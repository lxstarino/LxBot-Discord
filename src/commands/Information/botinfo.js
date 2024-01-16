const { SlashCommandBuilder } = require("@discordjs/builders")

const startDate = Date.now()

module.exports = {
    data: new SlashCommandBuilder()
    .setName("botinfo")
    .setDescription("Bot Status & Info"),
    async execute(client, interaction) {
        const msg = await interaction.deferReply({fetchReply: true})

        const settings = client.settings.storage.data.find(x => x.guildId === interaction.guild.id)
        let ls = settings ? settings.language ? require(`${process.cwd()}/src/languages/${settings.language}.json`) : require(`${process.cwd()}/src/languages/en.json`) : require(`${process.cwd()}/src/languages/en.json`)
        const { handlemsg } = require(`${process.cwd()}/src/handlers/functions`)

        client.basicEmbed({
            type: "editReply",
            thumbnail: `${client.user.displayAvatarURL()}`,
            fields: [
                { name: "Bot Name", value: `${client.user.username}`, inline: true},
                { name: "Bot Id", value: `${client.user.id}`, inline: true},
                { name: `${ls["cmds"]["botinfo"]["createdat"]}`, value: `<t:${Math.round(client.user.createdTimestamp / 1000)}:d>`, inline: true},
                { name: `${ls["cmds"]["botinfo"]["botowner"]}`, value: `<@!399301340326789120>`, inline: true},
                { name: "Bot Version", value: `${require(`${process.cwd()}/package.json`).version}`, inline: true}, 
                { name: `${ls["cmds"]["botinfo"]["startedsince"]}`, value: `<t:${Math.round(startDate / 1000)}:d>`, inline: true},
                { name: "Discord.js Version", value: `${require("discord.js/package.json").version}`, inline: true}, 
                { name: "Node.js Version", value: `${process.version}`, inline: true}, 
                { name: "Servers", value: `${client.guilds.cache.size}`, inline: true},
                { name: `${ls["cmds"]["botinfo"]["latency"]}`, value: `Bot: ${msg.createdTimestamp - interaction.createdTimestamp}\nWebsocket: ${client.ws.ping}`, inline: true}, 
                { name: `${handlemsg(ls["cmds"]["botinfo"]["commands"], {size: client.commands.size})}`, value: `Dev Commands: **${client.commands.filter(cmd => cmd.devOnly === true).size}**\nUser Commands: **${client.commands.filter(cmd => cmd.devOnly !== true).size}**`, inline: true},
                { name: "\u200b", value: `\u200b`, inline: true}, 
            ],
            footer: {text: `${interaction.user.tag}`}
        }, interaction)
    }
}
