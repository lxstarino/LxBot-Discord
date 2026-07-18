const { SlashCommandBuilder } = require("@discordjs/builders")

module.exports = {
    data: new SlashCommandBuilder()
    .setName("transfer")
    .setDescription("Transfer your money to another user")
    .addUserOption((option) => option
        .setName("target")
        .setDescription("The user you want to transfer money to")
        .setRequired(true)
    )
    .addNumberOption((option) => option
        .setName("amount")
        .setDescription("The amount of money to transfer")
        .setMinValue(1)
        .setRequired(true)
    )
    .addStringOption((option) => option
        .setName("source")
        .setDescription("Transfer from wallet or bank")
        .setRequired(true)
        .addChoices(
            { name: "Wallet", value: "wallet" },
            { name: "Bank", value: "bank" }
        )
    ),
    async execute(client, interaction){
        const target = interaction.options.get("target")
        const amount = interaction.options.get("amount").value
        const source = interaction.options.getString("source")
        
        let ls = client.getLanguage(interaction.guild?.id)
        const { handlemsg, getOrCreateProfile } = require(`${process.cwd()}/src/handlers/functions`)
        
        if(!Number.isInteger(amount)) throw({title: `${ls["cmds"]["transfer"]["title"]}`, desc: `${ls["errors"]["nwn"]}`})

        if(target.user.id === interaction.user.id) throw({title: `${ls["cmds"]["transfer"]["title"]}`, desc: `${ls["cmds"]["transfer"]["ctys"]}`})

        // Fetch or create profile for both sender and target
        const profile = await getOrCreateProfile(client, interaction.user.id, interaction.guild.id)
        const targetProfile = await getOrCreateProfile(client, target.user.id, interaction.guild.id)

        const balance = source === "wallet" ? profile.wallet : profile.bank
        if(amount > balance) {
            if (source === "wallet") {
                throw({
                    title: `${ls["cmds"]["transfer"]["title"]}`, 
                    desc: `${ls["cmds"]["transfer"]["nem_wallet"]}`
                })
            } else {
                throw({title: `${ls["cmds"]["transfer"]["title"]}`, desc: `${ls["cmds"]["transfer"]["nem"]}`})
            }
        }

        if(source === "wallet") {
            profile.wallet -= amount
            targetProfile.wallet += amount
        } else {
            profile.bank -= amount
            targetProfile.bank += amount
        }

        await client.economy.saveData()
        client.successEmbed({
            type: "reply",
            ephemeral: true,
            title: `${ls["cmds"]["transfer"]["title"]}`,
            desc: `${handlemsg(ls["cmds"]["transfer"]["successful"], {amount: amount, target: target.user.id})}`
        }, interaction)
    }
}
