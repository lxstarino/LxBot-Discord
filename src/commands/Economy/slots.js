const { SlashCommandBuilder } = require("discord.js")
const { handlemsg } = require("../../utils/stringUtils")
const { getOrCreateProfile } = require("../../repositories/ProfileRepository")
const EconomyService = require("../../services/EconomyService")

const slotItemList = ["🍇", "🍉", "🍊", "🍎", "🍓", "🍒", "🥕", "🍋", "🍏", "🍅"]

module.exports = {
    guildOnly: true,
    cooldown: 4,
    data: new SlashCommandBuilder()
        .setName("slots")
        .setDescription("Try your luck in slots")
        .addIntegerOption((option) => option
            .setName("amount")
            .setDescription("The amount of coins to bet")
            .setRequired(true)
            .setMinValue(1)
        ),
    async execute(client, interaction) {
        let amount = interaction.options.getInteger("amount")

        const ls = client.getLanguage(interaction.guild?.id)

        if (!Number.isInteger(amount)) {
            return client.errEmbed({
                type: "reply",
                ephemeral: true,
                desc: ls["errors"]["nwn"]
            }, interaction)
        }

        const profile = await getOrCreateProfile(client, interaction.user.id, interaction.guild.id)

        if (profile.wallet < amount) {
            return client.errEmbed({
                type: "reply",
                ephemeral: true,
                desc: ls["cmds"]["slots"]["nem"]
            }, interaction)
        }

        EconomyService.removeWallet(profile, amount)

        let slotItems = [
            Math.floor(Math.random() * slotItemList.length),
            Math.floor(Math.random() * slotItemList.length),
            Math.floor(Math.random() * slotItemList.length)
        ]

        let win = false
        let payout = amount

        if (slotItems[0] === slotItems[1] && slotItems[1] === slotItems[2]) {
            payout *= 9
            win = true
        } else if (slotItems[0] === slotItems[1] || slotItems[0] === slotItems[2] || slotItems[1] === slotItems[2]) {
            payout *= 2
            win = true
        }

        const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

        const msg = await client.Embed([{
            title: ls["cmds"]["slots"]["title"],
            desc: `[ 🎰 | 🎰 | 🎰 ]\n\n🎰 *Spinning the slot reels...*`
        }], [], "reply", false, interaction)

        if (!msg) {
            EconomyService.addWallet(profile, amount)
            return
        }

        await sleep(700)
        await client.Embed([{
            title: ls["cmds"]["slots"]["title"],
            desc: `[ ${slotItemList[slotItems[0]]} | 🎰 | 🎰 ]\n\n🎰 *Spinning the slot reels...*`
        }], [], "editReply", false, interaction)

        await sleep(700)
        await client.Embed([{
            title: ls["cmds"]["slots"]["title"],
            desc: `[ ${slotItemList[slotItems[0]]} | ${slotItemList[slotItems[1]]} | 🎰 ]\n\n🎰 *Spinning the slot reels...*`
        }], [], "editReply", false, interaction)

        await sleep(700)

        if (win) {
            EconomyService.addWallet(profile, payout)

            const winDesc = handlemsg(ls["cmds"]["slots"]["win"], {
                item1: slotItemList[slotItems[0]],
                item2: slotItemList[slotItems[1]],
                item3: slotItemList[slotItems[2]]
            })

            await client.Embed([{
                title: ls["cmds"]["slots"]["title"],
                color: "#2ECC71",
                desc: winDesc,
                fields: [
                    { name: ls["cmds"]["slots"]["fields"]["name1"], value: handlemsg(ls["cmds"]["slots"]["fields"]["value1"], { amount: payout }), inline: true },
                    { name: ls["cmds"]["slots"]["fields"]["name2"], value: handlemsg(ls["cmds"]["slots"]["fields"]["value2"], { amount: profile.wallet }), inline: true }
                ]
            }], [], "editReply", false, interaction)
        } else {
            const lostDesc = handlemsg(ls["cmds"]["slots"]["lost"], {
                item1: slotItemList[slotItems[0]],
                item2: slotItemList[slotItems[1]],
                item3: slotItemList[slotItems[2]]
            })

            const coin = client.appEmojis?.lux_coin || "<:lux_coin:1550631084855922698>"
            await client.Embed([{
                title: ls["cmds"]["slots"]["title"],
                color: "#E74C3C",
                desc: lostDesc,
                fields: [
                    { name: ls["cmds"]["slots"]["fields"]["name1"], value: `-${amount} ${coin}`, inline: true },
                    { name: ls["cmds"]["slots"]["fields"]["name2"], value: handlemsg(ls["cmds"]["slots"]["fields"]["value2"], { amount: profile.wallet }), inline: true }
                ]
            }], [], "editReply", false, interaction)
        }
    }
}
