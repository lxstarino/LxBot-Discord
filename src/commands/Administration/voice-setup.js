const { SlashCommandBuilder, PermissionsBitField, ChannelType } = require("discord.js")
const { handlemsg } = require("../../utils/stringUtils")
const { getOrCreateSettings } = require("../../repositories/SettingsRepository")

module.exports = {
    guildOnly: true,
    data: new SlashCommandBuilder()
        .setName("voice-setup")
        .setDescription("Setup or disable the Join-to-Create temporary voice channel system")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .addSubcommand(sub => sub
            .setName("create")
            .setDescription("Automatically create a Temp-Voice category and creator channel")
        )
        .addSubcommand(sub => sub
            .setName("disable")
            .setDescription("Disable the Temp-Voice system and remove the channels")
        ),

    async execute(client, interaction) {
        const subcommand = interaction.options.getSubcommand()
        const ls = client.getLanguage(interaction.guild?.id)

        const settings = await getOrCreateSettings(client, interaction.guild.id)

        const botMember = interaction.guild.members.me
        if (!botMember.permissions.has(PermissionsBitField.Flags.ManageChannels) || !botMember.permissions.has(PermissionsBitField.Flags.MoveMembers)) {
            return client.errEmbed({
                type: "reply",
                ephemeral: true,
                desc: ls["cmds"]["voice-setup"]["err_perms"]
            }, interaction)
        }

        if (subcommand === "create") {
            await interaction.deferReply({ ephemeral: true })

            try {
                const category = await interaction.guild.channels.create({
                    name: "Temp Voice Channels",
                    type: ChannelType.GuildCategory
                })

                const channel = await interaction.guild.channels.create({
                    name: "➕ Join to Create",
                    type: ChannelType.GuildVoice,
                    parent: category.id
                })

                settings.voice_creator_channel = channel.id
                settings.temp_voice_channels = []

                client.Embed([{
                    title: ls["cmds"]["voice-setup"]["title"],
                    desc: handlemsg(ls["cmds"]["voice-setup"]["setup_success"], {
                        category: category.name,
                        channel: channel.id
                    }),
                    timestamp: interaction.createdTimestamp
                }], undefined, "editReply", true, interaction)

            } catch (err) {
                console.error("Temp-Voice setup failed:", err)
                client.errEmbed({
                    type: "editReply",
                    desc: ls["cmds"]["voice-setup"]["err_create"] || "An error occurred while creating the channels. Make sure my role has correct channel permissions!"
                }, interaction)
            }

        } else if (subcommand === "disable") {
            await interaction.deferReply({ ephemeral: true })

            try {
                if (settings.voice_creator_channel) {
                    const creatorChan = interaction.guild.channels.cache.get(settings.voice_creator_channel)
                    if (creatorChan) {
                        const category = creatorChan.parent
                        await creatorChan.delete().catch((err) => console.error("[voice-setup] Failed to delete creator channel:", err.message))
                        if (category && category.children.cache.size === 0) {
                            await category.delete().catch((err) => console.error("[voice-setup] Failed to delete voice category:", err.message))
                        }
                    }
                }

                if (settings.temp_voice_channels && settings.temp_voice_channels.length > 0) {
                    for (const chInfo of settings.temp_voice_channels) {
                        const chId = typeof chInfo === "string" ? chInfo : chInfo.channelId
                        if (!chId) continue
                        const channel = interaction.guild.channels.cache.get(chId) || await interaction.guild.channels.fetch(chId).catch(() => null)
                        if (channel) {
                            await channel.delete().catch((err) => console.error("[voice-setup] Failed to delete temp channel:", err.message))
                        }
                    }
                }

                settings.voice_creator_channel = null
                settings.temp_voice_channels = []

                client.Embed([{
                    title: ls["cmds"]["voice-setup"]["title"],
                    desc: ls["cmds"]["voice-setup"]["disabled"],
                    timestamp: interaction.createdTimestamp
                }], undefined, "editReply", true, interaction)

            } catch (err) {
                console.error("Temp-Voice disable failed:", err)
                client.errEmbed({
                    type: "editReply",
                    desc: ls["cmds"]["voice-setup"]["err_disable"] || "An error occurred while disabling the system."
                }, interaction)
            }
        }
    }
}
