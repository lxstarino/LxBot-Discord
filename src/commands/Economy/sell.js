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

module.exports = {
    data: new SlashCommandBuilder()
        .setName("sell")
        .setDescription("Sell caught fish from your inventory for money"),
    async execute(client, interaction) {
        let ls = client.getLanguage(interaction.guild?.id)
        const { handlemsg, getOrCreateProfile } = require(`${process.cwd()}/src/handlers/functions`)

        const profile = await getOrCreateProfile(client, interaction.user.id, interaction.guild.id)
        profile.inventory = profile.inventory || {}
        profile.inventory.fish = profile.inventory.fish || {}

        // Calculate total value of all fish in inventory
        let totalValue = 0
        let totalCount = 0

        Object.entries(profile.inventory.fish).forEach(([fishKey, count]) => {
            if (count > 0 && fishPrices[fishKey]) {
                totalValue += fishPrices[fishKey] * count
                totalCount += count
                profile.inventory.fish[fishKey] = 0 // Clear inventory of this fish
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

        // Add to wallet and save
        profile.wallet += totalValue
        await client.economy.saveData()

        client.Embed([{
            title: ls["cmds"]["sell"]["title"],
            desc: handlemsg(ls["cmds"]["sell"]["success_all"], { amount: totalValue }),
            timestamp: interaction.createdTimestamp
        }], undefined, "reply", false, interaction)
    }
}
