const { getOrCreateSettings } = require(`${process.cwd()}/src/utils/functions`)

module.exports = {
    name: "channelDelete",
    async execute(channel, client) {
        if (!channel.guild) return

        try {
            const settings = client.settings?.mapCache?.get(channel.guild.id) || await getOrCreateSettings(client, channel.guild.id)
            if (!settings) return

            let modified = false

            if (settings.voice_creator_channel === channel.id) {
                settings.voice_creator_channel = null
                modified = true
            }

            if (settings.temp_voice_channels && settings.temp_voice_channels.length > 0) {
                const initialLength = settings.temp_voice_channels.length
                settings.temp_voice_channels = settings.temp_voice_channels.filter(c => {
                    const chId = typeof c === "string" ? c : c.channelId
                    return chId !== channel.id
                })
                if (settings.temp_voice_channels.length !== initialLength) {
                    modified = true
                }
            }

            if (settings.welcomechannel === channel.id) {
                settings.welcomechannel = null
                modified = true
            }
            if (settings.logchannel === channel.id) {
                settings.logchannel = null
                modified = true
            }
            if (settings.counting_channel === channel.id) {
                settings.counting_channel = null
                modified = true
            }
            if (settings.birthdaychannel === channel.id) {
                settings.birthdaychannel = null
                modified = true
            }
            if (settings.freegames_channel === channel.id) {
                settings.freegames_channel = null
                modified = true
            }

            if (modified) {

            }
        } catch (err) {
            console.error(`[channelDelete] Error handling channel deletion for channel ${channel.id}:`, err)
        }
    }
}
