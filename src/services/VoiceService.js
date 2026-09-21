const { ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require("discord.js")
const { handlemsg } = require("../utils/stringUtils")

class VoiceService {
    static getVoicePanelData(client, guild, voiceChannel, ownerId) {
        const ls = client.getLanguage(guild.id)

        const everyonePerms = voiceChannel.permissionOverwrites.cache.get(guild.roles.everyone.id)
        const isLocked = Boolean(everyonePerms && everyonePerms.deny.has(PermissionsBitField.Flags.Connect))

        const statusText = isLocked
            ? ls["cmds"]["voice"]["panel_status_private"]
            : ls["cmds"]["voice"]["panel_status_public"]

        const limitText = voiceChannel.userLimit === 0
            ? (ls["cmds"]["voice"]["panel_status_no_limit"] || "No Limit")
            : `${voiceChannel.userLimit}`

        const embed = client.tempEmbed()
            .setTitle(ls["cmds"]["voice"]["title"] || "Voice Control Panel")
            .setDescription(handlemsg(ls["cmds"]["voice"]["panel_desc"], {
                owner: ownerId,
                status: statusText,
                limit: limitText
            }))
            .setFooter({ text: ls["cmds"]["voice"]["panel_footer"] || guild.name })

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("voice-lock")
                .setEmoji("🔒")
                .setStyle(isLocked ? ButtonStyle.Success : ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId("voice-unlock")
                .setEmoji("🔓")
                .setStyle(!isLocked ? ButtonStyle.Success : ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId("voice-rename")
                .setEmoji("✏️")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId("voice-limit")
                .setEmoji("👥")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId("voice-kick")
                .setEmoji("🚫")
                .setStyle(ButtonStyle.Danger)
        )

        return { embeds: [embed], components: [row] }
    }
}

module.exports = VoiceService
