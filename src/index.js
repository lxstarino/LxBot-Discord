require("dotenv").config()
const fs = require("fs")
const { spawn } = require("child_process")
const path = require("path")
const StorageManager = require("./utils/StorageManager")
const { Client, Collection, GatewayIntentBits } = require("discord.js")

const isWorker = process.env.IS_CHILD_PROCESS === "true"
const isNodemon = Boolean(process.env.NODEMON || process.env.NODEMON_CONFIG)

if (!isWorker && !isNodemon) {
    function startBotWorker() {
        const child = spawn(process.execPath, [__filename], {
            cwd: process.cwd(),
            stdio: "inherit",
            env: { ...process.env, IS_CHILD_PROCESS: "true" }
        })

        child.on("exit", (code) => {
            if (code === 42) {
                console.log("\n[Bot] Restarting process...\n")
                startBotWorker()
            } else {
                process.exit(code || 0)
            }
        })
    }

    startBotWorker()
    return
}

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

const folders = fs.readdirSync("./src/handlers").filter(dir => !dir.endsWith(".js"))

for (directory of folders) {
    const handlers = fs.readdirSync(`./src/handlers/${directory}`).filter(file => file.endsWith(".js"))
    for (file of handlers) {
        require(`./handlers/${directory}/${file}`)(client)
    }
}

const EcoManager = new StorageManager("./src/storages/profile.json")
client.economy = EcoManager

const Ticket = new StorageManager("./src/storages/ticket.json")
client.ticket = Ticket

const Settings = new StorageManager("./src/storages/server_settings.json")
client.settings = Settings

const Polls = new StorageManager("./src/storages/polls.json")
client.polls = Polls

const ReactionRoles = new StorageManager("./src/storages/reaction-roles.json")
client.reactionRoles = ReactionRoles

client.captchas = new Map()

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
        const settings = client.settings.mapCache?.get(guildId)
        if (settings?.language) langCode = settings.language
    }
    return langCache[langCode] || langCache["en"] || {}
}

client.login(process.env.token)
