const { SlashCommandBuilder } = require("@discordjs/builders")

module.exports = {
    data: new SlashCommandBuilder()
    .setName("daily")
    .setDescription("Collect your daily reward"),
    async execute (client, interaction) {
        let ls = client.getLanguage(interaction.guild?.id)
        const { handlemsg, getOrCreateProfile } = require(`${process.cwd()}/src/handlers/functions`)

        const profile = await getOrCreateProfile(client, interaction.user.id, interaction.guild.id)

        const today = new Date(profile.daily)
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        if (profile.daily && new Date(interaction.createdTimestamp) >= today.valueOf() && new Date(interaction.createdTimestamp) <= tomorrow.valueOf()) {
            client.errEmbed({
                type: "reply",
                ephemeral: true,
                title: `${ls["cmds"]["daily"]["title"]}`,
                desc: `${handlemsg(ls["cmds"]["daily"]["already_collected"], {time: Math.round(Date.parse(tomorrow) / 1000)})}`
            }, interaction)
        } else {
            profile.wallet += 5000
            profile.daily = new Date(interaction.createdTimestamp)

            await client.economy.saveData()
            client.successEmbed({
                type: "reply",
                ephemeral: true,
                title: `${ls["cmds"]["daily"]["title"]}`,
                desc: `${ls["cmds"]["daily"]["collect"]}`
            }, interaction)
        }
    }
}