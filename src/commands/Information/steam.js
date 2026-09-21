const { SlashCommandBuilder } = require("discord.js")
const { emojis } = require("../../core/constants")
const { handlemsg } = require("../../utils/stringUtils")

module.exports = {
    guildOnly: false,
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName("steam")
        .setDescription("Look up a Steam user profile")
        .addStringOption(opt => opt
            .setName("user")
            .setDescription("Steam username, custom URL, or SteamID64")
            .setRequired(false)),
    async execute(client, interaction) {
        await interaction.deferReply().catch((err) => console.error("[steam] Failed to defer reply:", err.message))
        const ls = client.getLanguage(interaction.guild?.id)
        const steamLs = ls?.cmds?.steam || {}

        const key = process.env.STEAM_API_KEY
        const rawInput = interaction.options.getString("user") || "lxstarino"
        let id = rawInput.trim().replace(/.*steamcommunity\.com\/(id|profiles)\//, "").replace(/\/$/, "")

        try {
            if (!/^\d{17}$/.test(id)) {
                const v = await fetch(`https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=${key}&vanityurl=${encodeURIComponent(id)}`).then(r => r.json())
                id = v?.response?.steamid
            }
            if (!id) {
                return client.errEmbed({
                    type: "editReply",
                    title: "Steam",
                    desc: steamLs["not_found"]
                        ? handlemsg(steamLs["not_found"], { input: rawInput })
                        : `Could not find a Steam profile for \`${rawInput}\`.`
                }, interaction)
            }

            const api = (ep, p) => fetch(`https://api.steampowered.com/${ep}?key=${key}&${p}`).then(r => r.json()).catch(() => ({}))
            const [user, bans, lvl, games, recent, friends, badges, groups] = await Promise.all([
                api("ISteamUser/GetPlayerSummaries/v0002/", `steamids=${id}`).then(d => d.response?.players?.[0]),
                api("ISteamUser/GetPlayerBans/v1/", `steamids=${id}`).then(d => d.players?.[0]),
                api("IPlayerService/GetSteamLevel/v1/", `steamid=${id}`).then(d => d.response?.player_level),
                api("IPlayerService/GetOwnedGames/v0001/", `steamid=${id}`).then(d => d.response?.game_count),
                api("IPlayerService/GetRecentlyPlayedGames/v0001/", `steamid=${id}`).then(d => d.response?.games),
                api("ISteamUser/GetFriendList/v0001/", `steamid=${id}&relationship=friend`).then(d => d.friendslist?.friends),
                api("IPlayerService/GetBadges/v1/", `steamid=${id}`).then(d => d.response),
                api("ISteamUser/GetUserGroupList/v1/", `steamid=${id}`).then(d => d.response?.groups)
            ])

            if (!user) {
                return client.errEmbed({
                    type: "editReply",
                    title: "Steam",
                    desc: steamLs["not_found"]
                        ? handlemsg(steamLs["not_found"], { input: rawInput })
                        : `Could not find a Steam profile for \`${rawInput}\`.`
                }, interaction)
            }

            const data = { id, ...user, bans, lvl: lvl ?? "Private", games: games ?? "Private", recent, friends, badges, groups }

            const communityvisibilitystate = {
                1: steamLs["privacy_private"] || "Private",
                2: steamLs["privacy_friends"] || "Friends Only",
                3: steamLs["privacy_public"] || "Public",
                "undefined": steamLs["none"] || "Unknown"
            }

            const personastate = {
                1: "Online",
                2: "Busy",
                3: "Away",
                4: "Snooze",
                "undefined": steamLs["none"] || "Unknown"
            }

            const profilestate = {
                0: "Not Configured",
                1: "Configured",
                "undefined": steamLs["none"] || "Unknown"
            }

            const commentpermission = {
                1: "Anyone",
                2: "Profile Owner",
                "undefined": "Probably Private or Friends Only"
            }

            const statusText = data.gameextrainfo
                ? `Playing \`${data.gameextrainfo}\``
                : data.personastate == 0
                    ? `Offline | **Last Seen:** ${data.lastlogoff ? `<t:${data.lastlogoff}:D> (<t:${data.lastlogoff}:R>)` : (steamLs["none"] || "Unknown")}`
                    : (personastate[data.personastate] || (steamLs["none"] || "Unknown"))

            const steamEmoji = emojis?.steam || "<:steam:1550626219920195735>"

            const vacStatus = data.bans?.VACBanned
                ? (steamLs["vac_banned"] || "`VAC BANNED`")
                : (steamLs["vac_clean"] || "`CLEAN`")

            const tradeStatus = (data.bans?.EconomyBan && data.bans?.EconomyBan !== "none")
                ? (steamLs["trade_banned"] || "`TRADE BANNED`")
                : (steamLs["trade_clean"] || "`CLEAN`")

            return client.sendContainer({
                type: "editReply",
                sections: [
                    {
                        text: [
                            `## ${steamEmoji} **${data.personaname}**`,
                            `-# SteamID64: \`${data.id}\`${data.loccountrycode ? ` • Location: \`${data.loccountrycode}\`` : ""}`,
                            `> **Level:** \`${data.lvl}\` • **Games:** \`${data.games}\``,
                            `> **Status:** ${statusText}`
                        ],
                        accessory: {
                            type: "thumbnail",
                            url: data.avatarfull
                        }
                    },
                    {
                        type: "separator",
                        divider: true,
                        spacing: 1
                    },
                    {
                        text: [
                            `### **${steamLs["section_general"] || "💬 General"}**`,
                            `> 🏷️ **Name:** ${data.realname ? `\`${data.realname}\`` : (steamLs["none"] || "*Unknown*")}`,
                            `> 🌍 **Location:** ${data.loccountrycode ? `\`${data.loccountrycode}\`` : (steamLs["none"] || "*Unknown*")}`,
                            `> 📅 **Member Since:** ${data.timecreated ? `<t:${data.timecreated}:D> (<t:${data.timecreated}:R>)` : (steamLs["none"] || "*Unknown*")}`,
                            `> 👁️ **Visibility:** ${communityvisibilitystate[data.communityvisibilitystate]}`,
                            `> ⚙️ **State:** \`${profilestate[data.profilestate]}\``,
                            `> 💬 **Comments:** \`${commentpermission[data.commentpermission]}\``
                        ]
                    },
                    {
                        type: "separator",
                        divider: true,
                        spacing: 1
                    },
                    {
                        text: [
                            `### **${steamLs["section_security"] || "🛡️ Status & Security"}**`,
                            `> 🛡️ **VAC Status:** ${vacStatus}`,
                            `> 🎮 **Game Bans:** ${data.bans?.NumberOfGameBans ? `\`${data.bans?.NumberOfGameBans} Ban(s)\`` : (steamLs["vac_clean"] || "`CLEAN`")}`,
                            `> 👥 **Community Ban:** ${data.bans?.CommunityBanned ? (steamLs["vac_banned"] || "`BANNED`") : (steamLs["vac_clean"] || "`CLEAN`")}`,
                            `> 💰 **Trade Ban:** ${tradeStatus}`
                        ]
                    },
                    {
                        text: `-# ${steamEmoji} Steam Official Web API`,
                        accessory: {
                            type: "button",
                            label: steamLs["profile_btn"] || "Open Steam Profile",
                            emoji: steamEmoji,
                            url: data.profileurl,
                            style: 5
                        }
                    }
                ]
            }, interaction)
        } catch (err) {
            return client.errEmbed({
                type: "editReply",
                title: "Steam",
                desc: steamLs["err_fetch"] || ("Failed to fetch Steam profile: " + err.message)
            }, interaction)
        }
    }
}
