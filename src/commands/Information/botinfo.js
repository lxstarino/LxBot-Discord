const { SlashCommandBuilder } = require("@discordjs/builders")
const os = require("os")

const startDate = Date.now()

module.exports = {
    data: new SlashCommandBuilder()
        .setName("botinfo")
        .setDescription("Bot Status & Info"),
    async execute(client, interaction) {
        const msg = await interaction.deferReply({ fetchReply: true })

        let ls = client.getLanguage(interaction.guild?.id)
        const { handlemsg } = require(`${process.cwd()}/src/handlers/functions`)

        const ramUsed = `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`
        const systemOS = `${os.platform()} (${os.arch()})`
        const totalMembers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)
        const totalChannels = client.channels.cache.size

        client.Embed([{
            type: "editReply",
            thumbnail: `${client.user.displayAvatarURL()}`,
            fields: [
                { name: ls["cmds"]["botinfo"]["name"], value: `${client.user.username}`, inline: true },
                { name: ls["cmds"]["botinfo"]["id"], value: `${client.user.id}`, inline: true },
                { name: `${ls["cmds"]["botinfo"]["createdat"]}`, value: `<t:${Math.round(client.user.createdTimestamp / 1000)}:d>`, inline: true },
                { name: `${ls["cmds"]["botinfo"]["botowner"]}`, value: `<@!399301340326789120>`, inline: true },
                { name: ls["cmds"]["botinfo"]["version"], value: `${require(`${process.cwd()}/package.json`).version}`, inline: true },
                { name: ls["cmds"]["botinfo"]["djs_version"], value: `${require("discord.js/package.json").version}`, inline: true },
                { name: ls["cmds"]["botinfo"]["node_version"], value: `${process.version}`, inline: true },
                { name: ls["cmds"]["botinfo"]["ram"], value: ramUsed, inline: true },
                { name: ls["cmds"]["botinfo"]["os"], value: systemOS, inline: true },
                { name: ls["cmds"]["botinfo"]["servers"], value: `${client.guilds.cache.size.toLocaleString()}`, inline: true },
                { name: ls["cmds"]["botinfo"]["members"], value: `${totalMembers.toLocaleString()}`, inline: true },
                { name: ls["cmds"]["botinfo"]["channels"], value: `${totalChannels.toLocaleString()}`, inline: true },
                { name: ls["cmds"]["botinfo"]["latency"], value: `Bot: ${msg.createdTimestamp - interaction.createdTimestamp}ms\nWebsocket: ${client.ws.ping}ms`, inline: true },
                { name: `${handlemsg(ls["cmds"]["botinfo"]["commands"], { size: client.commands.size })}`, value: handlemsg(ls["cmds"]["botinfo"]["commands_val"], { dev: client.commands.filter(cmd => cmd.devOnly === true).size, user: client.commands.filter(cmd => cmd.devOnly !== true).size }), inline: true },
                { name: `${ls["cmds"]["botinfo"]["startedsince"]}`, value: `<t:${Math.round(startDate / 1000)}:F>\n(<t:${Math.round(startDate / 1000)}:R>)`, inline: false }
            ],
        }], undefined, "editReply", false, interaction)
    }
}
