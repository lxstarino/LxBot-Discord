module.exports = (client) => {
    process.on("unhandledRejection", async (err) => {
        console.error("Unhandled promise rejection:", err)

        if (err && (err.code === 50013 || err.message?.includes("Missing Permissions"))) {
            const lastInteraction = client.lastInteraction
            if (lastInteraction) {
                console.error("Unhandled Missing Permissions error caught globally:", err)
                try {
                    const ls = client.getLanguage(lastInteraction.guild?.id)
                    const title = ls["errors"]["mp"] || "Missing Permissions"
                    const desc = `> ${ls["events"]["interactionCreate"]["err_bot_missing_perms"]}`

                    if (lastInteraction.deferred || lastInteraction.replied) {
                        await client.errEmbed({
                            type: "editReply",
                            ephemeral: true,
                            title: title,
                            desc: desc
                        }, lastInteraction).catch(() => {})
                    } else {
                        await client.errEmbed({
                            type: "reply",
                            ephemeral: true,
                            title: title,
                            desc: desc
                        }, lastInteraction).catch(() => {})
                    }
                } catch (embedErr) {
                    console.error("Failed to send missing permissions embed:", embedErr)
                }
            }
        }
    })

    process.on("uncaughtException", (err, origin) => {
        console.error("Uncaught exception:", err, origin)
    })

    process.on("uncaughtExceptionMonitor", (err, origin) => {
        console.error("Uncaught exception monitor:", err, origin)
    })

    process.on("warning", (warning) => {
        console.warn("Process warning:", warning)
    })
}
