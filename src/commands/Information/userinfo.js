const { SlashCommandBuilder, PermissionsBitField } = require("discord.js")
const { handlemsg } = require("../../utils/stringUtils")
const { getOrCreateProfile } = require("../../repositories/ProfileRepository")
const { emojis } = require("../../core/constants")
const LevelingService = require("../../services/LevelingService")

module.exports = {
    data: new SlashCommandBuilder()
        .setName("userinfo")
        .setDescription("Displays information about a user")
        .addUserOption(opt => opt
            .setName("target")
            .setDescription("The user whose info you want to view")),
    async execute(client, interaction) {
        const target = interaction.options.getUser("target") || interaction.user
        const user = await target.fetch().catch(() => target)
        const member = interaction.guild ? await interaction.guild.members.fetch(user.id).catch(() => null) : null

        const ls = client.getLanguage(interaction.guild?.id)

        const houseEmojis = {
            HypeSquadOnlineHouse1: emojis.house_brave || "🟣",
            HypeSquadOnlineHouse2: emojis.house_brilliance || "🪸",
            HypeSquadOnlineHouse3: emojis.house_balance || "🟢"
        }
        const badges = (user.flags ? user.flags.toArray() : []).map(f => houseEmojis[f]).filter(Boolean)
        if (user.avatar?.startsWith("a_") || user.banner || user.avatarDecoration) {
            badges.push(emojis.nitro || "💳")
        }
        if (member?.premiumSince) {
            badges.push(emojis.boosts || "🚀")
        }
        if (user.bot) badges.push("🤖")

        const name = user.globalName ? `**${user.globalName}** (\`@${user.username}\`)` : `**@${user.username}**`
        const desc = `${name}${badges.length ? ` ${badges.join(" ")}` : ""}\n<@!${user.id}> • 🖼️ [${ls["cmds"]["userinfo"]["avatar_link"]}](${user.displayAvatarURL({ size: 1024 })})`

        const created = Math.round(user.createdTimestamp / 1000)
        const general = handlemsg(ls["cmds"]["userinfo"]["general_val"], {
            created: String(created),
            joined: String(Math.round((member?.joinedTimestamp || 0) / 1000)),
            nickname: member?.nickname ? `\`${member.nickname}\`` : ls["cmds"]["userinfo"]["none"],
            bot: user.bot ? ls["cmds"]["userinfo"]["yes"] : ls["cmds"]["userinfo"]["no"]
        })

        const fields = [{ name: ls["cmds"]["userinfo"]["section_general"], value: general, inline: Boolean(member) }]

        if (member) {
            const profile = await getOrCreateProfile(client, user.id, interaction.guild.id)
            const roles = member.roles.cache.filter(r => r.id !== interaction.guild.id).sort((a, b) => b.position - a.position)
            const rolesText = roles.size ? roles.first(10).map(r => `<@&${r.id}>`).join(" ") : ls["cmds"]["userinfo"]["no_roles"]

            const perms = member.permissions.has(PermissionsBitField.Flags.Administrator) ? ls["cmds"]["userinfo"]["admin"]
                : member.permissions.has(PermissionsBitField.Flags.ManageGuild) || member.permissions.has(PermissionsBitField.Flags.ModerateMembers) ? ls["cmds"]["userinfo"]["moderator"]
                    : ls["cmds"]["userinfo"]["member"]

            let serverStatus = handlemsg(ls["cmds"]["userinfo"]["server_val"], {
                highest: member.roles.highest.id !== interaction.guild.id ? `<@&${member.roles.highest.id}>` : "@everyone",
                perms: perms,
                voice: member.voice?.channelId ? `<#${member.voice.channelId}>` : ls["cmds"]["userinfo"]["none"],
                warnings: String(profile.warnings?.length || 0)
            })
            if (member.premiumSince) {
                serverStatus += handlemsg(ls["cmds"]["userinfo"]["booster_val"], { time: String(Math.round(member.premiumSinceTimestamp / 1000)) })
            }

            const lvl = profile.level || 1
            const xp = profile.xp || 0

            const ecoValue = handlemsg(ls["cmds"]["userinfo"]["eco_val"], {
                wallet: (profile.wallet || 0).toLocaleString(),
                bank: (profile.bank || 0).toLocaleString(),
                level: String(lvl),
                xp: xp.toLocaleString(),
                needed: LevelingService.getRequiredXp(lvl).toLocaleString()
            })

            fields.push(
                { name: ls["cmds"]["userinfo"]["section_server"], value: serverStatus, inline: true },
                { name: ls["cmds"]["userinfo"]["section_eco"], value: ecoValue, inline: false },
                { name: handlemsg(ls["cmds"]["userinfo"]["roles"], { size: String(roles.size) }), value: roles.size > 10 ? `${rolesText} *${handlemsg(ls["cmds"]["userinfo"]["more_roles"], { count: String(roles.size - 10) })}*` : rolesText, inline: false }
            )
        }

        client.Embed([{
            author: { name: user.username, iconURL: user.displayAvatarURL() },
            thumbnail: user.displayAvatarURL({ size: 512 }),
            color: member?.displayHexColor && member.displayHexColor !== "#000000" ? member.displayHexColor : null,
            desc: desc,
            fields: fields,
            timestamp: interaction.createdTimestamp,
            footer: { text: `ID: ${user.id}` }
        }], undefined, "reply", false, interaction)
    }
}
