const { SlashCommandBuilder } = require("@discordjs/builders")



module.exports = {
    data: new SlashCommandBuilder()
        .setName("work")
        .setDescription("Work at a random job to earn money"),
    async execute(client, interaction) {
        let ls = client.getLanguage(interaction.guild?.id)
        const { handlemsg, getOrCreateProfile } = require(`${process.cwd()}/src/handlers/functions`)

        const profile = await getOrCreateProfile(client, interaction.user.id, interaction.guild.id)
        
        // Cooldown check (1 hour)
        const lastWork = new Date(profile.work || 0)
        const nextWork = new Date(lastWork)
        nextWork.setHours(nextWork.getHours() + 1)

        if (profile.work && new Date(interaction.createdTimestamp) < nextWork.valueOf()) {
            return client.errEmbed({
                type: "reply",
                ephemeral: true,
                title: ls["cmds"]["work"]["title"],
                desc: handlemsg(ls["cmds"]["work"]["already_worked"], { time: Math.round(Date.parse(nextWork) / 1000) })
            }, interaction)
        }

        const jobs = ls["cmds"]["work"]["list"]
        const randomJob = jobs[Math.floor(Math.random() * jobs.length)]
        
        // Random amount between 100 and 600
        const earned = Math.floor(Math.random() * 501) + 100

        profile.wallet += earned
        profile.work = new Date(interaction.createdTimestamp)
        await client.economy.saveData()

        client.successEmbed({
            type: "reply",
            ephemeral: false,
            title: ls["cmds"]["work"]["title"],
            desc: handlemsg(ls["cmds"]["work"]["success"], { job: randomJob, amount: earned })
        }, interaction)
    }
}
