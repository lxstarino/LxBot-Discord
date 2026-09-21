const { SlashCommandBuilder, PermissionsBitField } = require("discord.js")
const { handlemsg } = require("../../utils/stringUtils")
const { getOrCreateSettings } = require("../../repositories/SettingsRepository")

module.exports = {
    guildOnly: true,
    data: new SlashCommandBuilder()
        .setName("level-reward-setup")
        .setDescription("Configure level role rewards for your server")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .addSubcommand(subcmd => subcmd
            .setName("add")
            .setDescription("Add or update a role reward for a specific level")
            .addIntegerOption(opt => opt
                .setName("level")
                .setDescription("The level required to earn this role")
                .setMinValue(1)
                .setRequired(true)
            )
            .addRoleOption(opt => opt
                .setName("role")
                .setDescription("The role to award when reaching this level")
                .setRequired(true)
            )
        )
        .addSubcommand(subcmd => subcmd
            .setName("remove")
            .setDescription("Remove a role reward for a specific level")
            .addIntegerOption(opt => opt
                .setName("level")
                .setDescription("The level reward to remove")
                .setMinValue(1)
                .setRequired(true)
            )
        )
        .addSubcommand(subcmd => subcmd
            .setName("list")
            .setDescription("List all configured level role rewards")
        )
        .addSubcommand(subcmd => subcmd
            .setName("clear")
            .setDescription("Remove all level role rewards")
        ),

    async execute(client, interaction) {
        const subcommand = interaction.options.getSubcommand()

        let ls = client.getLanguage(interaction.guild?.id)

        const settings = await getOrCreateSettings(client, interaction.guild.id)
        if (!settings.level_roles) settings.level_roles = []

        if (subcommand === "add") {
            const level = interaction.options.getInteger("level")
            const role = interaction.options.getRole("role")

            const botMember = interaction.guild.members.me
            if (role.managed || (botMember && role.position >= botMember.roles.highest.position)) {
                return client.errEmbed({
                    type: "reply",
                    ephemeral: true,
                    desc: handlemsg(ls["cmds"]["level-reward-setup"]["err_bot_hierarchy"], { role: role.id })
                }, interaction)
            }

            const existingIndex = settings.level_roles.findIndex(r => r.level === level)
            if (existingIndex !== -1) {
                settings.level_roles[existingIndex].roleId = role.id
            } else {
                settings.level_roles.push({ level, roleId: role.id })
            }

            settings.level_roles.sort((a, b) => a.level - b.level)

            const profiles = client.db ? client.db.getAllProfiles(interaction.guild.id) : []
            for (const p of profiles) {
                const userLevel = p.level || 1
                if (userLevel >= level) {
                    const member = interaction.guild.members.cache.get(p.userId) || await interaction.guild.members.fetch(p.userId).catch(() => null)
                    if (member && !member.roles.cache.has(role.id)) {
                        await member.roles.add(role.id).catch((err) => console.error(`[level-reward-setup] Failed to add role ${role.id} to member ${member.id}:`, err.message))
                    }
                }
            }

            return client.Embed([{
                title: ls["cmds"]["level-reward-setup"]["title"],
                desc: handlemsg(ls["cmds"]["level-reward-setup"]["add_success"], { level, role: role.id }),
                timestamp: interaction.createdTimestamp
            }], undefined, "reply", true, interaction)

        } else if (subcommand === "remove") {
            const level = interaction.options.getInteger("level")
            const existingIndex = settings.level_roles.findIndex(r => r.level === level)

            if (existingIndex === -1) {
                return client.errEmbed({
                    type: "reply",
                    ephemeral: true,
                    desc: handlemsg(ls["cmds"]["level-reward-setup"]["remove_not_found"], { level })
                }, interaction)
            }

            settings.level_roles.splice(existingIndex, 1)

            return client.Embed([{
                title: ls["cmds"]["level-reward-setup"]["title"],
                desc: handlemsg(ls["cmds"]["level-reward-setup"]["remove_success"], { level }),
                timestamp: interaction.createdTimestamp
            }], undefined, "reply", true, interaction)

        } else if (subcommand === "list") {
            if (settings.level_roles.length === 0) {
                return client.Embed([{
                    title: ls["cmds"]["level-reward-setup"]["list_title"],
                    desc: ls["cmds"]["level-reward-setup"]["list_empty"],
                    timestamp: interaction.createdTimestamp
                }], undefined, "reply", true, interaction)
            }

            const fields = settings.level_roles.map(item => ({
                name: handlemsg(ls["cmds"]["level-reward-setup"]["list_field_name"], { level: item.level }),
                value: handlemsg(ls["cmds"]["level-reward-setup"]["list_field_value"], { role: item.roleId }),
                inline: true
            }))

            return client.Embed([{
                title: ls["cmds"]["level-reward-setup"]["list_title"],
                fields: fields,
                timestamp: interaction.createdTimestamp
            }], undefined, "reply", true, interaction)

        } else if (subcommand === "clear") {
            settings.level_roles = []

            return client.Embed([{
                title: ls["cmds"]["level-reward-setup"]["title"],
                desc: ls["cmds"]["level-reward-setup"]["clear_success"],
                timestamp: interaction.createdTimestamp
            }], undefined, "reply", true, interaction)
        }
    }
}
