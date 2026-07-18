const { SlashCommandBuilder } = require("@discordjs/builders")

module.exports = {
    devOnly: true,
    data: new SlashCommandBuilder()
    .setName("fact")
    .setDescription("Get a random fact"),
    async execute(client, interaction) {
        let ls = client.getLanguage(interaction.guild?.id)
        const { handlemsg } = require(`${process.cwd()}/src/handlers/functions`)

        try {
            const response = await fetch("https://uselessfacts.jsph.pl/api/v2/facts/random")
            if (!response.ok) return interaction.reply({ content: ls["cmds"]["fact"]["err_fetch"], ephemeral: true })
            const data = await response.json()

            client.Embed([{
                title: `${ls["cmds"]["fact"]["title"]}`,
                desc: `${handlemsg(ls["cmds"]["fact"]["desc"], {user: interaction.user.tag, response: data.text})}`,
                footer: {text: `ID: ${data.id}`}
            }], undefined, "reply", false, interaction)
        } catch (err) {
            console.error(err)
            interaction.reply({ content: ls["cmds"]["fact"]["err_fetch"], ephemeral: true })
        }
    }
}
