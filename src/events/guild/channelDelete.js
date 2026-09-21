const { getOrCreateSettings } = require("../../repositories/SettingsRepository")

module.exports = {
    name: "channelDelete",
    async execute(channel, client) {
        if (!channel.guild) return

        try {
            const settings = client.settings?.get(channel.guild.id) || await getOrCreateSettings(client, channel.guild.id)
            if (!settings) return

            if (settings.voice_creator_channel === channel.id) {
                settings.voice_creator_channel = null
            }

            if (settings.temp_voice_channels && settings.temp_voice_channels.length > 0) {
                settings.temp_voice_channels = settings.temp_voice_channels.filter(c => {
                    const chId = typeof c === "string" ? c : c.channelId
                    return chId !== channel.id
                })
            }

            if (settings.welcomechannel === channel.id) {
                settings.welcomechannel = null
            }
            if (settings.logchannel === channel.id) {
                settings.logchannel = null
            }
            if (settings.counting_channel === channel.id) {
                settings.counting_channel = null
            }
            if (settings.birthdaychannel === channel.id) {
                settings.birthdaychannel = null
            }
            if (settings.freegames_channel === channel.id) {
                settings.freegames_channel = null
            }
            if (settings.honeypot_channel === channel.id) {
                settings.honeypot_channel = null
                settings.honeypot_warning_message_id = null
            }
        } catch (err) {
            console.error(`[channelDelete] Error handling channel deletion for channel ${channel.id}:`, err)
        }
    }
}
