const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js")
const { toolDetails } = require("../../services/economyItems")

module.exports = {
    guildOnly: true,
    data: new SlashCommandBuilder()
        .setName("toolinfo")
        .setDescription("View more details about a tool"),
    async execute(client, interaction) {
        const getComponents = (disabled = false) => {
            let row = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('toolinfo')
                    .setPlaceholder('Select a tool')
                    .setDisabled(disabled)
                    .addOptions(Object.entries(toolDetails).map(([key, info]) => {
                        const formattedLabel = `${info.emoji} ${key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}`
                        return {
                            label: formattedLabel.substring(0, 100),
                            value: key
                        }
                    })
                    )
            )

            return [row];
        }

        const replyMsg = await client.Embed([{
            title: "Tools Information",
            desc: "Select a tool below to gain more information",
            footer: { text: `${interaction.user.tag}` },
            thumbnail: interaction.user.displayAvatarURL(),
            timestamp: interaction.createdTimestamp
        }], getComponents(false), "reply", false, interaction)

        if (!replyMsg) return
        const collector = replyMsg.createMessageComponentCollector({
            filter: i => i.user.id === interaction.user.id,
            time: 120000
        })

        collector.on("collect", async (i) => {
            const toolKey = i.values[0]
            const tool = toolDetails[toolKey]
            const formattedName = `${tool.emoji} ${toolKey.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}`

            const perkParts = []
            if (tool.perks?.luckBonus) perkParts.push(`+${tool.perks.luckBonus}% Luck`)
            if (tool.perks?.minRarity) perkParts.push(`Min Rarity: ${tool.perks.minRarity}`)
            const perksText = perkParts.length > 0 ? perkParts.join(" • ") : "None"

            const descLines = [
                `> **Type:** \`${tool.type}\``,
                `> **Durability:** \`${tool.durability} uses\``,
                `> **Perks:** \`${perksText}\``
            ]

            await client.Embed([{
                title: formattedName,
                desc: descLines.join("\n"),
                footer: { text: `${interaction.user.tag}` },
                thumbnail: interaction.user.displayAvatarURL(),
                timestamp: interaction.createdTimestamp
            }], getComponents(false), "update", false, i)
        })
    }
}
