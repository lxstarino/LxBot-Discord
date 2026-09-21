const { SlashCommandBuilder, AttachmentBuilder } = require("discord.js")
const { createCanvas, loadImage } = require("@napi-rs/canvas")
const { handlemsg } = require("../../utils/stringUtils")

module.exports = {
    guildOnly: false,
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName("jail")
        .setDescription("Lock a user behind prison bars")
        .addUserOption(opt => opt
            .setName("user")
            .setDescription("The user to put in jail")
            .setRequired(false)),
    async execute(client, interaction) {
        const ls = client.getLanguage(interaction.guild?.id)

        await interaction.deferReply().catch(err => console.error("[jail] Failed to defer reply:", err.message))

        const targetUser = interaction.options.getUser("user") || interaction.user

        try {
            const avatarUrl = targetUser.displayAvatarURL({ extension: "png", size: 512, forceStatic: true })
            const avatarImg = await loadImage(avatarUrl)

            const width = 450
            const height = 450
            const canvas = createCanvas(width, height)
            const ctx = canvas.getContext("2d")

            ctx.drawImage(avatarImg, 0, 0, width, height)

            const imgData = ctx.getImageData(0, 0, width, height)
            const data = imgData.data
            for (let i = 0; i < data.length; i += 4) {
                const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
                data[i] = gray * 0.9
                data[i + 1] = gray * 0.95
                data[i + 2] = gray
            }
            ctx.putImageData(imgData, 0, 0)

            const drawCrossbar = (y) => {
                const grad = ctx.createLinearGradient(0, y, 0, y + 16)
                grad.addColorStop(0, "#2B2B2B")
                grad.addColorStop(0.3, "#707070")
                grad.addColorStop(0.5, "#A8A8A8")
                grad.addColorStop(0.8, "#505050")
                grad.addColorStop(1, "#181818")

                ctx.fillStyle = grad
                ctx.fillRect(0, y, width, 16)
            }
            drawCrossbar(60)
            drawCrossbar(height - 90)

            const barWidth = 14
            const barCount = 8
            const spacing = (width - barWidth) / (barCount - 1)

            for (let i = 0; i < barCount; i++) {
                const x = Math.round(i * spacing)

                ctx.fillStyle = "rgba(0, 0, 0, 0.45)"
                ctx.fillRect(x + barWidth, 0, 6, height)

                const barGrad = ctx.createLinearGradient(x, 0, x + barWidth, 0)
                barGrad.addColorStop(0, "#1F1F1F")
                barGrad.addColorStop(0.2, "#5C5C5C")
                barGrad.addColorStop(0.45, "#D6D6D6")
                barGrad.addColorStop(0.7, "#7A7A7A")
                barGrad.addColorStop(1, "#151515")

                ctx.fillStyle = barGrad
                ctx.fillRect(x, 0, barWidth, height)
            }

            const placardHeight = 55
            const placardY = height - placardHeight - 12
            const placardWidth = width - 40
            const placardX = 20

            ctx.fillStyle = "#0A0A0A"
            ctx.fillRect(placardX, placardY, placardWidth, placardHeight)

            ctx.strokeStyle = "#ECECEC"
            ctx.lineWidth = 3
            ctx.strokeRect(placardX, placardY, placardWidth, placardHeight)

            ctx.fillStyle = "#FFFFFF"
            ctx.font = "bold 16px sans-serif"
            ctx.textAlign = "center"
            ctx.fillText(`POLICE DEPT. — ${ls["cmds"]["jail"]["inmate_label"]} #${targetUser.id.slice(-6)}`, width / 2, placardY + 24)

            ctx.fillStyle = "#B0B0B0"
            ctx.font = "13px sans-serif"
            ctx.fillText(`${targetUser.username.toUpperCase()} • ${new Date().toLocaleDateString()}`, width / 2, placardY + 44)

            const buffer = canvas.toBuffer("image/png")
            const attachment = new AttachmentBuilder(buffer, { name: "jail.png" })

            const descText = handlemsg(ls["cmds"]["jail"]["desc"], { user: targetUser.id })

            client.Embed([{
                title: ls["cmds"]["jail"]["title"],
                desc: descText,
                image: "attachment://jail.png",
                timestamp: interaction.createdTimestamp
            }], undefined, "editReply", false, interaction, [attachment])

        } catch (err) {
            console.error("[jail] Error generating jail image:", err.message)
            client.errEmbed({
                type: "editReply",
                desc: ls["cmds"]["jail"]["err"]
            }, interaction)
        }
    }
}
