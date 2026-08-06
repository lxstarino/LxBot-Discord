const { PermissionsBitField } = require("discord.js")

module.exports = {
    customId: "voice-unlock",
    async execute(client, interaction, ls, handlemsg) {
        const { getOrCreateSettings, getVoicePanelData } = require(`${process.cwd()}/src/handlers/functions`)
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

        await voiceChannel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
            Connect: null
        })

        const panelData = getVoicePanelData(client, interaction.guild, voiceChannel, interaction.user.id)
        await client.Embed(panelData.embeds, panelData.components, "update", undefined, interaction)
    }
}
