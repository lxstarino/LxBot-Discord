const { SlashCommandBuilder } = require("discord.js")
const { handlemsg } = require("../../utils/stringUtils")
const { getOrCreateProfile } = require("../../repositories/ProfileRepository")
const EconomyService = require("../../services/EconomyService")

module.exports = {
    guildOnly: true,
    data: new SlashCommandBuilder()
        .setName("transfer")
        .setDescription("Transfer your money to another user")
        .addUserOption((option) => option
            .setName("target")
            .setDescription("The user you want to transfer money to")
            .setRequired(true)
        )
        .addIntegerOption((option) => option
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
    async execute(client, interaction) {
        const target = interaction.options.get("target")
        const amount = interaction.options.getInteger("amount")
        const source = interaction.options.getString("source")

        const ls = client.getLanguage(interaction.guild?.id)

        if (target.user.bot) throw ({ title: `${ls["cmds"]["transfer"]["title"]}`, desc: ls["cmds"]["transfer"]["err_bot"] })
        if (target.user.id === interaction.user.id) throw ({ title: `${ls["cmds"]["transfer"]["title"]}`, desc: `${ls["cmds"]["transfer"]["ctys"]}` })

        const profile = await getOrCreateProfile(client, interaction.user.id, interaction.guild.id)
        const targetProfile = await getOrCreateProfile(client, target.user.id, interaction.guild.id)

        const balance = source === "wallet" ? profile.wallet : profile.bank
        if (amount > balance) {
            if (source === "wallet") {
                throw ({
                    title: `${ls["cmds"]["transfer"]["title"]}`,
                    desc: `${ls["cmds"]["transfer"]["nem_wallet"]}`
                })
            } else {
                throw ({ title: `${ls["cmds"]["transfer"]["title"]}`, desc: `${ls["cmds"]["transfer"]["nem"]}` })
            }
        }

        if (source === "wallet") {
            EconomyService.transfer(profile, targetProfile, amount)
        } else {
            EconomyService.removeBank(profile, amount)
            EconomyService.addBank(targetProfile, amount)
        }

        client.successEmbed({
            type: "reply",
            ephemeral: true,
            desc: `${handlemsg(ls["cmds"]["transfer"]["successful"], { amount: amount, target: target.user.id })}`
        }, interaction)
    }
}
