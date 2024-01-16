const { SlashCommandBuilder } = require("@discordjs/builders")
const { PermissionsBitField, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder } = require("discord.js")

const emojis = {
    "1": "1️⃣",
    "2": "2️⃣",
    "3": "3️⃣",
    "4": "4️⃣",
    "5": "5️⃣",
    "6": "6️⃣",
    "7": "7️⃣",
    "8": "8️⃣",
    "9": "9️⃣",
    "10": "🔟"
}

module.exports = {
    data: new SlashCommandBuilder()
    .setName("t-setup")
    .setDescription("Setup a ticket system on your server")
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
    async execute(client, interaction){
        if(!interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageChannels) || !interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) throw({title: "Missing Permissions", desc: `The bot is lacking permissions!\n> Make sure that the bot has permission to Manage Channels and Roles`})

        try{
            first_layer()
            async function first_layer(){
                let menuoptions = []
                for(let i = 1; i <= 10; i++){
                    menuoptions.push({
                        value: `${i} Ticket Panel`,
                        description: `Manage/Edit the ${i} Ticket Panel`,
                        emoji: emojis[i]
                    })
                }
            
                let row1 = new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder()
                    .setCustomId('MenuSelection1')
                    .setMaxValues(1)
                    .setMinValues(1)
                    .setPlaceholder("Setup a Ticket Panel")
                    .addOptions(
                        menuoptions.slice(0, 5).map(option => {
                            let Obj = {
                                label: option.label ? option.label.substring(0, 50) : option.value.substring(0, 50),
                                value: option.value.substring(0, 50),
                                description: option.description.substring(0, 50),
                                emoji: option.emoji
                            }
                            return Obj
                        })
                    )
                )

                let row2 = new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder()
                    .setCustomId('MenuSelection2')
                    .setMaxValues(1)
                    .setMinValues(1)
                    .setPlaceholder("Setup a Ticket Panel")
                    .addOptions(
                        menuoptions.slice(5, 10).map(option => {
                            let Obj = {
                                label: option.label ? option.label.substring(0, 50) : option.value.substring(0, 50),
                                value: option.value.substring(0, 50),
                                description: option.description.substring(0, 50),
                                emoji: option.emoji
                            }
                            return Obj
                        })
                    )
                )
                
                let MenuEmbed = await client.basicEmbed({
                    type: "reply",
                    ephemeral: true,
                    thumbnail: "https://cdn.discordapp.com/emojis/1121671709473382420.png",
                    title: "Ticket Setup",
                    desc: ">>> Use the Select Menus below to manage your panels\nNote: You have 90 seconds to interact until timeout",
                    footer: {text: `${interaction.user.tag}`},
                    components: [row1, row2]
                }, interaction)

                async function menu_selection(menu){
                    menu?.deferUpdate()
                    let SetupNumber = menu?.values[0].split(" ")[0]
                    if(!client.ticket.storage.data.find(x => x.panel === SetupNumber && x.guildId === interaction.guild.id)){
                        await client.ticket.createData({guildId: interaction.guild.id, panel: SetupNumber, roles: [], channel: 0, category: 0, })
                    } else {
                        console.log("Panel found in json file")
                    }
                    second_layer(SetupNumber)
                }

                const col = MenuEmbed.createMessageComponentCollector({
                    filter: i => i?.isStringSelectMenu() && i?.user.id == interaction.user.id, 
                    time: 90000
                })

                col.on('collect', menu => {
                    col.stop()
                    menu_selection(menu)
                })

                col.on('end', (c) => {
                    if(c.size == 0)
                        client.errEmbed({type: "editReply", title: "Timeout", desc: "Your time to provide input is expired.", components: []}, interaction)
                })
            }


            async function second_layer(SetupNumber){
                let menuoptions = [
                    {
                        value: "Send Ticket System",
                        description: `Send the ${SetupNumber} Ticket System`,
                        emoji: "📨"
                    },
                    {
                        value: "Add Ticket Role",
                        description: `Add a Ticket Role for managing the Tickets`,
                        emoji: "➕"
                    },
                    {
                        value: "Remove Ticket Role",
                        description: `Remove a Ticket Role from managing the Tickets`,
                        emoji: "➖"
                    },
                    {
                        value: "Ticket Category",
                        description: `Creates a Category where the tickets are located`,
                        emoji: "📋"
                    },
                    {
                        value: "Ticket Channel",
                        description: `Define the Channel where the Ticket Message will be send`,
                        emoji: "📺"
                    },
                    {
                        value: "Reset Panel",
                        description: `Resets the Panel`,
                        emoji: "🔄"
                    },
                    {
                        value: "Cancel",
                        description: `Cancel and stop the Ticket-Setup!`,
                        emoji: "❌"
                    }
                ]

                let Select = new StringSelectMenuBuilder()
                    .setCustomId('MenuSelection')
                    .setMaxValues(1)
                    .setMinValues(1)
                    .setPlaceholder(`Manage #${SetupNumber} Ticket System`)
                    .addOptions(
                        menuoptions.map(option => {
                            let Obj = {
                                label: option.label ? option.label.substring(0, 50) : option.value.substring(0, 50),
                                value: option.value.substring(0, 50),
                                description: option.description.substring(0, 50),
                                emoji: option.emoji
                            }
                            return Obj;
                        })
                    )

                let MenuEmbed = await client.basicEmbed({
                    type: "editReply",
                    thumbnail: "https://cdn.discordapp.com/emojis/1121671709473382420.png",
                    title: `#${SetupNumber} Panel`,
                    desc: `>>> Use the Select Menu below to overwrite/edit the #${SetupNumber} Panel\nNote: You have 90 seconds to interact until timeout`,
                    footer: {text: `${interaction.user.tag}`},
                    components: [new ActionRowBuilder().addComponents(Select)]
                }, interaction)

                async function menu_selection(menu){
                    menu?.deferUpdate()
                    handle_selection(menu?.values[0], SetupNumber)
                }

                const col = MenuEmbed.createMessageComponentCollector({
                    filter: i => i?.isStringSelectMenu() && i?.user.id == interaction.user.id, 
                    time: 90000
                })

                col.on('collect', menu => {
                    col.stop()
                    if(menu?.values[0] == "Cancel") return client.errEmbed({type: "update", title: "Setup canceled", desc: "The process has been canceled", components: []}, menu)
                    menu_selection(menu)
                })

                col.on('end', (c) => {
                    if(c.size == 0)
                        client.errEmbed({type: "editReply", title: "Timeout", desc: "Your time to provide input is expired.", components: []}, interaction)
                })
            }

            async function handle_selection(option_type, SetupNumber) {
                let panel = client.ticket.storage.data.find(x => x.panel === SetupNumber && x.guildId === interaction.guild.id)
                if(!panel){
                    throw({title: "Ticket", desc: "Something went wrong, try again later or rerun the setup"})
                } 

                switch(option_type){
                    case "Add Ticket Role":
                        client.basicEmbed({
                            type: "editReply",
                            thumbnail: "https://cdn.discordapp.com/emojis/1121671709473382420.png",
                            title: "Add Role",
                            desc: `Which role should be added?\n\nCurrent Roles in Setup:\n ${panel.roles.length > 0 ? "<@&" + panel.roles.join(">, <@&") + ">" : "`None`"}`,
                            footer: {text: "Note: You have 30 seconds to interact until timeout"},
                            components: []
                        }, interaction).then(msg => {
                            msg.channel.awaitMessages({
                                filter: m => m.author.id === interaction.user.id, time: 30000, max: 1
                            }).then(async collected => {
                                let content = collected.first().content
                                await interaction.channel.bulkDelete(collected)
                                let role = interaction.guild.roles.cache.find(role => role.id === content.substring(content.indexOf("<@&") + 3, content.indexOf(">")))
                                if(!role){
                                    interaction.followUp({ephemeral: true, content: "The given role is invalid!"})
                                    return second_layer(SetupNumber)
                                }         

                                if(panel.roles.includes(role.id)){
                                    interaction.followUp({ephemeral: true, content: "The given role is already in this menu!"})
                                    return second_layer(SetupNumber)
                                }
                                if(role.position > interaction.guild.members.resolve(client.user).roles.highest.position){
                                    interaction.followUp({ephemeral: true, content: "Missing Permissions: The role you mentioned is above me"})
                                    return second_layer(SetupNumber)
                                }
            
                                panel.roles.push(role.id)
                                await client.ticket.saveData()
                                interaction.followUp({ephemeral: true, content: `Added <@&${role.id}> to menu`})
                                second_layer(SetupNumber)
                            }).catch(() => {
                                client.errEmbed({type: "editReply", title: "Timeout", desc: "Your time to provide input is expired.", components: []}, interaction)
                            })
                        })
                        break
                    case "Remove Ticket Role":
                        client.basicEmbed({
                            type: "editReply",
                            thumbnail: "https://cdn.discordapp.com/emojis/1121671709473382420.png",
                            title: "Remove Role",
                            desc: `Which role should be remove?\n\nCurrent Roles in Setup:\n ${panel.roles.length > 0 ? "<@&" + panel.roles.join(">, <@&") + ">" : "`None`"}`,
                            footer: {text: "Note: You have 30 seconds to interact until timeout"},
                            components: []
                        }, interaction).then(msg => {
                            msg.channel.awaitMessages({
                                filter: m => m.author.id === interaction.user.id, time: 30000, max: 1
                            }).then(async collected => {
                                let content = collected.first().content
                                await interaction.channel.bulkDelete(collected)
                                let role = interaction.guild.roles.cache.find(role => role.id === content.substring(content.indexOf("<@&") + 3, content.indexOf(">")))
                                if(!role){
                                    interaction.followUp({ephemeral: true, content: "The given role is invalid!"})
                                    return second_layer(SetupNumber)
                                }         

                                if(!panel.roles.includes(role.id)){
                                    interaction.followUp({ephemeral: true, content: "The given role is not in this menu!"})
                                    return second_layer(SetupNumber)
                                }
            
                                panel.roles.splice(panel.roles.splice(panel.roles.indexOf(role.id), 1))
                                await client.ticket.saveData()
                                interaction.followUp({ephemeral: true, content: `Removed <@&${role.id}> from menu`})
                                second_layer(SetupNumber)
                            }).catch(() => {
                                client.errEmbed({type: "editReply", title: "Timeout", desc: "Your time to provide input is expired.", components: []}, interaction)
                            })
                        })
                        break
                    case "Ticket Channel":
                        client.basicEmbed({
                            type: "editReply",
                            thumbnail: "https://cdn.discordapp.com/emojis/1121671709473382420.png",
                            title: "Channel",
                            desc: `Which Channel should be used for the message?`,
                            footer: {text: "Note: You have 30 seconds to interact until timeout"},
                            components: []
                        }, interaction).then(msg => {
                            msg.channel.awaitMessages({
                                filter: m => m.author.id === interaction.user.id, time: 30000, max: 1
                            }).then(async collected => {
                                let content = collected.first().content
                                await interaction.channel.bulkDelete(collected)
                                let channel = await interaction.guild.channels.cache.find(channel => channel.id === content.substring(content.indexOf("<#") + 2 , content.indexOf(">")))

                                if(!channel){
                                    interaction.followUp({ephemeral: true, content: "The given channel is invalid!"})
                                    return second_layer(SetupNumber)
                                } 
                                
                                panel.channel = channel.id
                                await client.ticket.saveData()
                                interaction.followUp({ephemeral: true, content: `Channel for message located!`})
                                second_layer(SetupNumber)
                            }).catch(() => {
                                client.errEmbed({type: "editReply", title: "Timeout", desc: "Your time to provide input is expired.", components: []}, interaction)
                            })
                        })
                        break
                    case "Ticket Category":
                        if(panel.roles.length == 0){
                            interaction.followUp({ephemeral: true, content: "Before you create the category, you should add some roles to your menu!"})
                            return second_layer(SetupNumber)
                        }

                        const category = await interaction.guild.channels.create({
                            name: "Tickets", 
                            type: 4, 
                            permissionOverwrites: [
                            {
                              id: interaction.guild.roles.everyone,
                              deny: [PermissionsBitField.Flags.ViewChannel],
                            },
                            {
                                id: client.user.id,
                                allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ManageChannels, PermissionsBitField.Flags.SendMessages]    
                            }
                        ]})
                        panel.roles.map(role => { 
                            if(interaction.guild.roles.cache.find(r => r.id === role))
                                category.permissionOverwrites.edit(role, {ViewChannel: true, SendMessages: true})
                        })

                        panel.category = category.id
                        await client.ticket.saveData()
                        interaction.followUp({ephemeral: true, content: `Category was created | <#${category.id}>`})
                        second_layer(SetupNumber)
                        break
                    case "Send Ticket System":
                        if(panel.roles.length == 0){
                            interaction.followUp({ephemeral: true, content: "Before you send the message, you should add some roles to your menu!"})
                            return second_layer(SetupNumber)
                        }
                        let channel = interaction.guild.channels.cache.find(channel => channel.id === panel.channel)
                        if(!channel){
                            interaction.followUp({ephemeral: true, content: "Channel not found!\nDefine a new channel for the message."})
                            return second_layer(SetupNumber)
                        }
                        
                        if(!interaction.guild.channels.cache.find(channel => channel.id === panel.category)){
                            interaction.followUp({ephemeral: true, content: "Category not found!\nCreate a new category for the tickets."})
                            return second_layer(SetupNumber)
                        }

                        const row = new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                                .setCustomId(`open-ticket-${panel.panel}`)
                                .setLabel("Create Ticket")
                                .setStyle("Secondary")
                                .setEmoji("📩")
                        )

                        await client.basicEmbed({title: "Support & Help", desc: "To create a ticket react with 📩", components: [row]}, channel)
                        client.successEmbed({type: "editReply",  desc: `Panel send to <#${channel.id}>`, components: []}, interaction)
                        break
                    case "Reset Panel":
                        panel.roles = []
                        panel.channel = 0
                        panel.category = 0

                        await client.ticket.saveData()
                        interaction.followUp({ephemeral: true, content: "Reseted the panel successfully!"})
                        second_layer(SetupNumber)
                        break
                }
            }
        } catch(err) {
            console.log(err)
        }
    }
}