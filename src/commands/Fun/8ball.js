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

        let ls = client.getLanguage(interaction.guild?.id)
        const { handlemsg } = require(`${process.cwd()}/src/handlers/functions`)

        client.Embed([{
            title: ls["cmds"]["8ball"]["title"],
            desc: `${handlemsg(ls['cmds']['8ball']['desc'], { question: question })}`,
            fields: [
                { name: `${ls['cmds']['8ball']['fields']['name']}`, value: `${handlemsg(ls['cmds']['8ball']['fields']['value'], { answer: ls['cmds']['8ball']['fields']['answers'][Math.floor(Math.random() * ls['cmds']['8ball']['fields']['answers'].length)] })}` }
            ],
            footer: { text: interaction.user.tag }
        }], undefined, "reply", false, interaction)
    }
}
