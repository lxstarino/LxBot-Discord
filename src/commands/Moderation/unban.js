const { SlashCommandBuilder } = require("@discordjs/builders")
const { PermissionsBitField } = require("discord.js")

module.exports = {
    data: new SlashCommandBuilder()
        .setName("unban")
        .setDescription("Unban a User")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.BanMembers)
        .addUserOption((option) => option
            .setName("target")
            .setDescription("target")
            .setRequired(true)
        ),
    async execute(client, interaction) {
        const target = interaction.options.get("target")

        let ls = client.getLanguage(interaction.guild?.id)
        const { handlemsg } = require(`${process.cwd()}/src/handlers/functions`)

        const banList = await interaction.guild.bans.fetch()
        if (!banList.get(target.user.id)) throw ({ title: `${ls["errors"]["uinb"]}`, desc: handlemsg(ls["cmds"]["ban/unban"]["edesc3"], { target: target.user.id }) })

        try {
            await interaction.guild.members.unban(target.user.id)
            client.Embed([{
                title: ls["cmds"]["ban/unban"]["unbantitle"],
                desc: handlemsg(ls["cmds"]["ban/unban"]["unbanned"], { target: target.user.id }),
                timestamp: interaction.createdTimestamp,
                footer: { text: `Moderator: ${interaction.user.tag}` }
            }], undefined, "reply", undefined, interaction)

            const { sendModLog } = require(`${process.cwd()}/src/handlers/functions`)
            await sendModLog(client, interaction.guild, {
                title: ls["logs"]["unban_title"],
                desc: handlemsg(ls["logs"]["unban_desc"], {
                    target: target.user.id,
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
                desc: handlemsg(ls["cmds"]["ban/unban"]["edesc1"], { target: target.user.id })
            })
        }
    }
}
