const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require("discord.js")

module.exports = {
    customId: "voice-rename",
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

        const modal = new ModalBuilder()
            .setCustomId("voice-rename-modal")
            .setTitle(ls["cmds"]["voice"]["modal_rename_title"])

        const nameInput = new TextInputBuilder()
            .setCustomId("voice-rename-input")
            .setLabel(ls["cmds"]["voice"]["modal_rename_label"])
            .setStyle(TextInputStyle.Short)
            .setPlaceholder(voiceChannel.name)
            .setMinLength(1)
            .setMaxLength(100)
            .setRequired(true)

        const row = new ActionRowBuilder().addComponents(nameInput)
        modal.addComponents(row)

        await interaction.showModal(modal)
    }
}
