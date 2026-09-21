const { PermissionsBitField, SlashCommandBuilder } = require("discord.js")
const { handlemsg } = require("../../utils/stringUtils")
const { getOrCreateProfile } = require("../../repositories/ProfileRepository")
const { sendModLog } = require("../../services/SecurityService")

module.exports = {
    guildOnly: true,
    data: new SlashCommandBuilder()
        .setName("warn")
        .setDescription("Warn a user on the server")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ModerateMembers)
        .addUserOption((option) => option
            .setName("target")
            .setDescription("The user you want to warn")
            .setRequired(true)
        )
        .addStringOption((option) => option
            .setName("reason")
            .setDescription("The reason for warning this user")
            .setMaxLength(512)
            .setRequired(false)
        ),
    async execute(client, interaction) {
        const target = interaction.options.getUser("target")
        const reason = interaction.options.getString("reason") || "No reason provided"

        const ls = client.getLanguage(interaction.guild?.id)

        const profile = await getOrCreateProfile(client, target.id, interaction.guild.id)
        profile.warnings = profile.warnings || []

        profile.warnings.push({
            moderator: interaction.user.id,
            reason: reason,
            timestamp: Date.now()
        })

        client.Embed([{
            title: ls["cmds"]["warn"]["title"],
            desc: handlemsg(ls["cmds"]["warn"]["success"], { target: target.id, reason: reason, count: profile.warnings.length }),
            timestamp: interaction.createdTimestamp,
            footer: { text: `Moderator: ${interaction.user.tag}` }
        }], undefined, "reply", false, interaction)

        await sendModLog(client, interaction.guild, {
            title: ls["logs"]["warn_title"],
            desc: handlemsg(ls["logs"]["warn_desc"], {
                target: target.id,
                tag: target.tag,
                moderator: interaction.user.id,
                reason: reason,
                count: profile.warnings.length
            }),
            color: "#f1c40f",
            timestamp: Date.now()
        })
    }
}
