const { SlashCommandBuilder } = require("discord.js")
const { handlemsg } = require("../../utils/stringUtils")

module.exports = {
    guildOnly: false,
    cooldown: 3,
    data: new SlashCommandBuilder()
        .setName("roll")
        .setDescription("Roll a Dice"),
    async execute(client, interaction) {
        const ls = client.getLanguage(interaction.guild?.id)

        client.Embed([{
            title: `${ls["cmds"]["roll"]["title"]}`,
            desc: `${handlemsg(ls["cmds"]["roll"]["desc"], {user: interaction.user.tag, number: Math.floor(Math.random() * 6) + 1})}`,
            footer: {text: interaction.user.tag}
        }], undefined, "reply", undefined, interaction)
    }
}
