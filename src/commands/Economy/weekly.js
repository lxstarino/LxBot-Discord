const { SlashCommandBuilder } = require("@discordjs/builders")

module.exports = {
    data: new SlashCommandBuilder()
    .setName("weekly")
    .setDescription("Collect your weekly reward"),
    async execute (client, interaction) {
        const settings = client.settings.storage.data.find(x => x.guildId === interaction.guild.id)
        let ls = settings ? settings.language ? require(`${process.cwd()}/src/languages/${settings.language}.json`) : require(`${process.cwd()}/src/languages/en.json`) : require(`${process.cwd()}/src/languages/en.json`)
        const { handlemsg } = require(`${process.cwd()}/src/handlers/functions`)
        
        const profile = client.economy.storage.data.find(x => x.userId === interaction.user.id && x.guildId === interaction.guild.id)
        if(profile){
            const today = new Date(profile.weekly)
            const week = new Date(today)
            week.setDate(week.getDate() + 7)

            if(new Date(interaction.createdTimestamp) >= today.valueOf() && new Date(interaction.createdTimestamp) <= week.valueOf()){
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
                },interaction)
            }
        } else {
            await client.economy.createData({guildId: interaction.guild.id, userId: interaction.user.id, wallet: 0, bank: 0, daily: 0, weekly: 0, monthly: 0})

            client.successEmbed({
                type: "reply",
                ephemeral: true,
                title: `${ls["success"]["pfc"]["title"]}`,
                desc: `${ls["success"]["pfc"]["desc"]}`
            }, interaction)
        }
    }
}
