const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require("discord.js")
const { toolList, fishDetails, oreDetails } = require("../../services/economyItems")
const { getOrCreateProfile } = require("../../repositories/ProfileRepository")
const EconomyService = require("../../services/EconomyService")

module.exports = {
    guildOnly: true,
    data: new SlashCommandBuilder()
        .setName("craft")
        .setDescription("Craft tools and baits"),
    async execute(client, interaction) {
        const ls = client.getLanguage(interaction.guild?.id)
        const profile = await getOrCreateProfile(client, interaction.user.id, interaction.guild.id)

        profile.inventory = profile.inventory || {}
        profile.inventory.fish = profile.inventory.fish || {}
        profile.inventory.ore = profile.inventory.ore || {}
        profile.inventory.tools = profile.inventory.tools || {}

        let selected = toolList[0]

        const getView = (disabled = false) => {
            const toolName = ls["cmds"]?.["tool_names"]?.[selected.key] || selected.key
            let canCraft = true

            const requirements = Object.entries(selected.recipe).map(([key, count]) => {
                const item = fishDetails[key] || oreDetails[key] || { emoji: "📦" }
                const itemName = ls["cmds"]?.[fishDetails[key] ? "fish_names" : "ore_names"]?.[key] || key
                const owned = (profile.inventory.fish[key] || profile.inventory.ore[key] || 0)

                if (owned < count) canCraft = false
                return `> ${owned >= count ? "✅" : "❌"} ${item.emoji} **${itemName}**: \`${owned}/${count}\``
            }).join("\n")

            const craftLs = ls["cmds"]["craft"]
            const raritiesLs = ls["cmds"]?.["rarities"] || ls["cmds"]?.["fish_rarities"] || {}

            const perkParts = []
            if (selected.perks?.luckBonus) perkParts.push(`+${selected.perks.luckBonus}% Luck`)
            if (selected.perks?.minRarity) perkParts.push(raritiesLs[selected.perks.minRarity] || selected.perks.minRarity)
            const perks = perkParts.length > 0 ? perkParts.join(" • ") : (craftLs["none"] || "None")

            const ownedUses = profile.inventory.tools[selected.key] || 0
            const ownedCount = Math.ceil(ownedUses / selected.durability)

            const embed = {
                title: craftLs["title"],
                desc: `### ${selected.emoji} **${toolName}**\n` +
                    `> 🔨 ${craftLs["durability"] || "Durability"}: **${selected.durability} ${craftLs["uses"] || "uses"}**\n` +
                    `> 🌟 ${craftLs["perks"] || "Perks"}: **${perks}**\n` +
                    `> 🎒 ${craftLs["in_inventory"] || "Owned"}: \`${ownedCount}x\` (${ownedUses} ${craftLs["uses"] || "uses"})\n\n` +
                    `**${craftLs["required_materials"] || "Required Materials"}:**\n${requirements}\n\n` +
                    (canCraft ? craftLs["ready_to_craft"] : craftLs["missing_materials"]),
                timestamp: interaction.createdTimestamp
            }

            const menu = new StringSelectMenuBuilder()
                .setCustomId("craft-select")
                .setPlaceholder(ls["cmds"]["craft"]["select_placeholder"])
                .setDisabled(disabled)
                .addOptions(toolList.map(t => ({
                    label: ls["cmds"]?.["tool_names"]?.[t.key] || t.key,
                    value: t.key,
                    emoji: t.emoji,
                    default: t.key === selected.key
                })))

            const btn = new ButtonBuilder()
                .setCustomId("craft-btn")
                .setLabel(ls["cmds"]["craft"]["btn_craft"])
                .setEmoji("🔨")
                .setStyle(canCraft ? ButtonStyle.Success : ButtonStyle.Secondary)
                .setDisabled(disabled || !canCraft)

            return {
                embeds: [embed],
                components: [
                    new ActionRowBuilder().addComponents(menu),
                    new ActionRowBuilder().addComponents(btn)
                ]
            }
        }

        const view = getView()
        const replyMsg = await client.Embed(view.embeds, view.components, "reply", false, interaction)
        if (!replyMsg) return

        const collector = replyMsg.createMessageComponentCollector({
            filter: i => i.user.id === interaction.user.id,
            time: 120000
        })

        collector.on("collect", async (i) => {
            if (i.customId === "craft-select") {
                selected = toolList.find(t => t.key === i.values[0]) || toolList[0]
            } else if (i.customId === "craft-btn") {
                let canCraft = true
                for (const [key, count] of Object.entries(selected.recipe)) {
                    const category = fishDetails[key] ? "fish" : "ore"
                    if (!EconomyService.hasItem(profile, category, key, count)) {
                        canCraft = false
                        break
                    }
                }

                if (canCraft) {
                    for (const [key, count] of Object.entries(selected.recipe)) {
                        const category = fishDetails[key] ? "fish" : "ore"
                        EconomyService.removeItem(profile, category, key, count)
                    }
                    EconomyService.addItem(profile, "tools", selected.key, selected.durability)
                }
            }

            const updated = getView()
            await client.Embed(updated.embeds, updated.components, "update", false, i)
        })

        collector.on("end", () => {
            const updated = getView(true)
            client.Embed(updated.embeds, updated.components, "update", false, interaction).catch((err) => console.error("[craft] Failed to disable components on collector end:", err.message))
        })
    }
}
