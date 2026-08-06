const { SlashCommandBuilder } = require("@discordjs/builders")

const oreList = {
    common: [
        { key: "coal", emoji: "⬛", value: 100 }
    ],
    uncommon: [
        { key: "iron", emoji: "🔩", value: 250 }
    ],
    rare: [
        { key: "gold", emoji: "🪙", value: 800 }
    ],
    legendary: [
        { key: "diamond", emoji: "💎", value: 5000 }
    ]
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("mine")
        .setDescription("Go mining to harvest ores that can be sold for money"),
    async execute(client, interaction) {
        let ls = client.getLanguage(interaction.guild?.id)
        const { handlemsg, getOrCreateProfile } = require(`${process.cwd()}/src/handlers/functions`)

        const cacheKey = `${interaction.guild.id}:${interaction.user.id}`
        const profile = client.economy.mapCache?.get(cacheKey) || await getOrCreateProfile(client, interaction.user.id, interaction.guild.id)

        const now = Date.now()
        const cooldown = 30000
        if (profile.lastMine && (now - profile.lastMine) < cooldown) {
            const nextMine = profile.lastMine + cooldown
            return client.errEmbed({
                type: "reply",
                ephemeral: true,
                title: ls["cmds"]["mine"]["title"],
                desc: handlemsg(ls["cmds"]["mine"]["cooldown"], { time: Math.round(nextMine / 1000) })
            }, interaction)
        }

        const roll = Math.random() * 100
        let rarity = "common"
        if (roll > 95) rarity = "legendary"
        else if (roll > 80) rarity = "rare"
        else if (roll > 50) rarity = "uncommon"

        const options = oreList[rarity]
        const ore = options[Math.floor(Math.random() * options.length)]

        profile.inventory = profile.inventory || {}
        profile.inventory.ore = profile.inventory.ore || {}
        profile.inventory.ore[ore.key] = (profile.inventory.ore[ore.key] || 0) + 1

        profile.lastMine = now
        await client.economy.saveData()

        const oreName = ls["cmds"]["ore_names"][ore.key] || ore.key
        const rarityName = ls["cmds"]["ore_rarities"][rarity]

        client.Embed([{
            title: ls["cmds"]["mine"]["title"],
            desc: handlemsg(ls["cmds"]["mine"]["mined"], {
                ore: oreName,
                emoji: ore.emoji,
                rarity: rarityName,
                value: ore.value
            }),
            timestamp: interaction.createdTimestamp
        }], undefined, "reply", false, interaction)
    }
}
