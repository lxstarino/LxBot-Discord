const { SlashCommandBuilder } = require("@discordjs/builders")
const {
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js")

module.exports = {
    devOnly: true,
    data: new SlashCommandBuilder()
        .setName("bot-proxyview")
        .setDescription("Inspect active in-memory auto-saving proxies and caches")
        .addStringOption(option =>
            option.setName("scope")
                .setDescription("Select proxy inspection scope")
                .setRequired(false)
                .addChoices(
                    { name: "All Shards (Global)", value: "all" },
                    { name: "Current Shard Only", value: "current" }
                )
        ),

    async execute(client, interaction) {
        let currentScope = interaction.options.getString("scope") || (client.shard ? "all" : "current")
        let selectedCacheKey = null
        let currentPage = 0
        const pageSize = 3

        async function fetchCacheData(scope) {
            if (scope === "all" && client.shard) {
                try {
                    const shardResults = await client.shard.broadcastEval((c) => {
                        const getEntries = (map) => {
                            if (!map) return []
                            return Array.from(map.entries()).map(([k, v]) => ({
                                key: k,
                                raw: v?.__raw || v
                            }))
                        }

                        return {
                            shardId: c.shard.ids[0],
                            settings: getEntries(c.settings?.mapCache),
                            economy: getEntries(c.economy?.mapCache),
                            ticket: getEntries(c.ticket?.mapCache),
                            reactionRoles: getEntries(c.reactionRoles?.mapCache),
                            polls: getEntries(c.polls?.mapCache)
                        }
                    })

                    const combined = {
                        settings: [],
                        economy: [],
                        ticket: [],
                        reactionRoles: [],
                        polls: []
                    }

                    for (const res of shardResults) {
                        for (const item of res.settings) combined.settings.push({ shardId: res.shardId, key: item.key, val: item.raw })
                        for (const item of res.economy) combined.economy.push({ shardId: res.shardId, key: item.key, val: item.raw })
                        for (const item of res.ticket) combined.ticket.push({ shardId: res.shardId, key: item.key, val: item.raw })
                        for (const item of res.reactionRoles) combined.reactionRoles.push({ shardId: res.shardId, key: item.key, val: item.raw })
                        for (const item of res.polls) combined.polls.push({ shardId: res.shardId, key: item.key, val: item.raw })
                    }

                    return [
                        { name: "Settings Proxies", key: "settings", entries: combined.settings, description: "Guild configuration & feature toggles" },
                        { name: "Profile / Economy Proxies", key: "economy", entries: combined.economy, description: "User profiles, balances, levels & inventory" },
                        { name: "Ticket Panels", key: "ticket", entries: combined.ticket, description: "Active ticket panel configs" },
                        { name: "Reaction Role Panels", key: "reactionRoles", entries: combined.reactionRoles, description: "Active reaction role panels" },
                        { name: "Poll Proxies", key: "polls", entries: combined.polls, description: "Active live polls in memory" }
                    ]
                } catch (err) {
                    console.error("[bot-proxyview] Failed to broadcastEval across shards:", err)
                }
            }

            const getLocalEntries = (map) => {
                if (!map) return []
                const shardId = client.shard ? client.shard.ids[0] : 0
                return Array.from(map.entries()).map(([k, v]) => ({
                    shardId,
                    key: k,
                    val: v?.__raw || v
                }))
            }

            return [
                { name: "Settings Proxies", key: "settings", entries: getLocalEntries(client.settings?.mapCache), description: "Guild configuration & feature toggles" },
                { name: "Profile / Economy Proxies", key: "economy", entries: getLocalEntries(client.economy?.mapCache), description: "User profiles, balances, levels & inventory" },
                { name: "Ticket Panels", key: "ticket", entries: getLocalEntries(client.ticket?.mapCache), description: "Active ticket panel configs" },
                { name: "Reaction Role Panels", key: "reactionRoles", entries: getLocalEntries(client.reactionRoles?.mapCache), description: "Active reaction role panels" },
                { name: "Poll Proxies", key: "polls", entries: getLocalEntries(client.polls?.mapCache), description: "Active live polls in memory" }
            ]
        }

        async function renderOverview() {
            const caches = await fetchCacheData(currentScope)
            const totalProxies = caches.reduce((acc, c) => acc + c.entries.length, 0)
            const scopeLabel = currentScope === "all" ? "All Shards (Global)" : `Current Shard (#${client.shard ? client.shard.ids.join(", ") : "0"})`

            const embed = client.tempEmbed()
                .setTitle("Active Proxy & Cache Inspector")
                .setDescription(
                    `**Scope:** \`${scopeLabel}\`\n` +
                    `**Total Active Proxies in RAM:** \`${totalProxies}\`\n\n` +
                    `Select a cache category below to inspect active proxy instances and their data.`
                )

            for (const c of caches) {
                embed.addFields({
                    name: `${c.name} (${c.entries.length})`,
                    value: `${c.description}\n**Cached Keys:** \`${c.entries.length}\``,
                    inline: true
                })
            }

            const menu = new StringSelectMenuBuilder()
                .setCustomId("select_proxy_cache")
                .setPlaceholder("Select a proxy cache to inspect...")
                .addOptions(
                    caches.map(c => ({
                        label: `${c.name} (${c.entries.length})`,
                        value: c.key,
                        description: c.description.substring(0, 100)
                    }))
                )

            const menuRow = new ActionRowBuilder().addComponents(menu)

            const buttonRow = new ActionRowBuilder()
            if (client.shard) {
                buttonRow.addComponents(
                    new ButtonBuilder()
                        .setCustomId("toggle_scope")
                        .setLabel(currentScope === "all" ? "Switch to: Current Shard" : "Switch to: All Shards")
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId("btn_refresh")
                        .setLabel("Refresh")
                        .setStyle(ButtonStyle.Primary)
                )
            } else {
                buttonRow.addComponents(
                    new ButtonBuilder()
                        .setCustomId("btn_refresh")
                        .setLabel("Refresh")
                        .setStyle(ButtonStyle.Primary)
                )
            }

            return { embeds: [embed], components: [menuRow, buttonRow] }
        }

        async function renderCacheDetails(cacheKey, page) {
            const caches = await fetchCacheData(currentScope)
            const target = caches.find(c => c.key === cacheKey)
            if (!target) return await renderOverview()

            const entries = target.entries
            const total = entries.length
            const maxPage = Math.max(0, Math.ceil(total / pageSize) - 1)
            const currentP = Math.min(page, maxPage)
            const start = currentP * pageSize
            const pagedEntries = entries.slice(start, start + pageSize)
            const scopeLabel = currentScope === "all" ? "All Shards (Global)" : `Current Shard (#${client.shard ? client.shard.ids.join(", ") : "0"})`

            const embed = client.tempEmbed()
                .setTitle(`${target.name} [Page ${currentP + 1}/${maxPage + 1}]`)
                .setDescription(
                    `**Scope:** \`${scopeLabel}\`\n` +
                    `**Total Cached in RAM:** \`${total}\`\n\n` +
                    (total === 0 ? "*No active proxy objects in memory for this category.*" : "")
                )

            for (const item of pagedEntries) {
                let jsonStr = ""
                try {
                    jsonStr = JSON.stringify(item.val, null, 2)
                    if (jsonStr.length > 900) {
                        jsonStr = jsonStr.substring(0, 890) + "\n... [truncated]"
                    }
                } catch {
                    jsonStr = String(item.val)
                }

                const shardPrefix = currentScope === "all" ? `[Shard #${item.shardId}] ` : ""

                embed.addFields({
                    name: `${shardPrefix}Key: \`${item.key}\``,
                    value: `\`\`\`json\n${jsonStr}\n\`\`\``,
                    inline: false
                })
            }

            const buttons = [
                new ButtonBuilder()
                    .setCustomId("btn_prev")
                    .setLabel("◀ Prev")
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(currentP === 0),
                new ButtonBuilder()
                    .setCustomId("btn_overview")
                    .setLabel("Overview")
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId("btn_next")
                    .setLabel("Next ▶")
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(currentP >= maxPage)
            ]

            const row = new ActionRowBuilder().addComponents(buttons)
            return { embeds: [embed], components: [row] }
        }

        const initialView = await renderOverview()
        const reply = await interaction.reply({
            ...initialView,
            ephemeral: true,
            fetchReply: true
        })

        const collector = reply.createMessageComponentCollector({
            time: 180000
        })

        collector.on("collect", async (i) => {
            if (i.user.id !== interaction.user.id) {
                return i.reply({ content: "You cannot control this session.", ephemeral: true })
            }

            if (i.isStringSelectMenu() && i.customId === "select_proxy_cache") {
                selectedCacheKey = i.values[0]
                currentPage = 0
                await i.update(await renderCacheDetails(selectedCacheKey, currentPage))
            } else if (i.isButton()) {
                if (i.customId === "toggle_scope") {
                    currentScope = currentScope === "all" ? "current" : "all"
                    currentPage = 0
                    if (selectedCacheKey) {
                        await i.update(await renderCacheDetails(selectedCacheKey, currentPage))
                    } else {
                        await i.update(await renderOverview())
                    }
                } else if (i.customId === "btn_refresh") {
                    if (selectedCacheKey) {
                        await i.update(await renderCacheDetails(selectedCacheKey, currentPage))
                    } else {
                        await i.update(await renderOverview())
                    }
                } else if (i.customId === "btn_overview") {
                    selectedCacheKey = null
                    currentPage = 0
                    await i.update(await renderOverview())
                } else if (i.customId === "btn_prev") {
                    currentPage = Math.max(0, currentPage - 1)
                    await i.update(await renderCacheDetails(selectedCacheKey, currentPage))
                } else if (i.customId === "btn_next") {
                    currentPage++
                    await i.update(await renderCacheDetails(selectedCacheKey, currentPage))
                }
            }
        })

        collector.on("end", async () => {
            try {
                const disabledRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId("expired")
                        .setLabel("Session Expired")
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true)
                )
                await interaction.editReply({ components: [disabledRow] })
            } catch { }
        })
    }
}
