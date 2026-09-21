const { SlashCommandBuilder } = require("discord.js")
const { handlemsg } = require("../../utils/stringUtils")
const { getOrCreateProfile } = require("../../repositories/ProfileRepository")
const EconomyService = require("../../services/EconomyService")

module.exports = {
    guildOnly: true,
    data: new SlashCommandBuilder()
        .setName("weekly")
        .setDescription("Collect your weekly reward"),
    async execute(client, interaction) {
        const ls = client.getLanguage(interaction.guild?.id)

        const profile = await getOrCreateProfile(client, interaction.user.id, interaction.guild.id)

        const today = new Date(profile.weekly)
        const week = new Date(today)
        week.setDate(week.getDate() + 7)

        if (profile.weekly && new Date(interaction.createdTimestamp) >= today.valueOf() && new Date(interaction.createdTimestamp) <= week.valueOf()) {
            client.errEmbed({
                type: "reply",
                ephemeral: true,
                desc: `${handlemsg(ls["cmds"]["weekly"]["already_collected"], { time: Math.round(week.getTime() / 1000) })}`
            }, interaction)
        } else {
            EconomyService.addWallet(profile, 10000)
            profile.weekly = new Date(interaction.createdTimestamp)

            client.successEmbed({
                type: "reply",
                ephemeral: false,
                desc: `${ls["cmds"]["weekly"]["collect"]}`
            }, interaction)
        }
    }
}
