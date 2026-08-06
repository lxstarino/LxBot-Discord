const { SlashCommandBuilder } = require("@discordjs/builders")
const { PermissionsBitField } = require("discord.js")

module.exports = {
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
        const { handlemsg, getOrCreateSettings } = require(`${process.cwd()}/src/handlers/functions`)

        const settings = await getOrCreateSettings(client, interaction.guild.id)
        if (!settings.level_roles) settings.level_roles = []

        const langDict = ls["cmds"]["level-reward-setup"] || {}

        if (subcommand === "add") {
            const level = interaction.options.getInteger("level")
            const role = interaction.options.getRole("role")

            const botMember = interaction.guild.members.me
            if (role.managed || (botMember && role.position >= botMember.roles.highest.position)) {
                return client.errEmbed({
                    type: "reply",
                    ephemeral: true,
                    title: langDict["title"] || "🎁 Level Role Rewards",
                    desc: handlemsg(langDict["err_bot_hierarchy"] || "I cannot assign the role <@&{role}> because it is higher than or equal to my highest role!", { role: role.id })
                }, interaction)
            }

            const existingIndex = settings.level_roles.findIndex(r => r.level === level)
            if (existingIndex !== -1) {
                settings.level_roles[existingIndex].roleId = role.id
            } else {
                settings.level_roles.push({ level, roleId: role.id })
            }

            settings.level_roles.sort((a, b) => a.level - b.level)
            await client.settings.saveData()

            const profiles = client.economy.storage?.data?.filter(x => x.guildId === interaction.guild.id) || []
            for (const p of profiles) {
                const userLevel = p.level || 1
                if (userLevel >= level) {
                    const member = interaction.guild.members.cache.get(p.userId) || await interaction.guild.members.fetch(p.userId).catch(() => null)
                    if (member && !member.roles.cache.has(role.id)) {
                        await member.roles.add(role.id).catch(() => {})
                    }
                }
            }

            return client.Embed([{
                title: langDict["title"] || "🎁 Level Role Rewards",
                desc: handlemsg(langDict["add_success"] || "Successfully set **Level {level}** reward to role <@&{role}>!", { level, role: role.id }),
                timestamp: interaction.createdTimestamp
            }], undefined, "reply", false, interaction)

        } else if (subcommand === "remove") {
            const level = interaction.options.getInteger("level")
            const existingIndex = settings.level_roles.findIndex(r => r.level === level)

            if (existingIndex === -1) {
                return client.errEmbed({
                    type: "reply",
                    ephemeral: true,
                    title: langDict["title"] || "🎁 Level Role Rewards",
                    desc: handlemsg(langDict["remove_not_found"] || "No level role reward is configured for **Level {level}**.", { level })
                }, interaction)
            }

            settings.level_roles.splice(existingIndex, 1)
            await client.settings.saveData()

            return client.Embed([{
                title: langDict["title"] || "🎁 Level Role Rewards",
                desc: handlemsg(langDict["remove_success"] || "Successfully removed role reward for **Level {level}**.", { level }),
                timestamp: interaction.createdTimestamp
            }], undefined, "reply", false, interaction)

        } else if (subcommand === "list") {
            if (settings.level_roles.length === 0) {
                return client.Embed([{
                    title: langDict["list_title"] || "📜 Configured Level Role Rewards",
                    desc: langDict["list_empty"] || "No level role rewards are configured for this server yet.",
                    timestamp: interaction.createdTimestamp
                }], undefined, "reply", false, interaction)
            }

            const fields = settings.level_roles.map(item => ({
                name: handlemsg(langDict["list_field_name"] || "Level {level}", { level: item.level }),
                value: handlemsg(langDict["list_field_value"] || "Role: <@&{role}>", { role: item.roleId }),
                inline: true
            }))

            return client.Embed([{
                title: langDict["list_title"] || "📜 Configured Level Role Rewards",
                fields: fields,
                timestamp: interaction.createdTimestamp
            }], undefined, "reply", false, interaction)

        } else if (subcommand === "clear") {
            settings.level_roles = []
            await client.settings.saveData()

            return client.Embed([{
                title: langDict["title"] || "🎁 Level Role Rewards",
                desc: langDict["clear_success"] || "Successfully cleared all level role rewards.",
                timestamp: interaction.createdTimestamp
            }], undefined, "reply", false, interaction)
        }
    }
}
