const { SlashCommandBuilder } = require("discord.js")
const { handlemsg, createProgressBar } = require("../../utils/stringUtils")
const { getOrCreateProfile } = require("../../repositories/ProfileRepository")
const { getOrCreateSettings } = require("../../repositories/SettingsRepository")
const LevelingService = require("../../services/LevelingService")

module.exports = {
    guildOnly: true,
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName("level")
        .setDescription("Check your or someone else's level")
        .addUserOption(option => option
            .setName("target")
            .setDescription("The user whose level you want to check")
            .setRequired(false)
        ),
    async execute(client, interaction) {
        const target = interaction.options.get("target") || interaction
        const userId = target.user ? target.user.id : target.id || interaction.user.id

        const ls = client.getLanguage(interaction.guild?.id)

        const profile = await getOrCreateProfile(client, userId, interaction.guild.id)
        const settings = await getOrCreateSettings(client, interaction.guild.id)

        const level = profile.level || 1
        const xp = profile.xp || 0
        const needed = LevelingService.getRequiredXp(level)
        const progress = Math.min(Math.max(xp / needed, 0), 1)
        const percent = Math.floor(progress * 100)
        const progressBar = createProgressBar(xp, needed, 10, client.appEmojis)

        let desc = handlemsg(ls["cmds"]["level"]["desc"], {
            user: userId,
            level: level,
            xp: xp.toLocaleString(),
            needed: needed.toLocaleString(),
            percent: String(percent),
            bar: progressBar
        })

        if (settings.level_roles && Array.isArray(settings.level_roles) && settings.level_roles.length > 0) {
            const nextReward = settings.level_roles
                .filter(r => r.level > level)
                .sort((a, b) => a.level - b.level)[0]

            if (nextReward && ls["cmds"]["level"]["next_reward"]) {
                desc += "\n" + handlemsg(ls["cmds"]["level"]["next_reward"], {
                    level: String(nextReward.level),
                    role: nextReward.roleId
                })
            }
        }

        client.Embed([{
            title: ls["cmds"]["level"]["title"],
            thumbnail: target.user ? target.user.displayAvatarURL() : interaction.user.displayAvatarURL(),
            desc: desc,
            footer: { text: ls["cmds"]["level"]["footer"] }
        }], undefined, "reply", false, interaction)
    }
}
