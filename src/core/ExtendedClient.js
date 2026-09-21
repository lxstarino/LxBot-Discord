const fs = require("fs")
const path = require("path")
const { Client, Collection } = require("discord.js")
const { INTENTS, PARTIALS, CACHE, EMOJIS } = require("./constants")
const TTLCache = require("../utils/TTLCache")
const Logger = require("./Logger")
const LanguageManager = require("./LanguageManager")

class ExtendedClient extends Client {
    constructor(options = {}) {
        super({
            intents: options.intents || INTENTS,
            partials: options.partials || PARTIALS,
            ...options
        })

        this.commands = new Collection()
        this.cooldowns = new Collection()
        this.buttons = new Collection()
        this.modals = new Collection()
        this.appEmojis = EMOJIS

        this.db = require("../database/Database")
        this.logger = Logger

        this.cache = {
            profiles: new TTLCache({ ttlMs: CACHE.PROFILES_TTL_MS, maxSize: CACHE.PROFILES_MAX_SIZE }),
            settings: new TTLCache({ ttlMs: CACHE.SETTINGS_TTL_MS, maxSize: CACHE.SETTINGS_MAX_SIZE })
        }

        this.economy = this.cache.profiles
        this.settings = this.cache.settings

        this.languageManager = new LanguageManager(this)
        this.getLanguage = (guildOrLang) => this.languageManager.get(guildOrLang)

        this._setupShutdownHandlers()
    }

    loadHandlers(handlersDir = path.join(__dirname, "..", "handlers")) {
        if (!fs.existsSync(handlersDir)) return
        const handlerFiles = fs.readdirSync(handlersDir).filter(file => file.endsWith(".js"))
        for (const file of handlerFiles) {
            try {
                const handler = require(path.join(handlersDir, file))
                if (typeof handler === "function") {
                    handler(this)
                }
            } catch (err) {
                console.error(`[ExtendedClient] Failed to load handler ${file}:`, err)
            }
        }
    }

    async start(token = process.env.token) {
        if (!token) {
            throw new Error("[ExtendedClient] Discord token not provided.")
        }
        return this.login(token)
    }

    async stop() {
        if (this.languageManager) {
            this.languageManager.destroy()
        }
        if (this.cache?.profiles?.destroy) {
            this.cache.profiles.destroy()
        }
        if (this.cache?.settings?.destroy) {
            this.cache.settings.destroy()
        }
        try {
            await this.destroy()
        } catch (err) {
            console.error("[ExtendedClient] Error during client destruction:", err.message)
        }
    }

    _setupShutdownHandlers() {
        const handleExit = async (signal) => {
            console.log(`[ExtendedClient] Received ${signal}, shutting down...`)
            await this.stop()
            process.exit(0)
        }

        process.once("SIGINT", () => handleExit("SIGINT"))
        process.once("SIGTERM", () => handleExit("SIGTERM"))
    }
}

module.exports = ExtendedClient
