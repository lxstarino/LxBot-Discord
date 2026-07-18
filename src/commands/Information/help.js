const { SlashCommandBuilder } = require("@discordjs/builders")
const { ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require("discord.js")

module.exports = {
    data: new SlashCommandBuilder()
        .setName("help")
        .setDescription("Shows Help"),
    async execute(client, interaction) {
        let ls = client.getLanguage(interaction.guild?.id)
        const { handlemsg } = require(`${process.cwd()}/src/handlers/functions`)

        const folders = [
            ...new Set(client.commands.map(cmd => cmd.Folder))
        ]

        const modules = folders.map((folder) => {
            const settings = client.settings.storage.data.find(x => x.guildId === interaction.guild.id)
            const getCommands = client.commands.filter(cmd => cmd.Folder === folder).map(cmd => {
                return {
                    name: cmd.data.name,
                    description: cmd.data.description
                }
            })

            if (settings) {
                if (settings.disabled_modules) {
                    if (!settings.disabled_modules.includes(folder)) {
                        return {
                            folder: folder,
                            commands: getCommands
                        }
                    }
                } else {
                    return {
                        folder: folder,
                        commands: getCommands
                    }
                }
            } else {
                return {
                    folder: folder,
                    commands: getCommands
                }
            }
        })

        const filtered_modules = modules.filter(folder => folder !== undefined)

        const emojis = {
            Minigames: {
                emoji: "🎮",
                url: "https://cdn.discordapp.com/emojis/1126795584955744279.png"
            },
            Fun: {
                emoji: "🎉",
                url: "https://cdn.discordapp.com/emojis/1206467612721287238.png"
            },
            Information: {
                emoji: "🌎",
                url: "https://cdn.discordapp.com/emojis/1126795586818015282.png"
            },
            Nsfw: {
                emoji: "🔞",
                url: "https://cdn.discordapp.com/emojis/1126795589162635286.png"
            },
            Moderation: {
                emoji: "🛡️",
                url: "https://cdn.discordapp.com/emojis/1126795590580322345.png"
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
            },
            Leveling: {
                emoji: "🏆",
                url: "https://cdn.discordapp.com/emojis/1126795590580322345.png"
            }
        }

        const Components = (select_state, btn0_state, btn1_state) => [
            new ActionRowBuilder()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId(`help-select`)
                        .setPlaceholder(ls["cmds"]["help"]["placeholder"])
                        .setDisabled(select_state)
                        .addOptions(
                            filtered_modules.map((module) => {
                                return {
                                    label: module.folder,
                                    value: module.folder,
                                    description: handlemsg(ls["cmds"]["help"]["category_desc"], { module: module.folder }),
                                    emoji: emojis[module.folder].emoji
                                }
                            })
                        )
                ),
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel(ls["cmds"]["help"]["btn_home"])
                        .setCustomId("help-home")
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji("📍")
                        .setDisabled(btn0_state),
                    new ButtonBuilder()
                        .setLabel(ls["cmds"]["help"]["btn_cmdlist"])
                        .setCustomId("help-cmdlist")
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji("📋")
                        .setDisabled(btn1_state)
                )
        ]

        const msg = await client.Embed([{
            image: "https://cdn.discordapp.com/attachments/1517162401357627463/1517165288326692914/33345.png?ex=6a3549c8&is=6a33f848&hm=29756800a75a9a832543520bea1836f49afa66d3f9a60701220d1e76b2c6bff3&"
        },
        {
            author: { name: `${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() },
            desc: ls["cmds"]["help"]["home_desc"],
            image: "https://cdn.discordapp.com/attachments/1517162401357627463/1517166682227871834/33345.png?ex=6a354b14&is=6a33f994&hm=8fc24d2494e2e0f76ccd518e36c4eba96e1f96092c7d2590db675493232b6462&",
        }], Components(false, true, false), "reply", true, interaction)

        if (!msg) return;
        const col = msg.createMessageComponentCollector({ filter: i => i.user.id === interaction.user.id, time: 180000 })

        col.on("collect", async (i) => {
            switch (i.customId) {
                case "help-select":
                    const [folder] = i.values
                    const module = filtered_modules.find(x => x.folder === folder)

                    await client.Embed([{
                        image: "https://cdn.discordapp.com/attachments/1517162401357627463/1517165288326692914/33345.png?ex=6a3549c8&is=6a33f848&hm=29756800a75a9a832543520bea1836f49afa66d3f9a60701220d1e76b2c6bff3&"
                    },
                    {
                        author: { name: `${interaction.user.tag} - ${module.folder}`, iconURL: interaction.user.displayAvatarURL() },
                        thumbnail: `${emojis[module.folder].url}`,
                        fields: module.commands.map((cmd) => {
                            return {
                                name: `\`/${cmd.name}\``,
                                value: `• ${cmd.description}`
                            }
                        }),
                        image: "https://cdn.discordapp.com/attachments/1517162401357627463/1517166682227871834/33345.png?ex=6a354b14&is=6a33f994&hm=8fc24d2494e2e0f76ccd518e36c4eba96e1f96092c7d2590db675493232b6462&",
                    }], Components(false, false, false), "update", true, i)
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

                    await client.Embed([{
                        image: "https://cdn.discordapp.com/attachments/1517162401357627463/1517165288326692914/33345.png?ex=6a3549c8&is=6a33f848&hm=29756800a75a9a832543520bea1836f49afa66d3f9a60701220d1e76b2c6bff3&"
                    },
                    {
                        author: { name: `${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() },
                        fields: getModules.map(module => {
                            return {
                                name: `${emojis[module.name].emoji} • ${module.name}`,
                                value: `\`/${module.cmds.join("`, `/")}\``
                            }
                        }),
                        image: "https://cdn.discordapp.com/attachments/1517162401357627463/1517166682227871834/33345.png?ex=6a354b14&is=6a33f994&hm=8fc24d2494e2e0f76ccd518e36c4eba96e1f96092c7d2590db675493232b6462&",
                    }], Components(false, false, true), "update", true, i)
                    break
                case "help-home":
                    await client.Embed([{
                        image: "https://cdn.discordapp.com/attachments/1517162401357627463/1517165288326692914/33345.png?ex=6a3549c8&is=6a33f848&hm=29756800a75a9a832543520bea1836f49afa66d3f9a60701220d1e76b2c6bff3&"
                    },
                    {
                        author: { name: `${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() },
                        desc: ls["cmds"]["help"]["home_desc"],
                        image: "https://cdn.discordapp.com/attachments/1517162401357627463/1517166682227871834/33345.png?ex=6a354b14&is=6a33f994&hm=8fc24d2494e2e0f76ccd518e36c4eba96e1f96092c7d2590db675493232b6462&",
                    }], Components(false, true, false), "update", true, i)
                    break
            }
        })
    }
}
