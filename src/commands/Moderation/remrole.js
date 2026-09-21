const { PermissionsBitField, SlashCommandBuilder } = require("discord.js")
const { handlemsg } = require("../../utils/stringUtils")

module.exports = {
    guildOnly: true,
    data: new SlashCommandBuilder()
        .setName("remrole")
        .setDescription("Remove a role from a user")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles)
        .addUserOption((option) => option
            .setName("target")
            .setDescription("The user to remove the role from")
            .setRequired(true)
        )
        .addRoleOption((option) => option
            .setName("role")
            .setDescription("The role to remove")
            .setRequired(true)
        ),
    async execute(client, interaction) {
        const target = interaction.options.get("target")

        const ls = client.getLanguage(interaction.guild?.id)

        const role = interaction.options.getRole("role")
        if (!target.member) throw ({ title: `${ls["errors"]["unf"]}`, desc: `${handlemsg(ls["cmds"]["add/remrole"]["edesc2"], { target: target.user.id })}` })
        if (!role || role.name === "@everyone") throw ({ title: `${ls["errors"]["ivr"]}`, desc: `${handlemsg(ls["cmds"]["add/remrole"]["edesc3"], { target: target.user.id })}` })

        try {
            await target.member.roles.remove(role.id)
            client.successEmbed({
                type: "reply",
                ephemeral: true,
                desc: `${handlemsg(ls["cmds"]["add/remrole"]["desc2"], { target: target.user.id, role: role.id })}`
            }, interaction)
        } catch (err) {
            throw ({ title: `${ls["errors"]["mp"]}`, desc: `${ls["cmds"]["add/remrole"]["edesc4"]}` })
        }
    }
}
