const { SlashCommandBuilder } = require("@discordjs/builders")

module.exports = {
    data: new SlashCommandBuilder()
    .setName("weekly")
    .setDescription("Collect your weekly reward"),
    async execute (client, interaction) {
        let ls = client.getLanguage(interaction.guild?.id)
        const { handlemsg, getOrCreateProfile } = require(`${process.cwd()}/src/handlers/functions`)

        const profile = await getOrCreateProfile(client, interaction.user.id, interaction.guild.id)

        const today = new Date(profile.weekly)
        const week = new Date(today)
        week.setDate(week.getDate() + 7)

        if (profile.weekly && new Date(interaction.createdTimestamp) >= today.valueOf() && new Date(interaction.createdTimestamp) <= week.valueOf()) {
            client.errEmbed({
                type: "reply",
                ephemeral: true,
                title: `${ls["cmds"]["weekly"]["title"]}`,
                desc: `${handlemsg(ls["cmds"]["weekly"]["already_collected"], {time: Math.round(Date.parse(week) / 1000)})}`
            }, interaction)
        } else {
            profile.wallet += 10000
            profile.weekly = new Date(interaction.createdTimestamp)

            await client.economy.saveData()
            client.successEmbed({
                type: "reply",
                ephemeral: true,
                title: `${ls["cmds"]["weekly"]["title"]}`,
                desc: `${ls["cmds"]["weekly"]["collect"]}`
            }, interaction)
        }
    }
}
