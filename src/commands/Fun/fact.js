const { SlashCommandBuilder } = require("@discordjs/builders")
const axios = require("axios")

module.exports = {
    data: new SlashCommandBuilder()
    .setName("fact")
    .setDescription("Get a random fact"),
    async execute(client, interaction) {
        const response = await axios("https://uselessfacts.jsph.pl/api/v2/facts/random", {method: "GET"}).catch(err => err)
        
        const settings = client.settings.storage.data.find(x => x.guildId === interaction.guild.id)
        let ls = settings ? settings.language ? require(`${process.cwd()}/src/languages/${settings.language}.json`) : require(`${process.cwd()}/src/languages/en.json`) : require(`${process.cwd()}/src/languages/en.json`)
        const { handlemsg } = require(`${process.cwd()}/src/handlers/functions`)

        client.basicEmbed({
            type: "reply",
            title: `${ls["cmds"]["fact"]["title"]}`,
            desc: `${handlemsg(ls["cmds"]["fact"]["desc"], {user: interaction.user.tag, response: response.data.text})}`,
            footer: {text: `ID: ${response.data.id}`}
        }, interaction)
    }
}
