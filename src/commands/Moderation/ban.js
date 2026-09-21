const { PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require("discord.js")
const { handlemsg } = require("../../utils/stringUtils")
const { sendModLog } = require("../../services/SecurityService")

module.exports = {
    guildOnly: true,
    data: new SlashCommandBuilder()
        .setName("ban")
        .setDescription("Ban a user from the server")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.BanMembers)
        .addUserOption((option) => option
            .setName("target")
            .setDescription("The user to ban")
            .setRequired(true)
        )
        .addStringOption((option) => option
            .setName("reason")
            .setDescription("The reason for banning this user")
            .setMaxLength(512)
            .setRequired(false)
        ),
    async execute(client, interaction) {
        const targetUser = interaction.options.getUser("target")
        const targetMember = interaction.options.getMember("target")

        const ls = client.getLanguage(interaction.guild?.id)

        if (targetMember && !targetMember.moderatable) {
            throw ({ title: `${ls["errors"]["mp"]}`, desc: handlemsg(ls["cmds"]["ban/unban"]["edesc1"], { target: targetUser.id }) })
        }
        const banList = await interaction.guild.bans.fetch()
        if (banList.get(targetUser.id)) {
            throw ({ title: `${ls["errors"]["uab"]}`, desc: handlemsg(ls["cmds"]["ban/unban"]["edesc2"], { target: targetUser.id }) })
        }

        const ConfirmMenu = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("ban-confirm")
                    .setLabel(ls["cmds"]["ban/unban"]["btnconfirm"])
                    .setEmoji("✅")
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId("ban-cancel")
                    .setLabel(ls["cmds"]["ban/unban"]["btncancel"])
                    .setEmoji("❌")
                    .setStyle(ButtonStyle.Danger)
            )

        const msg = await client.Embed([{
            title: ls["cmds"]["ban/unban"]["bantitle"],
            desc: handlemsg(ls["cmds"]["ban/unban"]["bandesc"], { target: targetUser.id }),
            timestamp: interaction.createdTimestamp,
            footer: { text: `Moderator: ${interaction.user.tag}` }
        }], [ConfirmMenu], "reply", undefined, interaction)

        try {
            const i = await msg.awaitMessageComponent({ filter: i => i.user.id === interaction.user.id, time: 60000 })
            if (i.customId === "ban-confirm") {
                try {
                    const reason = interaction.options.getString("reason") || "No reason provided"
                    await interaction.guild.members.ban(targetUser.id, { reason })
                    await client.Embed([{
                        title: ls["cmds"]["ban/unban"]["bantitle"],
                        desc: handlemsg(ls["cmds"]["ban/unban"]["banned"], { target: targetUser.id }),
                        timestamp: i.createdTimestamp,
                        footer: { text: `Moderator: ${i.user.tag}` }
                    }], [], "update", undefined, i)

                    await sendModLog(client, interaction.guild, {
                        title: ls["logs"]["ban_title"],
                        desc: handlemsg(ls["logs"]["ban_desc"], {
                            target: targetUser.id,
                            tag: targetUser.tag,
                            moderator: interaction.user.id,
                            reason: reason
                        }),
                        color: "#ff0000",
                        timestamp: Date.now()
                    })
                } catch (err) {
                    await client.errEmbed({
                        type: "reply",
                        ephemeral: true,
                        title: ls["errors"]["mp"],
                        desc: handlemsg(ls["cmds"]["ban/unban"]["edesc1"], { target: targetUser.id })
                    }, i)
                }
            } else if (i.customId === "ban-cancel") {
                await client.Embed([{
                    title: ls["cmds"]["ban/unban"]["bantitle"],
                    desc: ls["cmds"]["ban/unban"]["canceled"],
                    timestamp: i.createdTimestamp,
                    footer: { text: `Moderator: ${i.user.tag}` }
                }], [], "update", undefined, i)
            }
        } catch (err) {
            await client.Embed([{
                title: ls["cmds"]["ban/unban"]["bantitle"],
                desc: ls["cmds"]["ban/unban"]["canceled2"],
                timestamp: interaction.createdTimestamp,
                footer: { text: `Moderator: ${interaction.user.tag}` }
            }], [], "editReply", undefined, interaction).catch((err) => console.error("[ban] Failed to edit reply with cancel embed:", err.message))
        }
    }
}
