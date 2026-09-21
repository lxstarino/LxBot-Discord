const {
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType
} = require("discord.js")
const { handlemsg } = require("../../utils/stringUtils")

module.exports = {
    guildOnly: true,
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName("emoji-list")
        .setDescription("List all custom emojis on this server"),

    async execute(client, interaction) {
        await interaction.deferReply().catch(() => {})

        const ls = typeof client.getLanguage === "function" ? client.getLanguage(interaction.guild?.id) : null
        const tLs = ls?.cmds?.["emoji-list"] || {}

        let emojiCollection = null
        try {
            emojiCollection = await interaction.guild.emojis.fetch()
        } catch (err) {
            console.error("[emoji-list] Failed to fetch guild emojis:", err)
            emojiCollection = interaction.guild.emojis.cache
        }

        const emojis = Array.from(emojiCollection.values())

        if (!emojis || emojis.length === 0) {
            const emptyMsg = tLs["empty_server"] || "This server does not have any custom emojis yet."
            const emptyEmbed = client.tempEmbed()
                .setTitle(tLs["title_server"] || "Server Emojis")
                .setDescription(emptyMsg)
                .setColor("#5865F2")

            return interaction.editReply({ embeds: [emptyEmbed], components: [] })
        }

        emojis.sort((a, b) => a.name.localeCompare(b.name))

        const totalCount = emojis.length
        const animatedCount = emojis.filter(e => e.animated).length
        const staticCount = totalCount - animatedCount

        const pageSize = 6
        const totalPages = Math.ceil(totalCount / pageSize)
        let currentPage = 0

        function generatePage(page) {
            const start = page * pageSize
            const end = start + pageSize
            const pageEmojis = emojis.slice(start, end)

            const embed = client.tempEmbed()
                .setTitle(tLs["title_server"] || "Server Emojis")
                .setDescription(handlemsg(tLs["desc_overview"] || "**Total:** `{total}` • **Static:** `{static}` • **Animated:** `{animated}`", {
                    total: String(totalCount),
                    static: String(staticCount),
                    animated: String(animatedCount)
                }))
                .setColor("#5865F2")
                .setFooter({
                    text: handlemsg(tLs["page_footer"] || "Page {page} of {maxPage} • Total Emojis: {total}", {
                        page: String(page + 1),
                        maxPage: String(totalPages),
                        total: String(totalCount)
                    })
                })

            if (interaction.guild && interaction.guild.iconURL()) {
                embed.setThumbnail(interaction.guild.iconURL({ size: 128 }))
            }

            for (const emoji of pageEmojis) {
                const isAnimated = Boolean(emoji.animated)
                const emojiStr = isAnimated ? `<a:${emoji.name}:${emoji.id}>` : `<:${emoji.name}:${emoji.id}>`
                const syntaxStr = `\`${emojiStr}\``
                const idStr = `\`${emoji.id}\``
                const typeStr = isAnimated ? (tLs["type_animated"] || "Animated") : (tLs["type_static"] || "Static")

                const pngUrl = `https://cdn.discordapp.com/emojis/${emoji.id}.png?size=1024&quality=lossless`
                const gifUrl = `https://cdn.discordapp.com/emojis/${emoji.id}.gif?size=1024&quality=lossless`
                const webpUrl = `https://cdn.discordapp.com/emojis/${emoji.id}.webp?size=1024&quality=lossless`

                const links = isAnimated
                    ? `[GIF](${gifUrl}) • [PNG](${pngUrl}) • [WebP](${webpUrl})`
                    : `[PNG](${pngUrl}) • [WebP](${webpUrl})`

                embed.addFields({
                    name: `${emojiStr} ${emoji.name}`,
                    value: `• **${tLs["field_id"] || "ID"}:** ${idStr}\n• **${tLs["field_syntax"] || "Syntax"}:** ${syntaxStr}\n• **${tLs["field_type"] || "Type"}:** ${typeStr}\n• **${tLs["field_links"] || "Links"}:** ${links}`,
                    inline: true
                })
            }

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("emoji_first")
                    .setEmoji("⏮️")
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(page === 0),
                new ButtonBuilder()
                    .setCustomId("emoji_prev")
                    .setEmoji("◀️")
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(page === 0),
                new ButtonBuilder()
                    .setCustomId("emoji_page_indicator")
                    .setLabel(`${page + 1} / ${totalPages}`)
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId("emoji_next")
                    .setEmoji("▶️")
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(page === totalPages - 1),
                new ButtonBuilder()
                    .setCustomId("emoji_last")
                    .setEmoji("⏭️")
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(page === totalPages - 1)
            )

            return {
                embeds: [embed],
                components: totalPages > 1 ? [row] : []
            }
        }

        const initialPayload = generatePage(currentPage)
        const responseMsg = await interaction.editReply(initialPayload)

        if (totalPages <= 1) return

        const collector = responseMsg.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 120000
        })

        collector.on("collect", async (btnInt) => {
            if (btnInt.user.id !== interaction.user.id) {
                return btnInt.reply({
                    content: tLs["not_owner"] || "You cannot control this menu.",
                    ephemeral: true
                })
            }

            if (btnInt.customId === "emoji_first") {
                currentPage = 0
            } else if (btnInt.customId === "emoji_prev") {
                currentPage = Math.max(0, currentPage - 1)
            } else if (btnInt.customId === "emoji_next") {
                currentPage = Math.min(totalPages - 1, currentPage + 1)
            } else if (btnInt.customId === "emoji_last") {
                currentPage = totalPages - 1
            }

            await btnInt.update(generatePage(currentPage)).catch(() => {})
        })

        collector.on("end", async () => {
            const disabledPayload = generatePage(currentPage)
            if (disabledPayload.components.length > 0) {
                disabledPayload.components[0].components.forEach(b => b.setDisabled(true))
            }
            await interaction.editReply(disabledPayload).catch(() => {})
        })
    }
}
