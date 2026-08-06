const { SlashCommandBuilder } = require("@discordjs/builders")

const fishPrices = {
    cod: 150,
    salmon: 200,
    clownfish: 400,
    pufferfish: 500,
    squid: 1200,
    shark: 2500,
    seadragon: 10000
}

const orePrices = {
    coal: 100,
    iron: 250,
    gold: 800,
    diamond: 5000
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("sell")
        .setDescription("Sell all caught fish and mined ores from your inventory for money"),
    async execute(client, interaction) {
        let ls = client.getLanguage(interaction.guild?.id)
        const { handlemsg, getOrCreateProfile } = require(`${process.cwd()}/src/handlers/functions`)

        const cacheKey = `${interaction.guild.id}:${interaction.user.id}`
        const profile = client.economy.mapCache?.get(cacheKey) || await getOrCreateProfile(client, interaction.user.id, interaction.guild.id)

        profile.inventory = profile.inventory || {}
        profile.inventory.fish = profile.inventory.fish || {}
        profile.inventory.ore = profile.inventory.ore || {}

        let totalValue = 0
        let totalCount = 0

        Object.entries(profile.inventory.fish).forEach(([fishKey, count]) => {
            if (count > 0 && fishPrices[fishKey]) {
                totalValue += fishPrices[fishKey] * count
                totalCount += count
                profile.inventory.fish[fishKey] = 0
            }
        })

        Object.entries(profile.inventory.ore).forEach(([oreKey, count]) => {
            if (count > 0 && orePrices[oreKey]) {
                totalValue += orePrices[oreKey] * count
                totalCount += count
                profile.inventory.ore[oreKey] = 0
            }
        })

        if (totalCount === 0) {
            return client.errEmbed({
                type: "reply",
                ephemeral: true,
                title: ls["cmds"]["sell"]["title"],
                desc: ls["cmds"]["sell"]["empty"]
            }, interaction)
        }

        profile.wallet += totalValue
        await client.economy.saveData()

        client.Embed([{
            title: ls["cmds"]["sell"]["title"],
            desc: handlemsg(ls["cmds"]["sell"]["success_all"], { amount: totalValue }),
            timestamp: interaction.createdTimestamp
        }], undefined, "reply", false, interaction)
    }
}
