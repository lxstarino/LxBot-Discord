const { SlashCommandBuilder } = require("discord.js")
const { handlemsg } = require("../../utils/stringUtils")

module.exports = {
    guildOnly: false,
    cooldown: 3,
    data: new SlashCommandBuilder()
        .setName("coinflip")
        .setDescription("Flip a coin")
        .addStringOption((option) => option
            .setName("coinside")
            .setDescription("The side of the coin to bet on")
            .setRequired(true)
            .addChoices(
                { name: "Tail", value: "Tail" },
                { name: "Head", value: "Head" }
            )
        ),
    async execute(client, interaction) {
        const coinside = interaction.options.getString("coinside")
        const coin_side = ["Head", "Tail"]
        const result = coin_side[Math.floor(Math.random() * coin_side.length)]

        const ls = client.getLanguage(interaction.guild?.id)

        client.Embed([{
            title: handlemsg(ls["cmds"]["coinflip"]["title"], { coinside: coinside }),
            desc: handlemsg(ls["cmds"]["coinflip"]["desc"], { result: result }),
            fields: coinside === result
                ? [{ name: ls["cmds"]["coinflip"]["fields"]["name"], value: ls["cmds"]["coinflip"]["fields"]["win"] }]
                : [{ name: ls["cmds"]["coinflip"]["fields"]["name"], value: ls["cmds"]["coinflip"]["fields"]["lost"] }],
            footer: { text: interaction.user.tag }
        }], undefined, "reply", false, interaction)
    }
}
