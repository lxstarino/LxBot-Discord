const fs = require("fs")
const path = require("path")

class LanguageManager {
    constructor(client, dir = path.join(__dirname, "..", "languages")) {
        this.client = client
        this.dir = dir
        this.cache = {}
        this.watcher = null
        this.init()
    }

    init() {
        if (!fs.existsSync(this.dir)) return

        const files = fs.readdirSync(this.dir).filter(file => file.endsWith(".json"))
        for (const file of files) {
            const langCode = file.replace(".json", "")
            this.loadLanguage(langCode)
        }

        try {
            this.watcher = fs.watch(this.dir, (eventType, filename) => {
                if (filename && filename.endsWith(".json")) {
                    const langCode = filename.replace(".json", "")
                    this.loadLanguage(langCode)
                    console.log(`[LanguageManager] Language cache updated: ${langCode}.json`)
                }
            })
        } catch (err) {
            console.error("[LanguageManager] Failed to watch languages directory:", err.message)
        }
    }

    loadLanguage(langCode) {
        try {
            const filePath = path.join(this.dir, `${langCode}.json`)
            if (fs.existsSync(filePath)) {
                this.cache[langCode] = JSON.parse(fs.readFileSync(filePath, "utf-8"))
            }
        } catch (err) {
            console.error(`[LanguageManager] Failed to load language file ${langCode}.json:`, err.message)
            this.cache[langCode] = this.cache[langCode] || {}
        }
    }

    get(guildOrLang) {
        if (guildOrLang && this.cache[guildOrLang]) {
            return this.cache[guildOrLang]
        }

        let langCode = "en"
        if (guildOrLang) {
            const settings = this.client?.settings?.get(guildOrLang) || (this.client?.db ? this.client.db.getSettings(guildOrLang) : null)
            if (settings?.language) {
                langCode = settings.language
            }
        }

        return this.cache[langCode] || this.cache["en"] || {}
    }

    destroy() {
        if (this.watcher) {
            this.watcher.close()
            this.watcher = null
        }
    }
}

module.exports = LanguageManager
