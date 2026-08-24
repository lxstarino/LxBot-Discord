const { sendModLog, handlemsg, getOrCreateSettings } = require(`${process.cwd()}/src/utils/functions`)

module.exports = {
    name: "messageUpdate",
    async execute(oldMessage, newMessage, client) {
        if (newMessage.partial || !newMessage.author || newMessage.author.bot || !newMessage.guild) return
        if (oldMessage.content === newMessage.content) return

        let ls = client.getLanguage(newMessage.guild.id)

        const settings = client.settings.mapCache?.get(newMessage.guild.id) || await getOrCreateSettings(client, newMessage.guild.id)
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
