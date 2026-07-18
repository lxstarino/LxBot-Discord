const { SlashCommandBuilder } = require("@discordjs/builders")
const { PermissionsBitField } = require("discord.js")

module.exports = {
    data: new SlashCommandBuilder()
        .setName("userinfo")
        .setDescription("Displays Information about a User")
        .addUserOption((option) => option
            .setName("target")
            .setDescription("The user whose info you want to view")
            .setRequired(false)
        ),
    async execute(client, interaction) {
        const user = interaction.options.getUser("target") || interaction.user
        const member = interaction.options.getUser("target") ? interaction.options.getMember("target") : interaction.member

        let ls = client.getLanguage(interaction.guild?.id)
        const { handlemsg, getOrCreateProfile } = require(`${process.cwd()}/src/handlers/functions`)

        const Badges = {
            "HypeSquadOnlineHouse1": `${client.emojis.cache.find(emoji => emoji.id === "1194675493362995220") || ""}`,
            "HypeSquadOnlineHouse2": `${client.emojis.cache.find(emoji => emoji.id === "1194675488120115261") || ""}`,
            "HypeSquadOnlineHouse3": `${client.emojis.cache.find(emoji => emoji.id === "1194675491135819917") || ""}`,
        }

        const flags = user.flags ? user.flags.toArray() : []
        const userBadge = Badges[flags[0]] || ""

        if (member) {
            const profile = client.economy.storage.data.find(x => x.userId === user.id && x.guildId === interaction.guild.id) || {
                wallet: 0,
                bank: 0,
                level: 1,
                xp: 0,
                warnings: []
            }
            const warningsCount = profile.warnings ? profile.warnings.length : 0

            // Get roles (excluding @everyone)
            const roles = member.roles.cache.filter(role => role.id !== interaction.guild.id)
            const rolesString = roles.size > 0 ? roles.map(role => `<@&${role.id}>`).join(" ") : ls["cmds"]["userinfo"]["no_roles"]

            // Highest role
            const highestRole = member.roles.highest.id !== interaction.guild.id ? `<@&${member.roles.highest.id}>` : "@everyone"

            // Key Permissions
            let perms = ls["cmds"]["userinfo"]["member"]
            if (member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                perms = ls["cmds"]["userinfo"]["admin"]
            } else if (
                member.permissions.has(PermissionsBitField.Flags.ManageGuild) ||
                member.permissions.has(PermissionsBitField.Flags.BanMembers) ||
                member.permissions.has(PermissionsBitField.Flags.KickMembers) ||
                member.permissions.has(PermissionsBitField.Flags.ModerateMembers)
            ) {
                perms = ls["cmds"]["userinfo"]["moderator"]
            }

            client.Embed([{
                thumbnail: user.displayAvatarURL(),
                fields: [
                    { name: `${user.username} ${userBadge}`, value: `<@!${user.id}>`, inline: false },
                    { name: `${ls["cmds"]["userinfo"]["joinedon"]}`, value: `<t:${Math.round(member.joinedTimestamp / 1000)}:f>\n(<t:${Math.round(member.joinedTimestamp / 1000)}:R>)`, inline: true },
                    { name: `${ls["cmds"]["userinfo"]["registeredon"]}`, value: `<t:${Math.round(user.createdTimestamp / 1000)}:f>\n(<t:${Math.round(user.createdTimestamp / 1000)}:R>)`, inline: true },
                    { name: `${ls["cmds"]["userinfo"]["highest_role"]}`, value: highestRole, inline: true },
                    { name: `${ls["cmds"]["userinfo"]["balance"]}`, value: `Wallet: **${profile.wallet.toLocaleString()} 💰**\nBank: **${profile.bank.toLocaleString()} 💰**`, inline: true },
                    { name: `${ls["cmds"]["userinfo"]["leveling"]}`, value: `Level: **${profile.level}**\nXP: **${profile.xp.toLocaleString()}**`, inline: true },
                    { name: `${ls["cmds"]["userinfo"]["warnings"]}`, value: `**${warningsCount}**`, inline: true },
                    { name: `${ls["cmds"]["userinfo"]["key_perms"]}`, value: perms, inline: true },
                    { name: `Bot`, value: user.bot ? ls["cmds"]["userinfo"]["yes"] : ls["cmds"]["userinfo"]["no"], inline: true },
                    { name: `${ls["cmds"]["userinfo"]["avatar"]}`, value: `[Link](${user.displayAvatarURL({ size: 1024 })})`, inline: true },
                    { name: `${handlemsg(ls["cmds"]["userinfo"]["roles"], { size: roles.size })}`, value: rolesString, inline: false }
                ],
                timestamp: interaction.createdTimestamp,
                footer: { text: `ID: ${user.id}` }
            }], undefined, "reply", false, interaction)
        } else {
            // Safe fallback for when member is not available
            client.Embed([{
                thumbnail: user.displayAvatarURL(),
                fields: [
                    { name: `${user.username} ${userBadge}`, value: `<@!${user.id}>`, inline: false },
                    { name: `${ls["cmds"]["userinfo"]["registeredon"]}`, value: `<t:${Math.round(user.createdTimestamp / 1000)}:f> (<t:${Math.round(user.createdTimestamp / 1000)}:R>)`, inline: false },
                    { name: `Bot`, value: user.bot ? ls["cmds"]["userinfo"]["yes"] : ls["cmds"]["userinfo"]["no"], inline: true },
                    { name: `${ls["cmds"]["userinfo"]["avatar"]}`, value: `[Link](${user.displayAvatarURL({ size: 1024 })})`, inline: true }
                ],
                timestamp: interaction.createdTimestamp,
                footer: { text: `ID: ${user.id}` }
            }], undefined, "reply", false, interaction)
        }
    }
}
