const { SlashCommandBuilder } = require("@discordjs/builders")

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName("wheel")
        .setDescription("Spin the Wheel of Fortune to win coin multipliers")
        .addIntegerOption(option => option
            .setName("bet")
            .setDescription("The amount of coins you want to bet")
            .setRequired(true)
        ),
    async execute(client, interaction) {
        let ls = client.getLanguage(interaction.guild?.id)
        const { handlemsg, getOrCreateProfile } = require(`${process.cwd()}/src/handlers/functions`)

        const bet = interaction.options.getInteger("bet")

        if (bet < 10) {
            return client.errEmbed({
                type: "reply",
                ephemeral: true,
                title: ls["cmds"]["wheel"]["title"],
                desc: ls["cmds"]["wheel"]["err_bet_min"]
            }, interaction)
        }

        const profile = await getOrCreateProfile(client, interaction.user.id, interaction.guild.id)
        if (profile.wallet < bet) {
            return client.errEmbed({
                type: "reply",
                ephemeral: true,
                title: ls["cmds"]["wheel"]["title"],
                desc: ls["cmds"]["wheel"]["err_bet_wallet"]
            }, interaction)
        }

        const outcomes = [
            { mult: 0.0, weight: 30 },
            { mult: 0.5, weight: 20 },
            { mult: 1.5, weight: 25 },
            { mult: 2.0, weight: 15 },
            { mult: 3.0, weight: 7 },
            { mult: 5.0, weight: 3 }
        ]

        let rand = Math.random() * 100
        let result = outcomes[0]
        for (const out of outcomes) {
            if (rand < out.weight) {
                result = out
                break
            }
            rand -= out.weight
        }

        const frames = [
            "🎡 | [ **0.0x** ]  [ 0.5x ]  [ 1.5x ]  [ 2.0x ]  [ 3.0x ]  [ 5.0x ]",
            "🎡 | [ 1.5x ]  [ 2.0x ]  [ **3.0x** ]  [ 5.0x ]  [ 0.0x ]  [ 0.5x ]",
            "🎡 | [ 0.5x ]  [ 1.5x ]  [ 2.0x ]  [ **5.0x** ]  [ 3.0x ]  [ 0.0x ]"
        ]

        const msg = await client.Embed([{
            title: ls["cmds"]["wheel"]["title"],
            desc: `${frames[0]}\n\n${ls["cmds"]["wheel"]["spinning"]}`,
            footer: { text: `${interaction.user.tag} • Bet: ${bet} 💰`, iconURL: interaction.user.displayAvatarURL() }
        }], [], "reply", true, interaction)

        if (!msg) return

        const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

        await sleep(750)
        await client.Embed([{
            title: ls["cmds"]["wheel"]["title"],
            desc: `${frames[1]}\n\n${ls["cmds"]["wheel"]["spinning"]}`,
            footer: { text: `${interaction.user.tag} • Bet: ${bet} 💰`, iconURL: interaction.user.displayAvatarURL() }
        }], [], "editReply", true, interaction)

        await sleep(750)
        await client.Embed([{
            title: ls["cmds"]["wheel"]["title"],
            desc: `${frames[2]}\n\n${ls["cmds"]["wheel"]["spinning"]}`,
            footer: { text: `${interaction.user.tag} • Bet: ${bet} 💰`, iconURL: interaction.user.displayAvatarURL() }
        }], [], "editReply", true, interaction)

        await sleep(750)

        const payout = Math.floor(bet * result.mult)
        const netChange = payout - bet

        profile.wallet += netChange
        await client.economy.saveData()

        let resultText = ""
        let embedColor = "#95A5A6"

        if (result.mult >= 5.0) {
            resultText = handlemsg(ls["cmds"]["wheel"]["win"], { multiplier: result.mult.toFixed(1), payout: payout })
            embedColor = "#F1C40F"
        } else if (result.mult > 1.0) {
            resultText = handlemsg(ls["cmds"]["wheel"]["profit"], { multiplier: result.mult.toFixed(1), payout: netChange })
            embedColor = "#2ECC71"
        } else {
            const lossAmount = Math.abs(netChange)
            resultText = handlemsg(ls["cmds"]["wheel"]["loss"], { multiplier: result.mult.toFixed(1), loss: lossAmount })
            embedColor = "#E74C3C"
        }

        await client.Embed([{
            title: ls["cmds"]["wheel"]["title"],
            color: embedColor,
            desc: `🎯 | [ **${result.mult.toFixed(1)}x** ]\n\n${resultText}`,
            footer: { text: `Balance: ${profile.wallet} 💰`, iconURL: interaction.user.displayAvatarURL() },
            timestamp: true
        }], [], "editReply", true, interaction)
    }
}
