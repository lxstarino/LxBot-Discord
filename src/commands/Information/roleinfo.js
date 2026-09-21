const { SlashCommandBuilder } = require("discord.js")
const { handlemsg } = require("../../utils/stringUtils")

module.exports = {
    guildOnly: true,
    cooldown: 4,
    data: new SlashCommandBuilder()
        .setName("roleinfo")
        .setDescription("Displays detailed information about a role")
        .addRoleOption(opt => opt
            .setName("role")
            .setDescription("The role you want to view")
            .setRequired(true)),
    async execute(client, interaction) {
        const ls = client.getLanguage(interaction.guild?.id)

        const role = interaction.options.getRole("role")
        if (!role) return

        const createdTimestamp = Math.round(role.createdTimestamp / 1000)
        const roleColor = role.hexColor !== "#000000" ? role.hexColor.toUpperCase() : "Default (#000000)"

        const keyPermissions = []
        if (role.permissions.has("Administrator")) {
            keyPermissions.push(ls["cmds"]["roleinfo"]["perm_admin"])
        } else {
            if (role.permissions.has("ManageGuild")) keyPermissions.push(ls["cmds"]["roleinfo"]["perm_guild"])
            if (role.permissions.has("ManageRoles")) keyPermissions.push(ls["cmds"]["roleinfo"]["perm_roles"])
            if (role.permissions.has("ManageChannels")) keyPermissions.push(ls["cmds"]["roleinfo"]["perm_channels"])
            if (role.permissions.has("BanMembers")) keyPermissions.push(ls["cmds"]["roleinfo"]["perm_ban"])
            if (role.permissions.has("KickMembers")) keyPermissions.push(ls["cmds"]["roleinfo"]["perm_kick"])
            if (role.permissions.has("ManageMessages")) keyPermissions.push(ls["cmds"]["roleinfo"]["perm_msgs"])
            if (role.permissions.has("MentionEveryone")) keyPermissions.push(ls["cmds"]["roleinfo"]["perm_everyone"])
        }

        const permsText = keyPermissions.length > 0
            ? keyPermissions.join(" | ")
            : ls["cmds"]["roleinfo"]["no_special_perms"]

        let memberCount = 0
        if (role.id === interaction.guild.id) {
            memberCount = interaction.guild.memberCount
        } else {
            if (interaction.guild.members.cache.size < interaction.guild.memberCount) {
                await interaction.guild.members.fetch().catch(err => console.error("[roleinfo] Failed to fetch guild members:", err.message))
            }
            memberCount = role.members.size
        }

        const generalSection = handlemsg(ls["cmds"]["roleinfo"]["general_val"], {
            id: role.id,
            color: roleColor,
            pos: String(role.position),
            total: String(interaction.guild.roles.cache.size),
            created: String(createdTimestamp)
        })

        const detailsSection = handlemsg(ls["cmds"]["roleinfo"]["details_val"], {
            members: String(memberCount),
            hoist: role.hoist ? ls["cmds"]["roleinfo"]["yes"] : ls["cmds"]["roleinfo"]["no"],
            mentionable: role.mentionable ? ls["cmds"]["roleinfo"]["yes"] : ls["cmds"]["roleinfo"]["no"],
            managed: role.managed ? ls["cmds"]["roleinfo"]["yes"] : ls["cmds"]["roleinfo"]["no"],
            perms: permsText
        })

        const embedColor = role.hexColor !== "#000000" ? role.hexColor : null

        client.Embed([{
            author: { name: role.name, iconURL: role.iconURL() || interaction.guild.iconURL({ dynamic: true }) },
            color: embedColor,
            desc: `<@&${role.id}>`,
            fields: [
                { name: ls["cmds"]["roleinfo"]["section_general"], value: generalSection, inline: false },
                { name: ls["cmds"]["roleinfo"]["section_details"], value: detailsSection, inline: false }
            ],
            timestamp: interaction.createdTimestamp,
            footer: { text: handlemsg(ls["cmds"]["roleinfo"]["id_footer"], { id: role.id }) }
        }], undefined, "reply", false, interaction)
    }
}
