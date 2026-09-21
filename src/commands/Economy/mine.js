const { SlashCommandBuilder } = require("discord.js")
const { oreList, toolDetails } = require("../../services/economyItems")
const { handlemsg } = require("../../utils/stringUtils")
const { getOrCreateProfile } = require("../../repositories/ProfileRepository")
const EconomyService = require("../../services/EconomyService")

module.exports = {
    guildOnly: true,
    data: new SlashCommandBuilder()
        .setName("mine")
        .setDescription("Go mining to harvest ores that can be sold for money")
        .addStringOption(option =>
            option.setName("tool")
                .setDescription("The pickaxe to use (optional, automatic priority if not set)")
                .setRequired(false)
                .addChoices(
                    { name: "Diamond Pickaxe", value: "diamond_pickaxe" },
                    { name: "Gold Pickaxe", value: "gold_pickaxe" },
                    { name: "Iron Pickaxe", value: "iron_pickaxe" }
                )
        ),
    async execute(client, interaction) {
        const ls = client.getLanguage(interaction.guild?.id)
        const profile = await getOrCreateProfile(client, interaction.user.id, interaction.guild.id)

        const today = new Date(profile.mine)
        const cooldown = new Date(today)
        cooldown.setMinutes(cooldown.getMinutes() + 10)

        if (profile.mine && new Date(interaction.createdTimestamp) >= today.valueOf() && new Date(interaction.createdTimestamp) <= cooldown.valueOf()) {
            return client.errEmbed({
                type: "reply",
                ephemeral: true,
                desc: `${handlemsg(ls["cmds"]["mine"]["cooldown"], { time: Math.round(Date.parse(cooldown) / 1000) })}`
            }, interaction)
        } else {
            const selectedToolKey = interaction.options.getString("tool")
            const tools = profile.inventory?.tools || {}

            if (selectedToolKey && (!tools[selectedToolKey] || tools[selectedToolKey] <= 0)) {
                return client.errEmbed({
                    type: "reply",
                    ephemeral: true,
                    desc: handlemsg(ls["cmds"]["mine"]["no_tool"] || "Du hast kein(e) **{tool}** in deinem Inventar!", {
                        tool: ls["cmds"]?.["tool_names"]?.[selectedToolKey] || selectedToolKey
                    })
                }, interaction)
            }

            let toolToUse = selectedToolKey
            if (!toolToUse) {
                if (tools.diamond_pickaxe > 0) toolToUse = "diamond_pickaxe"
                else if (tools.gold_pickaxe > 0) toolToUse = "gold_pickaxe"
                else if (tools.iron_pickaxe > 0) toolToUse = "iron_pickaxe"
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
                    emoji: details?.emoji || "⛏️",
                    left
                }
            }

            const roll = Math.random() * 100 + luckBonus
            let rarity = "common"
            if (roll > 95) rarity = "legendary"
            else if (roll > 80) rarity = "rare"
            else if (roll > 50 || minRarity === "uncommon") rarity = "uncommon"

            const options = oreList[rarity]
            const ore = options[Math.floor(Math.random() * options.length)]

            EconomyService.addItem(profile, "ore", ore.key, 1)

            let droppedChest = null
            const chestRoll = Math.random()
            if (chestRoll < 0.03) {
                droppedChest = "ancient_chest"
            } else if (chestRoll < 0.15) {
                droppedChest = "miner_crate"
            }

            if (droppedChest) {
                EconomyService.addItem(profile, "chests", droppedChest, 1)
            }

            profile.mine = new Date(interaction.createdTimestamp)

            const oreName = ls["cmds"]["ore_names"][ore.key] || ore.key
            const rarityName = ls["cmds"]["ore_rarities"][rarity]

            let desc = handlemsg(ls["cmds"]["mine"]["mined"], {
                ore: oreName,
                emoji: ore.emoji,
                rarity: rarityName,
                value: ore.value
            })

            if (usedTool) {
                desc += `\n\n${usedTool.emoji} **Werkzeug:** \`${usedTool.name}\` (${usedTool.left} Verwendungen übrig)`
            }

            if (droppedChest) {
                const chestEmoji = droppedChest === "ancient_chest" ? "👑" : "⛏️"
                const chestTitle = ls["cmds"]?.["chest_names"]?.[droppedChest] || droppedChest
                desc += `\n\n📦 **Glückwunsch!** Du hast eine(n) **${chestTitle}** ${chestEmoji} gefunden!`
            }

            const embed = client.tempEmbed()
                .setTitle(ls["cmds"]["mine"]["title"])
                .setDescription(desc)
                .setFooter({ text: interaction.user.tag })
                .setTimestamp(interaction.createdTimestamp)

            await client.Embed([embed], undefined, "reply", false, interaction)
        }
    }
}
