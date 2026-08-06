const { ActionRowBuilder, ButtonBuilder, PermissionsBitField } = require("discord.js")

module.exports = {
    customId: "open-ticket",
    async execute(client, interaction, ls, handlemsg) {
        const panelNum = interaction.customId.replace("open-ticket-", "").replace("open-ticket", "") || "1"
        const panel_data = client.ticket.storage.data.find(x => x.guildId === interaction.guild.id && String(x.panel) === String(panelNum))

        if (panel_data) {
            const overwrites = [
                {
                    id: interaction.guild.roles.everyone.id,
                    deny: [PermissionsBitField.Flags.ViewChannel],
                },
                {
                    id: interaction.user.id,
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
                },
                {
                    id: client.user.id,
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ManageChannels]
                }
            ]

            if (Array.isArray(panel_data.roles)) {
                for (const roleId of panel_data.roles) {
                    if (interaction.guild.roles.cache.has(roleId)) {
                        overwrites.push({
                            id: roleId,
                            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
                        })
                    }
                }
            }

            const parentCategory = panel_data.category && interaction.guild.channels.cache.has(panel_data.category) ? panel_data.category : undefined

            let Channel = await interaction.guild.channels.create({
                name: `ticket-${interaction.user.id}`,
                type: 0,
                parent: parentCategory,
                permissionOverwrites: overwrites
            }).catch(err => console.log(err))

            if (!Channel) {
                return await interaction.reply({ ephemeral: true, content: ls["events"]["interactionCreate"]["ticket_err_create_channel"] })
            }

            const button_row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel(ls["events"]["interactionCreate"]["ticket_close_label"])
                    .setCustomId("close-ticket")
                    .setStyle(1)
                    .setEmoji("🔒"),
                new ButtonBuilder()
                    .setLabel(ls["events"]["interactionCreate"]["ticket_ping_label"])
                    .setCustomId("ticket-ping")
                    .setStyle(4)
                    .setEmoji("🚨")
            )

            let issue = await interaction.fields.getTextInputValue('ticket-description');
            client.Embed([{
                title: ls["events"]["interactionCreate"]["ticket_support_title"],
                desc: handlemsg(ls["events"]["interactionCreate"]["ticket_support_desc"], {user: interaction.user.id, issue: issue})
            }], [button_row], undefined, undefined, Channel)

            client.successEmbed({
                type: "reply",
                ephemeral: true,
                desc: handlemsg(ls["events"]["interactionCreate"]["ticket_created"], {channel: Channel.id})
            }, interaction)
        } else {
            client.errEmbed({ type: "reply", ephemeral: true, title: ls["events"]["interactionCreate"]["ticket_no_panel_title"], desc: handlemsg(ls["events"]["interactionCreate"]["ticket_no_panel_desc"], {panel: panelNum}) }, interaction)
        }
    }
}
