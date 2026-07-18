const { SlashCommandBuilder } = require("@discordjs/builders")

module.exports = {
    data: new SlashCommandBuilder()
    .setName("deposit")
    .setDescription("Deposit your money into bank")
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

        if(!Number.isInteger(amount)) throw({title: `${ls["cmds"]["deposit"]["title"]}`, desc: `${ls["errors"]["nwn"]}`})

        const profile = await getOrCreateProfile(client, interaction.user.id, interaction.guild.id)
        
        if(profile.wallet < amount) throw({title: `${ls["cmds"]["deposit"]["title"]}`, desc: `${ls["cmds"]["deposit"]["nem"]}`})
        
        profile.wallet -= amount
        profile.bank += amount

        await client.economy.saveData()
        client.successEmbed({
            type: "reply",
            ephemeral: true,
            title: `${ls["cmds"]["deposit"]["title"]}`, 
            desc: `${handlemsg(ls["cmds"]["deposit"]["successful"], {amount: amount})}`
        }, interaction)
    }
}
