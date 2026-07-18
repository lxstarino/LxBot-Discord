const { SlashCommandBuilder } = require("@discordjs/builders")



module.exports = {
    data: new SlashCommandBuilder()
        .setName("crime")
        .setDescription("Commit a high-risk crime to win or lose money"),
    async execute(client, interaction) {
        let ls = client.getLanguage(interaction.guild?.id)
        const { handlemsg, getOrCreateProfile } = require(`${process.cwd()}/src/handlers/functions`)

        const profile = await getOrCreateProfile(client, interaction.user.id, interaction.guild.id)
        
        // Cooldown check (2 hours)
        const lastCrime = new Date(profile.crime || 0)
        const nextCrime = new Date(lastCrime)
        nextCrime.setHours(nextCrime.getHours() + 2)

        if (profile.crime && new Date(interaction.createdTimestamp) < nextCrime.valueOf()) {
            return client.errEmbed({
                type: "reply",
                ephemeral: true,
                title: ls["cmds"]["crime"]["title"],
                desc: handlemsg(ls["cmds"]["crime"]["already_crimed"], { time: Math.round(Date.parse(nextCrime) / 1000) })
            }, interaction)
        }

        // Ensure they have enough money in wallet for a potential fine
        if (profile.wallet < 1000) {
            throw({
                title: ls["cmds"]["crime"]["title"],
                desc: ls["cmds"]["crime"]["nem"]
            })
        }

        const crimes = ls["cmds"]["crime"]["list"]
        const randomCrime = crimes[Math.floor(Math.random() * crimes.length)]

        const successChance = Math.random() * 100
        if (successChance > 45) {
            // Success: win 300 to 1500
            const reward = Math.floor(Math.random() * 1201) + 300
            profile.wallet += reward
            profile.crime = new Date(interaction.createdTimestamp)
            await client.economy.saveData()

            client.successEmbed({
                type: "reply",
                ephemeral: false,
                title: ls["cmds"]["crime"]["title"],
                desc: handlemsg(ls["cmds"]["crime"]["success"], { crime: randomCrime, amount: reward })
            }, interaction)
        } else {
            // Caught: lose 200 to 800
            const fine = Math.floor(Math.random() * 601) + 200
            profile.wallet = Math.max(0, profile.wallet - fine)
            profile.crime = new Date(interaction.createdTimestamp)
            await client.economy.saveData()

            client.errEmbed({
                type: "reply",
                ephemeral: false,
                title: ls["cmds"]["crime"]["title"],
                desc: handlemsg(ls["cmds"]["crime"]["caught"], { crime: randomCrime, amount: fine })
            }, interaction)
        }
    }
}
