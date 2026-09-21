const { SlashCommandBuilder } = require("discord.js")
const { handlemsg } = require("../../utils/stringUtils")
const { getOrCreateProfile } = require("../../repositories/ProfileRepository")
const EconomyService = require("../../services/EconomyService")

module.exports = {
    guildOnly: true,
    data: new SlashCommandBuilder()
        .setName("crime")
        .setDescription("Commit a high-risk crime to win or lose money"),
    async execute(client, interaction) {
        const ls = client.getLanguage(interaction.guild?.id)

        const profile = await getOrCreateProfile(client, interaction.user.id, interaction.guild.id)

        const lastCrime = new Date(profile.crime || 0)
        const nextCrime = new Date(lastCrime)
        nextCrime.setHours(nextCrime.getHours() + 2)

        if (profile.crime && new Date(interaction.createdTimestamp) < nextCrime.valueOf()) {
            return client.errEmbed({
                type: "reply",
                ephemeral: true,
                desc: handlemsg(ls["cmds"]["crime"]["already_crimed"], { time: Math.round(Date.parse(nextCrime) / 1000) })
            }, interaction)
        }

        if (profile.wallet < 1000) {
            throw ({
                title: ls["cmds"]["crime"]["title"],
                desc: ls["cmds"]["crime"]["nem"]
            })
        }

        const crimes = ls["cmds"]["crime"]["list"]
        const randomCrime = crimes[Math.floor(Math.random() * crimes.length)]

        const successChance = Math.random() * 100
        if (successChance > 45) {
            const reward = Math.floor(Math.random() * 1201) + 300
            EconomyService.addWallet(profile, reward)
            profile.crime = new Date(interaction.createdTimestamp)

            client.successEmbed({
                type: "reply",
                ephemeral: false,
                desc: handlemsg(ls["cmds"]["crime"]["success"], { crime: randomCrime, amount: reward })
            }, interaction)
        } else {
            const fine = Math.floor(Math.random() * 601) + 200
            if (!EconomyService.removeWallet(profile, fine)) {
                profile.wallet = 0
            }
            profile.crime = new Date(interaction.createdTimestamp)

            client.errEmbed({
                type: "reply",
                ephemeral: false,
                desc: handlemsg(ls["cmds"]["crime"]["caught"], { crime: randomCrime, amount: fine })
            }, interaction)
        }
    }
}
