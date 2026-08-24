require("dotenv").config()
const fs = require("fs")
const StorageManager = require("./utils/StorageManager")
const { Client, Collection, GatewayIntentBits, ShardingManager } = require("discord.js")

const { spawnSync } = require("child_process")

const isShard = Boolean(process.env.SHARDS !== undefined)

if (!isShard) {
    const totalShards = process.env.TOTAL_SHARDS
        ? (process.env.TOTAL_SHARDS === "auto" ? "auto" : parseInt(process.env.TOTAL_SHARDS))
        : "auto"

    const manager = new ShardingManager(__filename, {
        token: process.env.token,
        totalShards: totalShards,
        respawn: true
    })

    const killProcessTree = (pid) => {
        if (!pid) return
        try {
            if (process.platform === "win32") {
                spawnSync("taskkill", ["/PID", pid.toString(), "/T", "/F"], { stdio: "ignore" })
            } else {
                try {
                    process.kill(-pid, "SIGKILL")
                } catch (e) {
                    process.kill(pid, "SIGKILL")
                }
            }
        } catch (err) {
            console.error("[ShardingManager] Process kill error:", err.message)
        }
    }

    const cleanupShards = () => {
        for (const shard of manager.shards.values()) {
            try {
                if (shard.process && shard.process.pid) {
                    killProcessTree(shard.process.pid)
                }
            } catch (err) {
                console.error("[ShardingManager] Failed to cleanup shard process:", err.message)
            }
        }
    }

    process.on("SIGINT", () => {
        console.log("[ShardingManager] SIGINT received, stopping all shards...")
        cleanupShards()
        process.exit(0)
    })

    process.on("SIGTERM", () => {
        console.log("[ShardingManager] SIGTERM received, stopping all shards...")
        cleanupShards()
        process.exit(0)
    })

    process.once("SIGUSR2", () => {
        console.log("[ShardingManager] Nodemon reload detected, stopping all shards...")
        cleanupShards()
        process.kill(process.pid, "SIGUSR2")
    })

    process.on("exit", () => {
        cleanupShards()
    })

    manager.on("shardCreate", (shard) => {
        console.log(`[ShardingManager] Launched Shard #${shard.id}`)

        shard.on("message", (message) => {
            if (message && message.type === "SHARD_KILL_ALL") {
                console.log("[ShardingManager] Stopping all shards...")
                cleanupShards()
                process.exit(0)
            }
            if (message && message.type === "SHARD_RESTART_ALL") {
                console.log("[ShardingManager] Restarting all shards...")
                cleanupShards()
            }
        })
    })

    manager.spawn().catch((err) => {
        console.error("[ShardingManager] Error spawning shards:", err)
    })
} else {
    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.GuildVoiceStates
        ]
    })

    client.commands = new Collection()
    client.cooldowns = new Collection()

    const handlers = fs.readdirSync("./src/handlers").filter(file => file.endsWith(".js"))
    for (const file of handlers) {
        require(`./handlers/${file}`)(client)
    }

    const db = require("./utils/Database")

    client.db = db

    client.economy = new StorageManager("profiles")
    client.ticket = new StorageManager("tickets")
    client.settings = new StorageManager("settings")
    client.polls = new StorageManager("polls")
    client.reactionRoles = new StorageManager("reaction_roles")

    const langCache = {}

    function loadLanguage(langCode) {
        try {
            const filePath = `./src/languages/${langCode}.json`
            if (fs.existsSync(filePath)) {
                langCache[langCode] = JSON.parse(fs.readFileSync(filePath, "utf-8"))
            }
        } catch (err) {
            console.error(`Failed to load language file ${langCode}.json:`, err)
            langCache[langCode] = {}
        }
    }

    if (fs.existsSync("./src/languages")) {
        const langFiles = fs.readdirSync("./src/languages").filter(file => file.endsWith(".json"))
        for (const file of langFiles) {
            loadLanguage(file.replace(".json", ""))
        }

        fs.watch("./src/languages", (eventType, filename) => {
            if (filename && filename.endsWith(".json")) {
                const langCode = filename.replace(".json", "")
                loadLanguage(langCode)
                console.log(`> Language cache updated: ${langCode}.json`)
            }
        })
    }

    client.getLanguage = function (guildId) {
        let langCode = "en"
        if (guildId) {
            const settings = client.db ? client.db.getSettings(guildId) : client.settings.mapCache?.get(guildId)
            if (settings?.language) langCode = settings.language
        }
        return langCache[langCode] || langCache["en"] || {}
    }

    process.on("SIGINT", () => {
        try { client.destroy() } catch (err) { console.error("[Client] Error during SIGINT shutdown:", err.message) }
        process.exit(0)
    })

    process.on("SIGTERM", () => {
        try { client.destroy() } catch (err) { console.error("[Client] Error during SIGTERM shutdown:", err.message) }
        process.exit(0)
    })

    client.login(process.env.token)
}

