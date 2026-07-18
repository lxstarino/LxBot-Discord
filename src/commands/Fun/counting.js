const { SlashCommandBuilder } = require("@discordjs/builders")
const { PermissionsBitField, ChannelType } = require("discord.js")

module.exports = {
    data: new SlashCommandBuilder()
        .setName("counting")
        .setDescription("Manage or view the counting game")
        .addSubcommand(sub => sub
            .setName("setup")
            .setDescription("Setup the counting channel (Admin only)")
            .addChannelOption(opt => opt
                .setName("channel")
                .setDescription("The text channel to use for counting")
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)
            )
        )
        .addSubcommand(sub => sub
            .setName("disable")
            .setDescription("Disable the counting game (Admin only)")
        )
        .addSubcommand(sub => sub
            .setName("info")
            .setDescription("Show current counting game status")
        ),

    async execute(client, interaction) {
        const subcommand = interaction.options.getSubcommand()
        const ls = client.getLanguage(interaction.guild?.id)
        const { handlemsg, getOrCreateSettings } = require(`${process.cwd()}/src/handlers/functions`)

        const settings = await getOrCreateSettings(client, interaction.guild.id)

        if (subcommand === "setup") {
            // Require Administrator permission
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return client.errEmbed({
                    type: "reply",
                    ephemeral: true,
                    title: ls["cmds"]["counting"]["title"],
                    desc: ls["cmds"]["counting"]["admin_only"]
                }, interaction)
            }

            const channel = interaction.options.getChannel("channel")

            // Check bot perms in target channel
            const botMember = interaction.guild.members.me
            const perms = channel.permissionsFor(botMember)
            if (!perms.has(PermissionsBitField.Flags.SendMessages) || !perms.has(PermissionsBitField.Flags.EmbedLinks) || !perms.has(PermissionsBitField.Flags.ReadMessageHistory)) {
                return client.errEmbed({
                    type: "reply",
                    ephemeral: true,
                    title: ls["cmds"]["counting"]["title"],
                    desc: handlemsg(ls["cmds"]["counting"]["err_perms"], { channel: channel.id })
                }, interaction)
            }

            settings.counting_channel = channel.id
            settings.counting_current = 0
            settings.counting_last_user = null
            await client.settings.saveData()

            client.Embed([{
                title: ls["cmds"]["counting"]["title"],
                desc: handlemsg(ls["cmds"]["counting"]["setup_success"], {
                    channel: channel.id,
                    highscore: String(settings.counting_highscore || 0)
                }),
                timestamp: interaction.createdTimestamp
            }], undefined, "reply", false, interaction)

        } else if (subcommand === "disable") {
            // Require Administrator permission
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return client.errEmbed({
                    type: "reply",
                    ephemeral: true,
                    title: ls["cmds"]["counting"]["title"],
                    desc: ls["cmds"]["counting"]["admin_only"]
                }, interaction)
            }

            settings.counting_channel = null
            settings.counting_current = 0
            settings.counting_last_user = null
            await client.settings.saveData()

            client.Embed([{
                title: ls["cmds"]["counting"]["title"],
                desc: ls["cmds"]["counting"]["disabled"],
                timestamp: interaction.createdTimestamp
            }], undefined, "reply", false, interaction)

        } else if (subcommand === "info") {
            if (!settings.counting_channel) {
                return client.Embed([{
                    title: ls["cmds"]["counting"]["title"],
                    desc: ls["cmds"]["counting"]["not_set"],
                    timestamp: interaction.createdTimestamp
                }], undefined, "reply", false, interaction)
            }

            const lastUserText = settings.counting_last_user 
                ? `<@!${settings.counting_last_user}>` 
                : ls["cmds"]["counting"]["no_last_user"]

            client.Embed([{
                title: ls["cmds"]["counting"]["title"],
                desc: handlemsg(ls["cmds"]["counting"]["info_desc"], {
                    current: String(settings.counting_current || 0),
                    highscore: String(settings.counting_highscore || 0),
                    last_user: lastUserText
                }),
                timestamp: interaction.createdTimestamp
            }], undefined, "reply", false, interaction)
        }
    }
}
