const { SlashCommandBuilder } = require("@discordjs/builders")
const { PermissionsBitField } = require("discord.js")

module.exports = {
    data: new SlashCommandBuilder()
        .setName("clear-warns")
        .setDescription("Clear all warnings of a user")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ModerateMembers)
        .addUserOption((option) => option
            .setName("target")
            .setDescription("The user whose warnings you want to clear")
            .setRequired(true)
        ),
    async execute(client, interaction) {
        const target = interaction.options.get("target")

        let ls = client.getLanguage(interaction.guild?.id)
        const { handlemsg, getOrCreateProfile } = require(`${process.cwd()}/src/handlers/functions`)

        const profile = await getOrCreateProfile(client, target.user.id, interaction.guild.id)
        profile.warnings = []

        await client.economy.saveData()

        client.Embed([{
            title: ls["cmds"]["clear-warns"]["title"],
            desc: handlemsg(ls["cmds"]["clear-warns"]["success"], { target: target.user.id }),
            timestamp: interaction.createdTimestamp,
            footer: { text: `Moderator: ${interaction.user.tag}` }
        }], undefined, "reply", false, interaction)

        const { sendModLog } = require(`${process.cwd()}/src/handlers/functions`)
        await sendModLog(client, interaction.guild, {
            title: ls["logs"]["clear_warns_title"],
            desc: handlemsg(ls["logs"]["clear_warns_desc"], {
                target: target.user.id,
                tag: target.user.tag,
                moderator: interaction.user.id
            }),
            color: "#3498db",
            timestamp: Date.now()
        })
    }
}
