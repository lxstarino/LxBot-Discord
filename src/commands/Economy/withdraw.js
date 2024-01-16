const { SlashCommandBuilder } = require("@discordjs/builders")

module.exports = {
    data: new SlashCommandBuilder()
    .setName("withdraw")
    .setDescription("Withdraw your money from bank")
    .addNumberOption((option) => option
        .setName("amount")
        .setDescription("amount")
        .setMinValue(1)
        .setRequired(true)
    ),
    async execute(client, interaction) {
        const amount = interaction.options.get("amount").value
        
        const settings = client.settings.storage.data.find(x => x.guildId === interaction.guild.id)
        let ls = settings ? settings.language ? require(`${process.cwd()}/src/languages/${settings.language}.json`) : require(`${process.cwd()}/src/languages/en.json`) : require(`${process.cwd()}/src/languages/en.json`)
        const { handlemsg } = require(`${process.cwd()}/src/handlers/functions`)
        
        if(!Number.isInteger(amount)) throw({title: `${ls["cmds"]["withdraw"]["title"]}`, desc: `${ls["errors"]["nwn"]}`})

        const profile = client.economy.storage.data.find(x => x.userId === interaction.user.id && x.guildId === interaction.guild.id)
        if(profile){
            if(profile.bank < amount) throw({title: `${ls["cmds"]["withdraw"]["title"]}`, desc: `${ls["cmds"]["withdraw"]["nem"]}`})
            
            profile.wallet += amount
            profile.bank -= amount
            
            await client.economy.saveData()
            client.successEmbed({
                type: "reply",
                ephemeral: true,
                title: `${ls["cmds"]["withdraw"]["title"]}`, 
                desc: `${handlemsg(ls["cmds"]["withdraw"]["successful"], {amount: amount})}`
            }, interaction)
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
