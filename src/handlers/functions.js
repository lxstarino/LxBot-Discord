module.exports = {
    handlemsg,
    getOrCreateProfile,
    getOrCreateSettings,
    sendModLog,
    cleanupGuildData,
    getVoicePanelData,
    generateCaptchaImage
}

function handlemsg(ls, obj) {
    Object.entries(obj).forEach(([key, val]) => {
        ls = ls.replaceAll(`{${key}}`, val)
    })
    return ls
}

async function getOrCreateProfile(client, userId, guildId) {
    const cacheKey = `${guildId}:${userId}`
    let profile = client.economy.mapCache.get(cacheKey)

    if (!profile) {
        profile = { guildId, userId, wallet: 0, bank: 0, daily: 0, weekly: 0, monthly: 0, work: 0, crime: 0, xp: 0, level: 1, lastXpMessage: 0, warnings: [], inventory: { fish: {}, ore: {} }, birthday: null };
        await client.economy.createData(profile);
        client.economy.mapCache.set(cacheKey, profile)
    }

    return profile;
}

async function getOrCreateSettings(client, guildId) {
    let settings = client.settings.mapCache.get(guildId)

    if (!settings) {
        settings = {
            guildId,
            language: "en",
            disabled_modules: [],
            embed_color: null,
            welcomestate: false,
            welcomechannel: null,
            welcomecard: false,
            shop_items: [],
            logchannel: null,
            birthdaychannel: null,
            counting_channel: null,
            counting_current: 0,
            counting_highscore: 0,
            counting_last_user: null,
            voice_creator_channel: null,
            temp_voice_channels: [],
            level_roles: [],
            autorole: null,
            verify_role: null,
            verify_channel: null
        };
        await client.settings.createData(settings);
        client.settings.mapCache.set(guildId, settings)
    }

    if (!settings.level_roles) {
        settings.level_roles = [];
    }

    if (settings.autorole === undefined) {
        settings.autorole = null;
    }

    return settings;
}

async function sendModLog(client, guild, embedData) {
    const settings = client.settings.mapCache?.get(guild.id) || await getOrCreateSettings(client, guild.id)
    if (!settings || !settings.logchannel) return

    const channel = guild.channels.cache.get(settings.logchannel)
    if (!channel) return

    client.Embed([embedData], undefined, "send", false, channel)
}

async function cleanupGuildData(client, guildId, shouldSave = true) {
    console.log(`[Cleanup] Cleaning up data for guild ID: ${guildId}`);

    const managers = [
        { name: "settings", cacheType: "guild" },
        { name: "economy", cacheType: "user" },
        { name: "ticket" },
        { name: "polls" },
        { name: "reactionRoles" }
    ];

    for (const { name, cacheType } of managers) {
        const manager = client[name];
        if (!manager || !manager.storage || !Array.isArray(manager.storage.data)) continue;

        const initialLength = manager.storage.data.length;
        manager.storage.data = manager.storage.data.filter(x => x.guildId !== guildId);

        if (manager.mapCache) {
            if (cacheType === "guild") {
                manager.mapCache.delete(guildId);
            } else if (cacheType === "user") {
                for (const key of manager.mapCache.keys()) {
                    if (key.startsWith(`${guildId}:`)) {
                        manager.mapCache.delete(key);
                    }
                }
            }
        }

        if (shouldSave && manager.storage.data.length !== initialLength) {
            await manager.saveData();
        }
    }
}

function getVoicePanelData(client, guild, voiceChannel, ownerId) {
    const ls = client.getLanguage(guild.id)
    const { ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require("discord.js")

    const everyonePerms = voiceChannel.permissionOverwrites.cache.get(guild.roles.everyone.id)
    const isLocked = everyonePerms && everyonePerms.deny.has(PermissionsBitField.Flags.Connect)

    const statusText = isLocked
        ? ls["cmds"]["voice"]["panel_status_private"]
        : ls["cmds"]["voice"]["panel_status_public"]

    const limitText = voiceChannel.userLimit === 0
        ? ls["cmds"]["voice"]["panel_status_no_limit"]
        : handlemsg(ls["cmds"]["voice"]["panel_status_users"], { limit: voiceChannel.userLimit })

    const embed = {
        title: ls["cmds"]["voice"]["title"],
        desc: handlemsg(ls["cmds"]["voice"]["panel_desc"], {
            channel: voiceChannel.id,
            owner: ownerId,
            status: statusText,
            limit: limitText
        }),
        color: 0x5865F2,
        timestamp: new Date().toISOString()
    }

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("voice-lock")
            .setLabel(ls["cmds"]["voice"]["btn_lock"])
            .setEmoji("🔒")
            .setStyle(ButtonStyle.Danger)
            .setDisabled(isLocked ? true : false),
        new ButtonBuilder()
            .setCustomId("voice-unlock")
            .setLabel(ls["cmds"]["voice"]["btn_unlock"])
            .setEmoji("🔓")
            .setStyle(ButtonStyle.Success)
            .setDisabled(isLocked ? false : true),
        new ButtonBuilder()
            .setCustomId("voice-rename")
            .setLabel(ls["cmds"]["voice"]["btn_rename"])
            .setEmoji("✏️")
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId("voice-limit")
            .setLabel(ls["cmds"]["voice"]["btn_limit"])
            .setEmoji("👥")
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId("voice-kick")
            .setLabel(ls["cmds"]["voice"]["btn_kick"])
            .setEmoji("👢")
            .setStyle(ButtonStyle.Danger)
    )

    return { embeds: [embed], components: [row] }
}

async function generateCaptchaImage(code) {
    const { createCanvas } = require("@napi-rs/canvas")
    const canvas = createCanvas(300, 100)
    const ctx = canvas.getContext("2d")

    ctx.fillStyle = "#1e1e2e"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    for (let i = 0; i < 7; i++) {
        ctx.strokeStyle = `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.5)`
        ctx.lineWidth = Math.floor(Math.random() * 3) + 1
        ctx.beginPath()
        ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height)
        ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height)
        ctx.stroke()
    }

    for (let i = 0; i < 50; i++) {
        ctx.fillStyle = `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.6)`
        ctx.beginPath()
        ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 3, 0, Math.PI * 2)
        ctx.fill()
    }

    const colors = ["#ff5555", "#50fa7b", "#f1fa8c", "#bd93f9", "#ff79c6", "#8be9fd"]
    ctx.font = "bold 42px sans-serif"
    ctx.textBaseline = "middle"

    const charWidth = canvas.width / (code.length + 1)
    for (let i = 0; i < code.length; i++) {
        ctx.save()
        const char = code[i]
        const x = charWidth * (i + 1)
        const y = 50 + (Math.random() * 12 - 6)
        const angle = (Math.random() * 0.4 - 0.2)

        ctx.translate(x, y)
        ctx.rotate(angle)

        ctx.fillStyle = colors[i % colors.length]
        ctx.fillText(char, -15, 0)

        ctx.restore()
    }

    return canvas.toBuffer("image/png")
}
