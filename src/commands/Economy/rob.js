const { SlashCommandBuilder } = require("@discordjs/builders")

module.exports = {
    data: new SlashCommandBuilder()
    .setName("rob")
    .setDescription("Rob a user")
    .addUserOption((option) => option
        .setName("target")
        .setDescription("target")
        .setRequired(true)
    ),
    async execute(client, interaction){
        const target = interaction.options.get("target")

        const settings = client.settings.storage.data.find(x => x.guildId === interaction.guild.id)
        let ls = settings ? settings.language ? require(`${process.cwd()}/src/languages/${settings.language}.json`) : require(`${process.cwd()}/src/languages/en.json`) : require(`${process.cwd()}/src/languages/en.json`)
        const { handlemsg } = require(`${process.cwd()}/src/handlers/functions`)

        const profile = await client.economy.storage.data.find(x => x.userId === interaction.user.id && x.guildId === interaction.guild.id)
        if(profile){
            if(target.user.id == interaction.user.id) throw ({title: `${ls["cmds"]["rob"]["title"]}`, desc: `${ls["cmds"]["rob"]["crys"]}`})
            if(profile.wallet < 5000) throw({title: `${ls["cmds"]["rob"]["title"]}`, desc: `${ls["cmds"]["rob"]["rbl"]}`})

            const targetProfile = client.economy.storage.data.find(x => x.userId === target.user.id && x.guildId === interaction.guild.id)
            if(!targetProfile) throw({title: `${ls["errors"]["npf"]["title"]}`, desc: `${handlemsg(ls["errors"]["npf"]["desc"], {target: target.user.id})}`})
            if(targetProfile.wallet < 5000) throw({title: `${ls["cmds"]["rob"]["title"]}`, desc: `${handlemsg(ls["cmds"]["rob"]["nts"], {target: target.user.id})}`})

            var chance = Math.random() * 100
            var amount = Math.round(Math.random() * 5000)
            if(chance > 80){
                targetProfile.wallet -= amount
                profile.wallet += amount
                await client.economy.saveData()

                client.basicEmbed({type: "reply", title: `${ls["cmds"]["rob"]["title"]}`, desc: `${handlemsg(ls["cmds"]["rob"]["success"], {amount: amount, target: target.user.id})}`}, interaction)
            } else {
                targetProfile.wallet += amount
                profile.wallet -= amount
                await client.economy.saveData()

                client.basicEmbed({type: "reply", title: `${ls["cmds"]["rob"]["title"]}`, desc: `${handlemsg(ls["cmds"]["rob"]["caught"], {amount: amount, target: target.user.id})}`}, interaction)
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