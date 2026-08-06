const { SlashCommandBuilder } = require("@discordjs/builders")
const { handlemsg } = require(`${process.cwd()}/src/handlers/functions`)

module.exports = {
    data: new SlashCommandBuilder()
        .setName("lvl-lb")
        .setDescription("Show the highest level users on the server"),
    async execute(client, interaction) {
        let ls = client.getLanguage(interaction.guild?.id)

        const topTen = client.economy.storage.data
            .filter(x => x.guildId === interaction.guild.id && ((x.level || 1) > 1 || (x.xp || 0) > 0))
            .sort((a, b) => {
                const lvlDiff = (b.level || 1) - (a.level || 1)
                return lvlDiff !== 0 ? lvlDiff : (b.xp || 0) - (a.xp || 0)
            })
            .slice(0, 10)

        if (!topTen.length) {
            return client.Embed([{
                title: ls["cmds"]["lvl-lb"]["title"],
                desc: ls["cmds"]["lvl-lb"]["empty"]
            }], undefined, "reply", undefined, interaction)
        }

        let descriptionLines = []

        topTen.forEach((profile, index) => {
            descriptionLines.push(
                handlemsg(ls["cmds"]["lvl-lb"]["format"], {
                    rank: index + 1,
                    user: profile.userId,
                    level: profile.level || 1,
                    xp: profile.xp || 0
                })
            )
        })

        client.Embed([{
            title: ls["cmds"]["lvl-lb"]["title"],
            desc: descriptionLines.join("\n\n")
        }], undefined, "reply", undefined, interaction)
    }
}
