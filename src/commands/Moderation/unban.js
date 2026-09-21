const { PermissionsBitField, SlashCommandBuilder } = require("discord.js")
const { handlemsg } = require("../../utils/stringUtils")
const { sendModLog } = require("../../services/SecurityService")

module.exports = {
    guildOnly: true,
    data: new SlashCommandBuilder()
        .setName("unban")
        .setDescription("Unban a User")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.BanMembers)
        .addUserOption((option) => option
            .setName("target")
            .setDescription("The user to unban")
            .setRequired(true)
        ),
    async execute(client, interaction) {
        const targetUser = interaction.options.getUser("target")

        const ls = client.getLanguage(interaction.guild?.id)

        const banList = await interaction.guild.bans.fetch()
        if (!banList.get(targetUser.id)) throw ({ title: `${ls["errors"]["uinb"]}`, desc: handlemsg(ls["cmds"]["ban/unban"]["edesc3"], { target: targetUser.id }) })

        try {
            await interaction.guild.members.unban(targetUser.id)
            client.Embed([{
                title: ls["cmds"]["ban/unban"]["unbantitle"],
                desc: handlemsg(ls["cmds"]["ban/unban"]["unbanned"], { target: targetUser.id }),
                timestamp: interaction.createdTimestamp,
                footer: { text: `Moderator: ${interaction.user.tag}` }
            }], undefined, "reply", undefined, interaction)

            await sendModLog(client, interaction.guild, {
                title: ls["logs"]["unban_title"],
                desc: handlemsg(ls["logs"]["unban_desc"], {
                    target: targetUser.id,
                    moderator: interaction.user.id,
                    reason: "No reason provided"
                }),
                color: "#00ff00",
                timestamp: Date.now()
            })
        } catch (err) {
            console.error(err)
            throw ({
                title: ls["errors"]["mp"],
                desc: handlemsg(ls["cmds"]["ban/unban"]["edesc1"], { target: targetUser.id })
            })
        }
    }
}
