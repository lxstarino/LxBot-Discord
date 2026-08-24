const { ActivityType } = require("discord.js")
const RestoreManager = require(`${process.cwd()}/src/utils/RestoreManager`)
const { cleanupGuildData } = require(`${process.cwd()}/src/utils/functions`)

module.exports = {
    name: "ready",
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
        console.log(`| ${shardTag}${client.user.tag} bot started!\n| Guilds: ${client.guilds.cache.size}\n| Dev Commands: ${client.commands.filter(cmd => cmd.devOnly === true).size} & User Commands ${client.commands.filter(cmd => cmd.devOnly !== true).size}`)

        client.settings.mapCache = new Map()
        client.economy.mapCache = new Map()

        await RestoreManager.restoreAll(client)
    }
}
