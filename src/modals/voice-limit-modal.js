module.exports = {
    customId: "voice-limit-modal",
    async execute(client, interaction, ls, handlemsg) {
        const { getOrCreateSettings } = require(`${process.cwd()}/src/handlers/functions`)
        const settings = await getOrCreateSettings(client, interaction.guild.id)
        const voiceChannel = interaction.member.voice.channel

        if (!voiceChannel) {
            return client.errEmbed({
                type: "reply",
                ephemeral: true,
                title: ls["cmds"]["voice"]["title"],
                desc: ls["cmds"]["voice"]["not_in_voice"]
            }, interaction)
        }

        const tempChan = settings.temp_voice_channels?.find(c => {
            const chId = typeof c === "string" ? c : c.channelId
            return chId === voiceChannel.id
        })

        if (!tempChan) {
            return client.errEmbed({
                type: "reply",
                ephemeral: true,
                title: ls["cmds"]["voice"]["title"],
                desc: ls["cmds"]["voice"]["not_in_voice"]
            }, interaction)
        }

        const ownerId = typeof tempChan === "string" ? null : tempChan.ownerId
        if (ownerId && ownerId !== interaction.user.id) {
            return client.errEmbed({
                type: "reply",
                ephemeral: true,
                title: ls["cmds"]["voice"]["title"],
                desc: ls["cmds"]["voice"]["not_owner"]
            }, interaction)
        }

        const limitStr = interaction.fields.getTextInputValue("voice-limit-input")
        const newLimit = parseInt(limitStr.trim(), 10)

        if (isNaN(newLimit) || newLimit < 0 || newLimit > 99) {
            return client.errEmbed({
                type: "reply",
                ephemeral: true,
                title: ls["cmds"]["voice"]["title"],
                desc: "Please enter a valid number between 0 and 99!"
            }, interaction)
        }

        await voiceChannel.setUserLimit(newLimit)

        const displayLimit = newLimit === 0 ? ls["cmds"]["voice"]["panel_status_no_limit"] : newLimit
        await client.Embed([{
            title: ls["cmds"]["voice"]["title"],
            desc: handlemsg(ls["cmds"]["voice"]["limit_changed"], { limit: displayLimit }),
            color: 0x5865F2,
            timestamp: new Date().toISOString()
        }], undefined, "reply", true, interaction)
    }
}
