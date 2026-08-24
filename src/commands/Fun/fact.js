const { SlashCommandBuilder } = require("@discordjs/builders")

module.exports = {
    devOnly: true,
    data: new SlashCommandBuilder()
    .setName("fact")
    .setDescription("Get a random fact"),
    async execute(client, interaction) {
        let ls = client.getLanguage(interaction.guild?.id)
        const { handlemsg } = require(`${process.cwd()}/src/utils/functions`)

        try {
            const response = await fetch("https://uselessfacts.jsph.pl/api/v2/facts/random", { signal: AbortSignal.timeout(5000) })

            if (!response.ok) return client.errEmbed({ type: "reply", ephemeral: true, desc: ls["cmds"]["fact"]["err_fetch"] }, interaction)
            const data = await response.json()

            client.Embed([{
                title: `${ls["cmds"]["fact"]["title"]}`,
                desc: `${handlemsg(ls["cmds"]["fact"]["desc"], {user: interaction.user.tag, response: data.text})}`,
                footer: {text: `ID: ${data.id}`}
            }], undefined, "reply", false, interaction)
        } catch (err) {
            console.error(err)
            client.errEmbed({ type: "reply", ephemeral: true, desc: ls["cmds"]["fact"]["err_fetch"] }, interaction)
        }
    }
}
