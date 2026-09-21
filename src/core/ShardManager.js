const path = require("path")
const { spawnSync } = require("child_process")
const { ShardingManager } = require("discord.js")
const Logger = require("./Logger")
const { DEFAULT_SHARDS, DEFAULT_SHARD_TIMEOUT } = require("./constants")

class ShardManager {
    static start(mainFilePath = path.join(__dirname, "..", "index.js")) {
        const totalShards = process.env.TOTAL_SHARDS
            ? (process.env.TOTAL_SHARDS === "auto" ? "auto" : parseInt(process.env.TOTAL_SHARDS, 10))
            : DEFAULT_SHARDS

        const manager = new ShardingManager(mainFilePath, {
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
                console.error("[ShardManager] Process kill error:", err.message)
            }
        }

        const cleanupShards = () => {
            for (const shard of manager.shards.values()) {
                try {
                    if (shard.process && shard.process.pid) {
                        killProcessTree(shard.process.pid)
                    }
                } catch (err) {
                    console.error("[ShardManager] Failed to cleanup shard process:", err.message)
                }
            }
        }

        process.on("SIGINT", () => {
            console.log("[ShardManager] SIGINT received, stopping all shards...")
            cleanupShards()
            process.exit(0)
        })

        process.on("SIGTERM", () => {
            console.log("[ShardManager] SIGTERM received, stopping all shards...")
            cleanupShards()
            process.exit(0)
        })

        process.once("SIGUSR2", () => {
            console.log("[ShardManager] Nodemon reload detected, stopping all shards...")
            cleanupShards()
            process.kill(process.pid, "SIGUSR2")
        })

        process.on("exit", () => {
            cleanupShards()
        })

        manager.on("shardCreate", (shard) => {
            console.log(`[ShardManager] Launched Shard #${shard.id}`)

            shard.on("error", (error) => {
                console.error(`[ShardManager] Shard #${shard.id} error:`, error)
            })

            shard.on("message", (message) => {
                if (message && message.type === "LOG") return Logger.broadcast(message.text)
                if (message && message.type === "SHARD_KILL_ALL") {
                    console.log("[ShardManager] Stopping all shards...")
                    cleanupShards()
                    process.exit(0)
                }
                if (message && message.type === "SHARD_RESTART_ALL") {
                    Logger.clear()
                    console.log("[ShardManager] Restarting all shards...")
                    cleanupShards()
                }
            })
        })

        const spawnTimeout = process.env.SHARD_TIMEOUT
            ? parseInt(process.env.SHARD_TIMEOUT, 10)
            : DEFAULT_SHARD_TIMEOUT

        manager.spawn({ timeout: spawnTimeout }).catch((err) => {
            console.error("[ShardManager] Error spawning shards:", err)
            cleanupShards()
            process.exit(1)
        })

        return manager
    }
}

module.exports = ShardManager
