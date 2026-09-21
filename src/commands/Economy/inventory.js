const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js")
const { fishDetails, oreDetails, huntDetails, toolDetails, chestDetails } = require("../../services/economyItems")
const { handlemsg } = require("../../utils/stringUtils")
const { getOrCreateProfile } = require("../../repositories/ProfileRepository")

module.exports = {
    guildOnly: true,
    data: new SlashCommandBuilder()
        .setName("inventory")
        .setDescription("View your or another user's fish, ore, and tool inventory")
        .addUserOption(option => option
            .setName("user")
            .setDescription("The user to check the inventory of")
            .setRequired(false)
        ),
    async execute(client, interaction) {
        const ls = client.getLanguage(interaction.guild?.id)
        const targetUser = interaction.options.getUser("user") || interaction.user
        const isSelf = targetUser.id === interaction.user.id

        const profile = await getOrCreateProfile(client, targetUser.id, interaction.guild.id)
        const coin = client.appEmojis?.lux_coin || "<:lux_coin:1550631084855922698>"

        const fishInventory = profile.inventory?.fish || {}
        const oreInventory = profile.inventory?.ore || {}
        const toolInventory = profile.inventory?.tools || {}
        const chestInventory = profile.inventory?.chests || {}
        const huntInventory = profile.inventory?.hunt || {}

        let totalFishValue = 0
        let totalFishCount = 0
        let totalOreValue = 0
        let totalOreCount = 0
        let totalHuntValue = 0
        let totalHuntCount = 0
        let totalToolCount = 0
        let totalChestCount = 0

        const fishItemsList = []
        const oreItemsList = []
        const huntItemsList = []
        const toolItemsList = []
        const chestItemsList = []

        const invLs = ls["cmds"]?.["inventory"] || {}
        const raritiesLs = ls["cmds"]?.["rarities"] || ls["cmds"]?.["fish_rarities"] || {}

        Object.entries(fishInventory).forEach(([fishKey, count]) => {
            if (count > 0 && fishDetails[fishKey]) {
                const fishName = ls["cmds"]["fish_names"]?.[fishKey] || fishKey
                const details = fishDetails[fishKey]
                const itemValue = details.value * count
                totalFishValue += itemValue
                totalFishCount += count
                const valText = handlemsg(invLs["item_value"] || `(Value: {value} ${coin})`, { value: itemValue.toLocaleString() })
                fishItemsList.push(`• **${count}x** ${details.emoji} **${fishName}** ${valText}`)
            }
        })

        Object.entries(oreInventory).forEach(([oreKey, count]) => {
            if (count > 0 && oreDetails[oreKey]) {
                const oreName = ls["cmds"]["ore_names"]?.[oreKey] || oreKey
                const details = oreDetails[oreKey]
                const itemValue = details.value * count
                totalOreValue += itemValue
                totalOreCount += count
                const valText = handlemsg(invLs["item_value"] || `(Value: {value} ${coin})`, { value: itemValue.toLocaleString() })
                oreItemsList.push(`• **${count}x** ${details.emoji} **${oreName}** ${valText}`)
            }
        })

        Object.entries(huntInventory).forEach(([huntKey, count]) => {
            if (count > 0 && huntDetails[huntKey]) {
                const huntName = ls["cmds"]["hunt_names"]?.[huntKey] || huntKey
                const details = huntDetails[huntKey]
                const itemValue = details.value * count
                totalHuntValue += itemValue
                totalHuntCount += count
                const valText = handlemsg(invLs["item_value"] || `(Value: {value} ${coin})`, { value: itemValue.toLocaleString() })
                huntItemsList.push(`• **${count}x** ${details.emoji} **${huntName}** ${valText}`)
            }
        })

        Object.entries(toolInventory).forEach(([toolKey, count]) => {
            if (count > 0 && toolDetails[toolKey]) {
                const toolName = ls["cmds"]["tool_names"]?.[toolKey] || toolKey
                const details = toolDetails[toolKey]
                const itemCount = Math.ceil(count / details.durability)
                totalToolCount += itemCount
                const luckLabel = invLs["tool_luck"] || "Luck Bonus"
                const rarityLabel = invLs["tool_min_rarity"] || "Min Rarity"
                const minRarityName = details.perks?.minRarity ? (raritiesLs[details.perks.minRarity] || details.perks.minRarity) : (invLs["none"] || "None")
                const maxUses = itemCount * details.durability
                toolItemsList.push(`• ${details.emoji} **${toolName}**: \`${itemCount}x\` (${count}/${maxUses})\n └ ${luckLabel}: ${details.perks?.luckBonus}% • ${rarityLabel}: ${minRarityName}`)
            }
        })

        Object.entries(chestInventory).forEach(([chestKey, count]) => {
            if (count > 0 && chestDetails[chestKey]) {
                const chestName = ls["cmds"]?.["chest_names"]?.[chestKey] || chestKey
                const details = chestDetails[chestKey]
                totalChestCount += count
                const openTip = handlemsg(invLs["open_tip"] || "*(Open with `/open-chest chest:{chest}`)*", { chest: chestKey })
                chestItemsList.push(`• **${count}x** ${details.emoji} **${chestName}** ${openTip}`)
            }
        })

        const totalValue = totalFishValue + totalOreValue + totalHuntValue

        if (fishItemsList.length === 0 && oreItemsList.length === 0 && huntItemsList.length === 0 && toolItemsList.length === 0 && chestItemsList.length === 0) {
            const desc = isSelf
                ? ls["cmds"]["inventory"]["empty_self"]
                : handlemsg(ls["cmds"]["inventory"]["empty_other"], { user: targetUser.id })

            return client.Embed([{
                title: handlemsg(ls["cmds"]["inventory"]["title"], { user: targetUser.username }),
                desc: desc,
                timestamp: interaction.createdTimestamp
            }], undefined, "reply", false, interaction)
        }

        let currentTab = "all"

        const getComponents = (disabled = false) => {
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("inv-all")
                    .setLabel(invLs["tab_overview"] || "Overview")
                    .setEmoji("📋")
                    .setStyle(currentTab === "all" ? ButtonStyle.Primary : ButtonStyle.Secondary)
                    .setDisabled(disabled),
                new ButtonBuilder()
                    .setCustomId("inv-fish")
                    .setLabel(handlemsg(invLs["tab_fish"] || "Fish ({count})", { count: totalFishCount }))
                    .setEmoji("🎣")
                    .setStyle(currentTab === "fish" ? ButtonStyle.Primary : ButtonStyle.Secondary)
                    .setDisabled(disabled || fishItemsList.length === 0),
                new ButtonBuilder()
                    .setCustomId("inv-ore")
                    .setLabel(handlemsg(invLs["tab_ores"] || "Ores ({count})", { count: totalOreCount }))
                    .setEmoji("⛏️")
                    .setStyle(currentTab === "ore" ? ButtonStyle.Primary : ButtonStyle.Secondary)
                    .setDisabled(disabled || oreItemsList.length === 0),
                new ButtonBuilder()
                    .setCustomId("inv-hunt")
                    .setLabel(handlemsg(invLs["tab_hunt"] || "Hunt ({count})", { count: totalHuntCount }))
                    .setEmoji("🏹")
                    .setStyle(currentTab === "hunt" ? ButtonStyle.Primary : ButtonStyle.Secondary)
                    .setDisabled(disabled || huntItemsList.length === 0),
                new ButtonBuilder()
                    .setCustomId("inv-tools")
                    .setLabel(handlemsg(invLs["tab_tools"] || "Tools ({count})", { count: totalToolCount }))
                    .setEmoji("🛠️")
                    .setStyle(currentTab === "tools" ? ButtonStyle.Primary : ButtonStyle.Secondary)
                    .setDisabled(disabled || toolItemsList.length === 0),
            )
            const row2 = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("inv-chests")
                    .setLabel(handlemsg(invLs["tab_chests"] || "Chests ({count})", { count: totalChestCount }))
                    .setEmoji("📦")
                    .setStyle(currentTab === "chests" ? ButtonStyle.Primary : ButtonStyle.Secondary)
                    .setDisabled(disabled || chestItemsList.length === 0)
            )

            return [row, row2]
        }

        const getEmbedDesc = () => {
            if (currentTab === "fish") {
                const header = handlemsg(invLs["fish_header"] || "### 🎣 Fish Inventory ({count} total)\n\n", { count: totalFishCount })
                const subtotal = handlemsg(invLs["subtotal"] || `💵 **Subtotal Value:** **{value} ${coin}**`, { value: totalFishValue.toLocaleString() })
                return header + fishItemsList.join("\n") + "\n\n" + subtotal
            }
            if (currentTab === "ore") {
                const header = handlemsg(invLs["ore_header"] || "### ⛏️ Ores Inventory ({count} total)\n\n", { count: totalOreCount })
                const subtotal = handlemsg(invLs["subtotal"] || `💵 **Subtotal Value:** **{value} ${coin}**`, { value: totalOreValue.toLocaleString() })
                return header + oreItemsList.join("\n") + "\n\n" + subtotal
            }
            if (currentTab === "hunt") {
                const header = handlemsg(invLs["hunt_header"] || "### 🦃 Hunt Inventory ({count} total)\n\n", { count: totalHuntCount })
                const subtotal = handlemsg(invLs["subtotal"] || `💵 **Subtotal Value:** **{value} ${coin}**`, { value: totalHuntValue.toLocaleString() })
                return header + huntItemsList.join("\n") + "\n\n" + subtotal
            }
            if (currentTab === "tools") {
                const header = handlemsg(invLs["tools_header"] || "### 🛠️ Tools & Baits ({count} total)\n\n", { count: totalToolCount })
                return header + toolItemsList.join("\n")
            }
            if (currentTab === "chests") {
                const header = handlemsg(invLs["chests_header"] || "### 📦 Chests & Crates ({count} total)\n\n", { count: totalChestCount })
                const tip = invLs["chests_tip"] || "\n\n💡 *Use `/open-chest` to open your chests and uncover treasures!*"
                return header + chestItemsList.join("\n") + tip
            }

            let desc = handlemsg(invLs["overview_total"] || `💵 **Total Estimated Value:** **{value} ${coin}**\n\n`, { value: totalValue.toLocaleString() })
            desc += handlemsg(invLs["overview_fish"] || `> 🎣 **Fish:** \`{count} items\` (Value: **{value} ${coin}**)\n`, { count: totalFishCount, value: totalFishValue.toLocaleString() })
            desc += handlemsg(invLs["overview_ores"] || `> ⛏️ **Ores:** \`{count} items\` (Value: **{value} ${coin}**)\n`, { count: totalOreCount, value: totalOreValue.toLocaleString() })
            desc += handlemsg(invLs["overview_hunt"] || `> 🦃 **Hunt:** \`{count} items\` (Value: **{value} ${coin}**)\n`, { count: totalHuntCount, value: totalHuntValue.toLocaleString() })
            desc += handlemsg(invLs["overview_tools"] || "> 🛠️ **Tools:** `{count} items`\n", { count: totalToolCount })
            if (totalChestCount > 0) {
                desc += handlemsg(invLs["overview_chests"] || "> 📦 **Chests:** `{count} items`\n", { count: totalChestCount })
            }
            desc += invLs["overview_footer"] || "\n*Use the buttons below to browse each category in detail!*"
            return desc
        }

        const replyMsg = await client.Embed([{
            title: handlemsg(ls["cmds"]["inventory"]["title"], { user: targetUser.username }),
            desc: getEmbedDesc(),
            timestamp: interaction.createdTimestamp
        }], getComponents(), "reply", false, interaction)

        if (!replyMsg) return

        const collector = replyMsg.createMessageComponentCollector({
            filter: i => i.user.id === interaction.user.id,
            time: 120000
        })

        collector.on("collect", async (i) => {
            if (i.customId === "inv-all") currentTab = "all"
            else if (i.customId === "inv-fish") currentTab = "fish"
            else if (i.customId === "inv-ore") currentTab = "ore"
            else if (i.customId === "inv-hunt") currentTab = "hunt"
            else if (i.customId === "inv-tools") currentTab = "tools"
            else if (i.customId === "inv-chests") currentTab = "chests"

            await client.Embed([{
                title: handlemsg(ls["cmds"]["inventory"]["title"], { user: targetUser.username }),
                desc: getEmbedDesc(),
                timestamp: interaction.createdTimestamp
            }], getComponents(), "update", false, i)
        })

        collector.on("end", () => {
            client.Embed([{
                title: handlemsg(ls["cmds"]["inventory"]["title"], { user: targetUser.username }),
                desc: getEmbedDesc(),
                timestamp: interaction.createdTimestamp
            }], getComponents(true), "editReply", false, interaction).catch((err) => console.error("[inventory] Failed to edit reply on collector end:", err.message))
        })
    }
}
