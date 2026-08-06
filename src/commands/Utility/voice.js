const { SlashCommandBuilder } = require("@discordjs/builders")

module.exports = {
    data: new SlashCommandBuilder()
        .setName("voice")
        .setDescription("Open the Voice Channel Control Panel"),

    async execute(client, interaction) {
        const ls = client.getLanguage(interaction.guild?.id)
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

        const panelData = getVoicePanelData(client, interaction.guild, voiceChannel, interaction.user.id)
        await client.Embed(panelData.embeds, panelData.components, "reply", true, interaction)
    }
}
