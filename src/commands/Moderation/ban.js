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

        const settings = client.settings.storage.data.find(x => x.guildId === interaction.guild.id)
        let ls = settings ? settings.language ? require(`${process.cwd()}/src/languages/${settings.language}.json`) : require(`${process.cwd()}/src/languages/en.json`) : require(`${process.cwd()}/src/languages/en.json`)
        const { handlemsg } = require(`${process.cwd()}/src/handlers/functions`)

        if(!interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.BanMembers)) throw({title: `${ls["errors"]["mp"]}`, desc: handlemsg(ls["cmds"]["ban/unban"]["edesc1"], {target: target.user.id})})
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

        const msg = await client.basicEmbed({
            type: "reply",
            components: [ConfirmMenu],
            title: ls["cmds"]["ban/unban"]["bantitle"],
            desc: handlemsg(ls["cmds"]["ban/unban"]["bandesc"], {target: target.user.id}),
            timestamp: interaction.createdTimestamp,
            footer: {text: `Moderator: ${interaction.user.tag}`}
        }, interaction)

        msg.awaitMessageComponent({filter: i => i.user.id === interaction.user.id, time: 60000}).then(async(i) => {
            switch(i.customId){
                case "ban-confirm":
                    await interaction.guild.members.ban(target.user.id).then(() => {
                        client.basicEmbed({
                            type: "update",
                            components: [],
                            title: ls["cmds"]["ban/unban"]["bantitle"],
                            desc: handlemsg(ls["cmds"]["ban/unban"]["banned"], {target: target.user.id}),
                            timestamp: i.createdTimestamp,
                            footer: {text: `Moderator: ${i.user.tag}`}
                        }, i)
                    }).catch((err) => {throw({title: "Missing Permissions", desc: `The action for <@!${target.user.id}> can't be processed because the bot is lacking permissions`})})
                    break
                case "ban-cancel":
                    client.basicEmbed({
                        type: "update",
                        components: [],
                        title: ls["cmds"]["ban/unban"]["bantitle"],
                        desc: ls["cmds"]["ban/unban"]["canceled"],
                        timestamp: i.createdTimestamp,
                        footer: {text: `Moderator: ${i.user.tag}`}
                    }, i)
                    break
            }
        }).catch(() => {
            client.basicEmbed({
                type: "editReply",
                components: [],
                title: ls["cmds"]["ban/unban"]["bantitle"],
                desc: ls["cmds"]["ban/unban"]["canceled2"],
                timestamp: interaction.createdTimestamp,
                footer: {text: `Moderator: ${interaction.user.tag}`}
            }, interaction)
        })
    }
}

