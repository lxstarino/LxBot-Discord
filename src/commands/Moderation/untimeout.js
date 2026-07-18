const { SlashCommandBuilder } = require("@discordjs/builders")
const { PermissionsBitField } = require("discord.js")

module.exports = {
    data: new SlashCommandBuilder()
        .setName("untimeout")
        .setDescription("Remove timeout/mute from a member on the server")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ModerateMembers)
        .addUserOption((option) => option
            .setName("target")
            .setDescription("The member you want to untimeout")
            .setRequired(true)
        )
        .addStringOption((option) => option
            .setName("reason")
            .setDescription("The reason for untiming out this user")
            .setMaxLength(512)
            .setRequired(false)
        ),
    async execute(client, interaction) {
        const target = interaction.options.get("target")
        const reason = interaction.options.getString("reason") || "No reason provided"

        let ls = client.getLanguage(interaction.guild?.id)
        const { handlemsg } = require(`${process.cwd()}/src/handlers/functions`)

        const member = await interaction.guild.members.fetch(target.user.id).catch(() => null)
        if (!member) {
            throw ({ title: ls["cmds"]["untimeout"]["title"], desc: ls["errors"]["unf"] })
        }

        const disabledUntil = member.communicationDisabledUntilTimestamp
        if (!disabledUntil || disabledUntil < Date.now()) {
            return client.errEmbed({
                type: "reply",
                ephemeral: true,
                title: ls["cmds"]["untimeout"]["title"],
                desc: ls["cmds"]["untimeout"]["err_not_timed_out"]
            }, interaction)
        }

        await member.timeout(null, reason)

        client.Embed([{
            title: ls["cmds"]["untimeout"]["title"],
            desc: handlemsg(ls["cmds"]["untimeout"]["success"], {
                target: target.user.id,
                reason: reason
            }),
            timestamp: interaction.createdTimestamp,
            footer: { text: `Moderator: ${interaction.user.tag}` }
        }], undefined, "reply", false, interaction)

        const { sendModLog } = require(`${process.cwd()}/src/handlers/functions`)
        await sendModLog(client, interaction.guild, {
            title: ls["logs"]["untimeout_title"],
            desc: handlemsg(ls["logs"]["untimeout_desc"], {
                target: target.user.id,
                tag: target.user.tag,
                moderator: interaction.user.id,
                reason: reason
            }),
            color: "#2ecc71",
            timestamp: Date.now()
        })
    }
}
