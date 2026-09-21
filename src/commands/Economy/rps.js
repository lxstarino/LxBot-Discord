const { SlashCommandBuilder } = require("discord.js")
const { handlemsg } = require("../../utils/stringUtils")
const { getOrCreateProfile } = require("../../repositories/ProfileRepository")
const EconomyService = require("../../services/EconomyService")

const emojis = {
    rock: "🪨",
    paper: "📄",
    scissors: "✂️"
}

const botChoices = ["rock", "paper", "scissors"]

module.exports = {
    guildOnly: true,
    cooldown: 3,
    data: new SlashCommandBuilder()
        .setName("rps")
        .setDescription("Play rock paper scissors for money")
        .addStringOption((option) => option
            .setName("choice")
            .setDescription("Rock, paper, or scissors")
            .setRequired(true)
            .addChoices(
                { name: "Rock 🪨", value: "rock" },
                { name: "Paper 📄", value: "paper" },
                { name: "Scissors ✂️", value: "scissors" }
            )
        )
        .addIntegerOption((option) => option
            .setName("amount")
            .setDescription("The amount of money to bet")
            .setMinValue(1)
            .setRequired(true)
        ),
    async execute(client, interaction) {
        const userChoice = interaction.options.getString("choice")
        const betAmount = interaction.options.getInteger("amount")

        const ls = client.getLanguage(interaction.guild?.id)

        const profile = await getOrCreateProfile(client, interaction.user.id, interaction.guild.id)

        if (profile.wallet < betAmount) {
            throw ({
                title: ls["cmds"]["rps"]["title"],
                desc: ls["cmds"]["rps"]["nem"]
            })
        }

        const botChoice = botChoices[Math.floor(Math.random() * botChoices.length)]

        const displayUser = ls["cmds"]["rps"][userChoice]
        const displayBot = ls["cmds"]["rps"][botChoice]

        const userChoiceString = `${displayUser} ${emojis[userChoice]}`
        const botChoiceString = `${displayBot} ${emojis[botChoice]}`

        if (userChoice === botChoice) {
            client.Embed([{
                title: ls["cmds"]["rps"]["title"],
                desc: handlemsg(ls["cmds"]["rps"]["draw"], { choice: userChoiceString })
            }], undefined, "reply", undefined, interaction)
        } else if (
            (userChoice === "rock" && botChoice === "scissors") ||
            (userChoice === "paper" && botChoice === "rock") ||
            (userChoice === "scissors" && botChoice === "paper")
        ) {
            EconomyService.addWallet(profile, betAmount)

            client.successEmbed({
                type: "reply",
                ephemeral: false,
                desc: handlemsg(ls["cmds"]["rps"]["win"], { botChoice: botChoiceString, amount: betAmount })
            }, interaction)
        } else {
            EconomyService.removeWallet(profile, betAmount)

            client.errEmbed({
                type: "reply",
                ephemeral: false,
                desc: handlemsg(ls["cmds"]["rps"]["lost"], { botChoice: botChoiceString, amount: betAmount })
            }, interaction)
        }
    }
}
