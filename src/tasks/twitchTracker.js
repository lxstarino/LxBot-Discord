const db = require("../database/Database")
const { emojis } = require("../core/constants")

let cachedToken = null
let tokenExpiresAt = 0

async function getTwitchToken() {
    const clientId = process.env.TWITCH_CLIENT_ID
    const clientSecret = process.env.TWITCH_CLIENT_SECRET

    if (!clientId || !clientSecret) {
        return null
    }

    if (cachedToken && Date.now() < tokenExpiresAt) {
        return cachedToken
    }

    try {
        const res = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`, {
            method: "POST",
            signal: AbortSignal.timeout(10000)
        })

        if (!res.ok) {
            console.error(`[Twitch Tracker] Failed to get OAuth token. Status: ${res.status}`)
            return null
        }

        const data = await res.json()
        if (!data.access_token) {
            console.error("[Twitch Tracker] No access_token in response:", data)
            return null
        }

        cachedToken = data.access_token
        tokenExpiresAt = Date.now() + Math.max(0, (data.expires_in - 300) * 1000)
        return cachedToken
    } catch (err) {
        console.error("[Twitch Tracker] Error fetching Twitch OAuth token:", err.message)
        return null
    }
}

async function fetchLiveStreams(logins, token, clientId) {
    if (!logins || logins.length === 0) return []

    const query = logins.map(l => `user_login=${encodeURIComponent(l)}`).join("&")
    const url = `https://api.twitch.tv/helix/streams?${query}`

    try {
        const res = await fetch(url, {
            headers: {
                "Client-ID": clientId,
                "Authorization": `Bearer ${token}`
            },
            signal: AbortSignal.timeout(10000)
        })

        if (!res.ok) {
            console.error(`[Twitch Tracker] Helix streams request failed with status: ${res.status}`)
            return []
        }

        const json = await res.json()
        return Array.isArray(json.data) ? json.data : []
    } catch (err) {
        console.error("[Twitch Tracker] Error requesting live streams from Twitch:", err.message)
        return []
    }
}

async function checkTwitchLiveStreams(client) {
    if (client.shard && client.shard.ids[0] !== 0) return

    const clientId = process.env.TWITCH_CLIENT_ID
    const clientSecret = process.env.TWITCH_CLIENT_SECRET

    if (!clientId || !clientSecret) {
        return
    }

    const token = await getTwitchToken()
    if (!token) return

    const database = client.db || db
    const allTrackers = database.getAllTwitchNotifications()
    if (!allTrackers || allTrackers.length === 0) return

    const uniqueLogins = [...new Set(allTrackers.map(t => t.streamer_login.toLowerCase().trim()))]

    const chunkSize = 100
    const liveStreamsMap = new Map()

    for (let i = 0; i < uniqueLogins.length; i += chunkSize) {
        const chunk = uniqueLogins.slice(i, i + chunkSize)
        const liveStreams = await fetchLiveStreams(chunk, token, clientId)
        for (const stream of liveStreams) {
            liveStreamsMap.set(stream.user_login.toLowerCase(), stream)
        }
    }

    for (const tracker of allTrackers) {
        const login = tracker.streamer_login.toLowerCase()
        const stream = liveStreamsMap.get(login)

        if (stream) {
            if (tracker.last_stream_id === stream.id) {
                continue
            }

            const streamUrl = `https://twitch.tv/${stream.user_login}`
            const thumbnailUrl = (stream.thumbnail_url || "")
                .replace("{width}", "1280")
                .replace("{height}", "720")

            const formattedThumbnail = thumbnailUrl ? `${thumbnailUrl}?t=${Date.now()}` : null

            let contentText = tracker.custom_message
            if (contentText) {
                contentText = contentText
                    .replace(/\{streamer\}/gi, stream.user_name)
                    .replace(/\{url\}/gi, streamUrl)
                    .replace(/\{title\}/gi, stream.title)
                    .replace(/\{game\}/gi, stream.game_name || "Just Chatting")
            } else {
                contentText = `${emojis.twitch} **${stream.user_name}** is now live on Twitch!\n${streamUrl}`
            }

            const embedData = {
                title: `${emojis.twitch} ${stream.user_name} is live on Twitch!`,
                description: `**${stream.title || "No Title"}**\n\n🎮 **Category:** ${stream.game_name || "Just Chatting"}\n👥 **Viewers:** ${stream.viewer_count || 0}`,
                url: streamUrl,
                color: 0x9146FF,
                image: formattedThumbnail ? { url: formattedThumbnail } : undefined,
                footer: { text: "Twitch Live Notification" },
                timestamp: stream.started_at ? new Date(stream.started_at).toISOString() : new Date().toISOString()
            }

            const announceData = {
                channelId: tracker.channel_id,
                contentText: contentText,
                embedData: embedData
            }

            const announceFunc = async (c, { channelId, contentText, embedData }) => {
                const channel = c.channels.cache.get(channelId)
                if (!channel) return null

                try {
                    const msg = await channel.send({
                        content: contentText || undefined,
                        embeds: [embedData]
                    })
                    return msg.id
                } catch (err) {
                    console.error(`[Twitch Tracker] Failed to send alert in channel ${channelId}:`, err.message)
                    return null
                }
            }

            let sentMessageId = null
            try {
                if (client.shard) {
                    const results = await client.shard.broadcastEval(announceFunc, { context: announceData })
                    sentMessageId = results.find(id => Boolean(id)) || null
                } else {
                    sentMessageId = await announceFunc(client, announceData)
                }
            } catch (err) {
                console.error(`[Twitch Tracker] Error broadcasting alert for ${login}:`, err.message)
            }

            database.updateTwitchLive(tracker.guild_id, tracker.streamer_login, 1, stream.id, sentMessageId || tracker.last_message_id)

        } else {
            if (tracker.is_live === 1) {
                database.updateTwitchLive(tracker.guild_id, tracker.streamer_login, 0, null, tracker.last_message_id)
            }
        }
    }
}

module.exports = (client) => {
    if (client.shard && client.shard.ids[0] !== 0) return

    setTimeout(() => {
        checkTwitchLiveStreams(client).catch(err => {
            console.error("[Twitch Tracker] Error in initial check:", err)
        })
    }, 5000)

    setInterval(() => {
        checkTwitchLiveStreams(client).catch(err => {
            console.error("[Twitch Tracker] Error in interval check:", err)
        })
    }, 60 * 1000)
}
