const { SlashCommandBuilder } = require("discord.js")
const { handlemsg } = require("../../utils/stringUtils")
const { getOrCreateProfile } = require("../../repositories/ProfileRepository")
const EconomyService = require("../../services/EconomyService")

module.exports = {
    guildOnly: true,
    cooldown: 10,
    data: new SlashCommandBuilder()
        .setName("rob")
        .setDescription("Rob a user")
        .addUserOption((option) => option
            .setName("target")
            .setDescription("target")
            .setRequired(true)
        ),
    async execute(client, interaction) {
        const target = interaction.options.get("target")

        const ls = client.getLanguage(interaction.guild?.id)

        if (target.user.bot) throw ({ title: `${ls["cmds"]["rob"]["title"]}`, desc: ls["cmds"]["rob"]["err_bot"] })
        if (target.user.id == interaction.user.id) throw ({ title: `${ls["cmds"]["rob"]["title"]}`, desc: `${ls["cmds"]["rob"]["crys"]}` })
        const profile = await getOrCreateProfile(client, interaction.user.id, interaction.guild.id)
        if (profile.wallet < 5000) throw ({ title: `${ls["cmds"]["rob"]["title"]}`, desc: `${ls["cmds"]["rob"]["rbl"]}` })

        const targetProfile = await getOrCreateProfile(client, target.user.id, interaction.guild.id)
        if (targetProfile.wallet < 5000) throw ({ title: `${ls["cmds"]["rob"]["title"]}`, desc: `${handlemsg(ls["cmds"]["rob"]["nts"], { target: target.user.id })}` })

        const chance = Math.random() * 100
        const amount = Math.round(Math.random() * 5000)
        if (chance > 80) {
            EconomyService.transfer(targetProfile, profile, amount)

            client.Embed([{ title: `${ls["cmds"]["rob"]["title"]}`, desc: `${handlemsg(ls["cmds"]["rob"]["success"], { amount: amount, target: target.user.id })}` }], undefined, "reply", undefined, interaction)
        } else {
            EconomyService.transfer(profile, targetProfile, amount)

            client.Embed([{ title: `${ls["cmds"]["rob"]["title"]}`, desc: `${handlemsg(ls["cmds"]["rob"]["caught"], { amount: amount, target: target.user.id })}` }], undefined, "reply", undefined, interaction)
        }
    }
}
