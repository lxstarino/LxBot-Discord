const { SlashCommandBuilder, codeBlock } = require("@discordjs/builders")
const realb = require("../../api/realb")
const rb = new realb()

module.exports = {
    nsfw: true,
    data: new SlashCommandBuilder()
    .setName("rb")
    .setDescription("Displays porn image(s)")
    .addStringOption((option) => option
        .setName("tag")
        .setDescription("tag")
        .setMinLength(3)
        .setRequired(true)
    ).addNumberOption((option) => option
        .setName("amount")  
        .setDescription("amount")
        .setMaxValue(5)
        .setMinValue(1)
        .setRequired(true)
    ).addStringOption((option) => option
        .setName("filter")
        .setDescription("filter")
        .addChoices(
            {name: ".webm", value: ".webm"},
            {name: ".gif", value: ".gif"},
            {name: ".jpeg", value: ".jpeg"},
            {name: ".png", value: ".png"}
        )
    ),
    async execute(client, interaction) {
        const tag = interaction.options.get("tag").value
        const amount = interaction.options.get("amount").value
        const filter = interaction.options.get("filter") ? interaction.options.get("filter").value : undefined

        await interaction.deferReply()
        const media = await rb.getMedia(tag, amount, 3, filter)
        await interaction.editReply(codeBlock("js", `🔞 Realbooru - "/rb ${tag} ${amount}"`) + `\n${media.join('\n')}`)
    }
}
