const { SlashCommandBuilder, version: djsVersion } = require("discord.js")
const os = require("os")
const fs = require("fs")
const { handlemsg } = require("../../utils/stringUtils")

module.exports = {
    guildOnly: false,
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName("botinfo")
        .setDescription("Displays information and statistics about the bot"),
    async execute(client, interaction) {
        const replyMessage = await interaction.deferReply({ fetchReply: true })
        const ls = client.getLanguage(interaction.guild?.id)

        let totalGuilds = client.guilds.cache.size
        let cachedUsers = client.guilds.cache.reduce((acc, guild) => acc + (guild.memberCount || 0), 0)
        let totalChannels = client.channels.cache.size

        if (client.shard) {
            try {
                const [shardGuilds, shardUsers, shardChannels] = await Promise.all([
                    client.shard.fetchClientValues("guilds.cache.size"),
                    client.shard.broadcastEval(c => c.guilds.cache.reduce((a, g) => a + (g.memberCount || 0), 0)),
                    client.shard.fetchClientValues("channels.cache.size")
                ])
                totalGuilds = shardGuilds.reduce((a, b) => a + b, 0)
                cachedUsers = shardUsers.reduce((a, b) => a + b, 0)
                totalChannels = shardChannels.reduce((a, b) => a + b, 0)
            } catch (err) {
                console.error("[botinfo] Failed to collect cross-shard metrics:", err.message)
            }
        }

        const memUsage = `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(0)} MB`
        const uptimeTimestamp = Math.round((Date.now() - (client.uptime || 0)) / 1000)
        const shardDetails = client.shard ? handlemsg(ls["cmds"]["botinfo"]["shard_info"], {
            shard: client.shard.ids.join(", "),
            total: String(client.shard.count)
        }) : ""

        const devOnlyCommands = client.commands.filter(c => c.devOnly === true).size
        const publicCommands = client.commands.size - devOnlyCommands

        const generalSection = handlemsg(ls["cmds"]["botinfo"]["general_val"], {
            created: String(Math.round(client.user.createdTimestamp / 1000)),
            start: String(uptimeTimestamp),
            shard: shardDetails
        })

        const statsSection = handlemsg(ls["cmds"]["botinfo"]["stats_val"], {
            guilds: totalGuilds.toLocaleString(),
            members: cachedUsers.toLocaleString(),
            channels: totalChannels.toLocaleString(),
            total: String(client.commands.size),
            user: String(publicCommands),
            dev: String(devOnlyCommands)
        })

        const firstCpu = os.cpus()[0]
        const cpuSpeed = firstCpu?.speed ? ` @ ${(firstCpu.speed / 1000).toFixed(2)} GHz` : ""
        const cpuModel = firstCpu?.model ? firstCpu.model.trim().replace(/\s+/g, " ") : "CPU"
        const cpuInfo = `${cpuModel}${cpuSpeed} (${os.cpus().length} Cores)`

        let boardModel = ""
        let boardLine = ""
        try {
            let boardName = ""
            let biosVer = ""
            if (fs.existsSync("/sys/class/dmi/id/board_name")) {
                const rawBoard = fs.readFileSync("/sys/class/dmi/id/board_name", "utf8").replace(/\0/g, "").trim()
                if (rawBoard && !rawBoard.toLowerCase().includes("default string")) {
                    boardName = rawBoard
                }
            }
            if (fs.existsSync("/sys/class/dmi/id/bios_version")) {
                const rawBios = fs.readFileSync("/sys/class/dmi/id/bios_version", "utf8").replace(/\0/g, "").trim()
                if (rawBios && !rawBios.toLowerCase().includes("default string")) {
                    biosVer = rawBios
                }
            }
            if (boardName || biosVer) {
                boardModel = boardName && biosVer ? `${boardName} (BIOS ${biosVer})` : (boardName || `BIOS ${biosVer}`)
                if (ls["cmds"]?.["botinfo"]?.["board_line"]) {
                    boardLine = handlemsg(ls["cmds"]["botinfo"]["board_line"], { board: boardModel })
                } else {
                    boardLine = `\n> **Mainboard:** \`${boardModel}\``
                }
            }
        } catch (err) {
            console.error("[botinfo] Could not read motherboard/BIOS info:", err.message)
        }

        let diskLine = ""
        try {
            if (typeof fs.statfsSync === "function") {
                const stat = fs.statfsSync(".")
                const totalDisk = (stat.bsize * stat.blocks / 1024 / 1024 / 1024).toFixed(1)
                const freeDisk = (stat.bsize * stat.bfree / 1024 / 1024 / 1024).toFixed(1)
                const usedDisk = (totalDisk - freeDisk).toFixed(1)
                const percent = Math.round((usedDisk / totalDisk) * 100)
                const diskUsage = `${usedDisk} / ${totalDisk} GB (${percent}%)`
                if (ls["cmds"]?.["botinfo"]?.["disk_line"]) {
                    diskLine = handlemsg(ls["cmds"]["botinfo"]["disk_line"], { disk: diskUsage })
                } else {
                    diskLine = `\n> **Speicher:** \`${diskUsage}\``
                }
            }
        } catch (err) {
            console.error("[botinfo] Could not query disk statistics:", err.message)
        }

        const hostTotal = (os.totalmem() / 1024 / 1024 / 1024).toFixed(1)
        const hostUsed = ((os.totalmem() - os.freemem()) / 1024 / 1024 / 1024).toFixed(1)
        const hostRamPercent = Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100)
        const hostRamText = `${hostUsed} / ${hostTotal} GB (${hostRamPercent}%)`

        const hostBootTimestamp = Math.round(Date.now() / 1000 - os.uptime())
        const platformNames = { linux: "Linux", darwin: "macOS", win32: "Windows" }
        const osName = platformNames[os.platform()] || os.platform()
        const osWithRelease = `${osName} ${os.release()} (${os.arch()})`

        const systemSection = handlemsg(ls["cmds"]["botinfo"]["system_val"], {
            bot: String(replyMessage.createdTimestamp - interaction.createdTimestamp),
            ws: String(client.ws.ping),
            hardware: boardModel ? `${cpuInfo} | ${boardModel}` : cpuInfo,
            cpu: cpuInfo,
            board: boardLine,
            ram: memUsage,
            host_ram: hostRamText,
            disk: diskLine,
            os: osWithRelease,
            host_uptime: String(hostBootTimestamp),
            node: process.version,
            djs: djsVersion
        })

        client.Embed([{
            type: "editReply",
            author: { name: client.user.username, iconURL: client.user.displayAvatarURL() },
            thumbnail: client.user.displayAvatarURL({ size: 512 }),
            desc: `${client.appEmojis?.lx_logo || "<:lx_logo:1550651032076554311>"} [Website](https://lxst.cc) • 🤖 [Bot Invite](https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=8&integration_type=0&scope=bot) • ${client.appEmojis?.github || "<:github:1550651201442414622>"} [GitHub](https://github.com/lxstarino)`,
            fields: [
                { name: ls["cmds"]["botinfo"]["section_general"], value: generalSection, inline: false },
                { name: ls["cmds"]["botinfo"]["section_stats"], value: statsSection, inline: false },
                { name: ls["cmds"]["botinfo"]["section_system"], value: systemSection, inline: false }
            ],
            timestamp: interaction.createdTimestamp,
            footer: { text: `Bot ID: ${client.user.id}` }
        }], undefined, "editReply", false, interaction)
    }
}
