const defaultDb = require("../database/Database")
const { createAutoSaveProxy } = require("../utils/proxyUtils")

class ProfileRepository {
    static get(client, arg1, arg2) {
        if (!arg1 || !arg2) return null
        let gId = String(arg2)
        let uId = String(arg1)
        let cacheKey = `${gId}:${uId}`

        if (client?.economy?.has(cacheKey)) {
            return client.economy.get(cacheKey)
        }
        const altKey = `${uId}:${gId}`
        if (client?.economy?.has(altKey)) {
            return client.economy.get(altKey)
        }

        const database = client?.db || defaultDb
        let profile = database.getProfile(gId, uId)
        if (!profile) {
            profile = database.getProfile(uId, gId)
            if (profile) {
                cacheKey = altKey
            }
        }
        if (!profile) return null

        const proxy = createAutoSaveProxy(profile, (p) => {
            database.saveProfile(p.__raw || p)
        })

        if (client?.economy) {
            client.economy.set(cacheKey, proxy)
        }

        return proxy
    }

    static async getOrCreate(client, userId, guildId) {
        if (!guildId || !userId) return null
        const cacheKey = `${guildId}:${userId}`
        if (client?.economy?.has(cacheKey)) {
            return client.economy.get(cacheKey)
        }

        const database = client?.db || defaultDb
        let profile = database.getProfile(guildId, userId)

        if (!profile) {
            profile = {
                guildId: String(guildId),
                userId: String(userId),
                wallet: 0,
                bank: 0,
                daily: 0,
                weekly: 0,
                monthly: 0,
                work: 0,
                crime: 0,
                xp: 0,
                level: 1,
                lastXpMessage: 0,
                warnings: [],
                inventory: { fish: {}, ore: {}, tools: {}, hunt: {} },
                birthday: null
            }
            database.saveProfile(profile)
        }

        const proxy = createAutoSaveProxy(profile, (p) => {
            database.saveProfile(p.__raw || p)
        })

        if (client?.economy) {
            client.economy.set(cacheKey, proxy)
        }

        return proxy
    }

    static save(client, profile) {
        if (!profile || !profile.guildId || !profile.userId) return
        const database = client?.db || defaultDb
        database.saveProfile(profile.__raw || profile)
    }

    static getLeaderboard(client, guildId, limit = 10, type = "economy") {
        if (!guildId) return []
        const database = client?.db || defaultDb
        if (type === "level") {
            return database.getLevelLeaderboard(guildId, limit)
        }
        return database.getEconomyLeaderboard(guildId, limit)
    }
}

ProfileRepository.getOrCreateProfile = ProfileRepository.getOrCreate
module.exports = ProfileRepository
