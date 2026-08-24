const { SlashCommandBuilder } = require("discord.js")

module.exports = {
    data: new SlashCommandBuilder()
        .setName("serverinfo")
        .setDescription("Displays information about the current server"),
    async execute(client, interaction) {
        const { guild } = interaction
        let ls = client.getLanguage(guild?.id)
        const boostEmoji = client.emojis.cache.find(e => e.id === "1541468285671972995")?.toString() || "🚀"

        const allMembers = await guild.members.fetch().catch(() => guild.members.cache)
        const bots = allMembers.filter(m => m.user.bot).size
        const humans = guild.memberCount - bots

        const text = guild.channels.cache.filter(c => c.type === 0 || c.type === 5).size
        const vc = guild.channels.cache.filter(c => c.type === 2 || c.type === 13).size
        const cats = guild.channels.cache.filter(c => c.type === 4).size

        const created = Math.round(guild.createdTimestamp / 1000)

        const secLevels = [
            ls["cmds"]["serverinfo"]["sec_none"],
            ls["cmds"]["serverinfo"]["sec_low"],
            ls["cmds"]["serverinfo"]["sec_medium"],
            ls["cmds"]["serverinfo"]["sec_high"],
            ls["cmds"]["serverinfo"]["sec_very_high"]
        ]
        const security = secLevels[guild.verificationLevel] || ls["cmds"]["serverinfo"]["sec_none"]

        const assets = []
        if (guild.iconURL()) assets.push(`[${ls["cmds"]["serverinfo"]["icon_link"]}](${guild.iconURL({ size: 1024 })})`)
        if (guild.bannerURL()) assets.push(`[${ls["cmds"]["serverinfo"]["banner_link"]}](${guild.bannerURL({ size: 1024 })})`)
        if (guild.splashURL()) assets.push(`[${ls["cmds"]["serverinfo"]["splash_link"]}](${guild.splashURL({ size: 1024 })})`)

        let descParts = []
        if (guild.description) descParts.push(`*${guild.description}*`)
        if (guild.vanityURLCode) descParts.push(`🔗 **discord.gg/${guild.vanityURLCode}**`)
        if (assets.length) descParts.push(assets.join(" • "))

        const { handlemsg } = require(`${process.cwd()}/src/utils/functions`)

        let generalInfo = handlemsg(ls["cmds"]["serverinfo"]["general_val"], {
            owner: guild.ownerId,
            created: String(created),
            count: guild.memberCount.toLocaleString(),
            humans: String(humans),
            bots: String(bots),
            security: security
        })
        if (guild.afkChannelId) {
            generalInfo += handlemsg(ls["cmds"]["serverinfo"]["afk_val"], {
                channel: guild.afkChannelId,
                time: String(Math.round(guild.afkTimeout / 60))
            })
        }

        let featuresInfo = handlemsg(ls["cmds"]["serverinfo"]["features_val"], {
            level: String(guild.premiumTier),
            count: String(guild.premiumSubscriptionCount),
            emoji: boostEmoji,
            channels: String(guild.channels.cache.size),
            text: String(text),
            vc: String(vc),
            cats: String(cats),
            roles: String(guild.roles.cache.size),
            emojis: String(guild.emojis.cache.size),
            stickers: String(guild.stickers.cache.size)
        })

        client.Embed([{
            author: { name: guild.name, iconURL: guild.iconURL({ dynamic: true }) },
            thumbnail: guild.iconURL({ dynamic: true, size: 512 }),
            desc: descParts.length ? descParts.join("\n") : undefined,
            fields: [
                { name: ls["cmds"]["serverinfo"]["section_general"], value: generalInfo, inline: false },
                { name: ls["cmds"]["serverinfo"]["section_features"], value: featuresInfo, inline: false }
            ],
            timestamp: interaction.createdTimestamp,
            footer: { text: `Server ID: ${guild.id}` }
        }], undefined, "reply", false, interaction)
    }
}