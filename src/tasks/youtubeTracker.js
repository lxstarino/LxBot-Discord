const db = require("../database/Database")
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js")
const { emojis } = require("../core/constants")

function decodeXmlEntities(str) {
    if (!str) return str
    return str
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&apos;/g, "'")
}

function parseFeedXml(xml) {
    if (!xml) return null
    const titleMatch = xml.match(/<feed[^>]*>[\s\S]*?<title>([^<]+)<\/title>/)
    const channelTitle = titleMatch ? decodeXmlEntities(titleMatch[1].trim()) : null

    const entries = []
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g
    let match
    while ((match = entryRegex.exec(xml)) !== null) {
        const block = match[1]
        const videoId = (block.match(/<yt:videoId>([^<]+)<\/yt:videoId>/) || [])[1]
        const rawTitle = (block.match(/<title>([^<]+)<\/title>/) || [])[1]
        const published = (block.match(/<published>([^<]+)<\/published>/) || [])[1]
        const link = (block.match(/<link rel="alternate" href="([^"<]+)"/) || [])[1]
        const thumbnail = (block.match(/<media:thumbnail url="([^"<]+)"/) || [])[1]

        if (videoId) {
            entries.push({
                videoId: videoId.trim(),
                title: rawTitle ? decodeXmlEntities(rawTitle.trim()) : "Untitled Video",
                published: published ? published.trim() : null,
                link: link ? link.trim() : `https://www.youtube.com/watch?v=${videoId.trim()}`,
                thumbnail: thumbnail ? thumbnail.trim() : `https://i.ytimg.com/vi/${videoId.trim()}/hqdefault.jpg`
            })
        }
    }

    return { channelTitle, entries }
}

async function fetchChannelFeed(channelId) {
    if (!channelId || !/^UC[a-zA-Z0-9_-]{22}$/.test(channelId)) {
        return { ok: false, reason: "INVALID_ID" }
    }

    const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`
    try {
        const res = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            },
            signal: AbortSignal.timeout(10000)
        })

        if (!res.ok) {
            return { ok: false, status: res.status, reason: res.status === 404 ? "NOT_FOUND" : "FETCH_FAILED" }
        }

        const xml = await res.text()
        const parsed = parseFeedXml(xml)
        if (!parsed || !parsed.channelTitle) {
            return { ok: false, reason: "NOT_FOUND" }
        }

        return {
            ok: true,
            channelId,
            channelTitle: parsed.channelTitle,
            entries: parsed.entries,
            latestVideo: parsed.entries.length > 0 ? parsed.entries[0] : null
        }
    } catch (err) {
        return { ok: false, reason: "REQUEST_ERROR", message: err.message }
    }
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

let isChecking = false

async function checkYoutubeUploads(client) {
    if (client.shard && client.shard.ids[0] !== 0) return
    if (isChecking) return
    isChecking = true

    try {
        const database = client.db || db
        const allTrackers = database.getAllYoutubeNotifications()
        if (!allTrackers || allTrackers.length === 0) {
            isChecking = false
            return
        }

        const uniqueChannelIds = [...new Set(allTrackers.map(t => t.channel_id.trim()))]
        const feedMap = new Map()

        for (const channelId of uniqueChannelIds) {
            const feedResult = await fetchChannelFeed(channelId)
            if (feedResult.ok) {
                feedMap.set(channelId, {
                    channelTitle: feedResult.channelTitle,
                    entries: feedResult.entries,
                    latestVideo: feedResult.latestVideo
                })
            }
            await sleep(250)
        }

        for (const tracker of allTrackers) {
            const feedData = feedMap.get(tracker.channel_id.trim())
            if (!feedData || !feedData.latestVideo || !feedData.entries) {
                continue
            }

            const channelName = feedData.channelTitle || tracker.channel_name || "YouTube Channel"

            if (!tracker.last_video_id) {
                database.updateYoutubeLastVideo(tracker.guild_id, tracker.channel_id, feedData.latestVideo.videoId)
                tracker.last_video_id = feedData.latestVideo.videoId
                continue
            }

            if (tracker.last_video_id === feedData.latestVideo.videoId) {
                continue
            }

            const recentEntries = feedData.entries.slice(0, 3)
            const lastIndex = recentEntries.findIndex(v => v.videoId === tracker.last_video_id)

            let newVideos = []
            if (lastIndex !== -1) {
                newVideos = recentEntries.slice(0, lastIndex)
            } else {
                newVideos = recentEntries
            }

            if (newVideos.length === 0) {
                continue
            }

            newVideos.reverse()

            for (const video of newVideos) {
                const videoUrl = video.link || `https://www.youtube.com/watch?v=${video.videoId}`

                let contentText = tracker.custom_message
                if (contentText) {
                    contentText = contentText
                        .replace(/\{channel\}/gi, channelName)
                        .replace(/\{title\}/gi, video.title)
                        .replace(/\{url\}/gi, videoUrl)
                } else {
                    contentText = `${emojis.youtube} **${channelName}** hat ein neues Video hochgeladen!\n${videoUrl}`
                }

                const embedData = {
                    title: `${emojis.youtube} ${video.title}`.substring(0, 256),
                    url: videoUrl,
                    description: `📺 **Kanal:** [${channelName}](https://www.youtube.com/channel/${tracker.channel_id})\n\n[▶️ Auf YouTube ansehen](${videoUrl})`,
                    color: 0xFF0000,
                    image: video.thumbnail ? { url: video.thumbnail } : undefined,
                    footer: { text: "YouTube Upload Notification" },
                    timestamp: video.published ? new Date(video.published).toISOString() : new Date().toISOString()
                }

                const buttonRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setStyle(ButtonStyle.Link)
                        .setLabel("Video ansehen")
                        .setURL(videoUrl)
                        .setEmoji(emojis.youtube)
                )

                const announceData = {
                    discordChannelId: tracker.discord_channel_id,
                    contentText: contentText,
                    embedData: embedData,
                    components: [buttonRow.toJSON()]
                }

                const announceFunc = async (c, { discordChannelId, contentText, embedData, components }) => {
                    const channel = c.channels.cache.get(discordChannelId)
                    if (!channel) return null

                    try {
                        const msg = await channel.send({
                            content: contentText || undefined,
                            embeds: [embedData],
                            components: components || []
                        })
                        return msg.id
                    } catch (err) {
                        console.error(`[YouTube Tracker] Failed to send alert in channel ${discordChannelId}:`, err.message)
                        return null
                    }
                }

                try {
                    if (client.shard) {
                        await client.shard.broadcastEval(announceFunc, { context: announceData })
                    } else {
                        await announceFunc(client, announceData)
                    }
                } catch (err) {
                    console.error(`[YouTube Tracker] Error broadcasting alert for ${tracker.channel_id}:`, err.message)
                }

                if (newVideos.length > 1) {
                    await sleep(500)
                }
            }

            database.updateYoutubeLastVideo(tracker.guild_id, tracker.channel_id, feedData.latestVideo.videoId)
            tracker.last_video_id = feedData.latestVideo.videoId
        }
    } catch (err) {
        console.error("[YouTube Tracker] Error in tracker loop:", err)
    } finally {
        isChecking = false
    }
}

module.exports = (client) => {
    if (client.shard && client.shard.ids[0] !== 0) return

    setTimeout(() => {
        checkYoutubeUploads(client).catch(err => {
            console.error("[YouTube Tracker] Error in initial check:", err)
        })
    }, 10000)

    setInterval(() => {
        checkYoutubeUploads(client).catch(err => {
            console.error("[YouTube Tracker] Error in interval check:", err)
        })
    }, 120 * 1000)
}
