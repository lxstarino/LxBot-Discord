const { SlashCommandBuilder } = require("discord.js")
const { fishList, toolDetails } = require("../../services/economyItems")
const { handlemsg } = require("../../utils/stringUtils")
const { getOrCreateProfile } = require("../../repositories/ProfileRepository")
const EconomyService = require("../../services/EconomyService")

module.exports = {
    guildOnly: true,
    data: new SlashCommandBuilder()
        .setName("fish")
        .setDescription("Go fishing to catch fish that can be sold for money")
        .addStringOption(option =>
            option.setName("tool")
                .setDescription("The bait to use (optional, automatic priority if not set)")
                .setRequired(false)
                .addChoices(
                    { name: "Golden Bait 🪱", value: "golden_bait" },
                    { name: "Better Bait 🪝", value: "better_bait" }
                )
        ),
    async execute(client, interaction) {
        const ls = client.getLanguage(interaction.guild?.id)
        const profile = await getOrCreateProfile(client, interaction.user.id, interaction.guild.id)

        const today = new Date(profile.fish)
        const nextFish = new Date(today)
        nextFish.setMinutes(nextFish.getMinutes() + 10)

        if (profile.fish && new Date(interaction.createdTimestamp) >= today.valueOf() && new Date(interaction.createdTimestamp) <= nextFish.valueOf()) {
            client.errEmbed({
                type: "reply",
                ephemeral: true,
                desc: `${handlemsg(ls["cmds"]["fish"]["cooldown"], { time: Math.round(Date.parse(nextFish) / 1000) })}`
            }, interaction)
        } else {
            const selectedToolKey = interaction.options.getString("tool")
            const tools = profile.inventory?.tools || {}

            if (selectedToolKey && (!tools[selectedToolKey] || tools[selectedToolKey] <= 0)) {
                return client.errEmbed({
                    type: "reply",
                    ephemeral: true,
                    desc: handlemsg(ls["cmds"]["fish"]["no_tool"] || "Du hast kein(e) **{tool}** in deinem Inventar!", {
                        tool: ls["cmds"]?.["tool_names"]?.[selectedToolKey] || selectedToolKey
                    })
                }, interaction)
            }

            let toolToUse = selectedToolKey
            if (!toolToUse) {
                if (tools.golden_bait > 0) toolToUse = "golden_bait"
                else if (tools.better_bait > 0) toolToUse = "better_bait"
            }

            let luckBonus = 0
            let minRarity = "common"
            let usedTool = null

            if (toolToUse && tools[toolToUse] > 0) {
                EconomyService.removeItem(profile, "tools", toolToUse, 1)
                const left = profile.inventory?.tools?.[toolToUse] || 0

                const details = toolDetails[toolToUse]
                luckBonus = details?.perks?.luckBonus || 0
                minRarity = details?.perks?.minRarity || "common"
                usedTool = {
                    name: ls["cmds"]?.["tool_names"]?.[toolToUse] || toolToUse,
                    emoji: details?.emoji || "🪱",
                    left
                }
            }

            const roll = Math.random() * 100 + luckBonus
            let rarity = "common"
            if (roll > 95) rarity = "legendary"
            else if (roll > 80) rarity = "rare"
            else if (roll > 50 || minRarity === "uncommon") rarity = "uncommon"

            const options = fishList[rarity]
            const fish = options[Math.floor(Math.random() * options.length)]

            EconomyService.addItem(profile, "fish", fish.key, 1)

            let droppedChest = null
            const chestRoll = Math.random()
            if (chestRoll < 0.03) {
                droppedChest = "sunken_chest"
            } else if (chestRoll < 0.15) {
                droppedChest = "wooden_crate"
            }

            if (droppedChest) {
                EconomyService.addItem(profile, "chests", droppedChest, 1)
            }

            profile.fish = new Date(interaction.createdTimestamp)

            const fishName = ls["cmds"]["fish_names"][fish.key]
            const rarityName = ls["cmds"]["fish_rarities"][rarity]

            let desc = handlemsg(ls["cmds"]["fish"]["caught"], {
                fish: fishName,
                emoji: fish.emoji,
                rarity: rarityName,
                value: fish.value
            })

            if (droppedChest) {
                const chestName = ls["cmds"]?.["chest_names"]?.[droppedChest] || droppedChest
                const chestEmoji = droppedChest === "sunken_chest" ? "🗝️" : "🪵"
                const chestMsg = ls["cmds"]["fish"]["chest_found"] || "\n\n✨ **Bonus-Fund:** Du hast zusätzlich eine(n) **{chest}** {emoji} geborgen! *(Öffne sie mit `/open`)*"
                desc += handlemsg(chestMsg, { chest: chestName, emoji: chestEmoji })
            }

            const embedData = {
                title: `${ls["cmds"]["fish"]["title"]}`,
                desc: desc,
                timestamp: interaction.createdTimestamp
            }

            if (usedTool) {
                const status = usedTool.left > 0 ? `${usedTool.left} uses left` : "Used up"
                embedData.footer = { text: `${usedTool.emoji} ${usedTool.name} (+${luckBonus}% Luck) • ${status}` }
            }

            client.Embed([embedData], undefined, "reply", false, interaction)
        }
    }
}
