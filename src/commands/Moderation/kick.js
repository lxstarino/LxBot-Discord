const { SlashCommandBuilder } = require("@discordjs/builders")
const { PermissionsBitField } = require("discord.js")

module.exports = {
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
    async execute(client, interaction){
        const target = interaction.options.get("target")
        const reason = interaction.options.getString("reason") || "No reason provided"

        let ls = client.getLanguage(interaction.guild?.id)
        const { handlemsg } = require(`${process.cwd()}/src/handlers/functions`)

        if(!target.member) throw({title: ls["errors"]["unf"], desc: handlemsg(ls["cmds"]["kick"]["edesc1"], {target: target.user.id})})
        if(!target.member.moderatable) throw({title: ls["errors"]["mp"], desc: handlemsg(ls["cmds"]["kick"]["edesc2"], {target: target.user.id})})
             
        try {
            await interaction.guild.members.kick(target.user.id, reason)
            client.Embed([{
                title: ls["cmds"]["kick"]["title"],
                desc: handlemsg(ls["cmds"]["kick"]["kicked"], { target: target.user.id }),
                timestamp: interaction.createdTimestamp,
                footer: { text: `Moderator: ${interaction.user.tag}` }
            }], undefined, "reply", undefined, interaction)

            const { sendModLog } = require(`${process.cwd()}/src/handlers/functions`)
            await sendModLog(client, interaction.guild, {
                title: ls["logs"]["kick_title"],
                desc: handlemsg(ls["logs"]["kick_desc"], {
                    target: target.user.id,
                    tag: target.user.tag,
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
                desc: handlemsg(ls["cmds"]["kick"]["edesc2"], { target: target.user.id })
            })
        }
    }
}
