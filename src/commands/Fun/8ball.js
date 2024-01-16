const { SlashCommandBuilder } = require("@discordjs/builders")

module.exports = {
    data: new SlashCommandBuilder()
    .setName("8ball")
    .setDescription("Question the 8Ball Oracle")
    .addStringOption((option) => option
        .setName("question")
        .setMaxLength(528)
        .setDescription("The question you want to ask")
        .setRequired(true)
    ),
    async execute(client, interaction) {
        const question = interaction.options.get("question").value

        const settings = client.settings.storage.data.find(x => x.guildId === interaction.guild.id)
        let ls = settings ? settings.language ? require(`${process.cwd()}/src/languages/${settings.language}.json`) : require(`${process.cwd()}/src/languages/en.json`) : require(`${process.cwd()}/src/languages/en.json`)
        const { handlemsg } = require(`${process.cwd()}/src/handlers/functions`)

        client.basicEmbed({
            type: "reply",
            title: "🔮 8Ball",
            desc: `${handlemsg(ls['cmds']['8ball']['desc'], {question: question})}`,
            fields: [
                {name: `${ls['cmds']['8ball']['fields']['name']}`, value: `${handlemsg(ls['cmds']['8ball']['fields']['value'], {answer: ls['cmds']['8ball']['fields']['answers'][Math.floor(Math.random() * ls['cmds']['8ball']['fields']['answers'].length)]})}`}
            ],
            footer: {text: interaction.user.tag}
        }, interaction)
    }
}
