const { SlashCommandBuilder } = require("discord.js")
const { huntList, toolDetails } = require("../../services/economyItems")
const { handlemsg } = require("../../utils/stringUtils")
const { getOrCreateProfile } = require("../../repositories/ProfileRepository")
const EconomyService = require("../../services/EconomyService")

module.exports = {
    guildOnly: true,
    data: new SlashCommandBuilder()
        .setName("hunt")
        .setDescription("Go hunt to catch an Animal")
        .addStringOption(option =>
            option.setName("tool")
                .setDescription("The sword to use (optional, automatic priority if not set)")
                .setRequired(false)
                .addChoices(
                    { name: "Iron Sword", value: "iron_sword" },
                    { name: "Gold Sword", value: "gold_sword" },
                    { name: "Diamond Sword", value: "diamond_sword" }
                )
        ),
    async execute(client, interaction) {
        const ls = client.getLanguage(interaction.guild?.id)
        const profile = await getOrCreateProfile(client, interaction.user.id, interaction.guild.id)

        const today = new Date(profile.hunt)
        const nextHunt = new Date(today)
        nextHunt.setMinutes(nextHunt.getMinutes() + 10)

        if (profile.hunt && new Date(interaction.createdTimestamp) >= today.valueOf() && new Date(interaction.createdTimestamp) <= nextHunt.valueOf()) {
            client.errEmbed({
                type: "reply",
                ephemeral: true,
                desc: `${handlemsg(ls["cmds"]["hunt"]["cooldown"], { time: Math.round(Date.parse(nextHunt) / 1000) })}`
            }, interaction)
        } else {
            const selectedToolKey = interaction.options.getString("tool")
            const tools = profile.inventory?.tools || {}

            if (selectedToolKey && (!tools[selectedToolKey] || tools[selectedToolKey] <= 0)) {
                return client.errEmbed({
                    type: "reply",
                    ephemeral: true,
                    desc: handlemsg(ls["cmds"]["hunt"]["no_tool"] || "Du hast kein(e) **{tool}** in deinem Inventar!", {
                        tool: ls["cmds"]?.["tool_names"]?.[selectedToolKey] || selectedToolKey
                    })
                }, interaction)
            }

            let toolToUse = selectedToolKey
            if (!toolToUse) {
                if (tools.diamond_sword > 0) toolToUse = "diamond_sword"
                else if (tools.gold_sword > 0) toolToUse = "gold_sword"
                else if (tools.iron_sword > 0) toolToUse = "iron_sword"
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
                    emoji: details?.emoji || "⚔️",
                    left
                }
            }

            const roll = Math.random() * 100 + luckBonus
            let rarity = "common"
            if (roll > 95) rarity = "legendary"
            else if (roll > 80) rarity = "rare"
            else if (roll > 50 || minRarity === "uncommon") rarity = "uncommon"

            const options = huntList[rarity]
            const hunt = options[Math.floor(Math.random() * options.length)]

            EconomyService.addItem(profile, "hunt", hunt.key, 1)

            let droppedChest = null
            const chestRoll = Math.random()
            if (chestRoll < 0.15) {
                droppedChest = "wooden_crate"
            }

            if (droppedChest) {
                EconomyService.addItem(profile, "chests", droppedChest, 1)
            }

            profile.hunt = new Date(interaction.createdTimestamp)

            const animalName = ls["cmds"]?.["hunt_names"]?.[hunt.key] || hunt.key
            const rarityName = ls["cmds"]?.["hunt_rarities"]?.[rarity] || rarity

            let desc = handlemsg(ls["cmds"]["hunt"]["hunted"], {
                animal: animalName,
                emoji: hunt.emoji,
                rarity: rarityName,
                value: hunt.value
            })

            if (usedTool) {
                desc += `\n\n${usedTool.emoji} **Werkzeug:** \`${usedTool.name}\` (${usedTool.left} Verwendungen übrig)`
            }

            if (droppedChest) {
                const chestTitle = ls["cmds"]?.["chest_names"]?.[droppedChest] || droppedChest
                desc += `\n\n📦 **Glückwunsch!** Du hast eine(n) **${chestTitle}** 🪵 gefunden!`
            }

            const embed = client.tempEmbed()
                .setTitle(ls["cmds"]["hunt"]["title"])
                .setDescription(desc)
                .setFooter({ text: interaction.user.tag })
                .setTimestamp(interaction.createdTimestamp)

            await client.Embed([embed], undefined, "reply", false, interaction)
        }
    }
}
