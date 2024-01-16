const { SlashCommandBuilder } = require("@discordjs/builders")

module.exports = {
    data: new SlashCommandBuilder()
    .setName("daily")
    .setDescription("Collect your daily reward"),
    async execute (client, interaction) {
        const profile = client.economy.storage.data.find(x => x.userId === interaction.user.id && x.guildId === interaction.guild.id)
        
        const settings = client.settings.storage.data.find(x => x.guildId === interaction.guild.id)
        let ls = settings ? settings.language ? require(`${process.cwd()}/src/languages/${settings.language}.json`) : require(`${process.cwd()}/src/languages/en.json`) : require(`${process.cwd()}/src/languages/en.json`)
        const { handlemsg } = require(`${process.cwd()}/src/handlers/functions`)
        
        if(profile){
            const today = new Date(profile.daily)
            const tomorrow = new Date(today)
            tomorrow.setDate(tomorrow.getDate() + 1)

            if(new Date(interaction.createdTimestamp) >= today.valueOf() && new Date(interaction.createdTimestamp) <= tomorrow.valueOf()){
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