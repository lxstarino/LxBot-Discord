const { getOrCreateProfile, getOrCreateSettings, handlemsg } = require(`${process.cwd()}/src/handlers/functions`)

module.exports = {
    name: "messageCreate",
    async execute(message, client) {
        if (message.author.bot || !message.guild) return

        const settings = client.settings.mapCache?.get(message.guild.id) || await getOrCreateSettings(client, message.guild.id)

        if (settings.counting_channel && message.channel.id === settings.counting_channel) {
            const num = parseInt(message.content.trim(), 10)
            const expected = (settings.counting_current || 0) + 1
            const ls = client.getLanguage(message.guild.id)

            if (isNaN(num) || message.content.trim() !== String(num)) {
                settings.counting_current = 0
                settings.counting_last_user = null
                await client.settings.saveData()

                await message.react("💥").catch(() => {})
                const embed = {
                    title: ls["cmds"]["counting"]["ruined_title"],
                    description: handlemsg(ls["cmds"]["counting"]["ruined_wrong"], {
                        user: message.author.id,
                        wrong: message.content,
                        expected: String(expected)
                    }),
                    color: 0xff0000,
                    timestamp: new Date().toISOString()
                }
                client.Embed([embed], undefined, undefined, undefined, message.channel).catch(() => {})

                return
            }

            if (settings.counting_last_user === message.author.id) {
                settings.counting_current = 0
                settings.counting_last_user = null
                await client.settings.saveData()

                await message.react("💥").catch(() => {})
                const embed = {
                    title: ls["cmds"]["counting"]["ruined_title"],
                    description: handlemsg(ls["cmds"]["counting"]["ruined_double"], {
                        user: message.author.id
                    }),
                    color: 0xff0000,
                    timestamp: new Date().toISOString()
                }
                client.Embed([embed], undefined, undefined, undefined, message.channel).catch(() => {})

                return
            }

            if (num !== expected) {
                settings.counting_current = 0
                settings.counting_last_user = null
                await client.settings.saveData()

                await message.react("💥").catch(() => {})
                const embed = {
                    title: ls["cmds"]["counting"]["ruined_title"],
                    description: handlemsg(ls["cmds"]["counting"]["ruined_wrong"], {
                        user: message.author.id,
                        wrong: String(num),
                        expected: String(expected)
                    }),
                    color: 0xff0000,
                    timestamp: new Date().toISOString()
                }
                client.Embed([embed], undefined, undefined, undefined, message.channel).catch(() => {})

                return
            }

            settings.counting_current = expected
            settings.counting_last_user = message.author.id
            await message.react("✅").catch(() => {})

            if (expected > (settings.counting_highscore || 0)) {
                settings.counting_highscore = expected
                await message.react("👑").catch(() => {})
            }

            await client.settings.saveData()
        }

        if (settings.disabled_modules && settings.disabled_modules.includes("Leveling")) return

        const cacheKey = `${message.guild.id}:${message.author.id}`
        const cachedProfile = client.economy.mapCache?.get(cacheKey)

        if (settings.level_roles && Array.isArray(settings.level_roles) && settings.level_roles.length > 0 && message.member) {
            const profileToCheck = cachedProfile || await getOrCreateProfile(client, message.author.id, message.guild.id)
            const currentLevel = profileToCheck.level || 1

            for (const reward of settings.level_roles) {
                if (currentLevel >= reward.level && !message.member.roles.cache.has(reward.roleId)) {
                    try {
                        await message.member.roles.add(reward.roleId)
                    } catch (err) {
                        console.error(`[LevelRoles] Failed to assign role ${reward.roleId} to user ${message.author.id}:`, err)
                    }
                }
            }
        }

        const now = Date.now()
        const cooldown = 15000
        if (cachedProfile && cachedProfile.lastXpMessage && (now - cachedProfile.lastXpMessage) < cooldown) return

        const profile = cachedProfile || await getOrCreateProfile(client, message.author.id, message.guild.id)

        const xpGained = Math.floor(Math.random() * 11) + 15
        profile.xp = (profile.xp || 0) + xpGained
        profile.lastXpMessage = now

        let level = profile.level || 1
        let neededXp = level * level * 100

        if (profile.xp >= neededXp) {
            profile.level = level + 1
            profile.xp -= neededXp

            const awardedRoles = []
            if (settings.level_roles && Array.isArray(settings.level_roles) && message.member) {
                for (const reward of settings.level_roles) {
                    if (profile.level >= reward.level && !message.member.roles.cache.has(reward.roleId)) {
                        try {
                            await message.member.roles.add(reward.roleId)
                            awardedRoles.push(`<@&${reward.roleId}>`)
                        } catch (err) {
                            console.error(`[LevelRoles] Failed to assign role ${reward.roleId} to user ${message.author.id}:`, err)
                        }
                    }
                }
            }

            let ls = client.getLanguage(message.guild.id)
            let desc = handlemsg(ls["events"]["messageCreate"]["level_up_desc"], { user: message.author.id, level: profile.level })
            if (awardedRoles.length > 0 && ls["events"]["messageCreate"]["level_up_reward"]) {
                desc += handlemsg(ls["events"]["messageCreate"]["level_up_reward"], { roles: awardedRoles.join(", ") })
            }

            const levelUpEmbed = {
                title: ls["events"]["messageCreate"]["level_up_title"],
                description: desc
            }

            client.Embed([levelUpEmbed], undefined, undefined, undefined, message.channel, undefined, `<@${message.author.id}>`)
        }

        await client.economy.saveData()
    }
}
