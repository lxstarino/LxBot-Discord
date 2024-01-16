const { SlashCommandBuilder } = require("@discordjs/builders")
const { PermissionsBitField } = require("discord.js")

module.exports = {
    data: new SlashCommandBuilder()
    .setName("remrole")
    .setDescription("Remove a Role from a User")
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles)
    .addUserOption((option) => option
        .setName("target")
        .setDescription("target")
        .setRequired(true)
    )
    .addRoleOption((option) => option
        .setName("role")
        .setDescription("role")
        .setRequired(true)
    ),
    async execute(client, interaction) {
        const target = interaction.options.get("target")

        const settings = client.settings.storage.data.find(x => x.guildId === interaction.guild.id)
        let ls = settings ? settings.language ? require(`${process.cwd()}/src/languages/${settings.language}.json`) : require(`${process.cwd()}/src/languages/en.json`) : require(`${process.cwd()}/src/languages/en.json`)
        const { handlemsg } = require(`${process.cwd()}/src/handlers/functions`)

        const role = interaction.guild.roles.cache.find(role => role.id === interaction.options.get("role").value)
        if(!interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) throw({title: `${ls["errors"]["mp"]}`, desc: `${handlemsg(ls["cmds"]["add/remrole"]["edesc1"], {target: target.user.id})}`})
        if(!target.member) throw({title: `${ls["errors"]["unf"]}`, desc: `${handlemsg(ls["cmds"]["add/remrole"]["edesc2"], {target: target.user.id})}`})
        if(!role || role.name == "@everyone") throw({title: `${ls["errors"]["ivr"]}`, desc: `${handlemsg(ls["cmds"]["add/remrole"]["edesc3"], {target: target.user.id})}`})

        await target.member.roles.remove(role.id).then(() => {client.successEmbed({
            type: "reply", 
            ephemeral: true, 
            desc: `${handlemsg(ls["cmds"]["add/remrole"]["desc2"], {target: target.user.id, role: role.id})}`
        }, interaction)}).catch(() => {
            throw({title: `${ls["errors"]["mp"]}`, desc: `${ls["cmds"]["add/remrole"]["edesc4"]}`})
        }) 
    }
}
