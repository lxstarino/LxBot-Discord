const { SlashCommandBuilder } = require("@discordjs/builders")

const slotItemList = ["🍇", "🍉", "🍊", "🍎", "🍓", "🍒", "🥕", "🍋", "🍏", "🍅"];

module.exports = {
    data: new SlashCommandBuilder()
    .setName("slots")
    .setDescription("Try your luck in slots")
    .addNumberOption((option) => option
        .setName("amount")
        .setDescription("amount")
        .setRequired(true)
        .setMinValue(1)
    ),
    async execute(client, interaction){
        let amount = interaction.options.get("amount").value
        
        const settings = client.settings.storage.data.find(x => x.guildId === interaction.guild.id)
        let ls = settings ? settings.language ? require(`${process.cwd()}/src/languages/${settings.language}.json`) : require(`${process.cwd()}/src/languages/en.json`) : require(`${process.cwd()}/src/languages/en.json`)
        const { handlemsg } = require(`${process.cwd()}/src/handlers/functions`)
        
        if(!Number.isInteger(amount)) throw({title: `${ls["cmds"]["slots"]["title"]}`, desc: `${ls["errors"]["nwn"]}`})

        const profile = await client.economy.storage.data.find(x => x.userId === interaction.user.id && x.guildId === interaction.guild.id)
        if(profile){
            if(profile.wallet < amount) throw({title: `${ls["cmds"]["slots"]["title"]}`, desc: `${ls["cmds"]["slots"]["nem"]}`})

            let win = false
            let slotItems = []
            for(i = 0; i < 3; i++) { slotItems[i] = Math.floor(Math.random() * slotItemList.length)}
            if(slotItems[0] == slotItems[1] && slotItems[1] == slotItems[2]){
                amount *= 9
                win = true
            }
            if(slotItems[0] == slotItems[1] || slotItems[0] == slotItems[2] || slotItems[1] == slotItems[2]){
                amount *= 2
                win = true
            }
    
            if(win == true){
                profile.wallet += amount
    
                await client.economy.saveData()
                client.basicEmbed({
                    type: "reply",
                    title: `${ls["cmds"]["slots"]["title"]}`,
                    desc: `${handlemsg(ls["cmds"]["slots"]["win"], {item1: slotItemList[slotItems[0]], item2: slotItemList[slotItems[1]], item3: slotItemList[slotItems[2]]})}`,
                    fields: [
                        {name: `${ls["cmds"]["slots"]["fields"]["name1"]}`, value: `${handlemsg(ls["cmds"]["slots"]["fields"]["value2"], {amount: amount})}`, inline: true},
                        {name: `${ls["cmds"]["slots"]["fields"]["name2"]}`, value: `${handlemsg(ls["cmds"]["slots"]["fields"]["value2"], {amount: profile.wallet})}`, inline: true}
                    ]
                }, interaction)
            } else {
                profile.wallet -= amount
    
                await client.economy.saveData()
                client.basicEmbed({
                    type: "reply",
                    title: `${ls["cmds"]["slots"]["title"]}`,
                    desc: `${handlemsg(ls["cmds"]["slots"]["lost"], {item1: slotItemList[slotItems[0]], item2: slotItemList[slotItems[1]], item3: slotItemList[slotItems[2]]})}`,
                    fields: [
                        {name: `${ls["cmds"]["slots"]["fields"]["name1"]}`, value: `${handlemsg(ls["cmds"]["slots"]["fields"]["value1"], {amount: amount})}`, inline: true},
                        {name: `${ls["cmds"]["slots"]["fields"]["name2"]}`, value: `${handlemsg(ls["cmds"]["slots"]["fields"]["value2"], {amount: profile.wallet})}`, inline: true}
                    ]
                }, interaction)
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
