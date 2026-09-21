const { handlemsg } = require("../utils/stringUtils")

async function checkBirthdays(client) {
    const now = new Date()
    const today = { day: now.getDate(), month: now.getMonth() + 1 }

    const birthdayProfiles = client.db ? client.db.getTodayBirthdays(today.day, today.month) : []
    if (!birthdayProfiles || birthdayProfiles.length === 0) return

    const byGuild = {}
    for (const profile of birthdayProfiles) {
        if (!byGuild[profile.guildId]) byGuild[profile.guildId] = []
        byGuild[profile.guildId].push(profile.userId)
    }

    for (const [guildId, userIds] of Object.entries(byGuild)) {
        try {
            const guild = client.guilds.cache.get(guildId)
            if (!guild) continue

            const settings = client.db ? client.db.getSettings(guildId) : null
            if (!settings?.birthdaychannel) continue

            const channel = guild.channels.cache.get(settings.birthdaychannel)
            if (!channel) continue

            const ls = client.getLanguage(guildId)

            for (const userId of userIds) {
                const profile = client.db ? client.db.getProfile(guildId, userId) : null
                if (!profile) continue

                const lastWished = profile.lastBirthdayWish || 0
                const oneDayMs = 24 * 60 * 60 * 1000
                if (Date.now() - lastWished < oneDayMs) continue

                client.Embed([{
                    title: ls["cmds"]["birthday"]["title"],
                    desc: handlemsg(ls["cmds"]["birthday"]["wish"], { user: userId }),
                    timestamp: Date.now()
                }], undefined, "send", false, channel)

                profile.lastBirthdayWish = Date.now()
                if (client.db) client.db.saveProfile(profile)
            }
        } catch (err) {
            console.error(`[Birthday Task] Failed for guild ${guildId}:`, err.message)
        }
    }
}

module.exports = (client) => {
    checkBirthdays(client)
    setInterval(() => checkBirthdays(client), 60 * 60 * 1000)
}
