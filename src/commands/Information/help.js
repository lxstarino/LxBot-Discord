const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require("discord.js")

module.exports = {
    data: new SlashCommandBuilder()
        .setName("help")
        .setDescription("Shows the help menu and command overview"),
    async execute(client, interaction) {
        let ls = client.getLanguage(interaction.guild?.id)
        const { handlemsg, getOrCreateSettings } = require(`${process.cwd()}/src/handlers/functions`)
        const settings = await getOrCreateSettings(client, interaction.guild.id)

        const folders = [...new Set(client.commands.map(cmd => cmd.Folder))]

        const modules = folders.map((folder) => {
            const getCommands = Array.from(client.commands.filter(cmd => cmd.Folder === folder).values()).flatMap(cmd => {
                const json = cmd.data.toJSON()
                const baseName = json.name
                const options = json.options || []
                const subcommands = options.filter(opt => opt.type === 1)
                const groups = options.filter(opt => opt.type === 2)

                if (subcommands.length === 0 && groups.length === 0) {
                    return [{
                        name: baseName,
                        description: json.description || cmd.data.description || "No description provided."
                    }]
                }

                const list = []
                for (const sub of subcommands) {
                    list.push({
                        name: `${baseName} ${sub.name}`,
                        description: sub.description || "No description provided."
                    })
                }
                for (const grp of groups) {
                    const grpSubcommands = (grp.options || []).filter(opt => opt.type === 1)
                    for (const sub of grpSubcommands) {
                        list.push({
                            name: `${baseName} ${grp.name} ${sub.name}`,
                            description: sub.description || "No description provided."
                        })
                    }
                }
                return list
            })

            if (settings && settings.disabled_modules && settings.disabled_modules.includes(folder)) {
                return undefined
            }

            return {
                folder: folder,
                commands: getCommands
            }
        })

        const filtered_modules = modules.filter(m => m !== undefined)

        const emojis = {
            Administration: { emoji: "⚙️" },
            Economy: { emoji: "🏦" },
            Fun: { emoji: "🎉" },
            Games: { emoji: "🎮" },
            Information: { emoji: "ℹ️" },
            Leveling: { emoji: "🏆" },
            Moderation: { emoji: "🛡️" },
            Utility: { emoji: "🛠️" },
            Developer: { emoji: "👨‍💻" }
        }

        const getEmoji = (folderName) => {
            return emojis[folderName] ? emojis[folderName].emoji : "📁"
        }

        const buildComponents = (activeView, selectDisabled = false) => {
            const selectRow = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId("help-select")
                    .setPlaceholder(ls["cmds"]["help"]["placeholder"])
                    .setDisabled(selectDisabled)
                    .addOptions(
                        filtered_modules.map(mod => ({
                            label: mod.folder,
                            value: mod.folder,
                            description: handlemsg(ls["cmds"]["help"]["category_desc"], { module: mod.folder }),
                            emoji: getEmoji(mod.folder)
                        }))
                    )
            )

            const buttonRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("help-home")
                    .setLabel(ls["cmds"]["help"]["btn_home"])
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji("📍")
                    .setDisabled(selectDisabled || activeView === "home"),
                new ButtonBuilder()
                    .setCustomId("help-cmdlist")
                    .setLabel(ls["cmds"]["help"]["btn_cmdlist"])
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji("📋")
                    .setDisabled(selectDisabled || activeView === "cmdlist")
            )

            return [selectRow, buttonRow]
        }

        const BANNER_IMAGE = "https://cdn.discordapp.com/attachments/1517162401357627463/1517165288326692914/33345.png?ex=6a3549c8&is=6a33f848&hm=29756800a75a9a832543520bea1836f49afa66d3f9a60701220d1e76b2c6bff3&"
        const FOOTER_IMAGE = "https://cdn.discordapp.com/attachments/1517162401357627463/1517166682227871834/33345.png?ex=6a354b14&is=6a33f994&hm=8fc24d2494e2e0f76ccd518e36c4eba96e1f96092c7d2590db675493232b6462&"

        const getHomeEmbedObjects = () => {
            let totalCmdCount = 0
            const categoriesText = filtered_modules.map(mod => {
                const count = mod.commands.length
                totalCmdCount += count
                return `${getEmoji(mod.folder)} **${mod.folder}** • \`${count} command${count === 1 ? "" : "s"}\``
            }).join("\n")

            return [
                {
                    image: BANNER_IMAGE
                },
                {
                    author: { name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() },
                    desc: `${ls["cmds"]["help"]["home_desc"]}\n\n**${ls["cmds"]["help"]["categories_title"]}:**\n${categoriesText}`,
                    image: FOOTER_IMAGE
                }
            ]
        }

        const replyMsg = await client.Embed(
            getHomeEmbedObjects(),
            buildComponents("home"),
            "reply",
            true,
            interaction
        )

        if (!replyMsg) return

        const collector = replyMsg.createMessageComponentCollector({
            filter: i => i.user.id === interaction.user.id,
            time: 180000
        })

        collector.on("collect", async (i) => {
            if (i.customId === "help-select") {
                const [selectedFolder] = i.values
                const selectedModule = filtered_modules.find(x => x.folder === selectedFolder)

                if (!selectedModule) {
                    await i.deferUpdate().catch(() => {})
                    return
                }

                const folderEmoji = getEmoji(selectedModule.folder)

                const cmdFormattedList = selectedModule.commands.map(cmd => {
                    return `• \`/${cmd.name}\`\n  └ *${cmd.description}*`
                }).join("\n\n")

                await client.Embed([
                    {
                        image: BANNER_IMAGE
                    },
                    {
                        author: { name: `${interaction.user.tag} - ${selectedModule.folder}`, iconURL: interaction.user.displayAvatarURL() },
                        title: `${folderEmoji} ${selectedModule.folder} (${selectedModule.commands.length})`,
                        desc: cmdFormattedList || `*${ls["cmds"]["help"]["no_commands"]}*`,
                        image: FOOTER_IMAGE
                    }
                ], buildComponents("category"), "update", true, i)

            } else if (i.customId === "help-cmdlist") {
                await client.Embed([
                    {
                        image: BANNER_IMAGE
                    },
                    {
                        author: { name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() },
                        title: ls["cmds"]["help"]["title_all"],
                        desc: ls["cmds"]["help"]["desc_all"],
                        fields: filtered_modules.map(mod => ({
                            name: `${getEmoji(mod.folder)} ${mod.folder} (${mod.commands.length})`,
                            value: mod.commands.map(c => `\`/${c.name}\``).join(", ") || "*None*"
                        })),
                        image: FOOTER_IMAGE
                    }
                ], buildComponents("cmdlist"), "update", true, i)

            } else if (i.customId === "help-home") {
                await client.Embed(
                    getHomeEmbedObjects(),
                    buildComponents("home"),
                    "update",
                    true,
                    i
                )
            }
        })

        collector.on("end", async () => {
            const disabledComponents = buildComponents("none", true)
            await replyMsg.edit({
                components: disabledComponents
            }).catch(() => {})
        })
    }
}
