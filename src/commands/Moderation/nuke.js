const { SlashCommandBuilder } = require("@discordjs/builders")
const { PermissionsBitField } = require("discord.js")

module.exports = {
    data: new SlashCommandBuilder()
    .setName("nuke")
    .setDescription("Nuke the current channel")
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
    async execute(client, interaction){
        let ls = client.getLanguage(interaction.guild?.id)
        const { handlemsg } = require(`${process.cwd()}/src/handlers/functions`)

        try {
            const originalPosition = interaction.channel.position
            const newChannel = await interaction.channel.clone()
            await newChannel.setPosition(originalPosition)
            await interaction.channel.delete()

            await client.successEmbed({
                title: "Nuke",
                desc: handlemsg(ls["cmds"]["nuke"]["desc"], {user: interaction.user.id})
            }, newChannel)
        } catch (err) {
            console.error(err)
            throw err
        }
    }
}
