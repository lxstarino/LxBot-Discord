const { SlashCommandBuilder } = require("discord.js")
const { fishPrices, orePrices, huntPrices } = require("../../services/economyItems")
const { handlemsg } = require("../../utils/stringUtils")
const { getOrCreateProfile } = require("../../repositories/ProfileRepository")
const EconomyService = require("../../services/EconomyService")

module.exports = {
    guildOnly: true,
    data: new SlashCommandBuilder()
        .setName("sell")
        .setDescription("Sell all caught fish and mined ores from your inventory for money"),
    async execute(client, interaction) {
        const ls = client.getLanguage(interaction.guild?.id)
        const profile = await getOrCreateProfile(client, interaction.user.id, interaction.guild.id)

        profile.inventory = profile.inventory || {}
        profile.inventory.fish = profile.inventory.fish || {}
        profile.inventory.ore = profile.inventory.ore || {}
        profile.inventory.hunt = profile.inventory.hunt || {}

        let totalValue = 0
        let totalCount = 0

        Object.entries(profile.inventory.fish).forEach(([fishKey, count]) => {
            if (count > 0 && fishPrices[fishKey]) {
                totalValue += fishPrices[fishKey] * count
                totalCount += count
                delete profile.inventory.fish[fishKey]
            } else if (count <= 0) {
                delete profile.inventory.fish[fishKey]
            }
        })

        Object.entries(profile.inventory.ore).forEach(([oreKey, count]) => {
            if (count > 0 && orePrices[oreKey]) {
                totalValue += orePrices[oreKey] * count
                totalCount += count
                delete profile.inventory.ore[oreKey]
            } else if (count <= 0) {
                delete profile.inventory.ore[oreKey]
            }
        })

        Object.entries(profile.inventory.hunt).forEach(([huntKey, count]) => {
            if (count > 0 && huntPrices[huntKey]) {
                totalValue += huntPrices[huntKey] * count
                totalCount += count
                delete profile.inventory.hunt[huntKey]
            } else if (count <= 0) {
                delete profile.inventory.hunt[huntKey]
            }
        })

        if (totalCount === 0) {
            return client.errEmbed({
                type: "reply",
                ephemeral: true,
                desc: ls["cmds"]["sell"]["empty"]
            }, interaction)
        }

        EconomyService.addWallet(profile, totalValue)

        client.Embed([{
            title: ls["cmds"]["sell"]["title"],
            desc: handlemsg(ls["cmds"]["sell"]["success_all"], { amount: totalValue }),
            timestamp: interaction.createdTimestamp
        }], undefined, "reply", false, interaction)
    }
}
