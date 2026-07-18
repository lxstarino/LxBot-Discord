const { SlashCommandBuilder } = require("@discordjs/builders")

module.exports = {
    data: new SlashCommandBuilder()
        .setName("warnings")
        .setDescription("Check the warnings of a user")
        .addUserOption((option) => option
            .setName("target")
            .setDescription("The user whose warnings you want to check")
            .setRequired(false)
        ),
    async execute(client, interaction) {
        const user = interaction.options.getUser("target") || interaction.user

        let ls = client.getLanguage(interaction.guild?.id)
        const { handlemsg } = require(`${process.cwd()}/src/handlers/functions`)

        const profile = client.economy.storage.data.find(x => x.userId === user.id && x.guildId === interaction.guild.id)
        const warnings = profile ? (profile.warnings || []) : []

        if (warnings.length === 0) {
            return client.Embed([{
                title: handlemsg(ls["cmds"]["warnings"]["title"], { user: user.username }),
                desc: handlemsg(ls["cmds"]["warnings"]["empty"], { target: user.id }),
                timestamp: interaction.createdTimestamp
            }], undefined, "reply", false, interaction)
        }

        const list = warnings.map((warn, index) => {
            return handlemsg(ls["cmds"]["warnings"]["format"], {
                index: index + 1,
                moderator: warn.moderator,
                reason: warn.reason,
                time: Math.round(warn.timestamp / 1000)
            })
        }).join("\n\n")

        client.Embed([{
            title: handlemsg(ls["cmds"]["warnings"]["title"], { user: user.username }),
            desc: list,
            timestamp: interaction.createdTimestamp
        }], undefined, "reply", false, interaction)
    }
}
