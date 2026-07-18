const { SlashCommandBuilder } = require("@discordjs/builders")

module.exports = {
    data: new SlashCommandBuilder()
        .setName("roll")
        .setDescription("Roll a Dice"),
    async execute(client, interaction) {
        let ls = client.getLanguage(interaction.guild?.id)
        const { handlemsg } = require(`${process.cwd()}/src/handlers/functions`)

        client.Embed([{
            title: `${ls["cmds"]["roll"]["title"]}`,
            desc: `${handlemsg(ls["cmds"]["roll"]["desc"], {user: interaction.user.tag, number: Math.floor(Math.random() * 6) + 1})}`,
            footer: {text: interaction.user.tag}
        }], undefined, "reply", undefined, interaction)
    }
}