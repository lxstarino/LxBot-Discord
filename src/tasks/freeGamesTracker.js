const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js")
const db = require("../database/Database")

async function checkAndAnnounceFreeGames(client) {
    try {
        const response = await fetch("https://www.gamerpower.com/api/filter?platform=steam.epic-games-store&type=game", { signal: AbortSignal.timeout(15000) })

        if (!response.ok) {
            console.error(`[Free Games] API request failed with status: ${response.status}`)
            return
        }

        const games = await response.json()
        if (!Array.isArray(games)) return

        const database = client.db || db
        const announcedIds = database.getAnnouncedGames()

        const newGames = games.filter(g => !announcedIds.includes(Number(g.id)))
        if (newGames.length === 0) return

        console.log(`[Free Games] Found and announced ${newGames.length} new free game(s)!`)

        for (const game of newGames) {
            const gameData = {
                title: game.title,
                url: game.open_giveaway_url || game.gamerpower_url,
                worth: game.worth,
                description: game.description,
                platforms: game.platforms,
                end_date: game.end_date,
                instructions: game.instructions,
                image: game.image || game.thumbnail
            }

            const announceFunc = async (c, { gameData }) => {
                const database = c.db || require("../database/Database")
                const allSettings = database.getAllSettings()
                const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js")

                const steamEmoji = c.appEmojis?.steam || "<:steam:1550626219920195735>"
                const epicEmoji = c.appEmojis?.epicgames || "<:epicgames:1550631998161166459>"

                const button = new ButtonBuilder()
                    .setStyle(ButtonStyle.Link)
                    .setLabel("Claim Game")
                    .setURL(gameData.url)

                const platformsLower = (gameData.platforms || "").toLowerCase()
                if (platformsLower.includes("epic")) {
                    button.setEmoji(epicEmoji)
                } else if (platformsLower.includes("steam")) {
                    button.setEmoji(steamEmoji)
                }

                const row = new ActionRowBuilder().addComponents(button)

                let formattedPlatforms = gameData.platforms || "PC"
                if (platformsLower.includes("epic") && !formattedPlatforms.includes(epicEmoji)) {
                    formattedPlatforms = `${epicEmoji} ${formattedPlatforms}`
                } else if (platformsLower.includes("steam") && !formattedPlatforms.includes(steamEmoji)) {
                    formattedPlatforms = `${steamEmoji} ${formattedPlatforms}`
                }

                for (const guildData of allSettings) {
                    if (guildData.freegames_channel) {
                        try {
                            const guild = c.guilds.cache.get(guildData.guildId)
                            if (!guild) continue

                            const channel = guild.channels.cache.get(guildData.freegames_channel)
                            if (!channel) continue

                            let ls = typeof c.getLanguage === "function" ? c.getLanguage(guild.id) : null
                            if (!ls) continue

                            const embedData = {
                                title: gameData.title,
                                url: gameData.url,
                                desc: `**${ls["cmds"]["freegames-setup"]["embed_worth"] || "Worth"}:** ~~${gameData.worth}~~ **${ls["cmds"]["freegames-setup"]["embed_free"] || "FREE"}**\n\n${gameData.description}`,
                                fields: [
                                    { name: ls["cmds"]["freegames-setup"]["embed_platforms"] || "Platforms", value: formattedPlatforms, inline: true },
                                    { name: ls["cmds"]["freegames-setup"]["embed_end_date"] || "End Date", value: gameData.end_date || "N/A", inline: true },
                                    { name: ls["cmds"]["freegames-setup"]["embed_instructions"] || "Instructions", value: gameData.instructions || "Click the claim button below." }
                                ],
                                image: gameData.image,
                                footer: { text: "Provided by GamerPower.com" },
                                color: 0x00FF00
                            }

                            if (typeof c.Embed === "function") {
                                await c.Embed([embedData], [row], "send", false, channel)
                            }
                        } catch (err) {
                            console.error(`[Free Games] Failed to send notification to guild ${guildData.guildId}:`, err.message)
                        }
                    }
                }
            }

            if (client.shard) {
                await client.shard.broadcastEval(announceFunc, { context: { gameData } })
            } else {
                await announceFunc(client, { gameData })
            }

            (client.db || db).addAnnouncedGame(game.id)
        }
    } catch (err) {
        console.error("[Free Games] Error checking free games:", err.message)
    }
}

module.exports = (client) => {
    if (client.shard && client.shard.ids[0] !== 0) return

    checkAndAnnounceFreeGames(client)
    setInterval(() => checkAndAnnounceFreeGames(client), 60 * 60 * 1000)
}
