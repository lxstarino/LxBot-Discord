const { SlashCommandBuilder } = require("discord.js")
const { handlemsg } = require("../../utils/stringUtils")

module.exports = {
    guildOnly: false,
    cooldown: 3,
    data: new SlashCommandBuilder()
        .setName("avatar")
        .setDescription("Displays a user's avatar")
        .addUserOption((option) => option
            .setName("target")
            .setDescription("The user whose avatar you want to view")
            .setRequired(false)
        ),
    async execute(client, interaction) {
        const targetUser = interaction.options.getUser("target") || interaction.user

        const ls = client.getLanguage(interaction.guild?.id)

        client.Embed([{
            title: handlemsg(ls["cmds"]["avatar"]["title"], { user: targetUser.tag }),
            image: targetUser.displayAvatarURL({ size: 1024 }),
        }], undefined, "reply", false, interaction)
    }
}
