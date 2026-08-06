const { sendModLog, handlemsg, getOrCreateSettings } = require(`${process.cwd()}/src/handlers/functions`)

module.exports = {
    name: "messageDelete",
    async execute(message, client) {
        if (message.partial || !message.author || message.author.bot || !message.guild) return

        let ls = client.getLanguage(message.guild.id)

        const settings = client.settings.mapCache?.get(message.guild.id) || await getOrCreateSettings(client, message.guild.id)
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
