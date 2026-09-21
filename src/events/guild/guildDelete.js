const { cleanupGuildData } = require("../../repositories/SettingsRepository")

module.exports = {
    name: "guildDelete",
    async execute(guild, client) {
        if (!guild) return
        console.log(`[Event] Left guild: ${guild.name || "Unknown"} (${guild.id}). Triggering data cleanup...`)
        await cleanupGuildData(client, guild.id)
    }
}
