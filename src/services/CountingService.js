const { handlemsg } = require("../utils/stringUtils")

class CountingService {
    static async handleMessage(client, message, settings) {
        if (!settings?.counting_channel || message.channel.id !== settings.counting_channel) {
            return { isCounting: false, correct: false }
        }

        const num = parseInt(message.content.trim(), 10)
        const expected = (settings.counting_current || 0) + 1
        const ls = client.getLanguage(message.guild.id)

        if (isNaN(num) || message.content.trim() !== String(num)) {
            settings.counting_current = 0
            settings.counting_last_user = null

            await message.react("💥").catch((err) => console.error("[counting] Failed to react explosion:", err.message))
            const embed = {
                title: ls["cmds"]["counting"]["ruined_title"],
                desc: handlemsg(ls["cmds"]["counting"]["ruined_wrong"], {
                    user: message.author.id,
                    wrong: message.content,
                    expected: String(expected)
                }),
                color: 0xff0000,
                timestamp: new Date().toISOString()
            }
            client.Embed([embed], undefined, undefined, undefined, message.channel).catch((err) => console.error("[counting] Failed to send ruined embed:", err.message))
            return { isCounting: true, correct: false }
        }

        if (settings.counting_last_user === message.author.id) {
            settings.counting_current = 0
            settings.counting_last_user = null

            await message.react("💥").catch((err) => console.error("[counting] Failed to react explosion:", err.message))
            const embed = {
                title: ls["cmds"]["counting"]["ruined_title"],
                desc: handlemsg(ls["cmds"]["counting"]["ruined_double"], {
                    user: message.author.id
                }),
                color: 0xff0000,
                timestamp: new Date().toISOString()
            }
            client.Embed([embed], undefined, undefined, undefined, message.channel).catch((err) => console.error("[counting] Failed to send ruined embed:", err.message))
            return { isCounting: true, correct: false }
        }

        if (num !== expected) {
            settings.counting_current = 0
            settings.counting_last_user = null

            await message.react("💥").catch((err) => console.error("[counting] Failed to react explosion:", err.message))
            const embed = {
                title: ls["cmds"]["counting"]["ruined_title"],
                desc: handlemsg(ls["cmds"]["counting"]["ruined_wrong"], {
                    user: message.author.id,
                    wrong: String(num),
                    expected: String(expected)
                }),
                color: 0xff0000,
                timestamp: new Date().toISOString()
            }
            client.Embed([embed], undefined, undefined, undefined, message.channel).catch((err) => console.error("[counting] Failed to send ruined embed:", err.message))
            return { isCounting: true, correct: false }
        }

        settings.counting_current = expected
        settings.counting_last_user = message.author.id
        await message.react("✅").catch((err) => console.error("[counting] Failed to react checkmark:", err.message))

        if (expected > (settings.counting_highscore || 0)) {
            settings.counting_highscore = expected
            await message.react("👑").catch((err) => console.error("[counting] Failed to react crown:", err.message))
        }

        return { isCounting: true, correct: true }
    }
}

module.exports = CountingService
