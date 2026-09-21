const { PermissionsBitField, SlashCommandBuilder } = require("discord.js")
const { handlemsg } = require("../../utils/stringUtils")
const { sendModLog } = require("../../services/SecurityService")

const durationMap = {
    "60000": "60s",
    "300000": "5m",
    "600000": "10m",
    "3600000": "1h",
    "86400000": "1d",
    "604800000": "1w"
}

module.exports = {
    guildOnly: true,
    data: new SlashCommandBuilder()
        .setName("timeout")
        .setDescription("Timeout/Mute a member on the server")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ModerateMembers)
        .addUserOption((option) => option
            .setName("target")
            .setDescription("The member you want to timeout")
            .setRequired(true)
        )
        .addStringOption((option) => option
            .setName("duration")
            .setDescription("The duration of the timeout")
            .setRequired(true)
            .addChoices(
                { name: "60 seconds", value: "60000" },
                { name: "5 minutes", value: "300000" },
                { name: "10 minutes", value: "600000" },
                { name: "1 hour", value: "3600000" },
                { name: "1 day", value: "86400000" },
                { name: "1 week", value: "604800000" }
            )
        )
        .addStringOption((option) => option
            .setName("reason")
            .setDescription("The reason for timing out this user")
            .setMaxLength(512)
            .setRequired(false)
        ),
    async execute(client, interaction) {
        const targetUser = interaction.options.getUser("target")
        const durationVal = interaction.options.getString("duration")
        const reason = interaction.options.getString("reason") || "No reason provided"

        const ls = client.getLanguage(interaction.guild?.id)

        const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null)
        if (!member) {
            throw ({ title: ls["cmds"]["timeout"]["title"], desc: ls["errors"]["unf"] })
        }

        if (!member.moderatable) {
            return client.errEmbed({
                type: "reply",
                ephemeral: true,
                title: ls["cmds"]["timeout"]["title"],
                desc: ls["cmds"]["timeout"]["err_not_moderateable"]
            }, interaction)
        }

        const durationMs = parseInt(durationVal, 10)
        await member.timeout(durationMs, reason)

        const durationKey = durationMap[durationVal]
        const durationTranslated = ls["cmds"]["timeout"]["durations"][durationKey]

        client.Embed([{
            title: ls["cmds"]["timeout"]["title"],
            desc: handlemsg(ls["cmds"]["timeout"]["success"], {
                target: targetUser.id,
                duration: durationTranslated,
                reason: reason
            }),
            timestamp: interaction.createdTimestamp,
            footer: { text: `Moderator: ${interaction.user.tag}` }
        }], undefined, "reply", false, interaction)

        await sendModLog(client, interaction.guild, {
            title: ls["logs"]["timeout_title"],
            desc: handlemsg(ls["logs"]["timeout_desc"], {
                target: targetUser.id,
                tag: targetUser.tag,
                moderator: interaction.user.id,
                duration: durationTranslated,
                reason: reason
            }),
            color: "#e67e22",
            timestamp: Date.now()
        })
    }
}
