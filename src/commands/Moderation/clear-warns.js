const { PermissionsBitField, SlashCommandBuilder } = require("discord.js")
const { handlemsg } = require("../../utils/stringUtils")
const { getOrCreateProfile } = require("../../repositories/ProfileRepository")
const { sendModLog } = require("../../services/SecurityService")

module.exports = {
    guildOnly: true,
    data: new SlashCommandBuilder()
        .setName("clear-warns")
        .setDescription("Clear all warnings of a user")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ModerateMembers)
        .addUserOption((option) => option
            .setName("target")
            .setDescription("The user whose warnings you want to clear")
            .setRequired(true)
        ),
    async execute(client, interaction) {
        const target = interaction.options.getUser("target")

        const ls = client.getLanguage(interaction.guild?.id)

        const profile = await getOrCreateProfile(client, target.id, interaction.guild.id)
        profile.warnings = []

        client.Embed([{
            title: ls["cmds"]["clear-warns"]["title"],
            desc: handlemsg(ls["cmds"]["clear-warns"]["success"], { target: target.id }),
            timestamp: interaction.createdTimestamp,
            footer: { text: `Moderator: ${interaction.user.tag}` }
        }], undefined, "reply", false, interaction)

        await sendModLog(client, interaction.guild, {
            title: ls["logs"]["clear_warns_title"],
            desc: handlemsg(ls["logs"]["clear_warns_desc"], {
                target: target.id,
                tag: target.tag,
                moderator: interaction.user.id
            }),
            color: "#3498db",
            timestamp: Date.now()
        })
    }
}
