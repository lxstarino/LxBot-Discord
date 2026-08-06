const { SlashCommandBuilder } = require("@discordjs/builders")

const fishDetails = {
    cod: { emoji: "🐟", value: 150 },
    salmon: { emoji: "🐟", value: 200 },
    clownfish: { emoji: "🐠", value: 400 },
    pufferfish: { emoji: "🐡", value: 500 },
    squid: { emoji: "🦑", value: 1200 },
    shark: { emoji: "🦈", value: 2500 },
    seadragon: { emoji: "🐉", value: 10000 }
}

const oreDetails = {
    coal: { emoji: "⬛", value: 100 },
    iron: { emoji: "🔩", value: 250 },
    gold: { emoji: "🪙", value: 800 },
    diamond: { emoji: "💎", value: 5000 }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("inventory")
        .setDescription("View your or another user's fish and ore inventory")
        .addUserOption(option => option
            .setName("user")
            .setDescription("The user to check the inventory of")
            .setRequired(false)
        ),
    async execute(client, interaction) {
        let ls = client.getLanguage(interaction.guild?.id)
        const { handlemsg, getOrCreateProfile } = require(`${process.cwd()}/src/handlers/functions`)

        const targetUser = interaction.options.getUser("user") || interaction.user
        const isSelf = targetUser.id === interaction.user.id

        const cacheKey = `${interaction.guild.id}:${targetUser.id}`
        const profile = client.economy.mapCache?.get(cacheKey) || await getOrCreateProfile(client, targetUser.id, interaction.guild.id)

        const fishInventory = profile.inventory?.fish || {}
        const oreInventory = profile.inventory?.ore || {}

        let totalValue = 0
        const fishItemsList = []
        const oreItemsList = []

        Object.entries(fishInventory).forEach(([fishKey, count]) => {
            if (count > 0 && fishDetails[fishKey]) {
                const fishName = ls["cmds"]["fish_names"][fishKey] || fishKey
                const details = fishDetails[fishKey]
                const itemValue = details.value * count
                totalValue += itemValue
                fishItemsList.push(`• **${count}x** ${details.emoji} **${fishName}** (Value: ${itemValue} 💰)`)
            }
        })

        Object.entries(oreInventory).forEach(([oreKey, count]) => {
            if (count > 0 && oreDetails[oreKey]) {
                const oreName = ls["cmds"]["ore_names"][oreKey] || oreKey
                const details = oreDetails[oreKey]
                const itemValue = details.value * count
                totalValue += itemValue
                oreItemsList.push(`• **${count}x** ${details.emoji} **${oreName}** (Value: ${itemValue} 💰)`)
            }
        })

        if (fishItemsList.length === 0 && oreItemsList.length === 0) {
            const desc = isSelf
                ? ls["cmds"]["inventory"]["empty_self"]
                : handlemsg(ls["cmds"]["inventory"]["empty_other"], { user: targetUser.id })

            return client.Embed([{
                title: handlemsg(ls["cmds"]["inventory"]["title"], { user: targetUser.username }),
                desc: desc,
                timestamp: interaction.createdTimestamp
            }], undefined, "reply", false, interaction)
        }

        let descContent = ""
        if (fishItemsList.length > 0) {
            descContent += `🎣 **Fish:**\n${fishItemsList.join("\n")}\n\n`
        }
        if (oreItemsList.length > 0) {
            descContent += `⛏️ **Ores:**\n${oreItemsList.join("\n")}\n\n`
        }
        descContent += `Total Estimated Value: **${totalValue} 💰**`

        client.Embed([{
            title: handlemsg(ls["cmds"]["inventory"]["title"], { user: targetUser.username }),
            desc: descContent,
            timestamp: interaction.createdTimestamp
        }], undefined, "reply", false, interaction)
    }
}
