const { SlashCommandBuilder } = require("discord.js")
const { handlemsg } = require("../../utils/stringUtils")
const { getOrCreateProfile } = require("../../repositories/ProfileRepository")
const EconomyService = require("../../services/EconomyService")

module.exports = {
    guildOnly: true,
    data: new SlashCommandBuilder()
        .setName("deposit")
        .setDescription("Deposit your money into bank")
        .addIntegerOption((option) => option
            .setName("amount")
            .setDescription("amount")
            .setMinValue(1)
            .setRequired(true)
        ),
    async execute(client, interaction) {
        const amount = interaction.options.getInteger("amount")

        const ls = client.getLanguage(interaction.guild?.id)

        if (!Number.isInteger(amount)) throw ({ title: `${ls["cmds"]["deposit"]["title"]}`, desc: `${ls["errors"]["nwn"]}` })

        const profile = await getOrCreateProfile(client, interaction.user.id, interaction.guild.id)

        const success = EconomyService.deposit(profile, amount)
        if (!success) throw ({ title: `${ls["cmds"]["deposit"]["title"]}`, desc: `${ls["cmds"]["deposit"]["nem"]}` })

        client.successEmbed({
            type: "reply",
            ephemeral: true,
            desc: `${handlemsg(ls["cmds"]["deposit"]["successful"], { amount: amount })}`
        }, interaction)
    }
}
