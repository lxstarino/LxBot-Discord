const { PermissionsBitField } = require("discord.js")
const { processHoneypotMessage } = require("../../services/SecurityService")

module.exports = {
    name: "Honeypot",
    async restore(client) {
        for (const guild of client.guilds.cache.values()) {
            try {
                const rawSettings = client.db ? client.db.getSettings(guild.id) : null
                if (!rawSettings?.honeypot_channel) continue

                const channel = guild.channels.cache.get(rawSettings.honeypot_channel)
                if (!channel || !channel.isTextBased()) continue

                const botMember = guild.members.me
                const perms = channel.permissionsFor(botMember)
                if (!perms || !perms.has(PermissionsBitField.Flags.ReadMessageHistory) || !perms.has(PermissionsBitField.Flags.ManageMessages)) {
                    continue
                }

                const messages = await channel.messages.fetch({ limit: 50 }).catch(() => null)
                if (!messages || messages.size === 0) continue

                for (const msg of messages.values()) {
                    await processHoneypotMessage(client, msg, true)
                }
            } catch (err) {
                console.error(`[Honeypot Restore] Startup sweep failed for guild ${guild.id}:`, err.message)
            }
        }
    }
}
