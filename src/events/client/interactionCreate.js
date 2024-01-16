const { ActionRowBuilder, ButtonBuilder, PermissionsBitField, createChannel } = require("discord.js")

const developers = [
    "399301340326789120",
    "619915409885364245"
]

module.exports = {
    name: "interactionCreate",
    async execute(interaction, client) {
        if(interaction.isCommand()){
            const command = client.commands.get(interaction.commandName)
            const settings = client.settings.storage.data.find(x => x.guildId === interaction.guild.id)

            if(!command) return
            if(settings){
                if(settings.disabled_modules)
                {
                    if(settings.disabled_modules.includes(command.Folder)){
                        return client.errEmbed({type: "reply", ephemeral: true, desc: `This command is disabled on this server`}, interaction)
                    }
                }
            }
            if(!interaction.guild) return client.errEmbed({type: "reply", ephemeral: true, desc: `This commands are only in servers available`}, interaction)
            if(command.devOnly && !developers.includes(interaction.user.id)) return client.errEmbed({type: "reply", ephemeral: true, desc: `This command is only for developers available`}, interaction)
            if(command.nsfw && !interaction.channel.nsfw) return client.errEmbed({type: "reply", ephemeral: true, desc: `This command is only in NSFW Channels available`}, interaction)

            try{
                if(command.cooldown){
                    if(command.cooldown.users.includes(interaction.user.id)){
                        return client.errEmbed({type: "reply", ephemeral: true, title: "Cooldown", desc: `You're on cooldown for ${command.cooldown.time / 1000}s.`}, interaction)
                    }
                }
                await command.execute(client, interaction)
            } catch(err){
                console.error(err)

                if(command.cooldown) command.cooldown.users.includes(interaction.user.id) ? command.cooldown.users.splice(command.cooldown.users.indexOf(interaction.user.id), 1) : ""
                if(interaction.deferred || interaction.replied) {
                    client.errEmbed({
                        type: "editReply",
                        ephemeral: true,
                        title: err.title ? err.title : "Error",
                        desc: `> ${err.desc ? err.desc : err}`
                    }, interaction)
                } else {
                    client.errEmbed({
                        type: "reply",
                        ephemeral: true,
                        title: err.title ? err.title : "Error",
                        desc: `> ${err.desc ? err.desc : err}`
                    }, interaction)
                }
            }
        }

        if(interaction.isButton()){
            if(interaction.customId.slice(0,  interaction.customId.length - 2) == "open-ticket"){
                const posChannel = await interaction.guild.channels.cache.find(c => c.name === `ticket-${interaction.user.id}`)
                if(posChannel) return await client.errEmbed({type: "reply", ephemeral: true, title: "Ticket limit", desc: "Ticket limit reached, You already have 1 tickets open "}, interaction)

                const panel_data = client.ticket.storage.data.find(x => x.guildId === interaction.guild.id & x.panel === interaction.customId.slice(interaction.customId.length - 1,  interaction.customId.length))
                if(panel_data){
                    let Channel = await interaction.guild.channels.create({
                        name: `ticket-${interaction.user.id}`,
                        type: 0,
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
                    })

                    panel_data.roles.map(role => {
                        if(interaction.guild.roles.cache.find(r => r.id === role))
                            Channel.permissionOverwrites.edit(role, {ViewChannel: true, SendMessages: true})
                    })

                    const button = new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setLabel("Close Ticket")
                            .setCustomId("close-ticket")
                            .setStyle("Primary")
                            .setEmoji("🔒"),
                        new ButtonBuilder()
                            .setLabel("Ping Support")
                            .setCustomId("ticket-ping")
                            .setStyle("Danger")
                            .setEmoji("🚨")
                    )     

                    client.basicEmbed({
                        title: "Support & Help", 
                        desc: "Support will be with you shortly. If you want to close this ticket react with 🔒", 
                        components: [button]
                    }, Channel)

                    client.successEmbed({
                        type: "reply",
                        ephemeral: true,
                        desc: `Ticket created | <#${Channel.id}>`
                    }, interaction)
                } else {
                    client.errEmbed({type: "reply", ephemeral: true, title: "No panel found", desc: `> I cant find any data for #${interaction.customId.slice(interaction.customId.length - 1,  interaction.customId.length)} Panel!\n> Run \`/t-setup\` to create a Panel.`}, interaction)
                }
            } else if(interaction.customId == "close-ticket"){
                const posChannel = await interaction.guild.channels.cache.find(c => c.name === `ticket-${interaction.user.id}`)
                await posChannel.delete()
            } else if(interaction.customId == "ticket-ping"){
                const posChannel = await interaction.guild.channels.cache.find(c => c.name === `ticket-${interaction.user.id}`)
                const permissions = posChannel.permissionOverwrites.cache

                let supp_roles = []
                permissions.map(permission => {
                    let find_roles = interaction.guild.roles.cache.find(r => r.id === permission.id)
                    if(find_roles && find_roles.name != "@everyone")
                        supp_roles.push(`<@&${permission.id}>`)
                })

                if(supp_roles.length == 0) return interaction.reply("There are no Supporter Roles to ping!")
                interaction.reply(`Supporter Roles have been pinged!\n${supp_roles.join(", ")}`)
            }
        }
    }
}