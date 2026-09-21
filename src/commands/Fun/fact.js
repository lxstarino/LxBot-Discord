const { SlashCommandBuilder } = require("discord.js")
const { handlemsg } = require("../../utils/stringUtils")

module.exports = {
    guildOnly: false,
    cooldown: 3,
    data: new SlashCommandBuilder()
        .setName("fact")
        .setDescription("Get a random fact"),
    async execute(client, interaction) {
        const ls = client.getLanguage(interaction.guild?.id)

        try {
            const response = await fetch("https://uselessfacts.jsph.pl/api/v2/facts/random", { signal: AbortSignal.timeout(5000) })

            if (!response.ok) return client.errEmbed({ type: "reply", ephemeral: true, desc: ls["cmds"]["fact"]["err_fetch"] }, interaction)
            const data = await response.json()

            client.Embed([{
                title: `${ls["cmds"]["fact"]["title"]}`,
                desc: `${handlemsg(ls["cmds"]["fact"]["desc"], { user: interaction.user.tag, response: data.text })}`,
                footer: { text: `ID: ${data.id}` }
            }], undefined, "reply", false, interaction)
        } catch (err) {
            console.error(err)
            client.errEmbed({ type: "reply", ephemeral: true, desc: ls["cmds"]["fact"]["err_fetch"] }, interaction)
        }
    }
}
