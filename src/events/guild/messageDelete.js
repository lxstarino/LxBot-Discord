const { sendModLog, handlemsg } = require(`${process.cwd()}/src/handlers/functions`)

module.exports = {
    name: "messageDelete",
    async execute(message, client) {
        // Ignore bots, partial messages, and DM messages
        if (message.partial || !message.author || message.author.bot || !message.guild) return

        let ls = client.getLanguage(message.guild.id)

        // Prevent logging in the log channel itself to avoid loops
        const settings = client.settings.storage.data.find(x => x.guildId === message.guild.id)
        if (settings && settings.logchannel === message.channel.id) return

        await sendModLog(client, message.guild, {
            title: ls["logs"]["msg_delete_title"],
            desc: handlemsg(ls["logs"]["msg_delete_desc"], {
                user: message.author.id,
                tag: message.author.tag,
                channel: message.channel.id,
                content: message.content ? message.content.substring(0, 1000) : "No content"
            }),
            color: "#e74c3c",
            timestamp: Date.now()
        })
    }
}
