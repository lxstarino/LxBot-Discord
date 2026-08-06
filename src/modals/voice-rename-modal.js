module.exports = {
    customId: "voice-rename-modal",
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

        const newName = interaction.fields.getTextInputValue("voice-rename-input")
        await voiceChannel.setName(newName)

        await client.Embed([{
            title: ls["cmds"]["voice"]["title"],
            desc: handlemsg(ls["cmds"]["voice"]["name_changed"], { name: newName }),
            color: 0x5865F2,
            timestamp: new Date().toISOString()
        }], undefined, "reply", true, interaction)
    }
}
