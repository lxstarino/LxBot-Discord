const { SlashCommandBuilder } = require("@discordjs/builders")
const { PermissionsBitField, ChannelType } = require("discord.js")

module.exports = {
    data: new SlashCommandBuilder()
        .setName("counting")
        .setDescription("Manage or view the counting game")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .addSubcommand(sub => sub
            .setName("setup")
            .setDescription("Setup the counting channel")
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
            .setName("set")
            .setDescription("Manually set the current count number")
            .addIntegerOption(opt => opt
                .setName("number")
                .setDescription("The number to set the count to")
                .setRequired(true)
                .setMinValue(0)
            )
        ),

    async execute(client, interaction) {
        const subcommand = interaction.options.getSubcommand()
        const ls = client.getLanguage(interaction.guild?.id)
        const { handlemsg, getOrCreateSettings } = require(`${process.cwd()}/src/utils/functions`)

        const settings = await getOrCreateSettings(client, interaction.guild.id)

        if (subcommand === "setup") {
            const channel = interaction.options.getChannel("channel")

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

            client.Embed([{
                title: ls["cmds"]["counting"]["title"],
                desc: handlemsg(ls["cmds"]["counting"]["setup_success"], {
                    channel: channel.id,
                    highscore: String(settings.counting_highscore || 0)
                }),
                timestamp: interaction.createdTimestamp
            }], undefined, "reply", true, interaction)

        } else if (subcommand === "disable") {
            settings.counting_channel = null
            settings.counting_current = 0
            settings.counting_last_user = null

            client.Embed([{
                title: ls["cmds"]["counting"]["title"],
                desc: ls["cmds"]["counting"]["disabled"],
                timestamp: interaction.createdTimestamp
            }], undefined, "reply", true, interaction)

        } else if (subcommand === "set") {
            if (!settings.counting_channel) {
                return client.Embed([{
                    title: ls["cmds"]["counting"]["title"],
                    desc: ls["cmds"]["counting"]["not_set"],
                    timestamp: interaction.createdTimestamp
                }], undefined, "reply", true, interaction)
            }

            const number = interaction.options.getInteger("number")

            settings.counting_current = number
            settings.counting_last_user = null

            client.Embed([{
                title: ls["cmds"]["counting"]["title"],
                desc: handlemsg(ls["cmds"]["counting"]["set_count_success"], {
                    count: String(number)
                }),
                timestamp: interaction.createdTimestamp
            }], undefined, "reply", true, interaction)
        }
    }
}
