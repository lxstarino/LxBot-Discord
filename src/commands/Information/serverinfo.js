const { SlashCommandBuilder } = require("@discordjs/builders")

module.exports = {
    data: new SlashCommandBuilder()
    .setName("serverinfo")
    .setDescription("Displays Information about the current Server"),
    async execute(client, interaction){
        const guild_invites = await interaction.guild.invites.fetch()
        const description = interaction.guild.description

        let ls = client.getLanguage(interaction.guild?.id)
        const { handlemsg } = require(`${process.cwd()}/src/handlers/functions`)

        const BoostLevel = {
            "0": `${interaction.guild.premiumSubscriptionCount}/2`,
            "1": `${interaction.guild.premiumSubscriptionCount}/7`,
            "2": `${interaction.guild.premiumSubscriptionCount}/14`,
        }

        client.Embed([{
            thumbnail: `${interaction.guild.iconURL() || interaction.user.defaultAvatarURL}`,
            fields: [
                { name: `${interaction.guild.name}`, value: `${description ? description : ls["cmds"]["serverinfo"]["ndp"]}`, inline: false},
                { name: `${ls["cmds"]["serverinfo"]["serverowner"]}`, value: `<@!${interaction.guild.ownerId}>`, inline: false},
                { name: `${handlemsg(ls["cmds"]["serverinfo"]["lvl_title"], {level: interaction.guild.premiumTier})}`, value: `${handlemsg(ls["cmds"]["serverinfo"]["lvl_val"], {boosts: BoostLevel[interaction.guild.premiumTier]})}`, inline: true},  
                { name: `${ls["cmds"]["serverinfo"]["createdon"]}`, value: `🗓️ <t:${Math.round(interaction.guild.createdTimestamp / 1000)}:d>`, inline: true},    
                { name: `${ls["cmds"]["serverinfo"]["membercount"]}`, value: `${handlemsg(ls["cmds"]["serverinfo"]["member_val"], {count: interaction.guild.memberCount})}`, inline: true}, 
                { name: `${ls["cmds"]["serverinfo"]["invitecount"]}`, value: `${handlemsg(ls["cmds"]["serverinfo"]["invite_val"], {count: guild_invites.size})}`, inline: true},  
                { name: "\u200b", value: `\u200b`, inline: true},  
                { name: `${ls["cmds"]["serverinfo"]["rescount"]}`, value: `${handlemsg(ls["cmds"]["serverinfo"]["res_val"], {roles: interaction.guild.roles.cache.size, emojis: interaction.guild.emojis.cache.size, stickers: interaction.guild.stickers.cache.size})}`, inline: false},
                { name: `${handlemsg(ls["cmds"]["serverinfo"]["channelcount"], {size: interaction.guild.channels.cache.size})}`, value: `${handlemsg(ls["cmds"]["serverinfo"]["channel_val"], {categories: interaction.guild.channels.cache.filter(c => c.type === 4).size, text: interaction.guild.channels.cache.filter(c => c.type === 0).size, vc: interaction.guild.channels.cache.filter(c => c.type === 2).size})}`, inline: false},
            ],
            timestamp: interaction.createdTimestamp,
            footer: {text: `${handlemsg(ls["cmds"]["serverinfo"]["id_footer"], {id: interaction.guild.id})}`}
        }], undefined, "reply", false, interaction)
    }
}
