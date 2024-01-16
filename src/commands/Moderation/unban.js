const { SlashCommandBuilder } = require("@discordjs/builders")
const { PermissionsBitField } = require("discord.js")

module.exports = {
    data: new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Unban a User")
    .setDefaultMemberPermissions(PermissionsBitField.Flags.BanMembers)
    .addUserOption((option) => option
        .setName("target")
        .setDescription("target")
        .setRequired(true)
    ),
    async execute(client, interaction) {
        const target = interaction.options.get("target")

        const settings = client.settings.storage.data.find(x => x.guildId === interaction.guild.id)
        let ls = settings ? settings.language ? require(`${process.cwd()}/src/languages/${settings.language}.json`) : require(`${process.cwd()}/src/languages/en.json`) : require(`${process.cwd()}/src/languages/en.json`)
        const { handlemsg } = require(`${process.cwd()}/src/handlers/functions`)

        if(!interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.BanMembers)) throw({title: `${ls["errors"]["mp"]}`, desc: handlemsg(ls["cmds"]["ban/unban"]["edesc1"], {target: target.user.id})})
        const banList = await interaction.guild.bans.fetch()
        if(!banList.get(target.user.id)) throw({title: `${ls["errors"]["uinb"]}`, desc: handlemsg(ls["cmds"]["ban/unban"]["edesc3"], {target: target.user.id})})
           
        await interaction.guild.members.unban(target.user.id).then(() => {client.basicEmbed({type: "reply", title: "Unban", desc: handlemsg(ls["cmds"]["ban/unban"]["unbanned"], {target: target.user.id}), timestamp: interaction.createdTimestamp, footer: {text: `Moderator: ${interaction.user.tag}`}}, interaction)}).catch(err => console.log(err))
    }
}
