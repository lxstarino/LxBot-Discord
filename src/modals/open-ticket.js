const { ActionRowBuilder, ButtonBuilder, PermissionsBitField } = require("discord.js")

module.exports = {
    customId: "open-ticket",
    async execute(client, interaction, ls, handlemsg) {
        const panelNum = interaction.customId.slice(interaction.customId.length - 1)
        const panel_data = client.ticket.storage.data.find(x => x.guildId === interaction.guild.id && String(x.panel) === String(panelNum))
        
        if (panel_data) {
            let Channel = await interaction.guild.channels.create({
                name: `ticket-${interaction.user.id}`,
                type: 0, // GuildText
                parent: interaction.guild.channels.cache.find(channel => channel.id === panel_data.category) ? panel_data.category : undefined,
                permissionOverwrites: [
                    {
                        id: interaction.guild.roles.everyone,
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
                ],
            }).catch(err => console.log(err))

            if (!Channel) {
                return await interaction.reply({ ephemeral: true, content: ls["events"]["interactionCreate"]["ticket_err_create_channel"] })
            }

            panel_data.roles.map(async role => {
                if (interaction.guild.roles.cache.find(r => r.id === role))
                    await Channel.permissionOverwrites.edit(role, { ViewChannel: true, SendMessages: true }).catch(err => console.log(err))
            })

            const button_row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel(ls["events"]["interactionCreate"]["ticket_close_label"])
                    .setCustomId("close-ticket")
                    .setStyle(1) // Primary
                    .setEmoji("🔒"),
                new ButtonBuilder()
                    .setLabel(ls["events"]["interactionCreate"]["ticket_ping_label"])
                    .setCustomId("ticket-ping")
                    .setStyle(4) // Danger
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
