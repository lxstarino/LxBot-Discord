const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js")

module.exports = {
    customId: "open-ticket",
    async execute(client, interaction, ls, handlemsg) {
        const channel = await interaction.guild.channels.cache.find(c => c.name === `ticket-${interaction.user.id}`)
        if (channel) {
            return await client.errEmbed({ 
                type: "reply", 
                ephemeral: true, 
                title: ls["events"]["interactionCreate"]["ticket_limit_title"], 
                desc: handlemsg(ls["events"]["interactionCreate"]["ticket_limit_desc"], {channel: channel.id}) 
            }, interaction)
        }

        const ticket_input = new ActionRowBuilder().addComponents(
            new TextInputBuilder()
                .setCustomId('ticket-description')
                .setLabel(ls["events"]["interactionCreate"]["ticket_modal_label"])
                .setStyle(TextInputStyle.Paragraph)
                .setMaxLength(256)
                .setRequired(true)
        )
        const ticket_modal = new ModalBuilder()
            .setCustomId(interaction.customId)
            .setTitle(ls["events"]["interactionCreate"]["ticket_modal_title"])
            .addComponents(ticket_input)
            
        await interaction.showModal(ticket_modal)
    }
}
