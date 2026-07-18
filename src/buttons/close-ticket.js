module.exports = {
    customId: "close-ticket",
    async execute(client, interaction, ls, handlemsg) {
        await interaction.channel.delete()
    }
}
