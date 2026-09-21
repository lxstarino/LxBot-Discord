const defaultDb = require("../database/Database")
const { createAutoSaveProxy } = require("../utils/proxyUtils")

class SettingsRepository {
    static get(client, guildId) {
        if (!guildId) return null
        const cacheKey = String(guildId)
        if (client?.settings?.has(cacheKey)) {
            return client.settings.get(cacheKey)
        }

        const database = client?.db || defaultDb
        const settings = database.getSettings(guildId)
        if (!settings) return null

        const proxy = createAutoSaveProxy(settings, (s) => {
            database.saveSettings(s.__raw || s)
        })

        if (client?.settings) {
            client.settings.set(cacheKey, proxy)
        }

        return proxy
    }

    static async getOrCreate(client, guildId) {
        if (!guildId) return null
        const cacheKey = String(guildId)
        if (client?.settings?.has(cacheKey)) {
            return client.settings.get(cacheKey)
        }

        const database = client?.db || defaultDb
        let settings = database.getSettings(guildId)

        if (!settings) {
            settings = {
                guildId: String(guildId),
                language: "en",
                embed_color: "#5865F2",
                disabled_modules: [],
                freegames_channel: null,
                birthdaychannel: null,
                logchannel: null,
                shop_items: [],
                autorole: null,
                counting_channel: null,
                counting_current: 0,
                counting_last_user: null,
                counting_highscore: 0,
                level_roles: [],
                voice_creator_channel: null,
                voice_category: null,
                temp_voice_channels: [],
                welcomestate: false,
                welcomechannel: null,
                welcomecard: false,
                honeypot_channel: null,
                honeypot_action: "ban",
                honeypot_caught_users: [],
                honeypot_warning_message_id: null
            }
            database.saveSettings(settings)
        }

        const proxy = createAutoSaveProxy(settings, (s) => {
            database.saveSettings(s.__raw || s)
        })

        if (client?.settings) {
            client.settings.set(cacheKey, proxy)
        }

        return proxy
    }

    static save(client, settings) {
        if (!settings || !settings.guildId) return
        const database = client?.db || defaultDb
        database.saveSettings(settings.__raw || settings)
    }

    static async cleanupGuild(client, guildId) {
        if (!guildId) return
        console.log(`[Cleanup] Cleaning up SQLite data for guild ID: ${guildId}`)
        const database = client?.db || defaultDb
        database.cleanupGuild(guildId)

        if (client?.settings) client.settings.delete(String(guildId))

        if (client?.economy) {
            const keys = Array.from(client.economy.keys())
            for (const key of keys) {
                if (key.startsWith(`${guildId}:`) || key === guildId) {
                    client.economy.delete(key)
                }
            }
        }
    }
}

SettingsRepository.getOrCreateSettings = SettingsRepository.getOrCreate
SettingsRepository.cleanupGuildData = SettingsRepository.cleanupGuild
module.exports = SettingsRepository
