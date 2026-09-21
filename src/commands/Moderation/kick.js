const { PermissionsBitField, SlashCommandBuilder } = require("discord.js")
const { handlemsg } = require("../../utils/stringUtils")
const { sendModLog } = require("../../services/SecurityService")

module.exports = {
    guildOnly: true,
    data: new SlashCommandBuilder()
        .setName("kick")
        .setDescription("Kick a user")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.KickMembers)
        .addUserOption((option) => option
            .setName("target")
            .setDescription("The user to kick")
            .setRequired(true)
        )
        .addStringOption((option) => option
            .setName("reason")
            .setDescription("The reason for kicking this user")
            .setMaxLength(512)
            .setRequired(false)
        ),
    async execute(client, interaction) {
        const targetUser = interaction.options.getUser("target")
        const targetMember = interaction.options.getMember("target")
        const reason = interaction.options.getString("reason") || "No reason provided"

        const ls = client.getLanguage(interaction.guild?.id)

        if (!targetMember) throw ({ title: ls["errors"]["unf"], desc: handlemsg(ls["cmds"]["kick"]["edesc1"], { target: targetUser.id }) })
        if (!targetMember.moderatable) throw ({ title: ls["errors"]["mp"], desc: handlemsg(ls["cmds"]["kick"]["edesc2"], { target: targetUser.id }) })

        try {
            await interaction.guild.members.kick(targetUser.id, reason)
            client.Embed([{
                title: ls["cmds"]["kick"]["title"],
                desc: handlemsg(ls["cmds"]["kick"]["kicked"], { target: targetUser.id }),
                timestamp: interaction.createdTimestamp,
                footer: { text: `Moderator: ${interaction.user.tag}` }
            }], undefined, "reply", undefined, interaction)

            await sendModLog(client, interaction.guild, {
                title: ls["logs"]["kick_title"],
                desc: handlemsg(ls["logs"]["kick_desc"], {
                    target: targetUser.id,
                    tag: targetUser.tag,
                    moderator: interaction.user.id,
                    reason: reason
                }),
                color: "#ff8c00",
                timestamp: Date.now()
            })
        } catch (err) {
            console.error(err)
            throw ({
                title: ls["errors"]["mp"],
                desc: handlemsg(ls["cmds"]["kick"]["edesc2"], { target: targetUser.id })
            })
        }
    }
}
