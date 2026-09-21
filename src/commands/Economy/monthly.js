const { SlashCommandBuilder } = require("discord.js")
const { handlemsg } = require("../../utils/stringUtils")
const { getOrCreateProfile } = require("../../repositories/ProfileRepository")
const EconomyService = require("../../services/EconomyService")

module.exports = {
    guildOnly: true,
    data: new SlashCommandBuilder()
        .setName("monthly")
        .setDescription("Collect your monthly reward"),
    async execute(client, interaction) {
        const ls = client.getLanguage(interaction.guild?.id)

        const profile = await getOrCreateProfile(client, interaction.user.id, interaction.guild.id)

        const today = new Date(profile.monthly)
        const monthly = new Date(today)
        monthly.setDate(monthly.getDate() + 30)

        if (profile.monthly && new Date(interaction.createdTimestamp) >= today.valueOf() && new Date(interaction.createdTimestamp) <= monthly.valueOf()) {
            client.errEmbed({
                type: "reply",
                ephemeral: true,
                desc: `${handlemsg(ls["cmds"]["monthly"]["already_collected"], { time: Math.round(Date.parse(monthly) / 1000) })}`
            }, interaction)
        } else {
            EconomyService.addWallet(profile, 20000)
            profile.monthly = new Date(interaction.createdTimestamp)

            client.successEmbed({
                type: "reply",
                ephemeral: false,
                desc: `${ls["cmds"]["monthly"]["collect"]}`
            }, interaction)
        }
    }
}
