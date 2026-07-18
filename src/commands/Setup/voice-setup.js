const { SlashCommandBuilder } = require("@discordjs/builders")
const { PermissionsBitField, ChannelType } = require("discord.js")

module.exports = {
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
        const { handlemsg, getOrCreateSettings } = require(`${process.cwd()}/src/handlers/functions`)

        const settings = await getOrCreateSettings(client, interaction.guild.id)

        // Check if the bot has permissions to manage channels & move members
        const botMember = interaction.guild.members.me
        if (!botMember.permissions.has(PermissionsBitField.Flags.ManageChannels) || !botMember.permissions.has(PermissionsBitField.Flags.MoveMembers)) {
            return client.errEmbed({
                type: "reply",
                ephemeral: true,
                title: ls["cmds"]["voice-setup"]["title"],
                desc: ls["cmds"]["voice-setup"]["err_perms"]
            }, interaction)
        }

        if (subcommand === "create") {
            await interaction.deferReply({ ephemeral: true })

            try {
                // 1. Create Category
                const category = await interaction.guild.channels.create({
                    name: "Temp Voice Channels",
                    type: ChannelType.GuildCategory
                })

                // 2. Create Voice Channel inside Category
                const channel = await interaction.guild.channels.create({
                    name: "➕ Join to Create",
                    type: ChannelType.GuildVoice,
                    parent: category.id
                })

                settings.voice_creator_channel = channel.id
                settings.temp_voice_channels = []
                await client.settings.saveData()

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
                    title: ls["cmds"]["voice-setup"]["title"],
                    desc: "An error occurred while creating the channels. Make sure my role has correct channel permissions!"
                }, interaction)
            }

        } else if (subcommand === "disable") {
            await interaction.deferReply({ ephemeral: true })

            try {
                // Delete creator channel if it exists
                if (settings.voice_creator_channel) {
                    const creatorChan = interaction.guild.channels.cache.get(settings.voice_creator_channel)
                    if (creatorChan) {
                        const category = creatorChan.parent
                        await creatorChan.delete().catch(() => {})
                        if (category && category.children.cache.size === 0) {
                            await category.delete().catch(() => {})
                        }
                    }
                }

                // Delete all active temp voice channels
                if (settings.temp_voice_channels && settings.temp_voice_channels.length > 0) {
                    for (const chId of settings.temp_voice_channels) {
                        const channel = interaction.guild.channels.cache.get(chId)
                        if (channel) {
                            await channel.delete().catch(() => {})
                        }
                    }
                }

                settings.voice_creator_channel = null
                settings.temp_voice_channels = []
                await client.settings.saveData()

                client.Embed([{
                    title: ls["cmds"]["voice-setup"]["title"],
                    desc: ls["cmds"]["voice-setup"]["disabled"],
                    timestamp: interaction.createdTimestamp
                }], undefined, "editReply", true, interaction)

            } catch (err) {
                console.error("Temp-Voice disable failed:", err)
                client.errEmbed({
                    type: "editReply",
                    title: ls["cmds"]["voice-setup"]["title"],
                    desc: "An error occurred while disabling the system."
                }, interaction)
            }
        }
    }
}
