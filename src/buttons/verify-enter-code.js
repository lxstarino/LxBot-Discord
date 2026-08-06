const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require("discord.js")

module.exports = {
    customId: "verify-enter-code",
    async execute(client, interaction, ls, handlemsg) {
        const langDict = ls["cmds"]["verify"] || {}

        const modal = new ModalBuilder()
            .setCustomId("verify-modal")
            .setTitle(langDict["modal_title"] || "Enter Captcha Code")

        const codeInput = new TextInputBuilder()
            .setCustomId("verify-code-input")
            .setLabel(langDict["modal_label"] || "5-Character Code")
            .setStyle(TextInputStyle.Short)
            .setMaxLength(5)
            .setMinLength(4)
            .setRequired(true)

        const firstActionRow = new ActionRowBuilder().addComponents(codeInput)
        modal.addComponents(firstActionRow)

        await interaction.showModal(modal)
    }
}
