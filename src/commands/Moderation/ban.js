const { SlashCommandBuilder } = require("@discordjs/builders")
const { PermissionsBitField, ActionRowBuilder, ButtonBuilder } = require("discord.js")

module.exports = {
    data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban a User")
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

        if(target.member) if(!target.member.moderatable) throw({title: `${ls["errors"]["mp"]}`, desc: handlemsg(ls["cmds"]["ban/unban"]["edesc1"], {target: target.user.id})})
        const banList = await interaction.guild.bans.fetch()
        if(banList.get(target.user.id)) throw{title: `${ls["errors"]["uab"]}`, desc: handlemsg(ls["cmds"]["ban/unban"]["edesc2"], {target: target.user.id})}

        const ConfirmMenu = new ActionRowBuilder()  
        .addComponents(
            new ButtonBuilder()
                .setCustomId("ban-confirm")
                .setLabel(ls["cmds"]["ban/unban"]["btnconfirm"])
                .setEmoji(client.emojis.cache.find(emoji => emoji.id === "1194541395508219974") ? "<:check:1194541395508219974>" : "✅")
                .setStyle("Success"),
            new ButtonBuilder()
                .setCustomId("ban-cancel")
                .setLabel(ls["cmds"]["ban/unban"]["btncancel"])
                .setEmoji(client.emojis.cache.find(emoji => emoji.id === "1194394464588927076") ? "<:cross:1194394464588927076>" : "❌")
                .setStyle("Danger")
        )

        const msg = await client.Embed([{
            title: ls["cmds"]["ban/unban"]["bantitle"],
            desc: handlemsg(ls["cmds"]["ban/unban"]["bandesc"], {target: target.user.id}),
            timestamp: interaction.createdTimestamp,
            footer: {text: `Moderator: ${interaction.user.tag}`}
        }], [ConfirmMenu], "reply", undefined, interaction)

        try {
            const i = await msg.awaitMessageComponent({ filter: i => i.user.id === interaction.user.id, time: 60000 })
            if (i.customId === "ban-confirm") {
                try {
                    const reason = interaction.options.getString("reason") || "No reason provided"
                    await interaction.guild.members.ban(target.user.id, { reason })
                    await client.Embed([{
                        title: ls["cmds"]["ban/unban"]["bantitle"],
                        desc: handlemsg(ls["cmds"]["ban/unban"]["banned"], { target: target.user.id }),
                        timestamp: i.createdTimestamp,
                        footer: { text: `Moderator: ${i.user.tag}` }
                    }], [], "update", undefined, i)

                    const { sendModLog } = require(`${process.cwd()}/src/handlers/functions`)
                    await sendModLog(client, interaction.guild, {
                        title: ls["logs"]["ban_title"],
                        desc: handlemsg(ls["logs"]["ban_desc"], {
                            target: target.user.id,
                            tag: target.user.tag,
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
                        desc: handlemsg(ls["cmds"]["ban/unban"]["edesc1"], { target: target.user.id })
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
            }], [], "editReply", undefined, interaction).catch(() => { })
        }
    }
}

