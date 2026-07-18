const { SlashCommandBuilder } = require("@discordjs/builders")
const { PermissionsBitField, ChannelType } = require("discord.js")

module.exports = {
    data: new SlashCommandBuilder()
        .setName("log-setup")
        .setDescription("Configure the moderation logs system")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .addSubcommand(subcmd => subcmd
            .setName("set")
            .setDescription("Set the channel where bot logs will be sent")
            .addChannelOption(opt => opt
                .setName("channel")
                .setDescription("The text channel to send logs to")
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)
            )
        )
        .addSubcommand(subcmd => subcmd
            .setName("disable")
            .setDescription("Disable the logs system")
        ),
    async execute(client, interaction) {
        const subcommand = interaction.options.getSubcommand()

        let ls = client.getLanguage(interaction.guild?.id)
        const { handlemsg, getOrCreateSettings } = require(`${process.cwd()}/src/handlers/functions`)

        const settings = await getOrCreateSettings(client, interaction.guild.id)

        if (subcommand === "set") {
            const channel = interaction.options.getChannel("channel")

            // Check if bot can send messages and embed links in the target channel
            const botMember = interaction.guild.members.me
            const perms = channel.permissionsFor(botMember)
            if (!perms.has(PermissionsBitField.Flags.SendMessages) || !perms.has(PermissionsBitField.Flags.EmbedLinks)) {
                return client.errEmbed({
                    type: "reply",
                    ephemeral: true,
                    title: ls["cmds"]["log-setup"]["title"],
                    desc: handlemsg(ls["cmds"]["log-setup"]["err_perms"], { channel: channel.id })
                }, interaction)
            }

            settings.logchannel = channel.id
            await client.settings.saveData()

            client.Embed([{
                title: ls["cmds"]["log-setup"]["title"],
                desc: handlemsg(ls["cmds"]["log-setup"]["set_success"], { channel: channel.id }),
                timestamp: interaction.createdTimestamp
            }], undefined, "reply", false, interaction)

        } else if (subcommand === "disable") {
            settings.logchannel = null
            await client.settings.saveData()

            client.Embed([{
                title: ls["cmds"]["log-setup"]["title"],
                desc: ls["cmds"]["log-setup"]["disabled"],
                timestamp: interaction.createdTimestamp
            }], undefined, "reply", false, interaction)
        }
    }
}
