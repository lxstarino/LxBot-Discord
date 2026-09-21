const { SlashCommandBuilder, ChannelType } = require("discord.js")
const { handlemsg } = require("../../utils/stringUtils")

module.exports = {
    guildOnly: true,
    cooldown: 3,
    data: new SlashCommandBuilder()
        .setName("channelinfo")
        .setDescription("Displays information about a channel")
        .addChannelOption(opt => opt
            .setName("channel")
            .setDescription("The channel you want to view")),
    async execute(client, interaction) {
        const ls = client.getLanguage(interaction.guild?.id)

        const targetChannel = interaction.options.getChannel("channel") || interaction.channel
        const channel = await interaction.guild.channels.fetch(targetChannel.id).catch(() => targetChannel)

        const typeLabels = {
            [ChannelType.GuildText]: ls["cmds"]["channelinfo"]["tc"],
            [ChannelType.GuildVoice]: ls["cmds"]["channelinfo"]["vc"],
            [ChannelType.GuildAnnouncement]: ls["cmds"]["channelinfo"]["ac"],
            [ChannelType.AnnouncementThread]: ls["cmds"]["channelinfo"]["at"],
            [ChannelType.PublicThread]: ls["cmds"]["channelinfo"]["pt"],
            [ChannelType.PrivateThread]: ls["cmds"]["channelinfo"]["pt2"],
            [ChannelType.GuildStageVoice]: ls["cmds"]["channelinfo"]["svc"],
            [ChannelType.GuildForum]: ls["cmds"]["channelinfo"]["fc"]
        }

        const parentCategory = channel.parent ? channel.parent.name : ls["cmds"]["channelinfo"]["none"]
        const createdTimestamp = Math.round(channel.createdTimestamp / 1000)

        const generalSection = handlemsg(ls["cmds"]["channelinfo"]["general_val"], {
            type: typeLabels[channel.type] || ls["cmds"]["channelinfo"]["tnf"],
            category: parentCategory,
            created: String(createdTimestamp),
            pos: String(channel.rawPosition ?? channel.position ?? 0)
        })

        const slowmodeText = channel.rateLimitPerUser > 0
            ? handlemsg(ls["cmds"]["channelinfo"]["seconds"], { time: String(channel.rateLimitPerUser) })
            : ls["cmds"]["channelinfo"]["none"]

        let settingsSection = handlemsg(ls["cmds"]["channelinfo"]["settings_val"], {
            slowmode: slowmodeText,
            nsfw: channel.nsfw ? ls["cmds"]["channelinfo"]["yes"] : ls["cmds"]["channelinfo"]["no"],
            overwrites: String(channel.permissionOverwrites?.cache?.size || 0)
        })

        if (channel.type === ChannelType.GuildVoice || channel.type === ChannelType.GuildStageVoice) {
            settingsSection += handlemsg(ls["cmds"]["channelinfo"]["voice_val"], {
                bitrate: String(Math.round((channel.bitrate || 64000) / 1000)),
                limit: channel.userLimit > 0 ? String(channel.userLimit) : ls["cmds"]["channelinfo"]["unlimited"]
            })
        }

        const channelTopic = channel.topic || ls["cmds"]["channelinfo"]["ntp"]
        const descText = handlemsg(ls["cmds"]["channelinfo"]["topic_desc"], {
            channel: channel.id,
            topic: channelTopic
        })

        client.Embed([{
            author: { name: channel.name, iconURL: interaction.guild.iconURL({ dynamic: true }) },
            desc: descText,
            fields: [
                { name: ls["cmds"]["channelinfo"]["section_general"], value: generalSection, inline: false },
                { name: ls["cmds"]["channelinfo"]["section_settings"], value: settingsSection, inline: false }
            ],
            timestamp: interaction.createdTimestamp,
            footer: { text: handlemsg(ls["cmds"]["channelinfo"]["id_footer"], { id: channel.id }) }
        }], undefined, "reply", false, interaction)
    }
}
