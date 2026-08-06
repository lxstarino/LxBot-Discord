const { SlashCommandBuilder } = require("discord.js")

module.exports = {
    devOnly: true,
    data: new SlashCommandBuilder()
        .setName("bot-restart")
        .setDescription("Restarts the bot process"),
    async execute(client, interaction) {
        const ls = client.getLanguage(interaction.guild?.id)
        const restartLs = ls?.cmds?.["bot-restart"] || ls?.cmds?.["restart"] || {
            title: "Bot Restarting",
            desc: "The bot will restart in {seconds}s..."
        }

        let remainingSeconds = 3
        const baseDesc = restartLs.desc || "The bot will restart in {seconds}s..."

        const getDesc = (seconds) => {
            if (baseDesc.includes("<t:{time}:R>")) {
                return baseDesc.replace("<t:{time}:R>", `in **${seconds}s**`)
            }
            if (baseDesc.includes("{time}")) {
                return baseDesc.replace("{time}", `in **${seconds}s**`)
            }
            if (baseDesc.includes("{seconds}")) {
                return baseDesc.replace("{seconds}", seconds)
            }
            return `${baseDesc}\n\n⏱️ Restarting in **${seconds}s**...`
        }

        try {
            await client.Embed([{
                title: restartLs.title || "Bot Restarting",
                color: "#F1C40F",
                desc: getDesc(remainingSeconds)
            }], [], "reply", true, interaction)
        } catch (err) {
            console.error("Failed to send restart embed:", err)
        }

        const interval = setInterval(async () => {
            remainingSeconds--

            if (remainingSeconds > 0) {
                try {
                    await client.Embed([{
                        title: restartLs.title || "Bot Restarting",
                        color: "#F1C40F",
                        desc: getDesc(remainingSeconds)
                    }], [], "editReply", true, interaction)
                } catch (err) {
                }
            } else {
                clearInterval(interval)
                try {
                    await client.Embed([{
                        title: restartLs.title || "Bot Restarting",
                        color: "#E74C3C",
                        desc: "🔄 **Bot-Prozess wird jetzt neu gestartet...**"
                    }], [], "editReply", true, interaction)
                } catch (err) {
                }

                setTimeout(() => {
                    try {
                        if (client && typeof client.destroy === "function") {
                            client.destroy()
                        }
                    } catch (err) {
                    }

                    process.exit(42)
                }, 500)
            }
        }, 1000)
    }
}
