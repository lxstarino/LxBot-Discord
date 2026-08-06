const { AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js")

function generateCode(length = 5) {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    let result = ""
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
}

module.exports = {
    customId: "verify-refresh",
    async execute(client, interaction, ls, handlemsg) {
        const { generateCaptchaImage } = require(`${process.cwd()}/src/handlers/functions`)
        const langDict = ls["cmds"]["verify"] || {}

        const code = generateCode(5)
        const buffer = await generateCaptchaImage(code)
        const attachment = new AttachmentBuilder(buffer, { name: "captcha.png" })

        const key = `${interaction.guild.id}:${interaction.user.id}`
        client.captchas.set(key, {
            code: code,
            expires: Date.now() + 5 * 60 * 1000
        })

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("verify-enter-code")
                .setLabel(langDict["btn_enter_code"] || "Enter Code")
                .setEmoji("📝")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId("verify-refresh")
                .setLabel(langDict["btn_refresh"] || "New Captcha")
                .setEmoji("🔄")
                .setStyle(ButtonStyle.Secondary)
        )

        await client.Embed([{
            title: langDict["title"] || "🔐 Captcha Verification",
            desc: langDict["captcha_desc"] || "Please solve the Captcha in the image below.",
            image: "attachment://captcha.png",
            color: 0x5865F2
        }], [row], "update", undefined, interaction, [attachment])
    }
}
