const { SlashCommandBuilder } = require("discord.js")
const os = require("os")
const fs = require("fs")

module.exports = {
    data: new SlashCommandBuilder()
        .setName("botinfo")
        .setDescription("Displays information and statistics about the bot"),
    async execute(client, interaction) {
        const replyMessage = await interaction.deferReply({ fetchReply: true })
        const ls = client.getLanguage(interaction.guild?.id)
        const { handlemsg } = require(`${process.cwd()}/src/utils/functions`)

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
        const cpuModel = firstCpu?.model ? firstCpu.model.trim() : "CPU"
        const cpuInfo = `${cpuModel}${cpuSpeed} (${os.cpus().length} Cores)`

        let boardModel = ""
        try {
            if (fs.existsSync("/sys/class/dmi/id/board_name")) {
                const rawBoard = fs.readFileSync("/sys/class/dmi/id/board_name", "utf8").replace(/\0/g, "").trim()
                if (rawBoard && !rawBoard.toLowerCase().includes("default string")) {
                    boardModel = rawBoard
                }
            }
            if (fs.existsSync("/sys/class/dmi/id/bios_version")) {
                const rawBios = fs.readFileSync("/sys/class/dmi/id/bios_version", "utf8").replace(/\0/g, "").trim()
                if (rawBios && !rawBios.toLowerCase().includes("default string")) {
                    boardModel += boardModel ? ` (BIOS ${rawBios})` : `BIOS ${rawBios}`
                }
            }
        } catch (err) {
            console.error("[botinfo] Could not read motherboard/BIOS info:", err.message)
        }

        const hardwareInfo = boardModel ? `${cpuInfo} | ${boardModel}` : cpuInfo

        let diskText = ""
        try {
            if (typeof fs.statfsSync === "function") {
                const stat = fs.statfsSync(".")
                const totalDisk = (stat.bsize * stat.blocks / 1024 / 1024 / 1024).toFixed(1)
                const freeDisk = (stat.bsize * stat.bfree / 1024 / 1024 / 1024).toFixed(1)
                const usedDisk = (totalDisk - freeDisk).toFixed(1)
                diskText = ` | ${usedDisk} / ${totalDisk} GB (Disk)`
            }
        } catch (err) {
            console.error("[botinfo] Could not query disk statistics:", err.message)
        }

        const hostUsedMem = ((os.totalmem() - os.freemem()) / 1024 / 1024 / 1024).toFixed(1)
        const hostTotalMem = (os.totalmem() / 1024 / 1024 / 1024).toFixed(1)
        const hostBootTimestamp = Math.round(Date.now() / 1000 - os.uptime())
        const osWithRelease = `${os.platform()} ${os.release()} (${os.arch()})`

        const systemSection = handlemsg(ls["cmds"]["botinfo"]["system_val"], {
            bot: String(replyMessage.createdTimestamp - interaction.createdTimestamp),
            ws: String(client.ws.ping),
            hardware: hardwareInfo,
            ram: memUsage,
            host_ram: `${hostUsedMem} / ${hostTotalMem} GB`,
            disk: diskText,
            os: osWithRelease,
            host_uptime: String(hostBootTimestamp),
            node: process.version,
            djs: require("discord.js/package.json").version
        })

        client.Embed([{
            type: "editReply",
            author: { name: client.user.username, iconURL: client.user.displayAvatarURL({ dynamic: true }) },
            thumbnail: client.user.displayAvatarURL({ dynamic: true, size: 512 }),
            desc: `[Website](https://lxst.cc) | [Bot Invite](https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=8&integration_type=0&scope=bot) | [GitHub](https://github.com/lxstarino)`,
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
