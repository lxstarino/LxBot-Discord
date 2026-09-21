const { SlashCommandBuilder, PermissionsBitField, ChannelType } = require("discord.js")
const { handlemsg } = require("../../utils/stringUtils")
const defaultDb = require("../../database/Database")
const { attachCollector, participationRow, buildGiveawayEmbed } = require("../../restore/modules/giveaways")

module.exports = {
    guildOnly: true,
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName("giveaway")
        .setDescription("Create an interactive giveaway")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .addStringOption((option) => option
            .setName("prize")
            .setDescription("The prize of the giveaway")
            .setRequired(true)
            .setMaxLength(256)
        )
        .addChannelOption((option) => option
            .setName("channel")
            .setDescription("Channel to send the giveaway to (default: current channel)")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(false)
        )
        .addIntegerOption((option) => option
            .setName("duration")
            .setDescription("Giveaway duration in minutes (default: 60, max: 10080 / 1 week)")
            .setMinValue(1)
            .setMaxValue(10080)
            .setRequired(false)
        ),
    async execute(client, interaction) {
        const prize = interaction.options.getString("prize")
        const targetChannel = interaction.options.getChannel("channel") || interaction.channel
        const durationMs = (interaction.options.getInteger("duration") || 60) * 60 * 1000

        const ls = client.getLanguage(interaction.guild?.id)

        const perms = targetChannel.permissionsFor(interaction.guild.members.me)
        if (!perms.has(PermissionsBitField.Flags.SendMessages) || !perms.has(PermissionsBitField.Flags.EmbedLinks)) {
            return client.errEmbed({
                type: "reply",
                ephemeral: true,
                desc: handlemsg(ls["cmds"]["giveaway"]["missing_perms"], { channel: targetChannel.id })
            }, interaction)
        }

        const endsAt = Date.now() + durationMs
        const giveawayData = {
            guildId: interaction.guild.id,
            channelId: targetChannel.id,
            messageId: null,
            prize,
            endsAt,
            creatorId: interaction.user.id,
            creatorTag: interaction.user.tag,
            creatorAvatar: interaction.user.displayAvatarURL(),
            entries: []
        }

        const giveawayMsg = await client.Embed(
            [buildGiveawayEmbed(giveawayData, handlemsg, ls)],
            [participationRow(false, ls)],
            "send",
            false,
            targetChannel
        )

        giveawayData.messageId = giveawayMsg.id
        const database = client.db || defaultDb
        database.saveGiveaways(giveawayData)

        attachCollector(client, giveawayMsg, giveawayData, handlemsg)

        client.successEmbed({
            type: "reply",
            ephemeral: true,
            desc: handlemsg(ls["cmds"]["giveaway"]["giveaway_created"], { channel: targetChannel.id })
        }, interaction)
    }
}
