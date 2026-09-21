const { PermissionsBitField, SlashCommandBuilder } = require("discord.js")
const { handlemsg } = require("../../utils/stringUtils")

module.exports = {
    guildOnly: true,
    cooldown: 10,
    data: new SlashCommandBuilder()
        .setName("nuke")
        .setDescription("Nuke the current channel")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
    async execute(client, interaction) {
        const ls = client.getLanguage(interaction.guild?.id)

        try {
            await interaction.deferReply({ ephemeral: true }).catch((err) => console.error("[nuke] Failed to defer reply:", err.message))

            const originalPosition = interaction.channel.position
            const newChannel = await interaction.channel.clone()
            await newChannel.setPosition(originalPosition)
            await interaction.channel.delete().catch((err) => console.error("[nuke] Failed to delete original channel:", err.message))

            await client.successEmbed({
                title: ls["cmds"]["nuke"]["title"] || "💥 Nuke",
                desc: handlemsg(ls["cmds"]["nuke"]["desc"], { user: interaction.user.id })
            }, newChannel).catch((err) => console.error("[nuke] Failed to send success embed in new channel:", err.message))
        } catch (err) {
            console.error("[nuke] Error nuking channel:", err)
            throw err
        }
    }
}
