const { getOrCreateProfile, getOrCreateSettings, handlemsg } = require(`${process.cwd()}/src/handlers/functions`)

module.exports = {
    name: "messageCreate",
    async execute(message, client) {
        // Ignore bots and DM messages
        if (message.author.bot || !message.guild) return

        const settings = await getOrCreateSettings(client, message.guild.id)

        // Counting Game Logic
        if (settings.counting_channel && message.channel.id === settings.counting_channel) {
            const num = parseInt(message.content.trim(), 10)
            const expected = (settings.counting_current || 0) + 1
            const ls = client.getLanguage(message.guild.id)

            // If it's not a valid number or has extra text, ruin it
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
                client.Embed([embed], undefined, undefined, undefined, message.channel)
                return
            }

            // Check double counting
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
                client.Embed([embed], undefined, undefined, undefined, message.channel)
                return
            }

            // Check correct number
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
                client.Embed([embed], undefined, undefined, undefined, message.channel)
                return
            }

            // Correct count! Update state
            settings.counting_current = expected
            settings.counting_last_user = message.author.id
            await message.react("✅").catch(() => {})

            // Check and announce new highscore
            if (expected > (settings.counting_highscore || 0)) {
                settings.counting_highscore = expected
                await message.react("👑").catch(() => {})
            }

            await client.settings.saveData()
        }

        // If Leveling module is disabled, do not grant XP
        if (settings.disabled_modules && settings.disabled_modules.includes("Leveling")) return

        const profile = await getOrCreateProfile(client, message.author.id, message.guild.id)

        // 15-second cooldown per user to prevent spam
        const now = Date.now()
        const cooldown = 15000
        if (profile.lastXpMessage && (now - profile.lastXpMessage) < cooldown) return

        // Generate random XP between 15 and 25
        const xpGained = Math.floor(Math.random() * 11) + 15
        profile.xp = (profile.xp || 0) + xpGained
        profile.lastXpMessage = now

        // Check level up
        let level = profile.level || 1
        let neededXp = level * level * 100

        if (profile.xp >= neededXp) {
            profile.level = level + 1
            profile.xp -= neededXp

            // Send level up message
            let ls = client.getLanguage(message.guild.id)
            const levelUpEmbed = {
                title: ls["events"]["messageCreate"]["level_up_title"],
                description: handlemsg(ls["events"]["messageCreate"]["level_up_desc"], { user: message.author.id, level: profile.level })
            }

            client.Embed([levelUpEmbed], undefined, undefined, undefined, message.channel, undefined, `<@${message.author.id}>`)
        }

        await client.economy.saveData()
    }
}
