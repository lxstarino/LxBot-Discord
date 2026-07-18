const { sendModLog, handlemsg } = require(`${process.cwd()}/src/handlers/functions`)

module.exports = {
    name: "messageUpdate",
    async execute(oldMessage, newMessage, client) {
        // Ignore partial messages, bots, DM messages, and if content didn't change
        if (newMessage.partial || !newMessage.author || newMessage.author.bot || !newMessage.guild) return
        if (oldMessage.content === newMessage.content) return

        let ls = client.getLanguage(newMessage.guild.id)

        // Prevent logging in the log channel itself to avoid loops
        const settings = client.settings.storage.data.find(x => x.guildId === newMessage.guild.id)
        if (settings && settings.logchannel === newMessage.channel.id) return

        await sendModLog(client, newMessage.guild, {
            title: ls["logs"]["msg_update_title"],
            desc: handlemsg(ls["logs"]["msg_update_desc"], {
                user: newMessage.author.id,
                tag: newMessage.author.tag,
                channel: newMessage.channel.id,
                before: oldMessage.content ? oldMessage.content.substring(0, 500) : "No content",
                after: newMessage.content ? newMessage.content.substring(0, 500) : "No content"
            }),
            color: "#3498db",
            timestamp: Date.now()
        })
    }
}
