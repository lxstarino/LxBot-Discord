const { SlashCommandBuilder } = require("@discordjs/builders")
const { PermissionsBitField } = require("discord.js")

module.exports = {
    data: new SlashCommandBuilder()
    .setName("nuke")
    .setDescription("Nuke the current channel")
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
    async execute(client, interaction){
        const settings = client.settings.storage.data.find(x => x.guildId === interaction.guild.id)
        let ls = settings ? settings.language ? require(`${process.cwd()}/src/languages/${settings.language}.json`) : require(`${process.cwd()}/src/languages/en.json`) : require(`${process.cwd()}/src/languages/en.json`)
        const { handlemsg } = require(`${process.cwd()}/src/handlers/functions`)

        if(!interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageChannels)) throw({title: `${ls["errors"]["mp"]}`, desc: handlemsg(ls["cmds"]["nuke"]["edesc"], {channel: interaction.channel.id})})

        await interaction.channel.clone().then(async channel => {
            await channel.setPosition(interaction.channel.position).then(
                await interaction.channel.delete()
            )

            await client.successEmbed({
                title: "Nuke",
                desc: handlemsg(ls["cmds"]["nuke"]["desc"], {user: interaction.user.id})
            }, channel)
        })
    }
}
