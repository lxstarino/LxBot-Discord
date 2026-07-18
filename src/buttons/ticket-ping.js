const { ActionRowBuilder, ButtonBuilder } = require("discord.js")

module.exports = {
    customId: "ticket-ping",
    async execute(client, interaction, ls, handlemsg) {
        const channel = await interaction.channel
        const permissions = await channel.permissionOverwrites.cache

        if (permissions) {
            const button_row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel(ls["events"]["interactionCreate"]["ticket_close_label"])
                    .setCustomId("close-ticket")
                    .setStyle(1) // Primary
                    .setEmoji("🔒")
            )
            interaction.message.edit({ components: [button_row] })

            let supp_roles = []
            permissions.map(permission => {
                let find_roles = interaction.guild.roles.cache.find(r => r.id === permission.id)
                if (find_roles && find_roles.name != "@everyone")
                    supp_roles.push(`<@&${permission.id}>`)
            })

            if (supp_roles.length == 0) return interaction.reply({ ephemeral: true, content: ls["events"]["interactionCreate"]["ticket_ping_no_roles"] })
            await interaction.reply(handlemsg(ls["events"]["interactionCreate"]["ticket_ping_success"], {roles: supp_roles.join(", ")}))
        } else {
            await interaction.reply({ ephemeral: true, content: ls["events"]["interactionCreate"]["ticket_ping_error"] })
        }
    }
}
