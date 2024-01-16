const { SlashCommandBuilder } = require("@discordjs/builders")

module.exports = {
    data: new SlashCommandBuilder()
    .setName("serverinfo")
    .setDescription("Displays Information about the current Server"),
    async execute(client, interaction){
        const guild_invites = await interaction.guild.invites.fetch()
        const description = interaction.guild.description

        const settings = client.settings.storage.data.find(x => x.guildId === interaction.guild.id)
        let ls = settings ? settings.language ? require(`${process.cwd()}/src/languages/${settings.language}.json`) : require(`${process.cwd()}/src/languages/en.json`) : require(`${process.cwd()}/src/languages/en.json`)
        const { handlemsg } = require(`${process.cwd()}/src/handlers/functions`)

        const BoostLevel = {
            "0": `${interaction.guild.premiumSubscriptionCount}/2`,
            "1": `${interaction.guild.premiumSubscriptionCount}/7`,
            "2": `${interaction.guild.premiumSubscriptionCount}/14`,
        }

        client.basicEmbed({
            type: "reply",
            thumbnail: `${interaction.guild.iconURL() || interaction.user.defaultAvatarURL}`,
            fields: [
                { name: `${interaction.guild.name}`, value: `${description ? description : ls["cmds"]["serverinfo"]["ndp"]}`, inline: false},
                { name: `${ls["cmds"]["serverinfo"]["serverowner"]}`, value: `<@!${interaction.guild.ownerId}>`, inline: true},
                { name: `Server Level (${interaction.guild.premiumTier})`, value: `Boosts: ${BoostLevel[interaction.guild.premiumTier]}`, inline: true},  
                { name: `${ls["cmds"]["serverinfo"]["createdon"]}`, value: `🗓️ <t:${Math.round(interaction.guild.createdTimestamp / 1000)}:d>`, inline: true},    
                { name: `${ls["cmds"]["serverinfo"]["membercount"]}`, value: `**${interaction.guild.memberCount}** member(s)`, inline: true}, 
                { name: `${ls["cmds"]["serverinfo"]["invitecount"]}`, value: `**${guild_invites.size}** code(s)`, inline: true},  
                { name: "\u200b", value: `\u200b`, inline: true},  
                { name: `${ls["cmds"]["serverinfo"]["rescount"]}`, value: `**${interaction.guild.roles.cache.size}** role(s) | **${interaction.guild.emojis.cache.size}** emoji(s) | **${interaction.guild.stickers.cache.size}** sticker(s)`, inline: false},
                { name: `${handlemsg(ls["cmds"]["serverinfo"]["channelcount"], {size: interaction.guild.channels.cache.size})}`, value: `Categories: **${interaction.guild.channels.cache.filter(c => c.type === 4).size}** | Text Channels: **${interaction.guild.channels.cache.filter(c => c.type === 0).size}** | VC Channels: **${interaction.guild.channels.cache.filter(c => c.type === 2).size}**`, inline: false},
            ],
            timestamp: interaction.createdTimestamp,
            footer: {text: `Server ID: ${interaction.guild.id}`}
        }, interaction)
    }
}
