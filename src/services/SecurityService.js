const { PermissionsBitField } = require("discord.js")
const { handlemsg } = require("../utils/stringUtils")
const SettingsRepository = require("../repositories/SettingsRepository")

class SecurityService {
    static async sendModLog(client, guild, embedData) {
        if (!guild) return
        const settings = await SettingsRepository.getOrCreate(client, guild.id)
        if (!settings || !settings.logchannel) return

        const channel = guild.channels.cache.get(settings.logchannel)
        if (!channel) return

        client.Embed([embedData], undefined, "send", false, channel)
    }

    static async processHoneypotMessage(client, message, isCatchup = false) {
        if (!message || !message.guild || message.author.bot) return false

        const settings = client.settings?.get(message.guild.id) || await SettingsRepository.getOrCreate(client, message.guild.id)
        if (!settings?.honeypot_channel || message.channel.id !== settings.honeypot_channel) return false

        const member = message.member || await message.guild.members.fetch(message.author.id).catch(() => null)
        if (!member) return false

        const isExempt = member.permissions.has(PermissionsBitField.Flags.Administrator) ||
            member.permissions.has(PermissionsBitField.Flags.ManageGuild) ||
            member.permissions.has(PermissionsBitField.Flags.ManageMessages) ||
            member.permissions.has(PermissionsBitField.Flags.ModerateMembers)

        if (isExempt) return false

        await message.delete().catch(() => {})

        const action = settings.honeypot_action || "ban"
        const ls = client.getLanguage(message.guild.id)
        const reason = isCatchup
            ? "Honeypot Triggered (Startup Sweep / Offline Catch-Up)"
            : "Honeypot Triggered (Automated Bot Trap)"

        try {
            const dmText = handlemsg(ls["events"]["honeypot"]["dm_desc"], {
                guild: message.guild.name,
                action: action.toUpperCase()
            })
            await message.author.send({
                embeds: [{
                    title: ls["events"]["honeypot"]["dm_title"],
                    description: dmText,
                    color: 0xe74c3c,
                    timestamp: new Date().toISOString()
                }]
            }).catch(() => {})
        } catch (_) {}

        if (action === "softban") {
            if (member.bannable) {
                await member.ban({ deleteMessageSeconds: 604800, reason })
                await message.guild.members.unban(message.author.id, "Honeypot Softban auto-unban").catch(() => {})
            }
        } else {
            if (member.bannable) {
                await member.ban({ deleteMessageSeconds: 604800, reason })
            }
        }

        if (!Array.isArray(settings.honeypot_caught_users)) {
            settings.honeypot_caught_users = []
        }
        settings.honeypot_caught_users = [...settings.honeypot_caught_users, message.author.id]

        await SecurityService.updateHoneypotWarningEmbed(client, message.guild, settings).catch(() => {})

        const actionLabel = isCatchup ? `${action.toUpperCase()} [Startup-Sweep]` : action.toUpperCase()
        await SecurityService.sendModLog(client, message.guild, {
            title: ls["logs"]["honeypot_title"],
            desc: handlemsg(ls["logs"]["honeypot_desc"], {
                target: message.author.id,
                tag: message.author.tag,
                channel: message.channel.id,
                action: actionLabel,
                count: String(settings.honeypot_caught_users.length),
                content: message.cleanContent?.slice(0, 1000) || message.content?.slice(0, 1000) || "[No text content]"
            }),
            color: "#e74c3c",
            timestamp: Date.now()
        })

        return true
    }

    static async updateHoneypotWarningEmbed(client, guild, settings) {
        if (!settings?.honeypot_channel) return
        const channel = guild.channels.cache.get(settings.honeypot_channel)
        if (!channel || !channel.isTextBased()) return

        const ls = client.getLanguage(guild.id)
        const count = Array.isArray(settings.honeypot_caught_users) ? settings.honeypot_caught_users.length : 0

        const warnEmbed = {
            title: ls["cmds"]["honeypot-setup"]["warning_embed_title"],
            description: handlemsg(ls["cmds"]["honeypot-setup"]["warning_embed_desc"], {
                count: String(count)
            }),
            color: 0xff0000,
            footer: { text: ls["cmds"]?.["honeypot-setup"]?.["warning_embed_footer"] || "Security System • Automated Bot Trap" },
            timestamp: new Date().toISOString()
        }

        let msg = null
        if (settings.honeypot_warning_message_id) {
            msg = await channel.messages.fetch(settings.honeypot_warning_message_id).catch(() => null)
        }

        if (!msg) {
            const pinned = await channel.messages.fetchPinned().catch(() => null)
            msg = pinned?.find(m => m.author.id === client.user.id && m.embeds.some(e => e.title === ls["cmds"]["honeypot-setup"]["warning_embed_title"]))
        }

        if (msg) {
            await msg.edit({ embeds: [warnEmbed] }).catch(() => {})
            if (!settings.honeypot_warning_message_id) {
                settings.honeypot_warning_message_id = msg.id
            }
        } else {
            const sent = await channel.send({ embeds: [warnEmbed] }).catch(() => null)
            if (sent) {
                await sent.pin().catch(() => {})
                settings.honeypot_warning_message_id = sent.id
            }
        }
    }
}

module.exports = SecurityService
