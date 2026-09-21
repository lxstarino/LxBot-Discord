const { SlashCommandBuilder } = require("discord.js")
const { handlemsg } = require("../../utils/stringUtils")
const ProfileRepository = require("../../repositories/ProfileRepository")

module.exports = {
    guildOnly: true,
    data: new SlashCommandBuilder()
        .setName("eco-lb")
        .setDescription("Show the richest users in the server"),
    async execute(client, interaction) {
        const ls = client.getLanguage(interaction.guild?.id)

        const topTen = ProfileRepository.getLeaderboard(client, interaction.guild.id, 10, "economy")

        if (!topTen.length) {
            return client.Embed([{
                title: ls["cmds"]["eco-lb"]["title"],
                desc: ls["cmds"]["eco-lb"]["empty"]
            }], undefined, "reply", undefined, interaction)
        }

        const medals = ["🥇", "🥈", "🥉"]
        let descriptionLines = []

        topTen.forEach((profile, index) => {
            const total = (profile.wallet || 0) + (profile.bank || 0)
            const rankBadge = medals[index] || `\`#${index + 1}\``
            descriptionLines.push(
                handlemsg(ls["cmds"]["eco-lb"]["format"], {
                    rank: rankBadge,
                    user: profile.userId,
                    total: total.toLocaleString(),
                    wallet: (profile.wallet || 0).toLocaleString(),
                    bank: (profile.bank || 0).toLocaleString()
                })
            )
        })

        client.Embed([{
            title: ls["cmds"]["eco-lb"]["title"],
            desc: descriptionLines.join("\n\n")
        }], undefined, "reply", undefined, interaction)
    }
}
