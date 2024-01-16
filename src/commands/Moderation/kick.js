const { SlashCommandBuilder } = require("@discordjs/builders")
const { PermissionsBitField } = require("discord.js")

module.exports = {
    data: new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kick a user")
    .setDefaultMemberPermissions(PermissionsBitField.Flags.KickMembers)
    .addUserOption((option) => option
        .setName("target")
        .setDescription("target")
        .setRequired(true)
    ),
    async execute(client, interaction){
        const target = interaction.options.get("target")

        const settings = client.settings.storage.data.find(x => x.guildId === interaction.guild.id)
        let ls = settings ? settings.language ? require(`${process.cwd()}/src/languages/${settings.language}.json`) : require(`${process.cwd()}/src/languages/en.json`) : require(`${process.cwd()}/src/languages/en.json`)
        const { handlemsg } = require(`${process.cwd()}/src/handlers/functions`)

        if(!interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.KickMembers)) throw({title: `${ls["errors"]["mp"]}`, desc: handlemsg(ls["cmds"]["kick"]["edesc2"], {target: target.user.id})})
        if(!target.member) throw({title: ls["errors"]["unf"], desc: handlemsg(ls["cmds"]["kick"]["edesc1"], {target: target.user.id})})
        if(!target.member.moderatable) throw({title: ls["errors"]["mp"], desc: handlemsg(ls["cmds"]["kick"]["edesc2"], {target: target.user.id})})
             
        await interaction.guild.members.kick(target.user.id).then(() => {client.basicEmbed({type: "reply", title: "Kick", desc: handlemsg(ls["cmds"]["kick"]["kicked"], {target: target.user.id}), timestamp: interaction.createdTimestamp, footer: {text: `Moderator: ${interaction.user.tag}`}}, interaction)}).catch(err => console.log(err))
    }
}
