const db = require("./Database")
const { createAutoSaveProxy } = require("../utils/functions")

module.exports = class StorageManager {
    constructor(tableName) {
        this.tableName = (tableName || "").toLowerCase()
        this.mapCache = new Map()
    }

    _getKey(item) {
        if (!item || typeof item !== "object") return null
        if (this.tableName.includes("profile") && item.guildId && item.userId) {
            return `${item.guildId}:${item.userId}`
        } else if (this.tableName.includes("setting") && item.guildId) {
            return String(item.guildId)
        } else if (this.tableName.includes("ticket") && item.guildId && item.panel) {
            return `${item.guildId}:${item.panel}`
        } else if (this.tableName.includes("reaction") && item.guildId && item.panel) {
            return `${item.guildId}:${item.panel}`
        } else if (this.tableName.includes("poll") && item.pollId) {
            return String(item.pollId)
        }
        return null
    }



    saveItem(item) {
        if (!item) return
        const raw = item.__raw || item

        if (this.tableName.includes("profile")) {
            db.saveProfile(raw)
        } else if (this.tableName.includes("setting")) {
            db.saveSettings(raw)
        } else if (this.tableName.includes("ticket")) {
            db.saveTicket(raw)
        } else if (this.tableName.includes("poll")) {
            db.savePoll(raw)
        } else if (this.tableName.includes("reaction")) {
            db.saveReactionRole(raw)
        } else if (this.tableName.includes("free-games") || this.tableName.includes("freegames")) {
            if (typeof raw === "number" || typeof raw === "string") {
                db.addAnnouncedGame(raw)
            }
        }

        const key = this._getKey(raw)
        if (key) {
            const proxy = item.__isProxy ? item : createAutoSaveProxy(raw, (saved) => {
                this.saveItem(saved.__raw || saved)
            })
            this.mapCache.set(key, proxy)
        }
    }



}
