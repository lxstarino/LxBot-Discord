module.exports = {
    customId: "voice-kick-modal",
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

        const query = interaction.fields.getTextInputValue("voice-kick-input").trim().toLowerCase()
        const members = voiceChannel.members
        const targetMember = members.find(m => {
            return m.id === query ||
                   m.user.username.toLowerCase() === query ||
                   m.user.tag.toLowerCase() === query ||
                   m.displayName.toLowerCase() === query
        })

        if (!targetMember) {
            return client.errEmbed({
                type: "reply",
                ephemeral: true,
                title: ls["cmds"]["voice"]["title"],
                desc: handlemsg(ls["cmds"]["voice"]["kick_err_not_in_channel"], { target: query })
            }, interaction)
        }

        if (targetMember.id === interaction.user.id) {
            return client.errEmbed({
                type: "reply",
                ephemeral: true,
                title: ls["cmds"]["voice"]["title"],
                desc: ls["cmds"]["voice"]["kick_err_self"]
            }, interaction)
        }

        await targetMember.voice.disconnect().catch(err => console.error(err))

        await client.Embed([{
            title: ls["cmds"]["voice"]["title"],
            desc: handlemsg(ls["cmds"]["voice"]["kicked"], { target: targetMember.id }),
            color: 0x5865F2,
            timestamp: new Date().toISOString()
        }], undefined, "reply", true, interaction)
    }
}
