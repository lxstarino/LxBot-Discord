const { SlashCommandBuilder } = require("discord.js")
const { handlemsg } = require("../../utils/stringUtils")
const ProfileRepository = require("../../repositories/ProfileRepository")

module.exports = {
    guildOnly: true,
    data: new SlashCommandBuilder()
        .setName("lvl-lb")
        .setDescription("Show the highest level users on the server"),
    async execute(client, interaction) {
        const ls = client.getLanguage(interaction.guild?.id)

        const topTen = ProfileRepository.getLeaderboard(client, interaction.guild.id, 10, "level")

        if (!topTen.length) {
            return client.Embed([{
                title: ls["cmds"]["lvl-lb"]["title"],
                desc: ls["cmds"]["lvl-lb"]["empty"]
            }], undefined, "reply", undefined, interaction)
        }

        const medals = ["🥇", "🥈", "🥉"]
        let descriptionLines = []

        topTen.forEach((profile, index) => {
            const rankBadge = medals[index] || `\`#${index + 1}\``
            descriptionLines.push(
                handlemsg(ls["cmds"]["lvl-lb"]["format"], {
                    rank: rankBadge,
                    user: profile.userId,
                    level: profile.level || 1,
                    xp: (profile.xp || 0).toLocaleString()
                })
            )
        })

        client.Embed([{
            title: ls["cmds"]["lvl-lb"]["title"],
            desc: descriptionLines.join("\n\n")
        }], undefined, "reply", undefined, interaction)
    }
}
