const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js")
const { handlemsg, createProgressBar } = require("../../utils/stringUtils")
const defaultDb = require("../../database/Database")

const POLL_EMOJIS = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣"]
const POLL_BUTTON_STYLES = [ButtonStyle.Primary, ButtonStyle.Success, ButtonStyle.Danger, ButtonStyle.Secondary, ButtonStyle.Primary]

function buildComponents(options, disabled = false) {
    const rows = []
    for (let i = 0; i < options.length; i += 3) {
        const row = new ActionRowBuilder()
        options.slice(i, i + 3).forEach((opt, ci) => {
            const idx = i + ci
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId(`poll_vote_${idx}`)
                    .setLabel(`${POLL_EMOJIS[idx]} ${opt}`)
                    .setStyle(POLL_BUTTON_STYLES[idx])
                    .setDisabled(disabled)
            )
        })
        rows.push(row)
    }
    return rows
}

function buildResultsText(options, voterMap, handlemsg, ls, client) {
    const totalVotes = Object.keys(voterMap).length
    return options.map((opt, i) => {
        const count = Object.values(voterMap).filter(v => v === i).length
        const percent = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0
        const bar = createProgressBar(count, totalVotes, 8, client?.appEmojis)
        return handlemsg(ls["cmds"]["poll"]["result_line"], {
            emoji: POLL_EMOJIS[i], option: opt, count: String(count), percent: String(percent)
        }) + `\n${bar}`
    }).join("\n\n")
}

function buildEmbed(title, question, options, voterMap, endsAt, creatorTag, creatorAvatar, handlemsg, ls, client) {
    const ts = Math.floor(endsAt / 1000)
    return {
        title,
        description: `${handlemsg(ls["cmds"]["poll"]["desc"], { question })}\n\n${buildResultsText(options, voterMap, handlemsg, ls, client)}\n\n⏰ Ends <t:${ts}:R>`,
        footer: { text: handlemsg(ls["cmds"]["poll"]["createdby"], { user: creatorTag }), icon_url: creatorAvatar },
        timestamp: new Date().toISOString()
    }
}

function attachCollector(client, pollMsg, pollData, handlemsg) {
    const { messageId, question, options, endsAt, creatorTag, creatorAvatar, guildId } = pollData
    const remaining = endsAt - Date.now()

    if (remaining <= 0) {
        finalisePoll(client, pollMsg, pollData, handlemsg)
        return
    }

    const ls = client.getLanguage(guildId)
    const collector = pollMsg.createMessageComponentCollector({ time: remaining })

    collector.on("collect", async (i) => {
        if (!i.customId.startsWith("poll_vote_")) return
        const optionIdx = parseInt(i.customId.replace("poll_vote_", ""))

        pollData.voterMap[i.user.id] = optionIdx
        const database = client.db || defaultDb
        database.savePoll(pollData)

        await client.Embed(
            [buildEmbed(ls["cmds"]["poll"]["title"], question, options, pollData.voterMap, endsAt, creatorTag, creatorAvatar, handlemsg, ls, client)],
            buildComponents(options, false),
            "update",
            false,
            i
        ).catch((err) => console.error("[poll] Failed to update poll vote embed:", err.message))
    })

    collector.on("end", (_collected, reason) => {
        if (reason === "messageDelete") {
            const database = client.db || defaultDb
            database.deletePoll(messageId)
            return
        }
        finalisePoll(client, pollMsg, pollData, handlemsg)
    })
}

async function finalisePoll(client, pollMsg, pollData, handlemsg) {
    const { messageId, question, options, voterMap, creatorTag, creatorAvatar, guildId } = pollData
    const ls = client.getLanguage(guildId)
    const totalVotes = Object.keys(voterMap).length
    const finalResults = buildResultsText(options, voterMap, handlemsg, ls, client)

    await client.Embed(
        [{
            title: ls["cmds"]["poll"]["results_title"],
            description: handlemsg(ls["cmds"]["poll"]["results_desc"], { question, results: finalResults })
                + `\n\n📊 **Total votes: ${totalVotes}**`,
            footer: { text: handlemsg(ls["cmds"]["poll"]["createdby"], { user: creatorTag }), icon_url: creatorAvatar },
            timestamp: new Date().toISOString()
        }],
        buildComponents(options, true),
        "edit",
        false,
        pollMsg
    ).catch((err) => console.error("[poll] Failed to edit poll results on finalise:", err.message))

    const database = client.db || defaultDb
    database.deletePoll(messageId)
}

module.exports = {
    name: "Polls",
    attachCollector,
    buildComponents,
    buildEmbed,
    async restore(client) {
        const activePolls = client.db ? client.db.getAllPolls() : []
        if (activePolls.length === 0) return

        for (const pollData of activePolls) {
            try {
                const guild = client.guilds.cache.get(pollData.guildId)
                if (!guild) continue
                const channel = guild.channels.cache.get(pollData.channelId)
                if (!channel) continue
                const message = await channel.messages.fetch(pollData.messageId).catch(() => null)
                if (!message) {
                    if (client.db) client.db.deletePoll(pollData.messageId)
                    continue
                }

                attachCollector(client, message, pollData, handlemsg)
            } catch (err) {
                console.error(`  > [Poll Restore] Failed for poll ${pollData.messageId}: ${err.message}`)
            }
        }
    }
}
