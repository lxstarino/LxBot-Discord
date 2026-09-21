const { SlashCommandBuilder } = require("discord.js")
const { handlemsg } = require("../../utils/stringUtils")
const { getOrCreateProfile } = require("../../repositories/ProfileRepository")
const EconomyService = require("../../services/EconomyService")

module.exports = {
    guildOnly: true,
    data: new SlashCommandBuilder()
        .setName("work")
        .setDescription("Work at a random job to earn money"),
    async execute(client, interaction) {
        const ls = client.getLanguage(interaction.guild?.id)

        const profile = await getOrCreateProfile(client, interaction.user.id, interaction.guild.id)

        const lastWork = new Date(profile.work || 0)
        const nextWork = new Date(lastWork)
        nextWork.setHours(nextWork.getHours() + 1)

        if (profile.work && new Date(interaction.createdTimestamp) < nextWork.valueOf()) {
            return client.errEmbed({
                type: "reply",
                ephemeral: true,
                desc: handlemsg(ls["cmds"]["work"]["already_worked"], { time: Math.round(Date.parse(nextWork) / 1000) })
            }, interaction)
        }

        const jobs = ls["cmds"]["work"]["list"]
        const randomJob = jobs[Math.floor(Math.random() * jobs.length)]

        const earned = Math.floor(Math.random() * 501) + 100

        EconomyService.addWallet(profile, earned)
        profile.work = new Date(interaction.createdTimestamp)

        client.successEmbed({
            type: "reply",
            ephemeral: false,
            desc: handlemsg(ls["cmds"]["work"]["success"], { job: randomJob, amount: earned })
        }, interaction)
    }
}
