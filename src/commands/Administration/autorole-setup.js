
const { PermissionsBitField, SlashCommandBuilder } = require("discord.js")
const { getOrCreateSettings } = require("../../repositories/SettingsRepository")
const { handlemsg } = require("../../utils/stringUtils")

module.exports = {
    guildOnly: true,
    data: new SlashCommandBuilder()
        .setName("autorole-setup")
        .setDescription("Configure auto-role given to joining members")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .addSubcommand(sub => sub
            .setName("set")
            .setDescription("Set the role given to users when they join")
            .addRoleOption(opt => opt
                .setName("role")
                .setDescription("The role to automatically assign")
                .setRequired(true)
            )
        )
        .addSubcommand(sub => sub
            .setName("disable")
            .setDescription("Disable the auto-role system")
        ),

    async execute(client, interaction) {
        const subcommand = interaction.options.getSubcommand()
        const ls = client.getLanguage(interaction.guild?.id)
        const settings = await getOrCreateSettings(client, interaction.guild.id)

        if (subcommand === "set") {
            const role = interaction.options.getRole("role")

            const botMember = interaction.guild.members.me
            if (role.managed || (botMember && role.position >= botMember.roles.highest.position)) {
                return client.errEmbed({
                    type: "reply",
                    ephemeral: true,
                    title: ls["cmds"]["autorole-setup"]["title"],
                    desc: handlemsg(ls["cmds"]["autorole-setup"]["err_bot_hierarchy"], { role: role.id })
                }, interaction)
            }

            settings.autorole = role.id

            client.successEmbed({
                type: "reply",
                ephemeral: true,
                title: ls["cmds"]["autorole-setup"]["title"],
                desc: handlemsg(ls["cmds"]["autorole-setup"]["set_success"], { role: role.id })
            }, interaction)

        } else if (subcommand === "disable") {
            settings.autorole = null

            client.successEmbed({
                type: "reply",
                ephemeral: true,
                title: ls["cmds"]["autorole-setup"]["title"],
                desc: ls["cmds"]["autorole-setup"]["disabled"]
            }, interaction)
        }
    }
}
