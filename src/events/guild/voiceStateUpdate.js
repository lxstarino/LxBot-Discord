const { ChannelType } = require("discord.js")
const { getOrCreateSettings } = require("../../repositories/SettingsRepository")
const { handlemsg } = require("../../utils/stringUtils")

module.exports = {
    name: "voiceStateUpdate",
    async execute(oldState, newState, client) {
        const guild = newState.guild || oldState.guild
        if (!guild) return

        const settings = client.settings?.get(guild.id) || await getOrCreateSettings(client, guild.id)

        if (settings.voice_creator_channel && newState.channelId === settings.voice_creator_channel) {
            const creatorChan = guild.channels.cache.get(settings.voice_creator_channel) || await guild.channels.fetch(settings.voice_creator_channel).catch(() => null)
            if (creatorChan) {
                const ls = client.getLanguage(guild.id)

                try {
                    const tempChannelName = handlemsg(ls["cmds"]["voice-setup"]["default_channel_name"], {
                        user: newState.member.user.username
                    })

                    const newChannel = await guild.channels.create({
                        name: tempChannelName,
                        type: ChannelType.GuildVoice,
                        parent: creatorChan.parentId || null
                    })

                    await newState.setChannel(newChannel)

                    settings.temp_voice_channels = [
                        ...(settings.temp_voice_channels || []),
                        {
                            channelId: newChannel.id,
                            ownerId: newState.member.id
                        }
                    ]

                } catch (err) {
                    console.error("Failed to create temporary voice channel:", err)
                }
            }
        }

        if (oldState.channelId && settings.temp_voice_channels) {
            const isTemp = settings.temp_voice_channels.find(c => {
                const chId = typeof c === "string" ? c : c.channelId
                return chId === oldState.channelId
            })

            if (isTemp) {
                const channel = guild.channels.cache.get(oldState.channelId) || await guild.channels.fetch(oldState.channelId).catch(() => null)
                if (!channel || channel.members.size === 0) {
                    if (channel) {
                        await channel.delete().catch(err => console.error("[voiceStateUpdate] Failed to delete empty temp voice channel:", err.message))
                    }

                    settings.temp_voice_channels = (settings.temp_voice_channels || []).filter(c => {
                        const chId = typeof c === "string" ? c : c.channelId
                        return chId !== oldState.channelId
                    })
                }
            }
        }
    }
}
