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
        
        let ls = client.getLanguage(interaction.guild?.id)
        const { handlemsg, getOrCreateProfile } = require(`${process.cwd()}/src/handlers/functions`)
        
        if(!Number.isInteger(amount)) throw({title: `${ls["cmds"]["slots"]["title"]}`, desc: `${ls["errors"]["nwn"]}`})

        const profile = await getOrCreateProfile(client, interaction.user.id, interaction.guild.id)
        
        if(profile.wallet < amount) throw({title: `${ls["cmds"]["slots"]["title"]}`, desc: `${ls["cmds"]["slots"]["nem"]}`})

        let win = false
        let slotItems = []
        for(let i = 0; i < 3; i++) { slotItems[i] = Math.floor(Math.random() * slotItemList.length)}
        if(slotItems[0] == slotItems[1] && slotItems[1] == slotItems[2]){
            amount *= 9
            win = true
        } else if(slotItems[0] == slotItems[1] || slotItems[0] == slotItems[2] || slotItems[1] == slotItems[2]){
            amount *= 2
            win = true
        }

        if(win == true){
            profile.wallet += amount

            await client.economy.saveData()
            client.Embed([{
                title: `${ls["cmds"]["slots"]["title"]}`,
                desc: `${handlemsg(ls["cmds"]["slots"]["win"], {item1: slotItemList[slotItems[0]], item2: slotItemList[slotItems[1]], item3: slotItemList[slotItems[2]]})}`,
                fields: [
                    {name: `${ls["cmds"]["slots"]["fields"]["name1"]}`, value: `${handlemsg(ls["cmds"]["slots"]["fields"]["value2"], {amount: amount})}`, inline: true},
                    {name: `${ls["cmds"]["slots"]["fields"]["name2"]}`, value: `${handlemsg(ls["cmds"]["slots"]["fields"]["value2"], {amount: profile.wallet})}`, inline: true}
                ]
            }], undefined, "reply", undefined, interaction)
        } else {
            profile.wallet -= amount

            await client.economy.saveData()
            client.Embed([{
                title: `${ls["cmds"]["slots"]["title"]}`,
                desc: `${handlemsg(ls["cmds"]["slots"]["lost"], {item1: slotItemList[slotItems[0]], item2: slotItemList[slotItems[1]], item3: slotItemList[slotItems[2]]})}`,
                fields: [
                    {name: `${ls["cmds"]["slots"]["fields"]["name1"]}`, value: `${handlemsg(ls["cmds"]["slots"]["fields"]["value1"], {amount: amount})}`, inline: true},
                    {name: `${ls["cmds"]["slots"]["fields"]["name2"]}`, value: `${handlemsg(ls["cmds"]["slots"]["fields"]["value2"], {amount: profile.wallet})}`, inline: true}
                ]
            }], undefined, "reply", undefined, interaction)
        }
    }
}
