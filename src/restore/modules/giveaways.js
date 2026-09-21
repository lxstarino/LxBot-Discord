const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js")
const { handlemsg } = require("../../utils/stringUtils")
const defaultDb = require("../../database/Database")

function participationRow(disabled = false, ls) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("participate_giveaway")
            .setLabel(ls?.["cmds"]?.["giveaway"]?.["participate_btn"] || "Participate")
            .setEmoji("🎉")
            .setDisabled(disabled)
            .setStyle(ButtonStyle.Success)
    )
}

function buildGiveawayEmbed(giveawayData, handlemsg, ls) {
    const { prize, endsAt, creatorId, creatorTag, creatorAvatar, entries = [] } = giveawayData
    const ts = Math.floor(endsAt / 1000)
    return {
        title: ls["cmds"]["giveaway"]["title"],
        desc: handlemsg(ls["cmds"]["giveaway"]["desc"], {
            prize,
            endsAt: String(ts),
            creatorId,
            entries: String(entries.length)
        }),
        footer: {
            text: `Hosted by ${creatorTag}`,
            icon_url: creatorAvatar
        },
        timestamp: new Date(endsAt).toISOString()
    }
}

function attachCollector(client, giveawayMsg, giveawayData, handlemsg) {
    const { messageId, endsAt, guildId } = giveawayData
    const remaining = endsAt - Date.now()

    if (remaining <= 0) {
        finaliseGiveaway(client, giveawayMsg, giveawayData, handlemsg)
        return
    }

    const ls = client.getLanguage(guildId)
    const collector = giveawayMsg.createMessageComponentCollector({ time: remaining })

    collector.on("collect", async (i) => {
        if (i.customId !== "participate_giveaway") return

        if (!Array.isArray(giveawayData.entries)) {
            giveawayData.entries = []
        }

        const idx = giveawayData.entries.indexOf(i.user.id)
        let replyKey = "enter_success"
        if (idx !== -1) {
            giveawayData.entries.splice(idx, 1)
            replyKey = "leave_success"
        } else {
            giveawayData.entries.push(i.user.id)
        }

        const database = client.db || defaultDb
        database.saveGiveaways(giveawayData)

        await client.Embed(
            [{
                desc: handlemsg(ls["cmds"]["giveaway"][replyKey], { prize: giveawayData.prize })
            }],
            [],
            "reply",
            true,
            i
        ).catch(() => {})

        await client.Embed(
            [buildGiveawayEmbed(giveawayData, handlemsg, ls)],
            [participationRow(false, ls)],
            "edit",
            false,
            giveawayMsg
        ).catch(() => {})
    })

    collector.on("end", (_collected, reason) => {
        if (reason === "messageDelete") {
            const database = client.db || defaultDb
            database.deleteGiveaways(messageId)
            return
        }
        finaliseGiveaway(client, giveawayMsg, giveawayData, handlemsg)
    })
}

async function finaliseGiveaway(client, giveawayMsg, giveawayData, handlemsg) {
    const { messageId, prize, creatorId, creatorTag, creatorAvatar, guildId, entries = [] } = giveawayData
    const ls = client.getLanguage(guildId)

    let winnerText = handlemsg(ls["cmds"]["giveaway"]["no_winner"])
    let winnerMention = null
    if (entries.length > 0) {
        const randomIndex = Math.floor(Math.random() * entries.length)
        const winnerId = entries[randomIndex]
        winnerText = `<@${winnerId}>`
        winnerMention = `<@${winnerId}>`
    }

    const endedEmbed = [{
        title: ls["cmds"]["giveaway"]["ended_title"],
        desc: handlemsg(ls["cmds"]["giveaway"]["ended_desc"], {
            prize,
            creatorId,
            winners: winnerText,
            entries: String(entries.length)
        }),
        footer: {
            text: `Hosted by ${creatorTag}`,
            icon_url: creatorAvatar
        },
        timestamp: new Date().toISOString()
    }]

    await client.Embed(
        endedEmbed,
        [participationRow(true, ls)],
        "edit",
        false,
        giveawayMsg
    ).catch(() => {})

    if (winnerMention) {
        giveawayMsg.channel?.send({
            content: handlemsg(ls["cmds"]["giveaway"]["congrats"], {
                winner: winnerMention,
                prize
            })
        }).catch(() => {})
    }

    const database = client.db || defaultDb
    database.deleteGiveaways(messageId)
}

module.exports = {
    name: "Giveaways",
    attachCollector,
    participationRow,
    buildGiveawayEmbed,
    finaliseGiveaway,
    async restore(client) {
        const activeGiveaways = client.db ? client.db.getAllGiveaways() : []
        if (activeGiveaways.length === 0) return

        for (const giveawayData of activeGiveaways) {
            try {
                const guild = client.guilds.cache.get(giveawayData.guildId)
                if (!guild) continue
                const channel = guild.channels.cache.get(giveawayData.channelId)
                if (!channel) continue
                const message = await channel.messages.fetch(giveawayData.messageId).catch(() => null)
                if (!message) {
                    if (client.db) client.db.deleteGiveaways(giveawayData.messageId)
                    continue
                }

                attachCollector(client, message, giveawayData, handlemsg)
            } catch (err) {
                console.error(`  > [Giveaway Restore] Failed for giveaway ${giveawayData.messageId}: ${err.message}`)
            }
        }
    }
}
