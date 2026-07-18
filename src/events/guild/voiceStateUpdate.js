const { PermissionsBitField, ChannelType } = require("discord.js")
const RestoreManager = require(`${process.cwd()}/src/utils/RestoreManager`)
const { getOrCreateSettings } = require(`${process.cwd()}/src/handlers/functions`)

// ─── Restore Handler for Temp-Voice Channels ────────────────────────────────
// Deletes any empty temporary voice channels left over after bot restarts.

RestoreManager.register("Temp Voice Cleanup", async (client) => {
    for (const settings of client.settings.storage.data) {
        if (!settings.temp_voice_channels || settings.temp_voice_channels.length === 0) continue

        const guild = client.guilds.cache.get(settings.guildId)
        if (!guild) continue

        const activeChans = []
        for (const chInfo of settings.temp_voice_channels) {
            const chId = typeof chInfo === "string" ? chInfo : chInfo.channelId
            try {
                const channel = guild.channels.cache.get(chId)
                if (channel) {
                    if (channel.members.size === 0) {
                        await channel.delete().catch(() => {})
                        console.log(`  > [Voice Restore] Deleted leftover empty temp channel ${chId} in guild ${guild.name}`)
                    } else {
                        activeChans.push(chInfo)
                    }
                }
            } catch (err) {
                console.error(`  > [Voice Restore] Failed to check channel ${chId}:`, err.message)
            }
        }

        if (activeChans.length !== settings.temp_voice_channels.length) {
            settings.temp_voice_channels = activeChans
            await client.settings.saveData()
        }
    }
})

// ─── Event Handler ──────────────────────────────────────────────────────────

module.exports = {
    name: "voiceStateUpdate",
    async execute(oldState, newState, client) {
        const guild = newState.guild || oldState.guild
        if (!guild) return

        const settings = await getOrCreateSettings(client, guild.id)

        // 1. User joins the Join-to-Create channel
        if (settings.voice_creator_channel && newState.channelId === settings.voice_creator_channel) {
            const creatorChan = guild.channels.cache.get(settings.voice_creator_channel)
            if (creatorChan) {
                const ls = client.getLanguage(guild.id)
                const { handlemsg } = require(`${process.cwd()}/src/handlers/functions`)

                try {
                    // Create the temporary channel under the same category
                    const tempChannelName = handlemsg(ls["cmds"]["voice-setup"]["default_channel_name"], {
                        user: newState.member.user.username
                    })

                    // Create with NO permission overwrites (no ManageChannels for creator)
                    const newChannel = await guild.channels.create({
                        name: tempChannelName,
                        type: ChannelType.GuildVoice,
                        parent: creatorChan.parentId || null
                    })

                    // Move member to the new channel
                    await newState.setChannel(newChannel)

                    // Track in DB with Owner ID
                    settings.temp_voice_channels = settings.temp_voice_channels || []
                    settings.temp_voice_channels.push({
                        channelId: newChannel.id,
                        ownerId: newState.member.id
                    })
                    await client.settings.saveData()

                } catch (err) {
                    console.error("Failed to create temporary voice channel:", err)
                }
            }
        }

        // 2. User leaves/moves out of a temporary voice channel
        if (oldState.channelId && settings.temp_voice_channels) {
            const isTemp = settings.temp_voice_channels.find(c => {
                const chId = typeof c === "string" ? c : c.channelId
                return chId === oldState.channelId
            })

            if (isTemp) {
                const channel = guild.channels.cache.get(oldState.channelId)
                if (channel && channel.members.size === 0) {
                    try {
                        await channel.delete().catch(() => {})

                        // Remove from DB tracking
                        settings.temp_voice_channels = settings.temp_voice_channels.filter(c => {
                            const chId = typeof c === "string" ? c : c.channelId
                            return chId !== oldState.channelId
                        })
                        await client.settings.saveData()
                    } catch (err) {
                        console.error("Failed to delete empty temporary voice channel:", err)
                    }
                }
            }
        }
    }
}
