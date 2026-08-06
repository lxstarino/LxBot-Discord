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
    customId: "verify",
    async execute(client, interaction, ls, handlemsg) {
        const { getOrCreateSettings, generateCaptchaImage } = require(`${process.cwd()}/src/handlers/functions`)
        const settings = await getOrCreateSettings(client, interaction.guild.id)

        const langDict = ls["cmds"]["verify"] || {}

        if (settings.verify_role && interaction.member.roles.cache.has(settings.verify_role)) {
            return client.errEmbed({
                type: "reply",
                ephemeral: true,
                title: langDict["title"] || "🔐 Captcha Verification",
                desc: langDict["already_verified"] || "You are already verified!"
            }, interaction)
        }

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
        }], [row], "reply", true, interaction, [attachment])
    }
}
