const { SlashCommandBuilder } = require("@discordjs/builders")
const { PermissionsBitField, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js")

module.exports = {
    data: new SlashCommandBuilder()
        .setName("verify-setup")
        .setDescription("Configure Captcha verification for your server")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .addSubcommand(sub => sub
            .setName("send")
            .setDescription("Send the verification panel to a channel")
            .addChannelOption(opt => opt
                .setName("channel")
                .setDescription("The channel to send the verification panel in")
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)
            )
            .addRoleOption(opt => opt
                .setName("role")
                .setDescription("The role to grant upon successful verification")
                .setRequired(true)
            )
        )
        .addSubcommand(sub => sub
            .setName("disable")
            .setDescription("Disable the verification system")
        ),

    async execute(client, interaction) {
        const subcommand = interaction.options.getSubcommand()
        const ls = client.getLanguage(interaction.guild?.id)
        const { getOrCreateSettings, handlemsg } = require(`${process.cwd()}/src/handlers/functions`)
        const settings = await getOrCreateSettings(client, interaction.guild.id)

        const langDict = ls["cmds"]["verify-setup"] || {}

        if (subcommand === "send") {
            const channel = interaction.options.getChannel("channel")
            const role = interaction.options.getRole("role")

            const botMember = interaction.guild.members.me
            if (role.managed || (botMember && role.position >= botMember.roles.highest.position)) {
                return client.errEmbed({
                    type: "reply",
                    ephemeral: true,
                    title: langDict["title"] || "🔒 Verification Setup",
                    desc: handlemsg(langDict["err_bot_hierarchy"] || "I cannot assign the role <@&{role}> because it is higher than or equal to my highest role!", { role: role.id })
                }, interaction)
            }

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("verify")
                    .setLabel(langDict["btn_verify"] || "Verify")
                    .setEmoji("✅")
                    .setStyle(ButtonStyle.Success)
            )

            await client.Embed([{
                title: langDict["panel_title"] || "🛡️ Member Verification",
                desc: handlemsg(langDict["panel_desc"] || "Welcome!\nPlease click **Verify** below to complete the Captcha.", { guildname: interaction.guild.name }),
                color: 0x5865F2
            }], [row], undefined, undefined, channel)

            settings.verify_channel = channel.id
            settings.verify_role = role.id
            await client.settings.saveData()

            client.successEmbed({
                type: "reply",
                ephemeral: true,
                title: langDict["title"] || "🔒 Verification Setup",
                desc: handlemsg(langDict["set_success"] || "Verification panel sent to <#{channel}> with role <@&{role}>!", { channel: channel.id, role: role.id })
            }, interaction)

        } else if (subcommand === "disable") {
            settings.verify_channel = null
            settings.verify_role = null
            await client.settings.saveData()

            client.successEmbed({
                type: "reply",
                ephemeral: true,
                title: langDict["title"] || "🔒 Verification Setup",
                desc: langDict["disabled"] || "Verification system disabled."
            }, interaction)
        }
    }
}
