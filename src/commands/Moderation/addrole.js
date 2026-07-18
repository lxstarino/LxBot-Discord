const { SlashCommandBuilder } = require("@discordjs/builders")
const { PermissionsBitField } = require("discord.js")

module.exports = {
    data: new SlashCommandBuilder()
    .setName("addrole")
    .setDescription("Add a Role to a User")
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

        let ls = client.getLanguage(interaction.guild?.id)
        const { handlemsg } = require(`${process.cwd()}/src/handlers/functions`)

        const role = interaction.options.getRole("role")
        if(!target.member) throw({title: `${ls["errors"]["unf"]}`, desc: `${handlemsg(ls["cmds"]["add/remrole"]["edesc2"], {target: target.user.id})}`})
        if(!role || role.name == "@everyone") throw({title: `${ls["errors"]["ivr"]}`, desc: `${handlemsg(ls["cmds"]["add/remrole"]["edesc3"], {target: target.user.id})}`})

        try {
            await target.member.roles.add(role.id)
            client.successEmbed({
                type: "reply", 
                ephemeral: true, 
                desc: `${handlemsg(ls["cmds"]["add/remrole"]["desc"], {target: target.user.id, role: role.id})}`
            }, interaction)
        } catch (err) {
            throw({title: `${ls["errors"]["mp"]}`, desc: `${ls["cmds"]["add/remrole"]["edesc4"]}`})
        }  
    }
}
