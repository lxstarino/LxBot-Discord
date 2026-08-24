const { SlashCommandBuilder } = require("@discordjs/builders")
const {
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js")
const db = require(`${process.cwd()}/src/utils/Database`)
const { handlemsg } = require(`${process.cwd()}/src/utils/functions`)

module.exports = {
    devOnly: true,
    data: new SlashCommandBuilder()
        .setName("bot-dbview")
        .setDescription("Inspect SQLite database tables and records"),

    async execute(client, interaction) {
        const ls = client.getLanguage(interaction.guild?.id)
        const tLs = ls["cmds"]?.["bot-dbview"] || ls["cmds"]?.["db-view"] || {}
        const rawDb = (client.db || db).db

        function getTables() {
            const rows = rawDb.prepare(`
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name NOT LIKE 'sqlite_%'
                ORDER BY name ASC
            `).all()

            return rows.map(r => {
                const countRow = rawDb.prepare(`SELECT count(*) as count FROM "${r.name}"`).get()
                return {
                    name: r.name,
                    count: countRow ? countRow.count : 0
                }
            })
        }

        function getTableRows(tableName, offset = 0, limit = 4) {
            const totalRow = rawDb.prepare(`SELECT count(*) as count FROM "${tableName}"`).get()
            const total = totalRow ? totalRow.count : 0
            const rows = rawDb.prepare(`SELECT * FROM "${tableName}" LIMIT ? OFFSET ?`).all(limit, offset)
            return { rows, total }
        }

        let currentTable = null
        let currentPage = 0
        const pageSize = 4

        function renderOverview() {
            const tables = getTables()
            const totalRecords = tables.reduce((acc, t) => acc + t.count, 0)

            const embed = client.tempEmbed()
                .setTitle(tLs["title"] || "Database Viewer")
                .setDescription(handlemsg(tLs["overview_desc"] || "**Database File:** `{file}`\n**Journal Mode:** `WAL`\n**Tables:** `{tables}`\n**Total Records:** `{records}`\n\nSelect a table from the menu below to browse records.", {
                    file: "./src/storages/bot.db",
                    tables: String(tables.length),
                    records: String(totalRecords)
                }))

            tables.forEach(t => {
                embed.addFields({
                    name: `${t.name}`,
                    value: handlemsg(tLs["records_count"] || "{count} records", { count: String(t.count) }),
                    inline: true
                })
            })

            const selectOptions = tables.map(t => ({
                label: `${t.name} (${t.count})`,
                value: t.name,
                description: `${t.name} table`
            }))

            const menuRow = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId("db_select_table")
                    .setPlaceholder(tLs["select_placeholder"] || "Select a table to browse...")
                    .addOptions(selectOptions)
            )

            const buttonRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("db_refresh_overview")
                    .setLabel(tLs["btn_refresh"] || "Refresh")
                    .setEmoji("🔄")
                    .setStyle(ButtonStyle.Secondary)
            )

            return { embeds: [embed], components: [menuRow, buttonRow] }
        }

        function renderTableView(tableName, page) {
            const offset = page * pageSize
            const { rows, total } = getTableRows(tableName, offset, pageSize)
            const maxPage = Math.max(0, Math.ceil(total / pageSize) - 1)

            const embed = client.tempEmbed()
                .setTitle(`${tLs["title"] || "Database Viewer"} • ${tableName}`)
                .setDescription(handlemsg(tLs["table_view_desc"] || "Showing records **{from} - {to}** of **{total}** (Page {page}/{maxPage})", {
                    from: String(total === 0 ? 0 : offset + 1),
                    to: String(Math.min(offset + pageSize, total)),
                    total: String(total),
                    page: String(page + 1),
                    maxPage: String(maxPage + 1)
                }))

            if (rows.length === 0) {
                embed.addFields({
                    name: tLs["table_empty_title"] || "Table is Empty",
                    value: tLs["table_empty_desc"] || "No records found in this table."
                })
            } else {
                rows.forEach((row, i) => {
                    const recordNum = offset + i + 1
                    let fieldText = ""

                    if (row.data !== undefined) {
                        try {
                            const parsed = typeof row.data === "string" ? JSON.parse(row.data) : row.data
                            const compact = JSON.stringify(parsed, null, 2)
                            const truncated = compact.length > 950 ? compact.substring(0, 950) + "\n..." : compact
                            fieldText = `\`\`\`json\n${truncated}\n\`\`\``
                        } catch {
                            fieldText = `\`${row.data}\``
                        }
                    } else {
                        const compact = JSON.stringify(row, null, 2)
                        fieldText = `\`\`\`json\n${compact}\n\`\`\``
                    }

                    embed.addFields({
                        name: handlemsg(tLs["record_title"] || "Record #{num}", { num: String(recordNum) }),
                        value: fieldText || "Empty"
                    })
                })
            }

            const navRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("db_back_to_tables")
                    .setLabel(tLs["btn_tables"] || "Tables List")
                    .setEmoji("⬅️")
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId("db_page_prev")
                    .setLabel(tLs["btn_prev"] || "Previous")
                    .setEmoji("◀️")
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(page <= 0),
                new ButtonBuilder()
                    .setCustomId("db_page_next")
                    .setLabel(tLs["btn_next"] || "Next")
                    .setEmoji("▶️")
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(page >= maxPage),
                new ButtonBuilder()
                    .setCustomId("db_refresh_table")
                    .setLabel(tLs["btn_refresh"] || "Refresh")
                    .setEmoji("🔄")
                    .setStyle(ButtonStyle.Secondary)
            )

            return { embeds: [embed], components: [navRow] }
        }

        const initialView = renderOverview()
        const reply = await interaction.reply({
            embeds: initialView.embeds,
            components: initialView.components,
            ephemeral: true,
            fetchReply: true
        })

        const collector = reply.createMessageComponentCollector({
            time: 300000
        })

        collector.on("collect", async (i) => {
            if (i.user.id !== interaction.user.id) {
                return i.reply({ content: tLs["err_unauthorized"] || "You cannot interact with this viewer.", ephemeral: true })
            }

            if (i.customId === "db_select_table") {
                currentTable = i.values[0]
                currentPage = 0
                const view = renderTableView(currentTable, currentPage)
                await i.update({ embeds: view.embeds, components: view.components })
            } else if (i.customId === "db_back_to_tables") {
                currentTable = null
                currentPage = 0
                const view = renderOverview()
                await i.update({ embeds: view.embeds, components: view.components })
            } else if (i.customId === "db_page_prev") {
                if (currentTable && currentPage > 0) {
                    currentPage--
                    const view = renderTableView(currentTable, currentPage)
                    await i.update({ embeds: view.embeds, components: view.components })
                } else {
                    await i.deferUpdate()
                }
            } else if (i.customId === "db_page_next") {
                if (currentTable) {
                    const totalRow = rawDb.prepare(`SELECT count(*) as count FROM "${currentTable}"`).get()
                    const total = totalRow ? totalRow.count : 0
                    const maxPage = Math.max(0, Math.ceil(total / pageSize) - 1)
                    if (currentPage < maxPage) {
                        currentPage++
                        const view = renderTableView(currentTable, currentPage)
                        await i.update({ embeds: view.embeds, components: view.components })
                    } else {
                        await i.deferUpdate()
                    }
                } else {
                    await i.deferUpdate()
                }
            } else if (i.customId === "db_refresh_table") {
                if (currentTable) {
                    const view = renderTableView(currentTable, currentPage)
                    await i.update({ embeds: view.embeds, components: view.components })
                } else {
                    const view = renderOverview()
                    await i.update({ embeds: view.embeds, components: view.components })
                }
            } else if (i.customId === "db_refresh_overview") {
                const view = renderOverview()
                await i.update({ embeds: view.embeds, components: view.components })
            }
        })

        collector.on("end", async () => {
            try {
                await interaction.editReply({ components: [] })
            } catch {}
        })
    }
}
