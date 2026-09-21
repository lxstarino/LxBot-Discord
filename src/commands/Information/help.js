const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require("discord.js")
const { handlemsg } = require("../../utils/stringUtils")
const { getOrCreateSettings } = require("../../repositories/SettingsRepository")

module.exports = {
    guildOnly: false,
    cooldown: 3,
    data: new SlashCommandBuilder()
        .setName("help")
        .setDescription("Shows the help menu and command overview"),
    async execute(client, interaction) {
        const ls = client.getLanguage(interaction.guild?.id)
        const settings = interaction.guild ? await getOrCreateSettings(client, interaction.guild.id) : null

        const isDM = !interaction.guild
        const availableCommands = isDM
            ? client.commands.filter(cmd => !cmd.guildOnly)
            : client.commands

        const folders = [...new Set(availableCommands.map(cmd => cmd.Folder))]

        const modules = folders.map((folder) => {
            const rawCmds = Array.from(availableCommands.filter(cmd => cmd.Folder === folder).values())

            const commands = rawCmds.map(cmd => {
                const json = cmd.data.toJSON()
                const baseName = json.name
                const baseDesc = json.description || cmd.data.description || "No description provided."
                const options = json.options || []
                const subcommands = options.filter(opt => opt.type === 1)
                const groups = options.filter(opt => opt.type === 2)

                const subs = []
                for (const sub of subcommands) {
                    subs.push(sub.name)
                }
                for (const grp of groups) {
                    const grpSubcommands = (grp.options || []).filter(opt => opt.type === 1)
                    for (const sub of grpSubcommands) {
                        subs.push(`${grp.name} ${sub.name}`)
                    }
                }

                const subCount = subs.length > 0 ? subs.length : 1

                return {
                    baseName: baseName,
                    description: baseDesc,
                    subcommands: subs,
                    count: subCount
                }
            })

            if (settings && settings.disabled_modules && settings.disabled_modules.includes(folder)) {
                return undefined
            }

            const totalCount = commands.reduce((acc, c) => acc + c.count, 0)

            return {
                folder: folder,
                commands: commands,
                totalCount: totalCount
            }
        })

        const filtered_modules = modules.filter(m => m !== undefined)

        const emojis = {
            Administration: { emoji: "⚙️" },
            Economy: { emoji: client.appEmojis?.lux_bank || "<:lux_bank:1550640811853611180>" },
            Fun: { emoji: "🎉" },
            Games: { emoji: "🎮" },
            Information: { emoji: "💡" },
            Leveling: { emoji: "🏆" },
            Moderation: { emoji: "🛡️" },
            Utility: { emoji: "🧰" },
            Socials: { emoji: "📢" },
            Developer: { emoji: "⚡" }
        }

        const getEmoji = (folderName) => {
            return emojis[folderName] ? emojis[folderName].emoji : "📁"
        }

        const BANNER_IMAGE = "https://cdn.discordapp.com/attachments/1517162401357627463/1517165288326692914/33345.png?ex=6a3549c8&is=6a33f848&hm=29756800a75a9a832543520bea1836f49afa66d3f9a60701220d1e76b2c6bff3&"
        const FOOTER_IMAGE = "https://cdn.discordapp.com/attachments/1517162401357627463/1517166682227871834/33345.png?ex=6a354b14&is=6a33f994&hm=8fc24d2494e2e0f76ccd518e36c4eba96e1f96092c7d2590db675493232b6462&"
        const botId = client.user?.id || "1338080989775265792"

        const getSocialButtonsRow = () => new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setStyle(ButtonStyle.Link)
                .setURL("https://lxst.cc")
                .setEmoji(client.appEmojis?.lx_logo || "<:lx_logo:1550651032076554311>"),
            new ButtonBuilder()
                .setStyle(ButtonStyle.Link)
                .setURL(`https://discord.com/oauth2/authorize?client_id=${botId}&permissions=8&integration_type=0&scope=bot`)
                .setEmoji("🤖"),
            new ButtonBuilder()
                .setStyle(ButtonStyle.Link)
                .setURL("https://github.com/lxstarino")
                .setEmoji(client.appEmojis?.github || "<:github:1550651201442414622>")
        )

        const getSelectMenuRow = (activeView, selectedFolder = null, disabled = false) => {
            const menu = new StringSelectMenuBuilder()
                .setCustomId("help-select")
                .setPlaceholder(ls["cmds"]["help"]["placeholder"] || "Select a category...")
                .setDisabled(disabled)
                .addOptions(
                    {
                        label: ls["cmds"]["help"]["btn_home"] || "Home",
                        value: "help-home",
                        description: ls["cmds"]["help"]["opt_home_desc"] || "Return to the main overview",
                        emoji: "🏠",
                        default: activeView === "home"
                    },
                    {
                        label: ls["cmds"]["help"]["btn_cmdlist"] || "All Commands",
                        value: "help-all",
                        description: ls["cmds"]["help"]["opt_all_desc"] || "View all bot commands grouped by category",
                        emoji: "📋",
                        default: activeView === "cmdlist"
                    },
                    ...filtered_modules.map(mod => ({
                        label: mod.folder,
                        value: mod.folder,
                        description: handlemsg(ls["cmds"]["help"]["category_desc"], { module: mod.folder }),
                        emoji: getEmoji(mod.folder),
                        default: activeView === "category" && selectedFolder === mod.folder
                    }))
                )

            return new ActionRowBuilder().addComponents(menu)
        }

        const buildComponents = (activeView, selectedFolder = null, disabled = false) => {
            return [getSelectMenuRow(activeView, selectedFolder, disabled), getSocialButtonsRow()]
        }

        const getHomeEmbedObjects = () => {
            let totalCmdCount = 0
            filtered_modules.forEach(mod => { totalCmdCount += mod.totalCount })

            const sortedHomeModules = [...filtered_modules].sort((a, b) => b.totalCount - a.totalCount)

            const chunks = []
            for (let i = 0; i < sortedHomeModules.length; i += 2) {
                chunks.push(sortedHomeModules.slice(i, i + 2))
            }
            const categoriesText = chunks.map(chunk => {
                return "> " + chunk.map(mod => `${getEmoji(mod.folder)} **${mod.folder}:** \`${mod.totalCount}\``).join(" • ")
            }).join("\n")

            return [
                {
                    image: BANNER_IMAGE
                },
                {
                    author: { name: `${client.user.username} | ${ls["cmds"]["help"]["title_home"]}`, iconURL: client.user.displayAvatarURL() },
                    desc: `${ls["cmds"]["help"]["home_desc"]}\n\n**${ls["cmds"]["help"]["categories_title"]}:**\n${categoriesText}`,
                    image: FOOTER_IMAGE,
                    footer: { text: handlemsg(ls["cmds"]["help"]["footer_home"], { totalCmdCount: String(totalCmdCount), categoryCount: String(filtered_modules.length) }) }
                }
            ]
        }

        const getCategoryEmbedObjects = (folderName) => {
            const selectedModule = filtered_modules.find(x => x.folder === folderName)
            if (!selectedModule) return getHomeEmbedObjects()

            const folderEmoji = getEmoji(selectedModule.folder)
            const cmds = selectedModule.commands

            if (!cmds || cmds.length === 0) {
                return [
                    {
                        image: BANNER_IMAGE
                    },
                    {
                        author: { name: `${client.user.username} | ${selectedModule.folder}`, iconURL: client.user.displayAvatarURL() },
                        title: `${folderEmoji} ${selectedModule.folder} (${selectedModule.totalCount})`,
                        desc: `*${ls["cmds"]["help"]["no_commands"]}*`,
                        image: FOOTER_IMAGE,
                        footer: { text: handlemsg(ls["cmds"]["help"]["requested_by"], { user: interaction.user.tag }) }
                    }
                ]
            }

            const formattedList = cmds.map(cmd => {
                if (cmd.subcommands.length > 0) {
                    return `> **\`/${cmd.baseName}\`** \`[${cmd.subcommands.join(", ")}]\` — *${cmd.description}*`
                }
                return `> **\`/${cmd.baseName}\`** — *${cmd.description}*`
            })

            let fields = []
            let desc = handlemsg(ls["cmds"]["help"]["category_desc"], { module: selectedModule.folder })

            if (formattedList.length > 4) {
                const mid = Math.ceil(formattedList.length / 2)
                const col1 = formattedList.slice(0, mid)
                const col2 = formattedList.slice(mid)

                fields = [
                    {
                        name: "\u200b",
                        value: col1.join("\n"),
                        inline: true
                    },
                    {
                        name: "\u200b",
                        value: col2.join("\n"),
                        inline: true
                    }
                ]
            } else {
                desc += `\n\n${formattedList.join("\n")}`
            }

            return [
                {
                    image: BANNER_IMAGE
                },
                {
                    author: { name: `${client.user.username} | ${selectedModule.folder}`, iconURL: client.user.displayAvatarURL() },
                    title: `${folderEmoji} ${selectedModule.folder} (${selectedModule.totalCount})`,
                    desc: desc,
                    fields: fields.length > 0 ? fields : undefined,
                    image: FOOTER_IMAGE,
                    footer: { text: handlemsg(ls["cmds"]["help"]["requested_by"], { user: interaction.user.tag }) }
                }
            ]
        }

        const formatCommandsCompact = (commands) => {
            return commands.map(cmd => {
                if (cmd.subcommands.length > 0) {
                    return `\`/${cmd.baseName} [${cmd.subcommands.join(", ")}]\``
                }
                return `\`/${cmd.baseName}\``
            }).join(", ")
        }

        const getAllCommandsEmbedObjects = () => {
            const sorted = [...filtered_modules].sort((a, b) => {
                const lenA = formatCommandsCompact(a.commands).length
                const lenB = formatCommandsCompact(b.commands).length
                return lenB - lenA
            })

            const col1 = []
            const col2 = []
            let len1 = 0
            let len2 = 0

            for (const mod of sorted) {
                const text = `> **${getEmoji(mod.folder)} ${mod.folder} (${mod.totalCount})**\n> ${formatCommandsCompact(mod.commands)}`
                if (len1 <= len2) {
                    col1.push(text)
                    len1 += text.length
                } else {
                    col2.push(text)
                    len2 += text.length
                }
            }

            const fields = [
                {
                    name: "\u200b",
                    value: col1.join("\n\n") || "*None*",
                    inline: true
                }
            ]
            if (col2.length > 0) {
                fields.push({
                    name: "\u200b",
                    value: col2.join("\n\n"),
                    inline: true
                })
            }

            return [
                {
                    image: BANNER_IMAGE
                },
                {
                    author: { name: `${client.user.username} | ${ls["cmds"]["help"]["title_all"]}`, iconURL: client.user.displayAvatarURL() },
                    title: ls["cmds"]["help"]["title_all"],
                    desc: ls["cmds"]["help"]["desc_all"],
                    fields: fields,
                    image: FOOTER_IMAGE,
                    footer: { text: handlemsg(ls["cmds"]["help"]["requested_by"], { user: interaction.user.tag }) }
                }
            ]
        }

        let currentView = "home"
        let currentFolder = null

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
                const [selectedValue] = i.values

                if (selectedValue === "help-home") {
                    currentView = "home"
                    currentFolder = null

                    await client.Embed(
                        getHomeEmbedObjects(),
                        buildComponents("home"),
                        "update",
                        true,
                        i
                    )

                } else if (selectedValue === "help-all") {
                    currentView = "cmdlist"
                    currentFolder = null

                    await client.Embed(
                        getAllCommandsEmbedObjects(),
                        buildComponents("cmdlist"),
                        "update",
                        true,
                        i
                    )

                } else {
                    const selectedModule = filtered_modules.find(x => x.folder === selectedValue)
                    if (!selectedModule) {
                        await i.deferUpdate().catch(err => console.error("[help] Failed to defer update:", err.message))
                        return
                    }

                    currentView = "category"
                    currentFolder = selectedValue

                    await client.Embed(
                        getCategoryEmbedObjects(selectedValue),
                        buildComponents("category", selectedValue),
                        "update",
                        true,
                        i
                    )
                }
            }
        })

        collector.on("end", async () => {
            const disabledComponents = buildComponents(currentView, currentFolder, true)
            await interaction.editReply({
                components: disabledComponents
            }).catch(() => {
                replyMsg?.edit({ components: disabledComponents }).catch(() => {})
            })
        })
    }
}
