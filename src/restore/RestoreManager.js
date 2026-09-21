const fs = require("fs")
const path = require("path")

class RestoreManager {
    constructor() {
        this._handlers = []
        this._loaded = false
    }

    register(name, handler) {
        this._handlers.push({ name, handler })
    }

    _loadModules() {
        if (this._loaded) return
        this._loaded = true
        const modulesDir = path.join(__dirname, "modules")
        if (!fs.existsSync(modulesDir)) return

        const files = fs.readdirSync(modulesDir).filter(f => f.endsWith(".js"))
        for (const file of files) {
            try {
                const mod = require(path.join(modulesDir, file))
                if (typeof mod === "function") {
                    const name = mod.name || file.replace(".js", "")
                    this.register(name, mod)
                } else if (mod && typeof mod.restore === "function") {
                    this.register(mod.name || file.replace(".js", ""), mod.restore)
                }
            } catch (err) {
                console.error(`[RestoreManager] Failed to load restore module "${file}":`, err.message)
            }
        }
    }

    async restoreAll(client) {
        this._loadModules()
        if (this._handlers.length === 0) return

        const shardTag = client.shard ? `[Shard #${client.shard.ids.join(", ")}] ` : ""
        const completed = []

        for (const { name, handler } of this._handlers) {
            try {
                await handler(client)
                completed.push(name)
            } catch (err) {
                console.error(`${shardTag}[Restore] "${name}" failed: ${err.message}`)
            }
        }

        if (completed.length > 0) {
            console.log(`${shardTag}[Restore] Restored (${completed.length}): ${completed.join(", ")}`)
        }
    }
}

module.exports = new RestoreManager()
