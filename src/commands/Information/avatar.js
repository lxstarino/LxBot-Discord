const { SlashCommandBuilder } = require("@discordjs/builders")

module.exports = {
    data: new SlashCommandBuilder()
    .setName("avatar")
    .setDescription("Display a User Avatar")
    .addUserOption((option) => option
        .setName("target")
        .setDescription("target")
    ),
    async execute(client, interaction) {
        const target = interaction.options.get('target') || interaction

        let ls = client.getLanguage(interaction.guild?.id)
        const { handlemsg } = require(`${process.cwd()}/src/handlers/functions`)

        client.Embed([{
            title: `${handlemsg(ls["cmds"]["avatar"]["title"], {user: target.user.tag})}`,
            image: `${target.user.displayAvatarURL({size: 1024})}`,
        }], undefined, "reply", false, interaction)
    }
}
