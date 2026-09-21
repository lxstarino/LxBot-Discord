const { PermissionsBitField, ChannelType, SlashCommandBuilder } = require("discord.js")
const { handlemsg } = require("../../utils/stringUtils")
const { getOrCreateSettings } = require("../../repositories/SettingsRepository")
const { updateHoneypotWarningEmbed } = require("../../services/SecurityService")

module.exports = {
    guildOnly: true,
    data: new SlashCommandBuilder()
        .setName("honeypot-setup")
        .setDescription("Configure the honeypot security system against compromised accounts and spambots")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .addSubcommand(sub => sub
            .setName("set")
            .setDescription("Set the honeypot trap channel and punishment action")
            .addChannelOption(opt => opt
                .setName("channel")
                .setDescription("The text channel to use as the honeypot trap")
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)
            )
            .addStringOption(opt => opt
                .setName("action")
                .setDescription("The action to take when a user posts in the honeypot (default: ban)")
                .setRequired(false)
                .addChoices(
                    { name: "Ban (Purge 7d messages, permanent)", value: "ban" },
                    { name: "Softban (Purge 7d messages, kicks user)", value: "softban" }
                )
            )
        )
        .addSubcommand(sub => sub
            .setName("disable")
            .setDescription("Disable the honeypot system")
        )
        .addSubcommand(sub => sub
            .setName("status")
            .setDescription("Show current honeypot status and configuration")
        )
        .addSubcommand(sub => sub
            .setName("list-caught")
            .setDescription("List all user IDs caught by the honeypot")
        )
        .addSubcommand(sub => sub
            .setName("clear-caught")
            .setDescription("Clear the list and counter of caught honeypot accounts")
        )
        .addSubcommand(sub => sub
            .setName("remove-caught")
            .setDescription("Remove a specific user ID from the caught list")
            .addStringOption(opt => opt
                .setName("user_id")
                .setDescription("The user ID or @mention to remove from the caught list")
                .setRequired(true)
            )
        ),

    async execute(client, interaction) {
        const subcommand = interaction.options.getSubcommand()
        const ls = client.getLanguage(interaction.guild?.id)
        const settings = await getOrCreateSettings(client, interaction.guild.id)

        if (subcommand === "set") {
            const channel = interaction.options.getChannel("channel")
            const action = interaction.options.getString("action") || "ban"

            const botMember = interaction.guild.members.me
            const channelPerms = channel.permissionsFor(botMember)
            if (!channelPerms.has(PermissionsBitField.Flags.SendMessages) ||
                !channelPerms.has(PermissionsBitField.Flags.EmbedLinks) ||
                !channelPerms.has(PermissionsBitField.Flags.ManageMessages)) {
                return client.errEmbed({
                    type: "reply",
                    ephemeral: true,
                    title: ls["cmds"]["honeypot-setup"]["title"],
                    desc: handlemsg(ls["cmds"]["honeypot-setup"]["err_channel_perms"], { channel: channel.id })
                }, interaction)
            }

            if (!botMember.permissions.has(PermissionsBitField.Flags.BanMembers)) {
                return client.errEmbed({
                    type: "reply",
                    ephemeral: true,
                    title: ls["cmds"]["honeypot-setup"]["title"],
                    desc: ls["cmds"]["honeypot-setup"]["err_ban_perms"]
                }, interaction)
            }

            settings.honeypot_channel = channel.id
            settings.honeypot_action = action

            await updateHoneypotWarningEmbed(client, interaction.guild, settings)

            client.Embed([{
                title: ls["cmds"]["honeypot-setup"]["title"],
                desc: handlemsg(ls["cmds"]["honeypot-setup"]["set_success"], {
                    channel: channel.id,
                    action: action.toUpperCase()
                }),
                timestamp: interaction.createdTimestamp
            }], undefined, "reply", true, interaction)

        } else if (subcommand === "disable") {
            settings.honeypot_channel = null
            settings.honeypot_action = null

            client.Embed([{
                title: ls["cmds"]["honeypot-setup"]["title"],
                desc: ls["cmds"]["honeypot-setup"]["disabled_success"],
                timestamp: interaction.createdTimestamp
            }], undefined, "reply", true, interaction)

        } else if (subcommand === "status") {
            const isEnabled = Boolean(settings.honeypot_channel)
            const channelText = isEnabled ? `<#${settings.honeypot_channel}>` : ls["cmds"]["honeypot-setup"]["not_configured"]
            const actionText = isEnabled ? (settings.honeypot_action || "ban").toUpperCase() : "-"
            const statusTag = isEnabled ? "🟢 " + ls["cmds"]["honeypot-setup"]["active"] : "🔴 " + ls["cmds"]["honeypot-setup"]["inactive"]
            const caughtList = Array.isArray(settings.honeypot_caught_users) ? settings.honeypot_caught_users : []
            const count = caughtList.length

            let caughtPreview = ""
            if (count > 0) {
                const recent = caughtList.slice(-5).reverse()
                const formattedRecent = recent.map(id => `\`${id}\``).join(", ")
                caughtPreview = `\n> **${ls["cmds"]["honeypot-setup"]["recent_caught"]}:** ${formattedRecent}${count > 5 ? ` *(+${count - 5})*` : ""}`
            }

            client.Embed([{
                title: ls["cmds"]["honeypot-setup"]["status_title"],
                desc: handlemsg(ls["cmds"]["honeypot-setup"]["status_desc"], {
                    status: statusTag,
                    channel: channelText,
                    action: actionText,
                    count: String(count),
                    caught_list: caughtPreview
                }),
                timestamp: interaction.createdTimestamp
            }], undefined, "reply", true, interaction)

        } else if (subcommand === "list-caught") {
            const caughtList = Array.isArray(settings.honeypot_caught_users) ? settings.honeypot_caught_users : []
            if (caughtList.length === 0) {
                return client.Embed([{
                    title: ls["cmds"]["honeypot-setup"]["title"],
                    desc: ls["cmds"]["honeypot-setup"]["no_caught"],
                    timestamp: interaction.createdTimestamp
                }], undefined, "reply", true, interaction)
            }

            const formatted = caughtList.map((id, idx) => `**#${idx + 1}** • \`${id}\``).slice(0, 30).join("\n")
            const overflow = caughtList.length > 30 ? handlemsg(ls["cmds"]["honeypot-setup"]["list_overflow"] || "\n*...and {count} more.*", { count: String(caughtList.length - 30) }) : ""

            client.Embed([{
                title: handlemsg(ls["cmds"]["honeypot-setup"]["list_caught_title"], { count: String(caughtList.length) }),
                desc: formatted + overflow,
                timestamp: interaction.createdTimestamp
            }], undefined, "reply", true, interaction)

        } else if (subcommand === "clear-caught") {
            const previousCount = Array.isArray(settings.honeypot_caught_users) ? settings.honeypot_caught_users.length : 0
            settings.honeypot_caught_users = []
            await updateHoneypotWarningEmbed(client, interaction.guild, settings).catch(() => {})

            client.Embed([{
                title: ls["cmds"]["honeypot-setup"]["title"],
                desc: handlemsg(ls["cmds"]["honeypot-setup"]["cleared_caught_success"], {
                    count: String(previousCount)
                }),
                timestamp: interaction.createdTimestamp
            }], undefined, "reply", true, interaction)

        } else if (subcommand === "remove-caught") {
            const input = interaction.options.getString("user_id")
            const targetId = input.replace(/[<@!>]/g, "").trim()
            const caughtList = Array.isArray(settings.honeypot_caught_users) ? settings.honeypot_caught_users : []

            if (!caughtList.includes(targetId)) {
                return client.errEmbed({
                    type: "reply",
                    ephemeral: true,
                    title: ls["cmds"]["honeypot-setup"]["title"],
                    desc: handlemsg(ls["cmds"]["honeypot-setup"]["not_in_caught_list"], { id: targetId })
                }, interaction)
            }

            settings.honeypot_caught_users = caughtList.filter(id => id !== targetId)
            await updateHoneypotWarningEmbed(client, interaction.guild, settings).catch(() => {})

            client.Embed([{
                title: ls["cmds"]["honeypot-setup"]["title"],
                desc: handlemsg(ls["cmds"]["honeypot-setup"]["remove_caught_success"], {
                    id: targetId,
                    remaining: String(settings.honeypot_caught_users.length)
                }),
                timestamp: interaction.createdTimestamp
            }], undefined, "reply", true, interaction)
        }
    }
}
