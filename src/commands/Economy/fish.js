const { SlashCommandBuilder } = require("@discordjs/builders")

const fishList = {
    common: [
        { key: "cod", emoji: "🐟", value: 150 },
        { key: "salmon", emoji: "🐟", value: 200 }
    ],
    uncommon: [
        { key: "clownfish", emoji: "🐠", value: 400 },
        { key: "pufferfish", emoji: "🐡", value: 500 }
    ],
    rare: [
        { key: "squid", emoji: "🦑", value: 1200 },
        { key: "shark", emoji: "🦈", value: 2500 }
    ],
    legendary: [
        { key: "seadragon", emoji: "🐉", value: 10000 }
    ]
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("fish")
        .setDescription("Go fishing to catch fish that can be sold for money"),
    async execute(client, interaction) {
        let ls = client.getLanguage(interaction.guild?.id)
        const { handlemsg, getOrCreateProfile } = require(`${process.cwd()}/src/handlers/functions`)

        const profile = await getOrCreateProfile(client, interaction.user.id, interaction.guild.id)
        
        // 30 seconds cooldown
        const now = Date.now()
        const cooldown = 30000
        if (profile.lastFish && (now - profile.lastFish) < cooldown) {
            const nextFish = profile.lastFish + cooldown
            return client.errEmbed({
                type: "reply",
                ephemeral: true,
                title: ls["cmds"]["fish"]["title"],
                desc: handlemsg(ls["cmds"]["fish"]["cooldown"], { time: Math.round(nextFish / 1000) })
            }, interaction)
        }

        // Determine rarity
        const roll = Math.random() * 100
        let rarity = "common"
        if (roll > 95) rarity = "legendary"
        else if (roll > 80) rarity = "rare"
        else if (roll > 50) rarity = "uncommon"

        // Pick random fish from rarity
        const options = fishList[rarity]
        const fish = options[Math.floor(Math.random() * options.length)]

        // Add to inventory
        profile.inventory = profile.inventory || {}
        profile.inventory.fish = profile.inventory.fish || {}
        profile.inventory.fish[fish.key] = (profile.inventory.fish[fish.key] || 0) + 1
        
        profile.lastFish = now
        await client.economy.saveData()

        const fishName = ls["cmds"]["fish_names"][fish.key]
        const rarityName = ls["cmds"]["fish_rarities"][rarity]

        client.Embed([{
            title: ls["cmds"]["fish"]["title"],
            desc: handlemsg(ls["cmds"]["fish"]["caught"], {
                fish: fishName,
                emoji: fish.emoji,
                rarity: rarityName,
                value: fish.value
            }),
            timestamp: interaction.createdTimestamp
        }], undefined, "reply", false, interaction)
    }
}
