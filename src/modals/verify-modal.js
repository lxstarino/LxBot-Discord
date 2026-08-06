module.exports = {
    customId: "verify-modal",
    async execute(client, interaction, ls, handlemsg) {
        const { getOrCreateSettings } = require(`${process.cwd()}/src/handlers/functions`)
        const langDict = ls["cmds"]["verify"] || {}

        const key = `${interaction.guild.id}:${interaction.user.id}`
        const cachedCaptcha = client.captchas.get(key)

        if (!cachedCaptcha || Date.now() > cachedCaptcha.expires) {
            client.captchas.delete(key)
            return client.errEmbed({
                type: "reply",
                ephemeral: true,
                title: langDict["title"] || "🔐 Captcha Verification",
                desc: langDict["err_expired"] || "⏰ Captcha expired! Click Verify again to get a new code."
            }, interaction)
        }

        const inputCode = interaction.fields.getTextInputValue("verify-code-input").trim().toUpperCase()

        if (inputCode !== cachedCaptcha.code.toUpperCase()) {
            return client.errEmbed({
                type: "reply",
                ephemeral: true,
                title: langDict["title"] || "🔐 Captcha Verification",
                desc: langDict["err_invalid_code"] || "❌ Incorrect Code! Please check the image and try again."
            }, interaction)
        }

        client.captchas.delete(key)

        const settings = await getOrCreateSettings(client, interaction.guild.id)
        if (settings.verify_role) {
            const role = interaction.guild.roles.cache.get(settings.verify_role)
            if (role) {
                await interaction.member.roles.add(role.id).catch(err => console.error(`[Verify] Failed to add role ${role.name}:`, err))
            }
        }

        await client.Embed([{
            title: langDict["title"] || "🔐 Captcha Verification",
            desc: langDict["success"] || "🎉 **Verification Successful!** You have been granted access.",
            color: 0x57F287
        }], undefined, "reply", true, interaction)
    }
}
