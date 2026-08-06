const { ActivityType } = require("discord.js")
const RestoreManager = require(`${process.cwd()}/src/utils/RestoreManager`)
const { cleanupGuildData } = require(`${process.cwd()}/src/handlers/functions`)

module.exports = {
    name: "ready",
    async execute(client) {
        client.user.setPresence({ activities: [{ name: `Is watching you`, type: ActivityType.Custom }], status: 'idle' })
        console.log(`| ${client.user.tag} bot started!\n| Guilds: ${client.guilds.cache.size}\n| Dev Commands: ${client.commands.filter(cmd => cmd.devOnly === true).size} & User Commands ${client.commands.filter(cmd => cmd.devOnly !== true).size}`)

        client.settings.mapCache = new Map()
        if (client.settings.storage && Array.isArray(client.settings.storage.data)) {
            for (const item of client.settings.storage.data) {
                if (item.guildId) client.settings.mapCache.set(item.guildId, item)
            }
        }

        client.economy.mapCache = new Map()
        if (client.economy.storage && Array.isArray(client.economy.storage.data)) {
            for (const item of client.economy.storage.data) {
                if (item.guildId && item.userId) {
                    if (!item.inventory) item.inventory = {}
                    if (!item.inventory.fish) item.inventory.fish = {}
                    if (!item.inventory.ore) item.inventory.ore = {}
                    client.economy.mapCache.set(`${item.guildId}:${item.userId}`, item)
                }
            }
        }

        const storedGuildIds = new Set()

        if (client.settings && client.settings.storage && Array.isArray(client.settings.storage.data)) {
            client.settings.storage.data.forEach(x => { if (x.guildId) storedGuildIds.add(x.guildId) })
        }
        if (client.economy && client.economy.storage && Array.isArray(client.economy.storage.data)) {
            client.economy.storage.data.forEach(x => { if (x.guildId) storedGuildIds.add(x.guildId) })
        }
        if (client.ticket && client.ticket.storage && Array.isArray(client.ticket.storage.data)) {
            client.ticket.storage.data.forEach(x => { if (x.guildId) storedGuildIds.add(x.guildId) })
        }
        if (client.polls && client.polls.storage && Array.isArray(client.polls.storage.data)) {
            client.polls.storage.data.forEach(x => { if (x.guildId) storedGuildIds.add(x.guildId) })
        }
        if (client.reactionRoles && client.reactionRoles.storage && Array.isArray(client.reactionRoles.storage.data)) {
            client.reactionRoles.storage.data.forEach(x => { if (x.guildId) storedGuildIds.add(x.guildId) })
        }

        let cleanedAny = false
        for (const guildId of storedGuildIds) {
            if (!client.guilds.cache.has(guildId)) {
                console.log(`[Startup Cleanup] Bot is no longer in guild ${guildId}. Deleting data...`)
                await cleanupGuildData(client, guildId, false)
                cleanedAny = true
            }
        }

        if (cleanedAny) {
            console.log(`[Startup Cleanup] Done cleaning up data for left guilds. Saving databases to disk...`)
            if (client.settings?.saveData) await client.settings.saveData()
            if (client.economy?.saveData) await client.economy.saveData()
            if (client.ticket?.saveData) await client.ticket.saveData()
            if (client.polls?.saveData) await client.polls.saveData()
            if (client.reactionRoles?.saveData) await client.reactionRoles.saveData()
        }

        await RestoreManager.restoreAll(client)
    }
}
