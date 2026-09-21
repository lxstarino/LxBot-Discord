
const { PermissionsBitField, ChannelType, SlashCommandBuilder } = require("discord.js")
const { handlemsg } = require("../../utils/stringUtils")
const { getOrCreateSettings } = require("../../repositories/SettingsRepository")

module.exports = {
    guildOnly: true,
    data: new SlashCommandBuilder()
        .setName("birthday-setup")
        .setDescription("Configure the channel where birthday wishes are sent")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .addSubcommand(sub => sub
            .setName("set")
            .setDescription("Set the birthday channel")
            .addChannelOption(opt => opt
                .setName("channel")
                .setDescription("The text channel to post birthday wishes in")
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)
            )
        )
        .addSubcommand(sub => sub
            .setName("disable")
            .setDescription("Disable birthday wishes")
        ),

    async execute(client, interaction) {
        const subcommand = interaction.options.getSubcommand()
        const ls = client.getLanguage(interaction.guild?.id)

        const settings = await getOrCreateSettings(client, interaction.guild.id)

        if (subcommand === "set") {
            const channel = interaction.options.getChannel("channel")

            const botMember = interaction.guild.members.me
            const perms = channel.permissionsFor(botMember)
            if (!perms.has(PermissionsBitField.Flags.SendMessages) || !perms.has(PermissionsBitField.Flags.EmbedLinks)) {
                return client.errEmbed({
                    type: "reply",
                    ephemeral: true,
                    title: ls["cmds"]["birthday-setup"]["title"],
                    desc: handlemsg(ls["cmds"]["birthday-setup"]["err_perms"], { channel: channel.id })
                }, interaction)
            }

            settings.birthdaychannel = channel.id

            client.Embed([{
                title: ls["cmds"]["birthday-setup"]["title"],
                desc: handlemsg(ls["cmds"]["birthday-setup"]["set_success"], { channel: channel.id }),
                timestamp: interaction.createdTimestamp
            }], undefined, "reply", true, interaction)

        } else if (subcommand === "disable") {
            settings.birthdaychannel = null

            client.Embed([{
                title: ls["cmds"]["birthday-setup"]["title"],
                desc: ls["cmds"]["birthday-setup"]["disabled"],
                timestamp: interaction.createdTimestamp
            }], undefined, "reply", true, interaction)
        }
    }
}
