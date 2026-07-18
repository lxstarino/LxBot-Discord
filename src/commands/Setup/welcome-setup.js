const { SlashCommandBuilder } = require("@discordjs/builders")
const { PermissionsBitField, ChannelType } = require("discord.js")

module.exports = {
    data: new SlashCommandBuilder()
        .setName("welcome-setup")
        .setDescription("Setup a Welcome Message for your Server.")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .addBooleanOption(option =>
            option.setName("state")
                .setDescription("Determines if welcome is enabled or disabled")
                .setRequired(true))
        .addRoleOption(option =>
            option.setName("role")
                .setDescription("The role that will be added to a user if he joins"))
        .addChannelOption(option =>
            option.setName("channel")
                .setDescription("The channel where you want to send welcome message")
                .addChannelTypes(ChannelType.GuildText))
        .addBooleanOption(option =>
            option.setName("card")
                .setDescription("Determines if the welcome message includes a graphic card image")
                .setRequired(false)),
    async execute(client, interaction) {
        const channel = interaction.options.get("channel")
        const role = interaction.options.get("role")
        const state = interaction.options.get("state").value
        const card = interaction.options.get("card")?.value ?? false

        let ls = client.getLanguage(interaction.guild?.id)
        const { handlemsg, getOrCreateSettings } = require(`${process.cwd()}/src/handlers/functions`)

        const settings = await getOrCreateSettings(client, interaction.guild.id)

        settings.welcomestate = state
        settings.welcomechannel = channel ? channel.channel.id : null;
        settings.welcomerole = role ? role.role.id : null;
        settings.welcomecard = card
        await client.settings.saveData()

        client.successEmbed({ type: "reply", ephemeral: true, title: ls["cmds"]["welcome-msg"]["title"], desc: ls["cmds"]["welcome-msg"]["updated"] }, interaction)
    }
}