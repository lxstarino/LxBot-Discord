const { SlashCommandBuilder } = require("@discordjs/builders")
const { PermissionsBitField, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder } = require("discord.js")

module.exports = {
    devOnly: true,
    data: new SlashCommandBuilder()
    .setName("sr-setup")
    .setDescription("Setup a SelectionRole Menu on your server")
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
    async execute(client, interaction){
        interaction.reply("test23423")
    }
}