const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js")
const { handlemsg } = require("../../utils/stringUtils")
const { getOrCreateProfile } = require("../../repositories/ProfileRepository")
const EconomyService = require("../../services/EconomyService")

module.exports = {
    guildOnly: true,
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName("drop")
        .setDescription("Drop coins in the channel for the fastest user to claim!")
        .addIntegerOption(option => option
            .setName("amount")
            .setDescription("The amount of coins to drop")
            .setMinValue(10)
            .setRequired(true)
        )
        .addStringOption(option => option
            .setName("message")
            .setDescription("Custom message or note for the drop")
            .setMaxLength(200)
            .setRequired(false)
        ),
    async execute(client, interaction) {
        const amount = interaction.options.getInteger("amount")
        const message = interaction.options.getString("message")
        const ls = client.getLanguage(interaction.guild?.id)

        const profile = await getOrCreateProfile(client, interaction.user.id, interaction.guild.id)

        if (profile.wallet < amount) {
            throw ({
                title: ls["cmds"]["drop"]["title"],
                desc: ls["cmds"]["drop"]["err_nem_wallet"]
            })
        }

        EconomyService.removeWallet(profile, amount)

        const custom_msg = message ? `\n\n💬 **Note:** ${message}` : ""
        const formattedAmount = amount.toLocaleString("en-US")

        const buildActiveComponents = () => {
            return [
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId("drop_claim")
                        .setLabel(ls["cmds"]["drop"]["btn_claim"] || "Claim Drop! 🎉")
                        .setStyle(ButtonStyle.Success)
                        .setEmoji(client.appEmojis?.lux_coin || "<:lux_coin:1550631084855922698>")
                )
            ]
        }

        const buildClaimedComponents = (username) => {
            return [
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId("drop_claimed")
                        .setLabel(handlemsg(ls["cmds"]["drop"]["btn_claimed"] || "Claimed by {user} ⚡", { user: username }))
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true)
                )
            ]
        }

        const buildExpiredComponents = () => {
            return [
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId("drop_expired")
                        .setLabel(ls["cmds"]["drop"]["btn_expired"] || "Expired ⏰")
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true)
                )
            ]
        }

        const dropEmbedObj = {
            author: { name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() },
            title: ls["cmds"]["drop"]["title"],
            desc: handlemsg(ls["cmds"]["drop"]["desc"], {
                dropper: interaction.user.id,
                amount: formattedAmount,
                custom_msg: custom_msg
            }),
            color: "#F1C40F"
        }

        const replyMsg = await client.Embed([dropEmbedObj], buildActiveComponents(), "reply", false, interaction)
        if (!replyMsg) {
            profile.wallet += amount
            return
        }

        const startTime = Date.now()
        let isClaimed = false

        const collector = replyMsg.createMessageComponentCollector({
            time: 120000
        })

        collector.on("collect", async (i) => {
            if (i.customId !== "drop_claim") return

            if (i.user.id === interaction.user.id) {
                return i.reply({
                    content: `❌ ${ls["cmds"]["drop"]["err_self_claim"] || "You cannot claim your own drop!"}`,
                    ephemeral: true
                }).catch((err) => console.error("[drop] Failed to send self-claim error reply:", err.message))
            }

            if (isClaimed) return
            isClaimed = true

            collector.stop("claimed")

            const reactionTime = ((Date.now() - startTime) / 1000).toFixed(2)
            const winnerProfile = await getOrCreateProfile(client, i.user.id, interaction.guild.id)
            EconomyService.addWallet(winnerProfile, amount)

            const claimedEmbed = client.tempEmbed()
                .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
                .setTitle(ls["cmds"]["drop"]["title_claimed"])
                .setDescription(handlemsg(ls["cmds"]["drop"]["desc_claimed"], {
                    winner: i.user.id,
                    amount: formattedAmount,
                    time: reactionTime,
                    dropper: interaction.user.id
                }))
                .setColor("#2ECC71")

            const components = buildClaimedComponents(i.user.username)

            await i.update({
                embeds: [claimedEmbed],
                components: components
            }).catch(async () => {
                await replyMsg.edit({
                    embeds: [claimedEmbed],
                    components: components
                }).catch((err) => console.error("[drop] Failed to edit message with claimed embed fallback:", err.message))
            })
        })

        collector.on("end", async (collected, reason) => {
            if (reason === "claimed" || isClaimed) return

            EconomyService.addWallet(profile, amount)

            const expiredEmbed = client.tempEmbed()
                .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
                .setTitle(ls["cmds"]["drop"]["title_expired"])
                .setDescription(handlemsg(ls["cmds"]["drop"]["desc_expired"], {
                    amount: formattedAmount,
                    dropper: interaction.user.id
                }))
                .setColor("#E74C3C")

            await replyMsg.edit({
                embeds: [expiredEmbed],
                components: buildExpiredComponents()
            }).catch((err) => console.error("[drop] Failed to edit message on drop expiration:", err.message))
        })
    }
}
