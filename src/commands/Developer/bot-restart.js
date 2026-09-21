const { SlashCommandBuilder } = require("discord.js")

module.exports = {
    guildOnly: false,
    devOnly: true,
    data: new SlashCommandBuilder()
        .setName("bot-restart")
        .setDescription("Safely restart all bot processes and shards"),
    async execute(client, interaction) {
        const ls = client.getLanguage(interaction.guild?.id)
        const restartLs = ls?.cmds?.["bot-restart"] || {
            title: "Bot Restarting",
            desc: "The bot is restarting now..."
        }

        try {
            await client.Embed([{
                title: restartLs.title || "Bot Restarting",
                color: "#E74C3C",
                desc: restartLs.desc?.replace("<t:{time}:R>", "now...") || "**Bot-Prozess wird jetzt neu gestartet...**"
            }], [], "reply", true, interaction)
        } catch (err) {
            console.error("Failed to send restart embed:", err)
        }

        setTimeout(() => {
            try {
                if (client && typeof client.destroy === "function") {
                    client.destroy()
                }
            } catch (err) {
                console.error("[bot-restart] Failed to destroy client:", err.message)
            }

            if (process.send) {
                process.send({ type: "SHARD_RESTART_ALL" })
            }

            process.exit(42)
        }, 300)
    }
}
