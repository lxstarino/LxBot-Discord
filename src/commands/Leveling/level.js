const { SlashCommandBuilder } = require("@discordjs/builders")

module.exports = {
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

        let ls = client.getLanguage(interaction.guild?.id)
        const { handlemsg, getOrCreateProfile, getOrCreateSettings } = require(`${process.cwd()}/src/utils/functions`)

        const profile = await getOrCreateProfile(client, userId, interaction.guild.id)
        const settings = await getOrCreateSettings(client, interaction.guild.id)

        const level = profile.level || 1
        const xp = profile.xp || 0
        const needed = level * level * 100

        let desc = handlemsg(ls["cmds"]["level"]["desc"], {
            user: userId,
            level: level,
            xp: xp,
            needed: needed
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
