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

        let ls = client.getLanguage(interaction.guild?.id)
        const { handlemsg, getOrCreateProfile } = require(`${process.cwd()}/src/handlers/functions`)

        const profile = await getOrCreateProfile(client, interaction.user.id, interaction.guild.id)

        if(target.user.id == interaction.user.id) throw ({title: `${ls["cmds"]["rob"]["title"]}`, desc: `${ls["cmds"]["rob"]["crys"]}`})
        if(profile.wallet < 5000) throw({title: `${ls["cmds"]["rob"]["title"]}`, desc: `${ls["cmds"]["rob"]["rbl"]}`})

        const targetProfile = await getOrCreateProfile(client, target.user.id, interaction.guild.id)
        if(targetProfile.wallet < 5000) throw({title: `${ls["cmds"]["rob"]["title"]}`, desc: `${handlemsg(ls["cmds"]["rob"]["nts"], {target: target.user.id})}`})

        var chance = Math.random() * 100
        var amount = Math.round(Math.random() * 5000)
        if(chance > 80){
            targetProfile.wallet -= amount
            profile.wallet += amount
            await client.economy.saveData()

            client.Embed([{title: `${ls["cmds"]["rob"]["title"]}`, desc: `${handlemsg(ls["cmds"]["rob"]["success"], {amount: amount, target: target.user.id})}`}], undefined, "reply", undefined, interaction)
        } else {
            targetProfile.wallet += amount
            profile.wallet -= amount
            await client.economy.saveData()

            client.Embed([{title: `${ls["cmds"]["rob"]["title"]}`, desc: `${handlemsg(ls["cmds"]["rob"]["caught"], {amount: amount, target: target.user.id})}`}], undefined, "reply", undefined, interaction)
        }
    }
}