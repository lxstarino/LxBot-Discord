module.exports = {
    name: "Temp Voice Cleanup",
    async restore(client) {
        const allSettings = client.db ? client.db.getAllSettings() : []
        for (const rawSettings of allSettings) {
            if (!rawSettings.temp_voice_channels || rawSettings.temp_voice_channels.length === 0) continue

            const guild = client.guilds.cache.get(rawSettings.guildId)
            if (!guild) continue

            const activeChans = []
            for (const chInfo of rawSettings.temp_voice_channels) {
                const chId = typeof chInfo === "string" ? chInfo : chInfo.channelId
                if (!chId) continue

                try {
                    const channel = guild.channels.cache.get(chId) || await guild.channels.fetch(chId).catch(() => null)
                    if (channel) {
                        const voiceStatesCount = guild.voiceStates.cache.filter(vs => vs.channelId === chId).size
                        const membersCount = channel.members ? channel.members.size : 0
                        const isOccupied = voiceStatesCount > 0 || membersCount > 0

                        const shardTag = client.shard ? `[Shard #${client.shard.ids.join(",")}] ` : ""
                        if (!isOccupied) {
                            await channel.delete().catch(err => console.error(`${shardTag}[Temp Voice] Failed to delete leftover temp channel:`, err.message))
                            console.log(`${shardTag}[Temp Voice] Deleted leftover empty channel ${chId} in ${guild.name}`)
                        } else {
                            console.log(`${shardTag}[Temp Voice] Channel ${chId} is occupied in ${guild.name} (${voiceStatesCount} user(s)), keeping active.`)
                            activeChans.push(chInfo)
                        }
                    }
                } catch (err) {
                    console.error(`[Temp Voice] Failed to check channel ${chId}:`, err.message)
                }
            }

            if (activeChans.length !== rawSettings.temp_voice_channels.length) {
                const cleanedCount = rawSettings.temp_voice_channels.length - activeChans.length
                if (client.settings?.has(rawSettings.guildId)) {
                    client.settings.get(rawSettings.guildId).temp_voice_channels = activeChans
                } else {
                    rawSettings.temp_voice_channels = activeChans
                    if (client.db) client.db.saveSettings(rawSettings)
                }

                console.log(`[Temp Voice] Cleaned up ${cleanedCount} empty temp voice channel(s) in guild ${rawSettings.guildId}`)
            }
        }
    }
}
