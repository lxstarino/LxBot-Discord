module.exports = {
    customId: "close-ticket",
    async execute(client, interaction, ls, handlemsg) {
        await interaction.deferUpdate().catch((err) => console.error("[close-ticket] Failed to defer update:", err.message))
        await interaction.channel.delete().catch((err) => console.error("[close-ticket] Failed to delete ticket channel:", err.message))
    }
}
