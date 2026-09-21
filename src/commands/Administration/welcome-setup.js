const { PermissionsBitField, ChannelType, SlashCommandBuilder } = require("discord.js")
const { getOrCreateSettings } = require("../../repositories/SettingsRepository")

module.exports = {
    guildOnly: true,
    data: new SlashCommandBuilder()
        .setName("welcome-setup")
        .setDescription("Setup a Welcome Message for your server")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .addBooleanOption(option =>
            option.setName("state")
                .setDescription("Determines if welcome messages are enabled or disabled")
                .setRequired(true))
        .addChannelOption(option =>
            option.setName("channel")
                .setDescription("The text channel where welcome messages are sent")
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true))
        .addBooleanOption(option =>
            option.setName("card")
                .setDescription("Determines if the welcome message includes a graphic card image")
                .setRequired(true)),
    async execute(client, interaction) {
        const channel = interaction.options.getChannel("channel")
        const state = interaction.options.getBoolean("state")
        const card = interaction.options.getBoolean("card")

        const ls = client.getLanguage(interaction.guild?.id)

        const settings = await getOrCreateSettings(client, interaction.guild.id)

        settings.welcomestate = state
        settings.welcomechannel = channel ? channel.id : null
        settings.welcomecard = card

        client.successEmbed({
            type: "reply",
            ephemeral: true,
            title: ls["cmds"]["welcome-msg"]["title"],
            desc: ls["cmds"]["welcome-msg"]["updated"]
        }, interaction)
    }
}
