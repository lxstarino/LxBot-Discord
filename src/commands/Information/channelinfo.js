const { SlashCommandBuilder } = require("@discordjs/builders")
const { ChannelType } = require("discord.js")

module.exports = {
    data: new SlashCommandBuilder()
    .setName("channelinfo")
    .setDescription("Displays information about the current channel"),
    async execute(client, interaction){
        const settings = client.settings.storage.data.find(x => x.guildId === interaction.guild.id)
        let ls = settings ? settings.language ? require(`${process.cwd()}/src/languages/${settings.language}.json`) : require(`${process.cwd()}/src/languages/en.json`) : require(`${process.cwd()}/src/languages/en.json`)

        const types = {
            0: `${ls["cmds"]["channelinfo"]["tc"]}`, 
            2: `${ls["cmds"]["channelinfo"]["vc"]}`,
            5: `${ls["cmds"]["channelinfo"]["ac"]}`,
            10: `${ls["cmds"]["channelinfo"]["at"]}`,
            11: `${ls["cmds"]["channelinfo"]["pt"]}`,
            12: `${ls["cmds"]["channelinfo"]["pt2"]}`,
            13: `${ls["cmds"]["channelinfo"]["svc"]}`
        }

        client.basicEmbed({
            type: "reply",
            thumbnail: `${interaction.guild.iconURL() || interaction.user.defaultAvatarURL}`,
            fields: [
                { name: `${interaction.channel.name}`, value: `${interaction.channel.topic ? interaction.channel.topic : ls["cmds"]["channelinfo"]["ntp"]}`, inline: false},
                { name: `Id`, value: `${interaction.channel.id}`, inline: true},
                { name: `${ls["cmds"]["channelinfo"]["type"]}`, value: `${types[interaction.channel.type] || ls["cmds"]["channelinfo"]["tnf"]}`, inline: true},
                { name: "\u200b", value: `\u200b`, inline: true},  
                { name: `${ls["cmds"]["channelinfo"]["createdon"]}`, value: `<t:${Math.round(interaction.channel.createdAt / 1000)}:f>`, inline: true},
                { name: `Nsfw`, value: `${interaction.channel.nsfw}`, inline: true},
                { name: "\u200b", value: `\u200b`, inline: true},  
            ],
            timestamp: interaction.createdTimestamp,
            footer: {text: `Server ID: ${interaction.guild.id}`}
        }, interaction)
    }
}