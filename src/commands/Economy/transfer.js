const { SlashCommandBuilder } = require("@discordjs/builders")

module.exports = {
    data: new SlashCommandBuilder()
    .setName("transfer")
    .setDescription("Transfer your money to an other user")
    .addUserOption((option) => option
        .setName("target")
        .setDescription("target")
        .setRequired(true)
    )
    .addNumberOption((option) => option
        .setName("amount")
        .setDescription("amount")
        .setMinValue(1)
        .setRequired(true)
    ),
    async execute(client, interaction){
        const target = interaction.options.get("target") || interaction
        const amount = interaction.options.get("amount").value
        
        const settings = client.settings.storage.data.find(x => x.guildId === interaction.guild.id)
        let ls = settings ? settings.language ? require(`${process.cwd()}/src/languages/${settings.language}.json`) : require(`${process.cwd()}/src/languages/en.json`) : require(`${process.cwd()}/src/languages/en.json`)
        const { handlemsg } = require(`${process.cwd()}/src/handlers/functions`)
        
        if(!Number.isInteger(amount)) throw({title: `${ls["cmds"]["transfer"]["title"]}`, desc: `${ls["errors"]["nwn"]}`})

        const profile = await client.economy.storage.data.find(x => x.userId === interaction.user.id && x.guildId === interaction.guild.id)
        if(profile){
            if(target.user.id == interaction.user.id) throw({title: `${ls["cmds"]["transfer"]["title"]}`, desc: `${ls["cmds"]["transfer"]["ctys"]}`})
            if(amount > profile.bank) throw({title: `${ls["cmds"]["transfer"]["title"]}`, desc: `${ls["cmds"]["transfer"]["nem"]}`})

            const targetProfile = await client.economy.storage.data.find(x => x.userId === target.user.id && x.guildId === interaction.guild.id)
            if(!targetProfile) throw({title: `${ls["errors"]["npf"]["title"]}`, desc: `${handlemsg(ls["errors"]["npf"]["desc"], {target: target.user.id})}`})
            targetProfile.bank += amount
            profile.bank -= amount

            await client.economy.saveData()
            client.successEmbed({
                type: "reply",
                ephemeral: true,
                title: `${ls["cmds"]["transfer"]["title"]}`,
                desc: `${handlemsg(ls["cmds"]["transfer"]["successful"], {amount: amount, target: target.user.id})}`
            },interaction)
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
