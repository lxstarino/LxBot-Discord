const { SlashCommandBuilder } = require("@discordjs/builders")

module.exports = {
    data: new SlashCommandBuilder()
        .setName("eco-lb")
        .setDescription("Show the richest users in the server"),
    async execute(client, interaction) {
        let ls = client.getLanguage(interaction.guild?.id)
        const { handlemsg } = require(`${process.cwd()}/src/handlers/functions`)

        // Filter profiles belonging to the current guild and sort by total wealth (wallet + bank) descending
        const guildProfiles = client.economy.storage.data
            .filter(x => x.guildId === interaction.guild.id)
            .map(x => ({
                ...x,
                total: (x.wallet || 0) + (x.bank || 0)
            }))
            .sort((a, b) => b.total - a.total)

        if (!guildProfiles.length) {
            return client.Embed([{
                title: ls["cmds"]["eco-lb"]["title"],
                desc: ls["cmds"]["eco-lb"]["empty"]
            }], undefined, "reply", undefined, interaction)
        }

        // Get top 10 profiles
        const topTen = guildProfiles.slice(0, 10)
        let descriptionLines = []

        topTen.forEach((profile, index) => {
            descriptionLines.push(
                handlemsg(ls["cmds"]["eco-lb"]["format"], {
                    rank: index + 1,
                    user: profile.userId,
                    total: profile.total,
                    wallet: profile.wallet,
                    bank: profile.bank
                })
            )
        })

        client.Embed([{
            title: ls["cmds"]["eco-lb"]["title"],
            desc: descriptionLines.join("\n\n")
        }], undefined, "reply", undefined, interaction)
    }
}
