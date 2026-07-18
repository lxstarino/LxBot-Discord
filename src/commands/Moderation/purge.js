const { SlashCommandBuilder } = require("@discordjs/builders")
const { PermissionsBitField } = require("discord.js")

module.exports = {
    data: new SlashCommandBuilder()
        .setName("purge")
        .setDescription("Delete a specified amount of messages in this channel")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages)
        .addIntegerOption((option) => option
            .setName("amount")
            .setDescription("The number of messages to delete (1-100)")
            .setMinValue(1)
            .setMaxValue(100)
            .setRequired(true)
        )
        .addUserOption((option) => option
            .setName("target")
            .setDescription("Only delete messages from this user")
            .setRequired(false)
        ),
    async execute(client, interaction) {
        let ls = client.getLanguage(interaction.guild?.id)
        const { handlemsg } = require(`${process.cwd()}/src/handlers/functions`)

        // Check if bot has ManageMessages permission in this channel
        if (!interaction.guild.members.me.permissionsIn(interaction.channel).has(PermissionsBitField.Flags.ManageMessages)) {
            return client.errEmbed({
                type: "reply",
                ephemeral: true,
                title: ls["cmds"]["purge"]["title"],
                desc: ls["cmds"]["purge"]["err_perms"]
            }, interaction)
        }

        const amount = interaction.options.getInteger("amount")
        const targetUser = interaction.options.getUser("target")

        await interaction.deferReply({ ephemeral: true })

        try {
            let deletedCount = 0

            if (targetUser) {
                // Fetch the last 100 messages in the channel
                const messages = await interaction.channel.messages.fetch({ limit: 100 })
                // Filter messages from the target user
                const targetMessages = messages.filter(m => m.author.id === targetUser.id).first(amount)

                if (targetMessages.length > 0) {
                    const deleted = await interaction.channel.bulkDelete(targetMessages, true)
                    deletedCount = deleted.size
                }
            } else {
                const deleted = await interaction.channel.bulkDelete(amount, true)
                deletedCount = deleted.size
            }

            const { sendModLog } = require(`${process.cwd()}/src/handlers/functions`)
            await sendModLog(client, interaction.guild, {
                title: ls["logs"]["purge_title"],
                desc: targetUser
                    ? handlemsg(ls["logs"]["purge_user_desc"], { count: deletedCount, moderator: interaction.user.id, target: targetUser.id, channel: interaction.channel.id })
                    : handlemsg(ls["logs"]["purge_desc"], { count: deletedCount, moderator: interaction.user.id, channel: interaction.channel.id }),
                color: "#95a5a6",
                timestamp: Date.now()
            })

            // Check if the bulkDelete succeeded but deleted fewer messages because of the 14 days limit
            if (deletedCount < amount && !targetUser) {
                return client.Embed([{
                    title: ls["cmds"]["purge"]["title"],
                    desc: `${handlemsg(ls["cmds"]["purge"]["success"], { count: deletedCount })}\n\n⚠️ *${ls["cmds"]["purge"]["err_limit"]}*`,
                    timestamp: interaction.createdTimestamp,
                    footer: { text: `Moderator: ${interaction.user.tag}` }
                }], undefined, "editReply", true, interaction)
            }

            const successDesc = targetUser 
                ? handlemsg(ls["cmds"]["purge"]["success_user"], { count: deletedCount, target: targetUser.id })
                : handlemsg(ls["cmds"]["purge"]["success"], { count: deletedCount })

            client.Embed([{
                title: ls["cmds"]["purge"]["title"],
                desc: successDesc,
                timestamp: interaction.createdTimestamp,
                footer: { text: `Moderator: ${interaction.user.tag}` }
            }], undefined, "editReply", true, interaction)

        } catch (err) {
            console.error(err)
            client.errEmbed({
                type: "editReply",
                title: ls["cmds"]["purge"]["title"],
                desc: ls["cmds"]["purge"]["err_limit"]
            }, interaction)
        }
    }
}
