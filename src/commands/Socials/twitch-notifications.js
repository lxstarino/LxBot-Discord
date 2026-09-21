const { SlashCommandBuilder, PermissionsBitField, ChannelType } = require("discord.js")
const { handlemsg } = require("../../utils/stringUtils")
const { emojis } = require("../../core/constants")

let cachedToken = null
let tokenExpiresAt = 0

async function getTwitchUser(login) {
    const clientId = process.env.TWITCH_CLIENT_ID
    const clientSecret = process.env.TWITCH_CLIENT_SECRET
    if (!clientId || !clientSecret) return { error: "NO_CREDENTIALS" }

    if (!cachedToken || Date.now() >= tokenExpiresAt) {
        try {
            const tokenRes = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`, {
                method: "POST",
                signal: AbortSignal.timeout(10000)
            })
            if (!tokenRes.ok) return { error: "AUTH_FAILED" }
            const tokenData = await tokenRes.json()
            if (!tokenData.access_token) return { error: "AUTH_FAILED" }
            cachedToken = tokenData.access_token
            tokenExpiresAt = Date.now() + Math.max(0, (tokenData.expires_in - 300) * 1000)
        } catch {
            return { error: "TOKEN_ERROR" }
        }
    }

    try {
        const res = await fetch(`https://api.twitch.tv/helix/users?login=${encodeURIComponent(login)}`, {
            headers: {
                "Client-ID": clientId,
                "Authorization": `Bearer ${cachedToken}`
            },
            signal: AbortSignal.timeout(10000)
        })

        if (!res.ok) return { error: "FETCH_FAILED" }
        const data = await res.json()
        if (Array.isArray(data.data) && data.data.length > 0) {
            return { user: data.data[0] }
        }
        return { notFound: true }
    } catch {
        return { error: "REQUEST_ERROR" }
    }
}

module.exports = {
    guildOnly: true,
    data: new SlashCommandBuilder()
        .setName("twitch-notifications")
        .setDescription("Manage Twitch livestream notifications for your server")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .addSubcommand(sub =>
            sub.setName("add")
                .setDescription("Add a Twitch streamer to track")
                .addStringOption(opt =>
                    opt.setName("streamer")
                        .setDescription("Twitch username or channel URL")
                        .setRequired(true)
                )
                .addChannelOption(opt =>
                    opt.setName("channel")
                        .setDescription("Channel where live notifications will be posted")
                        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
                        .setRequired(true)
                )
                .addStringOption(opt =>
                    opt.setName("message")
                        .setDescription("Custom message or role ping (e.g. @everyone {streamer} is live!)")
                        .setRequired(false)
                )
        )
        .addSubcommand(sub =>
            sub.setName("remove")
                .setDescription("Remove a tracked Twitch streamer")
                .addStringOption(opt =>
                    opt.setName("streamer")
                        .setDescription("Twitch username to stop tracking")
                        .setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub.setName("list")
                .setDescription("List all tracked Twitch streamers on this server")
        ),

    async execute(client, interaction) {
        const subcommand = interaction.options.getSubcommand()
        const ls = typeof client.getLanguage === "function" ? client.getLanguage(interaction.guild?.id) : null
        const twitchLs = ls?.cmds?.["twitch-notifications"] || {}
        const db = client.db

        if (!db) {
            return interaction.reply({ content: "❌ Database not initialized.", ephemeral: true })
        }

        if (subcommand === "add") {
            let streamerInput = interaction.options.getString("streamer").trim()
            const channel = interaction.options.getChannel("channel")
            const customMessage = interaction.options.getString("message")

            streamerInput = streamerInput.replace(/^(https?:\/\/)?(www\.)?twitch\.tv\//i, "").replace(/\/+$/, "").trim().toLowerCase()

            if (!/^[a-zA-Z0-9_]{3,25}$/.test(streamerInput)) {
                return client.errEmbed ? client.errEmbed({
                    type: "reply",
                    ephemeral: true,
                    desc: twitchLs["err_invalid_name"] || "Please enter a valid Twitch username (3-25 characters, letters, numbers, and underscores only)."
                }, interaction) : interaction.reply({
                    content: "Please enter a valid Twitch username (3-25 characters, letters, numbers, and underscores only).",
                    ephemeral: true
                })
            }

            const currentList = db.getTwitchNotifications(interaction.guild.id)
            const alreadyExists = currentList.some(t => t.streamer_login.toLowerCase() === streamerInput)
            if (!alreadyExists && currentList.length >= 3) {
                return client.errEmbed ? client.errEmbed({
                    type: "reply",
                    ephemeral: true,
                    desc: twitchLs["err_limit"] || "This server has reached the maximum limit of **3** tracked Twitch streamers."
                }, interaction) : interaction.reply({
                    content: "This server has reached the maximum limit of 3 tracked Twitch streamers.",
                    ephemeral: true
                })
            }

            const botMember = interaction.guild.members.me
            const perms = channel.permissionsFor(botMember)
            if (!perms || !perms.has(PermissionsBitField.Flags.SendMessages) || !perms.has(PermissionsBitField.Flags.EmbedLinks)) {
                return client.errEmbed ? client.errEmbed({
                    type: "reply",
                    ephemeral: true,
                    desc: handlemsg(twitchLs["err_perms"] || "I need **Send Messages** and **Embed Links** permissions in <#{channel}>!", { channel: channel.id })
                }, interaction) : interaction.reply({
                    content: `I need Send Messages and Embed Links permissions in <#${channel.id}>!`,
                    ephemeral: true
                })
            }

            const twitchCheck = await getTwitchUser(streamerInput)
            if (twitchCheck.notFound) {
                return client.errEmbed ? client.errEmbed({
                    type: "reply",
                    ephemeral: true,
                    desc: handlemsg(twitchLs["err_not_found"] || "The Twitch channel **{streamer}** does not exist on Twitch.", { streamer: streamerInput })
                }, interaction) : interaction.reply({
                    content: `The Twitch channel **${streamerInput}** does not exist on Twitch.`,
                    ephemeral: true
                })
            }

            const twitchUser = twitchCheck.user
            const verifiedLogin = twitchUser ? twitchUser.login.toLowerCase() : streamerInput
            const displayName = twitchUser ? twitchUser.display_name : streamerInput

            db.addTwitchNotification(interaction.guild.id, verifiedLogin, channel.id, customMessage)

            const updatedList = db.getTwitchNotifications(interaction.guild.id)

            const embedData = {
                title: `${emojis.twitch} ${displayName}`,
                url: `https://twitch.tv/${verifiedLogin}`,
                desc: handlemsg(
                    twitchLs["add_success"] || "Successfully configured live notifications for **{streamer}** in <#{channel}>.",
                    { streamer: displayName, channel: channel.id }
                ),
                thumbnail: twitchUser?.profile_image_url || undefined,
                color: 0x9146FF,
                fields: [
                    {
                        name: "Notification Channel",
                        value: `<#${channel.id}>`,
                        inline: true
                    },
                    {
                        name: "Status",
                        value: "Watching for live streams",
                        inline: true
                    },
                    ...(customMessage ? [{
                        name: "Custom Message",
                        value: customMessage,
                        inline: false
                    }] : [])
                ],
                footer: {
                    text: `Tracked Streamers: ${updatedList.length}/3`
                },
                timestamp: interaction.createdTimestamp
            }

            if (typeof client.Embed === "function") {
                return client.Embed([embedData], undefined, "reply", true, interaction)
            }

            return interaction.reply({
                content: `Successfully configured live notifications for **${displayName}** in <#${channel.id}>.`,
                ephemeral: true
            })

        } else if (subcommand === "remove") {
            let streamerInput = interaction.options.getString("streamer").trim().toLowerCase()
            streamerInput = streamerInput.replace(/^(https?:\/\/)?(www\.)?twitch\.tv\//i, "").replace(/\/+$/, "").trim()

            const result = db.removeTwitchNotification(interaction.guild.id, streamerInput)

            if (result.changes === 0) {
                return client.errEmbed ? client.errEmbed({
                    type: "reply",
                    ephemeral: true,
                    desc: handlemsg(twitchLs["not_tracked"] || "**{streamer}** is not currently being tracked on this server.", { streamer: streamerInput })
                }, interaction) : interaction.reply({
                    content: `**${streamerInput}** is not currently being tracked on this server.`,
                    ephemeral: true
                })
            }

            const remainingList = db.getTwitchNotifications(interaction.guild.id)
            const embedData = {
                title: `${emojis.twitch} ${twitchLs["title"] || "Twitch Notifications"}`,
                desc: handlemsg(
                    twitchLs["remove_success"] || "Successfully removed **{streamer}** from Twitch notifications.",
                    { streamer: streamerInput }
                ),
                color: 0x9146FF,
                footer: {
                    text: `Tracked Streamers: ${remainingList.length}/3`
                },
                timestamp: interaction.createdTimestamp
            }

            if (typeof client.Embed === "function") {
                return client.Embed([embedData], undefined, "reply", true, interaction)
            }

            return interaction.reply({
                content: `Successfully removed **${streamerInput}** from Twitch notifications.`,
                ephemeral: true
            })

        } else if (subcommand === "list") {
            const list = db.getTwitchNotifications(interaction.guild.id)

            if (!list || list.length === 0) {
                const emptyMsg = twitchLs["list_empty"] || "There are currently no Twitch streamers being tracked on this server."
                if (typeof client.Embed === "function") {
                    return client.Embed([{
                        title: `${emojis.twitch} ${twitchLs["list_title"] || "Tracked Twitch Streamers"}`,
                        desc: emptyMsg,
                        color: 0x9146FF,
                        footer: { text: "Tracked Streamers: 0/3" },
                        timestamp: interaction.createdTimestamp
                    }], undefined, "reply", true, interaction)
                }
                return interaction.reply({ content: emptyMsg, ephemeral: true })
            }

            const description = list.map((item, idx) => {
                const status = item.is_live ? "🔴 **LIVE**" : "⚫ Offline"
                const msgNote = item.custom_message ? `\n> *Message:* \`${item.custom_message}\`` : ""
                return `**${idx + 1}. [${item.streamer_login}](https://twitch.tv/${item.streamer_login})** — ${status}\n> Channel: <#${item.channel_id}>${msgNote}`
            }).join("\n\n")

            if (typeof client.Embed === "function") {
                return client.Embed([{
                    title: `${emojis.twitch} ${twitchLs["list_title"] || "Tracked Twitch Streamers"} (${list.length}/3)`,
                    desc: description,
                    color: 0x9146FF,
                    footer: { text: "Maximum 3 streamers per server" },
                    timestamp: interaction.createdTimestamp
                }], undefined, "reply", true, interaction)
            }

            return interaction.reply({ content: description, ephemeral: true })
        }
    }
}
