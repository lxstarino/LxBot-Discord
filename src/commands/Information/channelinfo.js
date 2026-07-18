const { SlashCommandBuilder } = require("@discordjs/builders")

module.exports = {
    data: new SlashCommandBuilder()
        .setName("channelinfo")
        .setDescription("Displays information about the current channel"),
    async execute(client, interaction) {
        let ls = client.getLanguage(interaction.guild?.id)
        const { handlemsg } = require(`${process.cwd()}/src/handlers/functions`)

        const types = {
            0: `${ls["cmds"]["channelinfo"]["tc"]}`, 
            2: `${ls["cmds"]["channelinfo"]["vc"]}`,
            5: `${ls["cmds"]["channelinfo"]["ac"]}`,
            10: `${ls["cmds"]["channelinfo"]["at"]}`,
            11: `${ls["cmds"]["channelinfo"]["pt"]}`,
            12: `${ls["cmds"]["channelinfo"]["pt2"]}`,
            13: `${ls["cmds"]["channelinfo"]["svc"]}`
        }

        const channel = interaction.channel
        const parentName = channel.parent ? channel.parent.name : ls["cmds"]["channelinfo"]["none"]
        
        let slowmode = ls["cmds"]["channelinfo"]["none"]
        if (channel.rateLimitPerUser !== undefined && channel.rateLimitPerUser > 0) {
            slowmode = handlemsg(ls["cmds"]["channelinfo"]["seconds"], { time: channel.rateLimitPerUser })
        }

        const isNsfw = channel.nsfw ? ls["cmds"]["channelinfo"]["yes"] : ls["cmds"]["channelinfo"]["no"]

        client.Embed([{
            fields: [
                { name: `${channel.name}`, value: `${channel.topic ? channel.topic : ls["cmds"]["channelinfo"]["ntp"]}`, inline: false },
                { name: `Id`, value: `${channel.id}`, inline: true },
                { name: `${ls["cmds"]["channelinfo"]["type"]}`, value: `${types[channel.type] || ls["cmds"]["channelinfo"]["tnf"]}`, inline: true },
                { name: `${ls["cmds"]["channelinfo"]["category"]}`, value: `${parentName}`, inline: true },
                { name: `${ls["cmds"]["channelinfo"]["createdon"]}`, value: `<t:${Math.round(channel.createdAt / 1000)}:f> (<t:${Math.round(channel.createdAt / 1000)}:R>)`, inline: false },
                { name: `${ls["cmds"]["channelinfo"]["slowmode"]}`, value: `${slowmode}`, inline: true },
                { name: `Nsfw`, value: `${isNsfw}`, inline: true },
                { name: "\u200b", value: `\u200b`, inline: true }
            ],
            timestamp: interaction.createdTimestamp,
            footer: { text: `Server ID: ${interaction.guild.id}` }
        }], undefined, "reply", false, interaction)
    }
}