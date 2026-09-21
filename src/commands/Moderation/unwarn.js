const { PermissionsBitField, SlashCommandBuilder } = require("discord.js")
const { handlemsg } = require("../../utils/stringUtils")
const { getOrCreateProfile } = require("../../repositories/ProfileRepository")
const { sendModLog } = require("../../services/SecurityService")

module.exports = {
    guildOnly: true,
    data: new SlashCommandBuilder()
        .setName("unwarn")
        .setDescription("Remove a warning from a user")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ModerateMembers)
        .addUserOption((option) => option
            .setName("target")
            .setDescription("The user whose warning you want to remove")
            .setRequired(true)
        )
        .addIntegerOption((option) => option
            .setName("warn_id")
            .setDescription("The number of the warning to remove (default: most recent)")
            .setMinValue(1)
            .setRequired(false)
        ),
    async execute(client, interaction) {
        const target = interaction.options.getUser("target")
        const warnId = interaction.options.getInteger("warn_id")

        const ls = client.getLanguage(interaction.guild?.id)

        const profile = await getOrCreateProfile(client, target.id, interaction.guild.id)
        const warnings = profile ? (profile.warnings || []) : []

        if (warnings.length === 0) {
            return client.errEmbed({
                type: "reply",
                ephemeral: true,
                title: ls["cmds"]["unwarn"]["title"],
                desc: handlemsg(ls["cmds"]["unwarn"]["no_warns"], { target: target.id })
            }, interaction)
        }

        if (warnId !== null && (warnId < 1 || warnId > warnings.length)) {
            return client.errEmbed({
                type: "reply",
                ephemeral: true,
                title: ls["cmds"]["unwarn"]["title"],
                desc: handlemsg(ls["cmds"]["unwarn"]["invalid_id"], { max: String(warnings.length) })
            }, interaction)
        }

        const warnIndex = warnId !== null ? warnId - 1 : warnings.length - 1
        const updatedWarnings = [...warnings]
        const [removedWarn] = updatedWarnings.splice(warnIndex, 1)
        profile.warnings = updatedWarnings

        client.Embed([{
            title: ls["cmds"]["unwarn"]["title"],
            desc: handlemsg(ls["cmds"]["unwarn"]["success"], {
                target: target.id,
                id: String(warnIndex + 1),
                reason: removedWarn?.reason || "N/A",
                remaining: String(profile.warnings.length)
            }),
            timestamp: interaction.createdTimestamp,
            footer: { text: `Moderator: ${interaction.user.tag}` }
        }], undefined, "reply", false, interaction)

        await sendModLog(client, interaction.guild, {
            title: ls["logs"]["unwarn_title"],
            desc: handlemsg(ls["logs"]["unwarn_desc"], {
                target: target.id,
                tag: target.tag,
                moderator: interaction.user.id,
                id: String(warnIndex + 1),
                reason: removedWarn?.reason || "N/A",
                remaining: String(profile.warnings.length)
            }),
            color: "#2ecc71",
            timestamp: Date.now()
        })
    }
}
