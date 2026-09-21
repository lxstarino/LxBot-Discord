const { ActivityType } = require("discord.js")
const fs = require("fs")
const RestoreManager = require("../../restore/RestoreManager")

module.exports = {
    name: "ready",
    once: true,
    async execute(client) {
        client.user.setPresence({
            activities: [{
                name: `with ${client.commands.size} commands!`,
                type: ActivityType.Streaming,
                url: "https://www.twitch.tv/lxstarino"
            }],
            status: 'dnd'
        })
        const shardTag = client.shard ? `[Shard #${client.shard.ids.join(", ")}] ` : ""
        const devCount = client.commands.filter(cmd => cmd.devOnly === true).size
        const userCount = client.commands.filter(cmd => cmd.devOnly !== true).size
        const ping = client.ws.ping >= 0 ? `${client.ws.ping}ms` : "N/A"

        console.log(`${shardTag}Online as ${client.user.tag} • ${client.guilds.cache.size} Guild(s) • ${client.commands.size} Commands (${userCount} User / ${devCount} Dev) • Ping: ${ping}`)

        await RestoreManager.restoreAll(client)

        if (fs.existsSync("./src/tasks")) {
            const taskFiles = fs.readdirSync("./src/tasks").filter(file => file.endsWith(".js"))
            for (const taskFile of taskFiles) {
                try {
                    require(`../../tasks/${taskFile}`)(client)
                } catch (err) {
                    console.error(`${shardTag}[Tasks] Failed to load ${taskFile}:`, err.message)
                }
            }
            if (taskFiles.length > 0) {
                const taskNames = taskFiles.map(f => f.replace(".js", ""))
                console.log(`${shardTag}[Tasks] Active (${taskNames.length}): ${taskNames.join(", ")}`)
            }
        }
    }
}
