const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js")

let topArticlesPool = []
let lastFetchedMonth = ""
const summaryCache = new Map()

const fetchTopWikipediaArticles = async () => {
    const now = new Date()
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const y = prevMonth.getFullYear()
    const m = String(prevMonth.getMonth() + 1).padStart(2, "0")
    const monthKey = `${y}-${m}`

    if (topArticlesPool.length > 0 && lastFetchedMonth === monthKey) {
        return topArticlesPool
    }

    try {
        const url = `https://wikimedia.org/api/rest_v1/metrics/pageviews/top/en.wikipedia/all-access/${y}/${m}/all-days`
        const res = await fetch(url, { headers: { "User-Agent": "DiscordBot/1.0 (https://discord.com)" } }).catch(() => null)
        if (!res || !res.ok) return topArticlesPool

        const data = await res.json()
        if (!data.items || !data.items[0] || !data.items[0].articles) return topArticlesPool

        const clean = data.items[0].articles.filter(a => {
            const title = a.article
            if (!title) return false
            if (title === "Main_Page" || title.includes(":") || title.startsWith("List_of_") || title.startsWith("Deaths_in_") || title.includes(".html") || title.includes(".php")) return false
            return true
        })

        if (clean.length > 0) {
            topArticlesPool = clean
            lastFetchedMonth = monthKey
        }
        return topArticlesPool
    } catch (err) {
        return topArticlesPool
    }
}

const fetchArticleThumbnail = async (wikiTitle) => {
    if (summaryCache.has(wikiTitle)) return summaryCache.get(wikiTitle)
    try {
        const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiTitle)}`
        const res = await fetch(url, { headers: { "User-Agent": "DiscordBot/1.0 (https://discord.com)" } }).catch(() => null)
        if (!res || !res.ok) return null
        const data = await res.json()
        const thumb = (data.thumbnail && data.thumbnail.source) ? data.thumbnail.source : null
        summaryCache.set(wikiTitle, thumb)
        return thumb
    } catch (err) {
        return null
    }
}

const getNextTopic = async (usedSet, excludeWiki = "") => {
    const pool = await fetchTopWikipediaArticles()
    if (!pool || pool.length === 0) {
        return { name: "Minecraft", wiki: "Minecraft", count: 1500000, thumbnail: null }
    }

    let available = pool.filter(a => !usedSet.has(a.article) && a.article !== excludeWiki)
    if (available.length === 0) {
        usedSet.clear()
        available = pool.filter(a => a.article !== excludeWiki)
    }

    const randomIndex = Math.floor(Math.random() * available.length)
    const chosen = available[randomIndex]
    usedSet.add(chosen.article)

    const thumbnail = await fetchArticleThumbnail(chosen.article)
    const displayName = chosen.article.replace(/_/g, " ")

    return {
        name: displayName,
        wiki: chosen.article,
        count: chosen.views,
        thumbnail: thumbnail
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("higherlower")
        .setDescription("Play Higher or Lower with live Wikipedia Top 1,000 Most Read topics"),
    async execute(client, interaction) {
        let ls = client.getLanguage(interaction.guild?.id)
        const { handlemsg } = require(`${process.cwd()}/src/handlers/functions`)

        const usedTopics = new Set()

        await interaction.deferReply({ ephemeral: true }).catch(() => {})

        let itemA = await getNextTopic(usedTopics)
        let itemB = await getNextTopic(usedTopics, itemA.wiki)
        let nextItem = await getNextTopic(usedTopics, itemB.wiki)
        let score = 0

        const buildActiveComponents = () => {
            return [
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId("hilo-higher")
                        .setLabel(ls["cmds"]["hilo"]["btn_higher"] || "Higher ⬆️")
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId("hilo-lower")
                        .setLabel(ls["cmds"]["hilo"]["btn_lower"] || "Lower ⬇️")
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId("hilo-stop")
                        .setLabel(ls["cmds"]["hilo"]["btn_stop"] || "Stop 🛑")
                        .setStyle(ButtonStyle.Danger)
                )
            ]
        }

        const buildRetryComponents = () => {
            return [
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId("hilo-retry")
                        .setLabel(ls["cmds"]["hilo"]["btn_retry"] || "Play Again 🔄")
                        .setStyle(ButtonStyle.Success)
                )
            ]
        }

        const buildDisabledComponents = () => {
            return [
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId("hilo-higher")
                        .setLabel(ls["cmds"]["hilo"]["btn_higher"] || "Higher ⬆️")
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId("hilo-lower")
                        .setLabel(ls["cmds"]["hilo"]["btn_lower"] || "Lower ⬇️")
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId("hilo-stop")
                        .setLabel(ls["cmds"]["hilo"]["btn_stop"] || "Stop 🛑")
                        .setStyle(ButtonStyle.Danger)
                        .setDisabled(true)
                )
            ]
        }

        const formatNum = (num) => num.toLocaleString("en-US")

        const initialDesc = handlemsg(ls["cmds"]["hilo"]["desc"], {
            itemA: itemA.name,
            countA: formatNum(itemA.count),
            itemB: itemB.name
        })

        const embedObj = {
            author: { name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() },
            title: ls["cmds"]["hilo"]["title"],
            desc: initialDesc
        }
        if (itemB.thumbnail) embedObj.thumbnail = itemB.thumbnail

        const replyMsg = await client.Embed([embedObj], buildActiveComponents(), "editReply", true, interaction)

        if (!replyMsg) return

        const collector = replyMsg.createMessageComponentCollector({
            filter: i => i.user.id === interaction.user.id,
            time: 180000
        })

        collector.on("collect", async (i) => {
            if (i.customId === "hilo-retry") {
                score = 0
                itemA = await getNextTopic(usedTopics)
                itemB = await getNextTopic(usedTopics, itemA.wiki)
                nextItem = await getNextTopic(usedTopics, itemB.wiki)

                const newDesc = handlemsg(ls["cmds"]["hilo"]["desc"], {
                    itemA: itemA.name,
                    countA: formatNum(itemA.count),
                    itemB: itemB.name
                })

                const retryEmbed = {
                    author: { name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() },
                    title: ls["cmds"]["hilo"]["title"],
                    desc: newDesc
                }
                if (itemB.thumbnail) retryEmbed.thumbnail = itemB.thumbnail

                await client.Embed([retryEmbed], buildActiveComponents(), "update", true, i)
                return
            }

            if (i.customId === "hilo-stop") {
                const stoppedDesc = handlemsg(ls["cmds"]["hilo"]["stopped"], {
                    score: score
                })

                const stopEmbed = {
                    author: { name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() },
                    title: ls["cmds"]["hilo"]["title"],
                    desc: stoppedDesc
                }
                if (itemB.thumbnail) stopEmbed.thumbnail = itemB.thumbnail

                await client.Embed([stopEmbed], buildRetryComponents(), "update", true, i)
                return
            }

            const choice = i.customId === "hilo-higher" ? "higher" : "lower"
            let isCorrect = false
            let isEqual = false

            if (itemB.count === itemA.count) {
                isEqual = true
            } else if (choice === "higher" && itemB.count > itemA.count) {
                isCorrect = true
            } else if (choice === "lower" && itemB.count < itemA.count) {
                isCorrect = true
            }

            if (isEqual) {
                itemA = itemB
                itemB = nextItem
                getNextTopic(usedTopics, itemB.wiki).then(res => { nextItem = res })

                const equalDesc = handlemsg(ls["cmds"]["hilo"]["equal"], {
                    countB: formatNum(itemA.count),
                    score: score
                })

                const eqEmbed = {
                    author: { name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() },
                    title: ls["cmds"]["hilo"]["title"],
                    desc: equalDesc
                }
                if (itemB.thumbnail) eqEmbed.thumbnail = itemB.thumbnail

                await client.Embed([eqEmbed], buildActiveComponents(), "update", true, i)

            } else if (isCorrect) {
                score += 1
                const prevItemB = itemB
                itemA = itemB
                itemB = nextItem
                getNextTopic(usedTopics, itemB.wiki).then(res => { nextItem = res })

                const correctDesc = handlemsg(ls["cmds"]["hilo"]["correct"], {
                    itemB: prevItemB.name,
                    countB: formatNum(prevItemB.count),
                    score: score,
                    nextItem: itemB.name
                })

                const okEmbed = {
                    author: { name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() },
                    title: ls["cmds"]["hilo"]["title"],
                    desc: correctDesc
                }
                if (itemB.thumbnail) okEmbed.thumbnail = itemB.thumbnail

                await client.Embed([okEmbed], buildActiveComponents(), "update", true, i)

            } else {
                const gameOverDesc = handlemsg(ls["cmds"]["hilo"]["gameover"], {
                    itemB: itemB.name,
                    countB: formatNum(itemB.count),
                    score: score
                })

                const goEmbed = {
                    author: { name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() },
                    title: ls["cmds"]["hilo"]["title"],
                    color: "#E74C3C",
                    desc: gameOverDesc
                }
                if (itemB.thumbnail) goEmbed.thumbnail = itemB.thumbnail

                await client.Embed([goEmbed], buildRetryComponents(), "update", true, i)
            }
        })

        collector.on("end", async (collected, reason) => {
            if (reason === "time") {
                await replyMsg.edit({
                    components: buildDisabledComponents()
                }).catch(() => {})
            }
        })
    }
}
