const { SlashCommandBuilder } = require("@discordjs/builders")
const { handlemsg } = require(`${process.cwd()}/src/utils/functions`)

module.exports = {
    data: new SlashCommandBuilder()
        .setName("eco-lb")
        .setDescription("Show the richest users in the server"),
    async execute(client, interaction) {
        let ls = client.getLanguage(interaction.guild?.id)

        const topTen = client.db.getEconomyLeaderboard(interaction.guild.id, 10)

        if (!topTen.length) {
            return client.Embed([{
                title: ls["cmds"]["eco-lb"]["title"],
                desc: ls["cmds"]["eco-lb"]["empty"]
            }], undefined, "reply", undefined, interaction)
        }

        let descriptionLines = []

        topTen.forEach((profile, index) => {
            const total = (profile.wallet || 0) + (profile.bank || 0)
            descriptionLines.push(
                handlemsg(ls["cmds"]["eco-lb"]["format"], {
                    rank: index + 1,
                    user: profile.userId,
                    total: total,
                    wallet: profile.wallet || 0,
                    bank: profile.bank || 0
                })
            )
        })

        client.Embed([{
            title: ls["cmds"]["eco-lb"]["title"],
            desc: descriptionLines.join("\n\n")
        }], undefined, "reply", undefined, interaction)
    }
}
