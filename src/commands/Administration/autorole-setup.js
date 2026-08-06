const { SlashCommandBuilder } = require("@discordjs/builders")
const { PermissionsBitField } = require("discord.js")

module.exports = {
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
        const { getOrCreateSettings, handlemsg } = require(`${process.cwd()}/src/handlers/functions`)
        const settings = await getOrCreateSettings(client, interaction.guild.id)

        const langDict = ls["cmds"]["autorole-setup"] || {}

        if (subcommand === "set") {
            const role = interaction.options.getRole("role")

            const botMember = interaction.guild.members.me
            if (role.managed || (botMember && role.position >= botMember.roles.highest.position)) {
                return client.errEmbed({
                    type: "reply",
                    ephemeral: true,
                    title: langDict["title"] || "🤖 Auto-Role Setup",
                    desc: handlemsg(langDict["err_bot_hierarchy"] || "I cannot assign the role <@&{role}> because it is higher than or equal to my highest role!", { role: role.id })
                }, interaction)
            }

            settings.autorole = role.id
            await client.settings.saveData()

            client.successEmbed({
                type: "reply",
                ephemeral: true,
                title: langDict["title"] || "🤖 Auto-Role Setup",
                desc: handlemsg(langDict["set_success"] || "Auto-Role has been successfully set to <@&{role}>!", { role: role.id })
            }, interaction)

        } else if (subcommand === "disable") {
            settings.autorole = null
            await client.settings.saveData()

            client.successEmbed({
                type: "reply",
                ephemeral: true,
                title: langDict["title"] || "🤖 Auto-Role Setup",
                desc: langDict["disabled"] || "Auto-Role has been successfully disabled."
            }, interaction)
        }
    }
}
