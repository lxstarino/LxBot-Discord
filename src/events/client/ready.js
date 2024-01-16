const { ActivityType } = require("discord.js");

module.exports = {
    name: "ready",
    async execute(client) {
        client.user.setPresence({activities: [{ name: `Is watching you`, type: ActivityType.Custom}], status: 'idle',});
        console.log(`${client.user.tag} bot started!\n=> Guilds: ${client.guilds.cache.size}\n=> Commands: ${client.commands.size}`)
    }
}
