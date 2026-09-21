const { SlashCommandBuilder, PermissionsBitField } = require("discord.js")
const { getOrCreateProfile } = require("../../repositories/ProfileRepository")
const { getOrCreateSettings } = require("../../repositories/SettingsRepository")
const { handlemsg } = require("../../utils/stringUtils")

module.exports = {
    guildOnly: true,
    data: new SlashCommandBuilder()
        .setName("level-manage")
        .setDescription("Manage users' level and XP (Admin only)")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .addSubcommand(sub => sub
            .setName("add")
            .setDescription("Add levels to a user")
            .addUserOption(opt => opt
                .setName("user")
                .setDescription("The user to receive levels")
                .setRequired(true)
            )
            .addIntegerOption(opt => opt
                .setName("amount")
                .setDescription("The number of levels to add")
                .setRequired(true)
                .setMinValue(1)
            )
        )
        .addSubcommand(sub => sub
            .setName("remove")
            .setDescription("Remove levels from a user")
            .addUserOption(opt => opt
                .setName("user")
                .setDescription("The user to remove levels from")
                .setRequired(true)
            )
            .addIntegerOption(opt => opt
                .setName("amount")
                .setDescription("The number of levels to remove")
                .setRequired(true)
                .setMinValue(1)
            )
        )
        .addSubcommand(sub => sub
            .setName("set")
            .setDescription("Set a user's level")
            .addUserOption(opt => opt
                .setName("user")
                .setDescription("The user whose level will be set")
                .setRequired(true)
            )
            .addIntegerOption(opt => opt
                .setName("level")
                .setDescription("The new level")
                .setRequired(true)
                .setMinValue(1)
            )
        )
        .addSubcommand(sub => sub
            .setName("reset")
            .setDescription("Reset a user's level and XP back to 1")
            .addUserOption(opt => opt
                .setName("user")
                .setDescription("The user whose level will be reset")
                .setRequired(true)
            )
        ),

    async execute(client, interaction) {
        const subcommand = interaction.options.getSubcommand()
        const targetUser = interaction.options.getUser("user")

        const ls = client.getLanguage(interaction.guild?.id)

        if (targetUser.bot) {
            return client.errEmbed({
                type: "reply",
                ephemeral: true,
                desc: ls["cmds"]["level-manage"]["err_bot"]
            }, interaction)
        }

        const profile = await getOrCreateProfile(client, targetUser.id, interaction.guild.id)
        const settings = await getOrCreateSettings(client, interaction.guild.id)

        let currentLevel = profile.level || 1
        let successMsg = ""

        if (subcommand === "add") {
            const amount = interaction.options.getInteger("amount")
            currentLevel += amount
            profile.level = currentLevel

            successMsg = handlemsg(ls["cmds"]["level-manage"]["add_success"], {
                user: targetUser.id,
                amount: String(amount),
                level: String(currentLevel)
            })
        } else if (subcommand === "remove") {
            const amount = interaction.options.getInteger("amount")
            currentLevel = Math.max(1, currentLevel - amount)
            profile.level = currentLevel

            successMsg = handlemsg(ls["cmds"]["level-manage"]["remove_success"], {
                user: targetUser.id,
                amount: String(amount),
                level: String(currentLevel)
            })
        } else if (subcommand === "set") {
            const level = interaction.options.getInteger("level")
            currentLevel = Math.max(1, level)
            profile.level = currentLevel
            profile.xp = 0

            successMsg = handlemsg(ls["cmds"]["level-manage"]["set_success"], {
                user: targetUser.id,
                level: String(currentLevel)
            })
        } else if (subcommand === "reset") {
            profile.level = 1
            profile.xp = 0
            currentLevel = 1

            successMsg = handlemsg(ls["cmds"]["level-manage"]["reset_success"], {
                user: targetUser.id
            })
        }

        if (settings.level_roles && Array.isArray(settings.level_roles) && settings.level_roles.length > 0) {
            const member = interaction.guild.members.cache.get(targetUser.id) || await interaction.guild.members.fetch(targetUser.id).catch(() => null)
            if (member) {
                const awardedRoles = []
                for (const reward of settings.level_roles) {
                    if (profile.level >= reward.level && !member.roles.cache.has(reward.roleId)) {
                        try {
                            await member.roles.add(reward.roleId)
                            awardedRoles.push(`<@&${reward.roleId}>`)
                        } catch (err) {
                            console.error(`[level-manage] Failed to award level role ${reward.roleId}:`, err.message)
                        }
                    } else if (profile.level < reward.level && member.roles.cache.has(reward.roleId)) {
                        await member.roles.remove(reward.roleId).catch(err => console.error(`[level-manage] Failed to remove level role ${reward.roleId}:`, err.message))
                    }
                }
                if (awardedRoles.length > 0 && ls["cmds"]["level-manage"]["awarded_roles"]) {
                    successMsg += "\n" + handlemsg(ls["cmds"]["level-manage"]["awarded_roles"], {
                        roles: awardedRoles.join(", ")
                    })
                }
            }
        }

        return client.successEmbed({
            type: "reply",
            ephemeral: true,
            desc: successMsg
        }, interaction)
    }
}
