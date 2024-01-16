const { SlashCommandBuilder} = require("@discordjs/builders")
const { ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, IntegrationExpireBehavior } = require("discord.js")

module.exports = {
    data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Shows Help"),
    async execute(client, interaction) {
        const folders = [
            ...new Set(client.commands.map(cmd => cmd.Folder))
        ]

        const modules = folders.map((folder) => {
            const settings = client.settings.storage.data.find(x => x.guildId === interaction.guild.id)

            const getCommands = client.commands.filter(cmd => cmd.Folder === folder).map(cmd => {
                return{
                    name: cmd.data.name,
                    description: cmd.data.description
                }
            })
            
            if(settings){
                if(settings.disabled_modules){
                    if(!settings.disabled_modules.includes(folder)){
                        return{
                            folder: folder,
                            commands: getCommands
                        }
                    }
                } else {
                    return{
                        folder: folder,
                        commands: getCommands
                    }
                }
            } else {
                return{
                    folder: folder,
                    commands: getCommands
                }
            }
        })

        const filtered_modules = modules.filter(folder => folder !== undefined)

        const emojis = {
            Fun: {
                emoji: "🎮", 
                url: "https://cdn.discordapp.com/emojis/1126795584955744279.png"
            },
            Information: {
                emoji: "🌎",
                url: "https://cdn.discordapp.com/emojis/1126795586818015282.png" 
            },
            NSFW: {
                emoji: "🔞",
                url: "https://cdn.discordapp.com/emojis/1126795589162635286.png"
            },
            VALORANT: {
                emoji: client.emojis.cache.find(emoji => emoji.id === "1193978557198770297") ? "<:vlicon:1193978557198770297>" : "❓",
                url: "https://cdn.discordapp.com/emojis/1193978557198770297.png"
            },
            Moderation: {
                emoji: "🛡️",
                url: "https://cdn.discordapp.com/emojis/1126795590580322345.png"
            },
            Tools: {
                emoji: "🔨",
                url: "https://cdn.discordapp.com/emojis/1193995763336888330.png"
            },
            Economy: {
                emoji: "🏦",
                url: "https://cdn.discordapp.com/emojis/1193980982139818077.png"
            },
            Setup: {
                emoji: "⚒️",
                url: "https://cdn.discordapp.com/emojis/1126795592178348102.png"
            },
            Reactionrole: {
                emoji: "📄",
                url: "https://cdn.discordapp.com/emojis/1127825735864823948.png"
            },
            Settings: {
                emoji: "⚙️",
                url: "https://cdn.discordapp.com/emojis/1194028420351406100.png"
            },
            Developer: {
                emoji: "👨‍💻",
                url: "https://cdn.discordapp.com/emojis/1194715316148781156.png"
            }
        }

        const Components = (state) => [
            new ActionRowBuilder()
			.addComponents(
				new StringSelectMenuBuilder()
					.setCustomId(`help-select`)
					.setPlaceholder('Select a category')
                    .setDisabled(state)
                    .addOptions(
                    filtered_modules.map((module) => {
                        return{
                            label: module.folder,
                            value: module.folder,
                            description: `Commands from ${module.folder} module`,
                            emoji: emojis[module.folder].emoji
                        }
                    }) 
                )
			),
            new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel("Home")
                    .setCustomId("help-home")
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji("📍")
                    .setDisabled(state),
                new ButtonBuilder()
                    .setLabel("Commands List")
                    .setCustomId("help-cmdlist")
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji("📋")
                    .setDisabled(state),
                new ButtonBuilder()
                    .setLabel("Close")
                    .setCustomId("help-close")
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji(client.emojis.cache.find(emoji => emoji.id === "1194394464588927076") ? "<:cross:1194394464588927076>" : "❌")
                    .setDisabled(state)
            )
        ]

        const msg = await client.basicEmbed({
            type: "reply",
            components: Components(false),
            author: {name: "Phoen1x Help-Menu", iconURL: client.user.displayAvatarURL()},
            desc: "```Please use the Select Menu below to get further information about a module.```\n`Note: The Components are disabling after 2 minutes`",
            image: "https://cdn.discordapp.com/attachments/1187638425168388096/1193984167071993916/banner.png?ex=65aeb368&is=659c3e68&hm=f16c2038a717798f70f2d015d813e7d2a6011d843d28fc2fff86632f8b329f8e&",
            fields: [
                {name: "Bot Links", value: "• Twitch from Phoen1x: [Twitch](https://www.twitch.tv/derrotephoen1x)\n• Instagram from Phoen1x: [Instagram](https://www.instagram.com/philipp_phoen1x/)"}
            ],
            footer: {text: `${interaction.user.tag} | Use the components below for navigation.`}
        }, interaction)

        const col = msg.createMessageComponentCollector({filter: i => i.user.id === interaction.user.id, time: 120000})

        col.on("collect", async(i) => {
            switch(i.customId){
                case "help-select":
                    const [folder] = i.values
                    const module = filtered_modules.find(x => x.folder === folder)

                    client.basicEmbed({
                        type: "update",
                        title: `${module.folder}`,
                        thumbnail: `${emojis[module.folder].url}`,
                        fields: module.commands.map((cmd) => {
                            return{
                                name: `\`/${cmd.name}\``,
                                value: `• ${cmd.description}`
                            }
                        }),
                        footer: {text: `${interaction.user.tag} | Use the components below for navigation.`}
                    }, i)
                    break
                case "help-cmdlist": 
                        const getModules = filtered_modules.map(module => {
                            const getCmds = module.commands.map(cmd => {
                                return cmd.name
                            })

                            return {
                                name: module.folder,
                                cmds: getCmds
                            }
                        })
                
                        client.basicEmbed({
                            type: "update",
                            title: `Commands List`,
                            fields: getModules.map(module => {
                                return{
                                    name: `${emojis[module.name].emoji} • ${module.name}`,
                                    value: `\`${module.cmds.join("\`, `")}\``
                                }
                            }),
                            footer: {text: `${interaction.user.tag} | Use the components below for navigation.`}
                        }, i)
                        break
                case "help-home":
                    i.update({embeds: msg.embeds})
                    break
                case "help-close":
                    await col.stop() 
                    await i.message.delete()
                    break
            }
        })
    }
}
