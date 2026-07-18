const { SlashCommandBuilder } = require("@discordjs/builders")

module.exports = {
    data: new SlashCommandBuilder()
    .setName("monthly")
    .setDescription("Collect your monthly reward"),
    async execute (client, interaction) {
        let ls = client.getLanguage(interaction.guild?.id)
        const { handlemsg, getOrCreateProfile } = require(`${process.cwd()}/src/handlers/functions`)
        
        const profile = await getOrCreateProfile(client, interaction.user.id, interaction.guild.id)

        const today = new Date(profile.monthly)
        const monthly = new Date(today)
        monthly.setDate(monthly.getDate() + 30)

        if (profile.monthly && new Date(interaction.createdTimestamp) >= today.valueOf() && new Date(interaction.createdTimestamp) <= monthly.valueOf()) {
            client.errEmbed({
                type: "reply",
                ephemeral: true,
                title: `${ls["cmds"]["monthly"]["title"]}`,
                desc: `${handlemsg(ls["cmds"]["monthly"]["already_collected"], {time: Math.round(Date.parse(monthly) / 1000)})}`
            }, interaction)
        } else {
            profile.wallet += 20000
            profile.monthly = new Date(interaction.createdTimestamp)

            await client.economy.saveData()
            client.successEmbed({
                type: "reply",
                ephemeral: true,
                title: `${ls["cmds"]["monthly"]["title"]}`,
                desc: `${ls["cmds"]["monthly"]["collect"]}`
            }, interaction)
        }
    }
}
