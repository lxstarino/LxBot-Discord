const { SlashCommandBuilder } = require("@discordjs/builders")
const RestoreManager = require(`${process.cwd()}/src/utils/RestoreManager`)

const DAYS_IN_MONTH = [0, 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

function isValidDate(day, month) {
    if (month < 1 || month > 12) return false
    if (day < 1 || day > DAYS_IN_MONTH[month]) return false
    return true
}

RestoreManager.register("Birthday Checker", async (client) => {
    const { handlemsg, getOrCreateSettings } = require(`${process.cwd()}/src/handlers/functions`)

    async function checkBirthdays() {
        const now = new Date()
        const today = { day: now.getDate(), month: now.getMonth() + 1 }

        const birthdayProfiles = client.economy.storage.data.filter(profile => {
            if (!profile.birthday) return false
            return profile.birthday.day === today.day && profile.birthday.month === today.month
        })

        const byGuild = {}
        for (const profile of birthdayProfiles) {
            if (!byGuild[profile.guildId]) byGuild[profile.guildId] = []
            byGuild[profile.guildId].push(profile.userId)
        }

        for (const [guildId, userIds] of Object.entries(byGuild)) {
            try {
                const guild = client.guilds.cache.get(guildId)
                if (!guild) continue

                const settings = client.settings.mapCache?.get(guildId)
                if (!settings?.birthdaychannel) continue

                const channel = guild.channels.cache.get(settings.birthdaychannel)
                if (!channel) continue

                const ls = client.getLanguage(guildId)

                for (const userId of userIds) {
                    const profile = client.economy.mapCache?.get(`${guildId}:${userId}`)
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
                }

                await client.economy.saveData()
            } catch (err) {
                console.error(`[Birthday] Failed for guild ${guildId}:`, err.message)
            }
        }
    }

    await checkBirthdays()
    setInterval(checkBirthdays, 60 * 60 * 1000)
})

module.exports = {
    data: new SlashCommandBuilder()
        .setName("birthday")
        .setDescription("Set or view birthdays")
        .addSubcommand(sub => sub
            .setName("set")
            .setDescription("Set your birthday")
            .addIntegerOption(opt => opt
                .setName("day")
                .setDescription("Day of your birthday (1-31)")
                .setMinValue(1)
                .setMaxValue(31)
                .setRequired(true)
            )
            .addIntegerOption(opt => opt
                .setName("month")
                .setDescription("Month of your birthday (1-12)")
                .setMinValue(1)
                .setMaxValue(12)
                .setRequired(true)
            )
        )
        .addSubcommand(sub => sub
            .setName("view")
            .setDescription("View your or someone else's birthday")
            .addUserOption(opt => opt
                .setName("user")
                .setDescription("The user to check (leave empty for yourself)")
                .setRequired(false)
            )
        ),

    async execute(client, interaction) {
        const subcommand = interaction.options.getSubcommand()
        const ls = client.getLanguage(interaction.guild?.id)
        const { handlemsg, getOrCreateProfile } = require(`${process.cwd()}/src/handlers/functions`)

        if (subcommand === "set") {
            const day = interaction.options.getInteger("day")
            const month = interaction.options.getInteger("month")

            if (!isValidDate(day, month)) {
                return client.errEmbed({
                    type: "reply",
                    ephemeral: true,
                    title: ls["cmds"]["birthday"]["title"],
                    desc: ls["cmds"]["birthday"]["invalid_date"]
                }, interaction)
            }

            const profile = await getOrCreateProfile(client, interaction.user.id, interaction.guild.id)
            profile.birthday = { day, month }
            profile.lastBirthdayWish = 0
            await client.economy.saveData()

            client.Embed([{
                title: ls["cmds"]["birthday"]["title"],
                desc: handlemsg(ls["cmds"]["birthday"]["set_success"], {
                    day: String(day).padStart(2, "0"),
                    month: String(month).padStart(2, "0")
                }),
                timestamp: interaction.createdTimestamp
            }], undefined, "reply", true, interaction)

        } else if (subcommand === "view") {
            const targetUser = interaction.options.getUser("user") || interaction.user
            const isSelf = targetUser.id === interaction.user.id

            const profile = await getOrCreateProfile(client, targetUser.id, interaction.guild.id)

            if (!profile.birthday) {
                return client.Embed([{
                    title: ls["cmds"]["birthday"]["title"],
                    desc: isSelf
                        ? ls["cmds"]["birthday"]["not_set_self"]
                        : handlemsg(ls["cmds"]["birthday"]["not_set_other"], { user: targetUser.id }),
                    timestamp: interaction.createdTimestamp
                }], undefined, "reply", false, interaction)
            }

            const { day, month } = profile.birthday
            client.Embed([{
                title: ls["cmds"]["birthday"]["title"],
                desc: isSelf
                    ? handlemsg(ls["cmds"]["birthday"]["view_self"], {
                        day: String(day).padStart(2, "0"),
                        month: String(month).padStart(2, "0")
                    })
                    : handlemsg(ls["cmds"]["birthday"]["view_other"], {
                        user: targetUser.id,
                        day: String(day).padStart(2, "0"),
                        month: String(month).padStart(2, "0")
                    }),
                timestamp: interaction.createdTimestamp
            }], undefined, "reply", false, interaction)
        }
    }
}
