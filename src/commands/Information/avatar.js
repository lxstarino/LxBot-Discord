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

        const settings = client.settings.storage.data.find(x => x.guildId === interaction.guild.id)
        let ls = settings ? settings.language ? require(`${process.cwd()}/src/languages/${settings.language}.json`) : require(`${process.cwd()}/src/languages/en.json`) : require(`${process.cwd()}/src/languages/en.json`)
        const { handlemsg } = require(`${process.cwd()}/src/handlers/functions`)

        client.basicEmbed({
            type: `reply`,
            title: `${handlemsg(ls["cmds"]["avatar"]["title"], {user: target.user.tag})}`,
            url: `${target.user.displayAvatarURL({size: 1024})}`,
            image: `${target.user.displayAvatarURL({size: 1024})}`,
            footer: {text: `${interaction.user.tag}`}
        }, interaction)
    }
}
