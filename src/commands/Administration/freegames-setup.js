
const { PermissionsBitField, ChannelType, SlashCommandBuilder } = require("discord.js")
const { handlemsg } = require("../../utils/stringUtils")
const { getOrCreateSettings } = require("../../repositories/SettingsRepository")

module.exports = {
    guildOnly: true,
    data: new SlashCommandBuilder()
        .setName("freegames-setup")
        .setDescription("Configure the automatic Steam & Epic Games free games tracker")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .addSubcommand(subcmd => subcmd
            .setName("set")
            .setDescription("Set the channel where free games announcements will be sent")
            .addChannelOption(opt => opt
                .setName("channel")
                .setDescription("The text channel to send announcements to")
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)
            )
        )
        .addSubcommand(subcmd => subcmd
            .setName("disable")
            .setDescription("Disable the free games tracker announcements")
        ),
    async execute(client, interaction) {
        const subcommand = interaction.options.getSubcommand();

        let ls = client.getLanguage(interaction.guild?.id);

        const settings = await getOrCreateSettings(client, interaction.guild.id);

        if (subcommand === "set") {
            const channel = interaction.options.getChannel("channel");

            const botMember = interaction.guild.members.me;
            const perms = channel.permissionsFor(botMember);
            if (!perms.has(PermissionsBitField.Flags.SendMessages) || !perms.has(PermissionsBitField.Flags.EmbedLinks)) {
                return client.errEmbed({
                    type: "reply",
                    ephemeral: true,
                    title: ls["cmds"]["freegames-setup"]["title"],
                    desc: handlemsg(ls["cmds"]["freegames-setup"]["err_perms"], { channel: channel.id })
                }, interaction);
            }

            settings.freegames_channel = channel.id;

            client.Embed([{
                title: ls["cmds"]["freegames-setup"]["title"],
                desc: handlemsg(ls["cmds"]["freegames-setup"]["set_success"], { channel: channel.id }),
                timestamp: interaction.createdTimestamp
            }], undefined, "reply", true, interaction);

        } else if (subcommand === "disable") {
            settings.freegames_channel = null;

            client.Embed([{
                title: ls["cmds"]["freegames-setup"]["title"],
                desc: ls["cmds"]["freegames-setup"]["disabled"],
                timestamp: interaction.createdTimestamp
            }], undefined, "reply", true, interaction);
        }
    }
};
