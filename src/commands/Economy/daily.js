const { SlashCommandBuilder } = require("discord.js")
const { handlemsg } = require("../../utils/stringUtils")
const { getOrCreateProfile } = require("../../repositories/ProfileRepository")
const EconomyService = require("../../services/EconomyService")

module.exports = {
    guildOnly: true,
    data: new SlashCommandBuilder()
        .setName("daily")
        .setDescription("Collect your daily reward"),
    async execute(client, interaction) {
        const ls = client.getLanguage(interaction.guild?.id)

        const profile = await getOrCreateProfile(client, interaction.user.id, interaction.guild.id)

        const today = new Date(profile.daily)
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        if (profile.daily && new Date(interaction.createdTimestamp) >= today.valueOf() && new Date(interaction.createdTimestamp) <= tomorrow.valueOf()) {
            client.errEmbed({
                type: "reply",
                ephemeral: true,
                desc: `${handlemsg(ls["cmds"]["daily"]["already_collected"], { time: Math.round(Date.parse(tomorrow) / 1000) })}`
            }, interaction)
        } else {
            EconomyService.addWallet(profile, 5000)
            profile.daily = new Date(interaction.createdTimestamp)

            client.successEmbed({
                type: "reply",
                ephemeral: false,
                desc: `${ls["cmds"]["daily"]["collect"]}`
            }, interaction)
        }
    }
}
