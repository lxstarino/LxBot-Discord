const { SlashCommandBuilder } = require("@discordjs/builders")

module.exports = {
    data: new SlashCommandBuilder()
        .setName("roll")
        .setDescription("Roll a Dice"),
    async execute(client, interaction) {
        const settings = client.settings.storage.data.find(x => x.guildId === interaction.guild.id)
        let ls = settings ? settings.language ? require(`${process.cwd()}/src/languages/${settings.language}.json`) : require(`${process.cwd()}/src/languages/en.json`) : require(`${process.cwd()}/src/languages/en.json`)
        const { handlemsg } = require(`${process.cwd()}/src/handlers/functions`)

        client.basicEmbed({
            type: "reply",
            title: `${ls["cmds"]["roll"]["title"]}`,
            desc: `${handlemsg(ls["cmds"]["roll"]["desc"], {user: interaction.user.tag, number: Math.floor(Math.random() * 6) + 1})}`,
            footer: {text: interaction.user.tag}
        }, interaction)
    }
}