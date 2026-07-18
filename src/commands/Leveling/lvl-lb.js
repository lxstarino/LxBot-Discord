const { SlashCommandBuilder } = require("@discordjs/builders")

module.exports = {
    data: new SlashCommandBuilder()
        .setName("lvl-lb")
        .setDescription("Show the highest level users on the server"),
    async execute(client, interaction) {
        let ls = client.getLanguage(interaction.guild?.id)
        const { handlemsg } = require(`${process.cwd()}/src/handlers/functions`)

        const guildProfiles = client.economy.storage.data
            .filter(x => x.guildId === interaction.guild.id && x.xp !== undefined)
            .sort((a, b) => {
                if ((b.level || 1) !== (a.level || 1)) {
                    return (b.level || 1) - (a.level || 1)
                }
                return (b.xp || 0) - (a.xp || 0)
            })

        if (!guildProfiles.length) {
            return client.Embed([{
                title: ls["cmds"]["lvl-lb"]["title"],
                desc: ls["cmds"]["lvl-lb"]["empty"]
            }], undefined, "reply", undefined, interaction)
        }

        const topTen = guildProfiles.slice(0, 10)
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
