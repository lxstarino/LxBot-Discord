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
        
        let ls = client.getLanguage(interaction.guild?.id)
        const { handlemsg, getOrCreateProfile } = require(`${process.cwd()}/src/handlers/functions`)
        
        if(!Number.isInteger(amount)) throw({title: `${ls["cmds"]["withdraw"]["title"]}`, desc: `${ls["errors"]["nwn"]}`})

        const profile = await getOrCreateProfile(client, interaction.user.id, interaction.guild.id)
        
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
    }
}
