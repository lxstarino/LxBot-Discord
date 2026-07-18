const { ActivityType } = require("discord.js")
const RestoreManager = require(`${process.cwd()}/src/utils/RestoreManager`)

module.exports = {
    name: "ready",
    async execute(client) {
        client.user.setPresence({ activities: [{ name: `Is watching you`, type: ActivityType.Custom }], status: 'idle' })
        console.log(`| ${client.user.tag} bot started!\n| Guilds: ${client.guilds.cache.size}\n| Dev Commands: ${client.commands.filter(cmd => cmd.devOnly === true).size} & User Commands ${client.commands.filter(cmd => cmd.devOnly !== true).size}`)

        // Run all registered restore handlers (polls, giveaways, reminders, etc.)
        await RestoreManager.restoreAll(client)
    }
}
