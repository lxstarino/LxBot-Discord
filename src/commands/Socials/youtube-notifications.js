const { SlashCommandBuilder, PermissionsBitField, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js")
const { handlemsg } = require("../../utils/stringUtils")
const { emojis } = require("../../core/constants")

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

async function resolveAndVerifyChannel(input) {
    if (!input || typeof input !== "string") {
        return { ok: false, reason: "INVALID_INPUT" }
    }

    let clean = input.trim()

    if (/^UC[a-zA-Z0-9_-]{22}$/.test(clean)) {
        const feedCheck = await fetchChannelFeed(clean)
        if (feedCheck.ok) {
            return {
                ok: true,
                channelId: clean,
                channelTitle: feedCheck.channelTitle,
                latestVideoId: feedCheck.latestVideo ? feedCheck.latestVideo.videoId : null
            }
        }
        return { ok: false, reason: feedCheck.reason || "NOT_FOUND" }
    }

    const directMatch = clean.match(/youtube\.com\/channel\/(UC[a-zA-Z0-9_-]{22})/i)
    if (directMatch) {
        const channelId = directMatch[1]
        const feedCheck = await fetchChannelFeed(channelId)
        if (feedCheck.ok) {
            return {
                ok: true,
                channelId: channelId,
                channelTitle: feedCheck.channelTitle,
                latestVideoId: feedCheck.latestVideo ? feedCheck.latestVideo.videoId : null
            }
        }
        return { ok: false, reason: feedCheck.reason || "NOT_FOUND" }
    }

    let fetchUrl = clean
    if (!clean.startsWith("http://") && !clean.startsWith("https://")) {
        if (!clean.startsWith("@")) clean = "@" + clean
        fetchUrl = `https://www.youtube.com/${clean}`
    }

    try {
        const res = await fetch(fetchUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept-Language": "en-US,en;q=0.9"
            },
            signal: AbortSignal.timeout(10000)
        })

        if (!res.ok) {
            return { ok: false, reason: res.status === 404 ? "NOT_FOUND" : "FETCH_FAILED" }
        }

        const html = await res.text()
        const m1 = html.match(/<meta itemprop="channelId" content="(UC[a-zA-Z0-9_-]{22})"/)
        const m2 = html.match(/"channelId":"(UC[a-zA-Z0-9_-]{22})"/)
        const m3 = html.match(/"externalId":"(UC[a-zA-Z0-9_-]{22})"/)

        const channelId = m1 ? m1[1] : (m2 ? m2[1] : (m3 ? m3[1] : null))
        if (!channelId) {
            return { ok: false, reason: "NOT_FOUND" }
        }

        const feedCheck = await fetchChannelFeed(channelId)
        if (!feedCheck.ok) {
            return { ok: false, reason: feedCheck.reason || "NOT_FOUND" }
        }

        return {
            ok: true,
            channelId,
            channelTitle: feedCheck.channelTitle,
            latestVideoId: feedCheck.latestVideo ? feedCheck.latestVideo.videoId : null
        }
    } catch (err) {
        return { ok: false, reason: "REQUEST_ERROR", message: err.message }
    }
}

module.exports = {
    guildOnly: true,
    data: new SlashCommandBuilder()
        .setName("youtube-notifications")
        .setDescription("Manage YouTube video upload notifications for your server")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .addSubcommand(sub =>
            sub.setName("add")
                .setDescription("Add a YouTube channel to track for video uploads")
                .addStringOption(opt =>
                    opt.setName("channel")
                        .setDescription("YouTube channel handle (@name), URL, or Channel ID")
                        .setRequired(true)
                )
                .addChannelOption(opt =>
                    opt.setName("discord_channel")
                        .setDescription("Discord channel where upload notifications will be posted")
                        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
                        .setRequired(true)
                )
                .addStringOption(opt =>
                    opt.setName("message")
                        .setDescription("Custom message or role ping (e.g. @everyone {channel} has uploaded a new video!)")
                        .setRequired(false)
                )
        )
        .addSubcommand(sub =>
            sub.setName("remove")
                .setDescription("Remove a tracked YouTube channel")
                .addStringOption(opt =>
                    opt.setName("channel")
                        .setDescription("YouTube channel handle, ID, or name to stop tracking")
                        .setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub.setName("list")
                .setDescription("List all tracked YouTube channels on this server")
        ),

    async execute(client, interaction) {
        const subcommand = interaction.options.getSubcommand()
        const ls = typeof client.getLanguage === "function" ? client.getLanguage(interaction.guild?.id) : null
        const ytLs = ls?.cmds?.["youtube-notifications"] || {}
        const db = client.db

        if (!db) {
            return interaction.reply({ content: "❌ Database not initialized.", ephemeral: true })
        }

        if (subcommand === "add") {
            await interaction.deferReply({ ephemeral: true })

            const channelInput = interaction.options.getString("channel").trim()
            const discordChannel = interaction.options.getChannel("discord_channel")
            const customMessage = interaction.options.getString("message")

            const botMember = interaction.guild.members.me
            const perms = discordChannel.permissionsFor(botMember)
            if (!perms || !perms.has(PermissionsBitField.Flags.SendMessages) || !perms.has(PermissionsBitField.Flags.EmbedLinks)) {
                return client.errEmbed ? client.errEmbed({
                    type: "reply",
                    ephemeral: true,
                    desc: handlemsg(ytLs["err_perms"] || "I need **Send Messages** and **Embed Links** permissions in <#{channel}>!", { channel: discordChannel.id })
                }, interaction) : interaction.editReply({
                    content: `I need Send Messages and Embed Links permissions in <#${discordChannel.id}>!`
                })
            }

            const currentList = db.getYoutubeNotifications(interaction.guild.id)
            if (currentList.length >= 5) {
            }

            const check = await resolveAndVerifyChannel(channelInput)
            if (!check.ok) {
                return client.errEmbed ? client.errEmbed({
                    type: "reply",
                    ephemeral: true,
                    desc: handlemsg(ytLs["err_not_found"] || "The YouTube channel **{channel}** does not exist or could not be found. Please check the handle or channel ID.", { channel: channelInput })
                }, interaction) : interaction.editReply({
                    content: `The YouTube channel **${channelInput}** does not exist or could not be found.`
                })
            }

            const alreadyExists = currentList.some(t => t.channel_id === check.channelId)
            if (!alreadyExists && currentList.length >= 5) {
                return client.errEmbed ? client.errEmbed({
                    type: "reply",
                    ephemeral: true,
                    desc: ytLs["err_limit"] || "This server has reached the maximum limit of **5** tracked YouTube channels."
                }, interaction) : interaction.editReply({
                    content: "This server has reached the maximum limit of 5 tracked YouTube channels."
                })
            }

            db.addYoutubeNotification(
                interaction.guild.id,
                check.channelId,
                check.channelTitle,
                discordChannel.id,
                customMessage,
                check.latestVideoId
            )

            const updatedList = db.getYoutubeNotifications(interaction.guild.id)
            const channelUrl = `https://www.youtube.com/channel/${check.channelId}`

            const embedData = {
                title: `${emojis.youtube} ${check.channelTitle}`,
                url: channelUrl,
                desc: handlemsg(
                    ytLs["add_success"] || "Successfully configured upload notifications for **{channel}** in <#{discord_channel}>.",
                    { channel: check.channelTitle, discord_channel: discordChannel.id }
                ),
                color: 0xFF0000,
                fields: [
                    {
                        name: "Notification Channel",
                        value: `<#${discordChannel.id}>`,
                        inline: true
                    },
                    {
                        name: "Status",
                        value: "Watching for new uploads",
                        inline: true
                    },
                    {
                        name: "Channel ID",
                        value: `\`${check.channelId}\``,
                        inline: true
                    },
                    ...(customMessage ? [{
                        name: "Custom Message",
                        value: customMessage,
                        inline: false
                    }] : [])
                ],
                footer: {
                    text: `Tracked Channels: ${updatedList.length}/5`
                },
                timestamp: interaction.createdTimestamp
            }

            const buttonRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setStyle(ButtonStyle.Link)
                    .setLabel("Kanal ansehen")
                    .setURL(channelUrl)
                    .setEmoji(emojis.youtube)
            )

            if (typeof client.Embed === "function") {
                return client.Embed([embedData], [buttonRow], "reply", true, interaction)
            }

            return interaction.editReply({
                content: `Successfully configured upload notifications for **${check.channelTitle}** in <#${discordChannel.id}>.`,
                components: [buttonRow]
            })

        } else if (subcommand === "remove") {
            let channelInput = interaction.options.getString("channel").trim()

            const list = db.getYoutubeNotifications(interaction.guild.id)
            let match = list.find(t => t.channel_id.toLowerCase() === channelInput.toLowerCase() || t.channel_name.toLowerCase() === channelInput.toLowerCase())

            if (!match) {
                const resolved = await resolveAndVerifyChannel(channelInput)
                if (resolved.ok) {
                    match = list.find(t => t.channel_id === resolved.channelId)
                }
            }

            if (!match) {
                return client.errEmbed ? client.errEmbed({
                    type: "reply",
                    ephemeral: true,
                    desc: handlemsg(ytLs["not_tracked"] || "**{channel}** is not currently being tracked on this server.", { channel: channelInput })
                }, interaction) : interaction.reply({
                    content: `**${channelInput}** is not currently being tracked on this server.`,
                    ephemeral: true
                })
            }

            db.removeYoutubeNotification(interaction.guild.id, match.channel_id)
            const remainingList = db.getYoutubeNotifications(interaction.guild.id)

            const embedData = {
                title: `${emojis.youtube} ${ytLs["title"] || "YouTube Notifications"}`,
                desc: handlemsg(
                    ytLs["remove_success"] || "Successfully removed **{channel}** from YouTube notifications.",
                    { channel: match.channel_name }
                ),
                color: 0xFF0000,
                footer: {
                    text: `Tracked Channels: ${remainingList.length}/5`
                },
                timestamp: interaction.createdTimestamp
            }

            if (typeof client.Embed === "function") {
                return client.Embed([embedData], undefined, "reply", true, interaction)
            }

            return interaction.reply({
                content: `Successfully removed **${match.channel_name}** from YouTube notifications.`,
                ephemeral: true
            })

        } else if (subcommand === "list") {
            const list = db.getYoutubeNotifications(interaction.guild.id)

            if (!list || list.length === 0) {
                const emptyMsg = ytLs["list_empty"] || "There are currently no YouTube channels being tracked on this server."
                if (typeof client.Embed === "function") {
                    return client.Embed([{
                        title: `${emojis.youtube} ${ytLs["list_title"] || "Tracked YouTube Channels"}`,
                        desc: emptyMsg,
                        color: 0xFF0000,
                        footer: { text: "Tracked Channels: 0/5" },
                        timestamp: interaction.createdTimestamp
                    }], undefined, "reply", true, interaction)
                }
                return interaction.reply({ content: emptyMsg, ephemeral: true })
            }

            const description = list.map((item, idx) => {
                const msgNote = item.custom_message ? `\n> *Message:* \`${item.custom_message}\`` : ""
                const lastVid = item.last_video_id ? `\n> *Last Video ID:* \`${item.last_video_id}\`` : ""
                return `**${idx + 1}. [${item.channel_name}](https://www.youtube.com/channel/${item.channel_id})**\n> Channel: <#${item.discord_channel_id}> • ID: \`${item.channel_id}\`${lastVid}${msgNote}`
            }).join("\n\n")

            if (typeof client.Embed === "function") {
                return client.Embed([{
                    title: `${emojis.youtube} ${ytLs["list_title"] || "Tracked YouTube Channels"} (${list.length}/5)`,
                    desc: description,
                    color: 0xFF0000,
                    footer: { text: "Maximum 5 channels per server" },
                    timestamp: interaction.createdTimestamp
                }], undefined, "reply", true, interaction)
            }

            return interaction.reply({ content: description, ephemeral: true })
        }
    }
}
