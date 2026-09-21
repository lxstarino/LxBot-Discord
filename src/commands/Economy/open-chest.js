const { SlashCommandBuilder } = require("discord.js")
const { chestDetails, fishDetails, oreDetails, toolDetails } = require("../../services/economyItems")
const { handlemsg } = require("../../utils/stringUtils")
const { getOrCreateProfile } = require("../../repositories/ProfileRepository")
const EconomyService = require("../../services/EconomyService")

module.exports = {
    guildOnly: true,
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName("open-chest")
        .setDescription("Open a treasure chest or crate from your inventory")
        .addStringOption(option =>
            option.setName("chest")
                .setDescription("The chest or crate you want to open")
                .setRequired(true)
                .addChoices(
                    { name: "Wooden Crate 🪵", value: "wooden_crate" },
                    { name: "Sunken Chest 🪸", value: "sunken_chest" },
                    { name: "Miner's Crate ⛏️", value: "miner_crate" },
                    { name: "Ancient Chest 👑", value: "ancient_chest" }
                )
        ),
    async execute(client, interaction) {
        const ls = client.getLanguage(interaction.guild?.id)
        const openLs = ls["cmds"]?.["open-chest"] || {}
        const profile = await getOrCreateProfile(client, interaction.user.id, interaction.guild.id)

        const chestKey = interaction.options.getString("chest")
        const details = chestDetails[chestKey]

        if (!EconomyService.hasItem(profile, "chests", chestKey, 1)) {
            const chestName = ls["cmds"]?.["chest_names"]?.[chestKey] || chestKey
            return client.errEmbed({
                type: "reply",
                ephemeral: true,
                desc: handlemsg(openLs["no_chest"] || "You do not have any **{chest}** {emoji} in your inventory!", {
                    chest: chestName,
                    emoji: details?.emoji || "📦"
                })
            }, interaction)
        }

        EconomyService.removeItem(profile, "chests", chestKey, 1)
        const remainingChests = profile.inventory?.chests?.[chestKey] || 0

        const minCoins = details.minCoins || 500
        const maxCoins = details.maxCoins || 2000
        const gainedCoins = Math.floor(Math.random() * (maxCoins - minCoins + 1)) + minCoins
        EconomyService.addWallet(profile, gainedCoins)

        const bonusWon = []
        if (Array.isArray(details.bonusItems)) {
            for (const bonus of details.bonusItems) {
                if (Math.random() <= bonus.chance) {
                    const count = bonus.count || 1
                    EconomyService.addItem(profile, bonus.type, bonus.key, count)

                    if (bonus.type === "fish") {
                        const itemEmoji = fishDetails[bonus.key]?.emoji || "🐟"
                        const itemName = ls["cmds"]?.["fish_names"]?.[bonus.key] || bonus.key
                        bonusWon.push(`• **+${count}x** ${itemEmoji} **${itemName}**`)
                    } else if (bonus.type === "ore") {
                        const itemEmoji = oreDetails[bonus.key]?.emoji || "🪨"
                        const itemName = ls["cmds"]?.["ore_names"]?.[bonus.key] || bonus.key
                        bonusWon.push(`• **+${count}x** ${itemEmoji} **${itemName}**`)
                    } else if (bonus.type === "tool") {
                        const itemEmoji = toolDetails[bonus.key]?.emoji || "🛠️"
                        const itemName = ls["cmds"]?.["tool_names"]?.[bonus.key] || bonus.key
                        bonusWon.push(`• **+${count}x** ${itemEmoji} **${itemName}**`)
                    }
                }
            }
        }

        const coin = client.appEmojis?.lux_coin || "<:lux_coin:1550631084855922698>"
        const walletEmoji = client.appEmojis?.lux_wallet || "<:lux_wallet:1550640829620559982>"
        const chestName = ls["cmds"]?.["chest_names"]?.[chestKey] || chestKey
        let desc = handlemsg(openLs["opened"] || `You opened **1x {chest}** {emoji}!\n\n${coin} **Coins obtained:** **+{coins} ${coin}**`, {
            chest: chestName,
            emoji: details.emoji,
            coins: gainedCoins.toLocaleString()
        })

        if (bonusWon.length > 0) {
            desc += `\n\n${openLs["bonus_loot"] || "🎁 **Bonus Loot:**"}\n${bonusWon.join("\n")}`
        }

        desc += `\n\n` + handlemsg(openLs["new_balance"] || "{walletEmoji} **New Balance:** **{balance} {coin}**", {
            walletEmoji,
            balance: profile.wallet.toLocaleString(),
            coin
        })

        const embedData = {
            title: openLs["title"] || "📦 Chest Opened!",
            desc: desc,
            timestamp: interaction.createdTimestamp
        }

        if (remainingChests > 0) {
            embedData.footer = { text: handlemsg(openLs["remaining"] || "{remaining}x {chest} remaining", { remaining: String(remainingChests), chest: chestName }) }
        }

        client.Embed([embedData], undefined, "reply", false, interaction)
    }
}
