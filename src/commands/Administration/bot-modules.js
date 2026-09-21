const { SlashCommandBuilder, PermissionsBitField, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require("discord.js")

const MODULE_EMOJIS = {
    "Economy": "<:lux_coin:1550631084855922698>",
    "Fun": "🎉",
    "Games": "🎮",
    "Information": "ℹ️",
    "Leveling": "🏆",
    "Moderation": "🛡️",
    "Utility": "⚙️",
    "Socials": "🌐",
    "Developer": "👨‍💻"
}

module.exports = {
    guildOnly: true,
    data: new SlashCommandBuilder()
        .setName("bot-modules")
        .setDescription("Enable or disable specific bot modules on your server")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
    async execute(client, interaction) {
        const ls = client.getLanguage(interaction.guild?.id)
        const { handlemsg } = require("../../utils/stringUtils")
        const { getOrCreateSettings } = require("../../repositories/SettingsRepository")
        const settings = await getOrCreateSettings(client, interaction.guild.id)
        if (!settings.disabled_modules) settings.disabled_modules = []

        const allModules = [...new Set(client.commands.map(cmd => cmd.Folder))]
            .filter(folder => folder && folder !== "Administration")
            .sort()

        function buildPayload() {
            const disabledSet = new Set(settings.disabled_modules || [])

            const statusLines = allModules.map(mod => {
                const emoji = MODULE_EMOJIS[mod] || "📁"
                const isEnabled = !disabledSet.has(mod)
                const statusTag = isEnabled
                    ? `\`🟢 ${ls["cmds"]["bot-modules"]["status_enabled"]}\``
                    : `\`🔴 ${ls["cmds"]["bot-modules"]["status_disabled"]}\``
                return `> ${emoji} **${mod}** • ${statusTag}`
            }).join("\n")

            const description = handlemsg(ls["cmds"]["bot-modules"]["desc"], {
                guild: interaction.guild.name,
                status_list: statusLines
            })

            const selectOptions = allModules.map(mod => {
                const isEnabled = !disabledSet.has(mod)
                const emoji = isEnabled ? "🟢" : "🔴"
                const optDesc = isEnabled
                    ? ls["cmds"]["bot-modules"]["opt_desc_enabled"]
                    : ls["cmds"]["bot-modules"]["opt_desc_disabled"]

                return {
                    label: mod,
                    value: mod,
                    description: optDesc,
                    emoji: emoji
                }
            })

            const selectRow = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId("module-toggle-select")
                    .setPlaceholder(ls["cmds"]["bot-modules"]["placeholder"])
                    .addOptions(selectOptions)
            )

            const buttonsRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("btn-enable-all")
                    .setLabel(ls["cmds"]["bot-modules"]["btn_enable_all"])
                    .setEmoji("✅")
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId("btn-disable-all")
                    .setLabel(ls["cmds"]["bot-modules"]["btn_disable_all"])
                    .setEmoji("❌")
                    .setStyle(ButtonStyle.Danger)
            )

            return {
                embeds: [{
                    title: ls["cmds"]["bot-modules"]["title"],
                    desc: description,
                    thumbnail: client.user.displayAvatarURL(),
                    footer: { text: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() }
                }],
                components: [selectRow, buttonsRow]
            }
        }

        const initial = buildPayload()
        const msg = await client.Embed(initial.embeds, initial.components, "reply", true, interaction)
        if (!msg) return

        const collector = msg.createMessageComponentCollector({
            filter: i => i.user.id === interaction.user.id,
            time: 120000
        })

        collector.on("collect", async (i) => {
            if (i.customId === "module-toggle-select") {
                const targetModule = i.values[0]
                if (!settings.disabled_modules) settings.disabled_modules = []

                const index = settings.disabled_modules.indexOf(targetModule)
                if (index > -1) {
                    settings.disabled_modules.splice(index, 1)
                } else {
                    settings.disabled_modules.push(targetModule)
                }

                const updated = buildPayload()
                await client.Embed(updated.embeds, updated.components, "update", undefined, i)

            } else if (i.customId === "btn-enable-all") {
                settings.disabled_modules = []
                const updated = buildPayload()
                await client.Embed(updated.embeds, updated.components, "update", undefined, i)

            } else if (i.customId === "btn-disable-all") {
                settings.disabled_modules = [...allModules]
                const updated = buildPayload()
                await client.Embed(updated.embeds, updated.components, "update", undefined, i)
            }
        })

        collector.on("end", async (collected, reason) => {
            if (reason === "time") {
                await client.errEmbed({
                    type: "editReply",
                    title: ls["cmds"]["bot-modules"]["title"],
                    desc: ls["cmds"]["bot-modules"]["timeout"],
                    components: []
                }, interaction).catch(() => { })
            }
        })
    }
}