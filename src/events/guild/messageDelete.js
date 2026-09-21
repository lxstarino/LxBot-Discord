const { sendModLog } = require("../../services/SecurityService")
const { handlemsg } = require("../../utils/stringUtils")
const { getOrCreateSettings } = require("../../repositories/SettingsRepository")

module.exports = {
    name: "messageDelete",
    async execute(message, client) {
        if (message.partial || !message.author || message.author.bot || !message.guild) return

        const ls = client.getLanguage(message.guild.id)

        const settings = client.settings?.get(message.guild.id) || await getOrCreateSettings(client, message.guild.id)
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
