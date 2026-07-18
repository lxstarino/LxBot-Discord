const { SlashCommandBuilder } = require("@discordjs/builders")

module.exports = {
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
        const { handlemsg, getOrCreateProfile } = require(`${process.cwd()}/src/handlers/functions`)

        const profile = await getOrCreateProfile(client, userId, interaction.guild.id)

        const level = profile.level || 1
        const xp = profile.xp || 0
        const needed = level * level * 100

        client.Embed([{
            title: ls["cmds"]["level"]["title"],
            thumbnail: target.user ? target.user.displayAvatarURL() : interaction.user.displayAvatarURL(),
            desc: handlemsg(ls["cmds"]["level"]["desc"], {
                user: userId,
                level: level,
                xp: xp,
                needed: needed
            }),
            footer: { text: ls["cmds"]["level"]["footer"] }
        }], undefined, "reply", false, interaction)
    }
}
