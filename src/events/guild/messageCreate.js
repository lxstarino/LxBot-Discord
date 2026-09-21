const { getOrCreateSettings } = require("../../repositories/SettingsRepository")
const SecurityService = require("../../services/SecurityService")
const CountingService = require("../../services/CountingService")
const LevelingService = require("../../services/LevelingService")

module.exports = {
    name: "messageCreate",
    async execute(message, client) {
        if (message.author.bot || !message.guild) return

        const settings = client.settings?.get(message.guild.id) || await getOrCreateSettings(client, message.guild.id)

        if (settings?.honeypot_channel && message.channel.id === settings.honeypot_channel) {
            const caught = await SecurityService.processHoneypotMessage(client, message, false)
            if (caught) return
        }

        if (settings?.autorole && message.member && !message.member.roles.cache.has(settings.autorole)) {
            const role = message.guild.roles.cache.get(settings.autorole)
            if (role && role.id !== message.guild.id) {
                await message.member.roles.add(role.id).catch((err) => {
                    console.error(`[Auto-Role] Failed to assign role ${role.name} on message to user ${message.author.tag}:`, err)
                })
            }
        }

        if (settings?.counting_channel && message.channel.id === settings.counting_channel) {
            const result = await CountingService.handleMessage(client, message, settings)
            if (!result?.correct) return
        }

        await LevelingService.processMessageXp(client, message, settings)
    }
}
