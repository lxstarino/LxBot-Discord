const { SlashCommandBuilder, PermissionsBitField, ChannelType } = require("discord.js")
const { handlemsg } = require("../../utils/stringUtils")
const defaultDb = require("../../database/Database")
const { attachCollector, buildComponents, buildEmbed } = require("../../restore/modules/polls")

module.exports = {
    guildOnly: true,
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName("poll")
        .setDescription("Create an interactive poll with up to 5 options")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .addStringOption((option) => option
            .setName("question")
            .setDescription("The poll question")
            .setRequired(true)
            .setMaxLength(256)
        )
        .addStringOption((option) => option
            .setName("option1")
            .setDescription("First option")
            .setRequired(true)
            .setMaxLength(80)
        )
        .addStringOption((option) => option
            .setName("option2")
            .setDescription("Second option")
            .setRequired(true)
            .setMaxLength(80)
        )
        .addStringOption((option) => option
            .setName("option3")
            .setDescription("Third option (optional)")
            .setRequired(false)
            .setMaxLength(80)
        )
        .addStringOption((option) => option
            .setName("option4")
            .setDescription("Fourth option (optional)")
            .setRequired(false)
            .setMaxLength(80)
        )
        .addStringOption((option) => option
            .setName("option5")
            .setDescription("Fifth option (optional)")
            .setRequired(false)
            .setMaxLength(80)
        )
        .addChannelOption((option) => option
            .setName("channel")
            .setDescription("Channel to send the poll to (default: current channel)")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(false)
        )
        .addIntegerOption((option) => option
            .setName("duration")
            .setDescription("Poll duration in minutes (default: 60, max: 10080 / 1 week)")
            .setMinValue(1)
            .setMaxValue(10080)
            .setRequired(false)
        ),

    async execute(client, interaction) {
        const question = interaction.options.getString("question")
        const targetChannel = interaction.options.getChannel("channel") || interaction.channel
        const durationMs = (interaction.options.getInteger("duration") || 60) * 60 * 1000

        const ls = client.getLanguage(interaction.guild?.id)

        const options = ["option1", "option2", "option3", "option4", "option5"]
            .map(name => interaction.options.getString(name))
            .filter(Boolean)

        const perms = targetChannel.permissionsFor(interaction.guild.members.me)
        if (!perms.has(PermissionsBitField.Flags.SendMessages) || !perms.has(PermissionsBitField.Flags.EmbedLinks)) {
            return client.errEmbed({
                type: "reply", ephemeral: true,
                desc: handlemsg(ls["cmds"]["poll"]["missing_perms"], { channel: targetChannel.id })
            }, interaction)
        }

        const endsAt = Date.now() + durationMs
        const pollData = {
            guildId: interaction.guild.id,
            channelId: targetChannel.id,
            messageId: null,
            question, options, endsAt,
            creatorTag: interaction.user.tag,
            creatorAvatar: interaction.user.displayAvatarURL(),
            voterMap: {}
        }

        const pollMsg = await client.Embed(
            [buildEmbed(ls["cmds"]["poll"]["title"], question, options, {}, endsAt, pollData.creatorTag, pollData.creatorAvatar, handlemsg, ls, client)],
            buildComponents(options, false),
            "send",
            false,
            targetChannel
        )

        pollData.messageId = pollMsg.id
        const database = client.db || defaultDb
        database.savePoll(pollData)

        attachCollector(client, pollMsg, pollData, handlemsg)

        client.successEmbed({
            type: "reply", ephemeral: true,
            desc: handlemsg(ls["cmds"]["poll"]["pollcreated"], { channel: targetChannel.id }),
        }, interaction)
    }
}
