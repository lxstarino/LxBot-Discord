const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js")

function getSetupControls({ btn_send = "Send", btn_reset = "Reset", btn_cancel = "Cancel", extra = [] }) {
    const row = new ActionRowBuilder();
    for (const btn of extra) {
        row.addComponents(btn);
    }
    row.addComponents(
        new ButtonBuilder().setCustomId("btn-send").setLabel(btn_send).setStyle(ButtonStyle.Success).setEmoji("📨"),
        new ButtonBuilder().setCustomId("btn-reset").setLabel(btn_reset).setStyle(ButtonStyle.Danger).setEmoji("🔄"),
        new ButtonBuilder().setCustomId("btn-cancel").setLabel(btn_cancel).setStyle(ButtonStyle.Danger).setEmoji("❌")
    );
    return row;
}

function handlemsg(ls, obj) {
    Object.entries(obj).forEach(([key, val]) => {
        ls = ls.replaceAll(`{${key}}`, val)
    })
    return ls
}

const db = require("../utils/Database")

function createAutoSaveProxy(target, onSave) {
    if (!target || typeof target !== "object" || target.__isProxy) return target

    const handler = {
        get(obj, prop, receiver) {
            if (prop === "__isProxy") return true
            if (prop === "__raw") return obj
            const val = Reflect.get(obj, prop, receiver)
            if (val && typeof val === "object" && !val.__isProxy) {
                return new Proxy(val, handler)
            }
            return val
        },
        set(obj, prop, val, receiver) {
            const res = Reflect.set(obj, prop, val, receiver)
            try {
                onSave(target)
            } catch (err) {
                console.error("[Database AutoSave Error]", err)
            }
            return res
        }
    }

    return new Proxy(target, handler)
}

async function getOrCreateProfile(client, userId, guildId) {
    const cacheKey = `${guildId}:${userId}`
    if (client?.economy?.mapCache?.has(cacheKey)) {
        return client.economy.mapCache.get(cacheKey)
    }

    const database = client?.db || db

    let profile = database.getProfile(guildId, userId)

    if (!profile) {
        profile = {
            guildId,
            userId,
            wallet: 0,
            bank: 0,
            daily: 0,
            weekly: 0,
            monthly: 0,
            work: 0,
            crime: 0,
            xp: 0,
            level: 1,
            lastXpMessage: 0,
            warnings: [],
            inventory: { fish: {}, ore: {} },
            birthday: null
        }
        database.saveProfile(profile)
    }

    const proxy = createAutoSaveProxy(profile, (p) => {
        database.saveProfile(p.__raw || p)
    })

    if (client?.economy?.mapCache) {
        client.economy.mapCache.set(cacheKey, proxy)
    }

    return proxy
}

async function getOrCreateSettings(client, guildId) {
    const cacheKey = String(guildId);
    if (client?.settings?.mapCache?.has(cacheKey)) {
        return client.settings.mapCache.get(cacheKey)
    }

    const database = client?.db || db
    let settings = database.getSettings(guildId)

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
            autorole: null
        }
        database.saveSettings(settings)
    }

    if (!settings.level_roles) {
        settings.level_roles = []
    }

    if (settings.autorole === undefined) {
        settings.autorole = null
    }

    const proxy = createAutoSaveProxy(settings, (s) => {
        database.saveSettings(s.__raw || s)
    })

    if (client?.settings?.mapCache) {
        client.settings.mapCache.set(guildId, proxy)
    }

    return proxy
}

async function sendModLog(client, guild, embedData) {
    const settings = await getOrCreateSettings(client, guild.id)
    if (!settings || !settings.logchannel) return

    const channel = guild.channels.cache.get(settings.logchannel)
    if (!channel) return

    client.Embed([embedData], undefined, "send", false, channel)
}

async function cleanupGuildData(client, guildId, shouldSave = true) {
    console.log(`[Cleanup] Cleaning up SQLite data for guild ID: ${guildId}`)
    const database = client?.db || db
    database.cleanupGuild(guildId)

    if (client?.settings?.mapCache) client.settings.mapCache.delete(guildId)

    const cachesToClean = [
        client?.economy?.mapCache,
        client?.ticket?.mapCache,
        client?.reactionRoles?.mapCache,
        client?.polls?.mapCache
    ]

    for (const cache of cachesToClean) {
        if (cache) {
            for (const key of cache.keys()) {
                if (key.startsWith(`${guildId}:`) || key === guildId) {
                    cache.delete(key)
                }
            }
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


async function getOrCreateTicketPanel(client, guildId, panelNumber) {
    const cacheKey = `${guildId}:${panelNumber}`
    if (client?.ticket?.mapCache?.has(cacheKey)) {
        return client.ticket.mapCache.get(cacheKey)
    }

    const database = client?.db || db
    let ticketData = database.getTicket(guildId, panelNumber)

    if (!ticketData) {
        ticketData = { guildId: guildId, panel: panelNumber, roles: [], channel: 0, category: 0 }
        database.saveTicket(ticketData)
    }

    const proxy = createAutoSaveProxy(ticketData, (t) => {
        database.saveTicket(t.__raw || t)
    })

    if (client?.ticket?.mapCache) {
        client.ticket.mapCache.set(cacheKey, proxy)
    }

    return proxy
}

async function getOrCreateReactionRolePanel(client, guildId, panelNumber) {
    const cacheKey = `${guildId}:${panelNumber}`
    if (client?.reactionRoles?.mapCache?.has(cacheKey)) {
        return client.reactionRoles.mapCache.get(cacheKey)
    }

    const database = client?.db || db
    let rrData = database.getReactionRole(guildId, panelNumber)

    if (!rrData) {
        rrData = { guildId: guildId, panel: panelNumber, roles: [], channel: 0, description: null }
        database.saveReactionRole(rrData)
    }

    const proxy = createAutoSaveProxy(rrData, (r) => {
        database.saveReactionRole(r.__raw || r)
    })

    if (client?.reactionRoles?.mapCache) {
        client.reactionRoles.mapCache.set(cacheKey, proxy)
    }

    return proxy
}

async function createPoll(client, pollData) {
    const database = client?.db || db
    database.savePoll(pollData)
    const proxy = createAutoSaveProxy(pollData, (p) => {
        database.savePoll(p.__raw || p)
    })
    const cacheKey = String(pollData.pollId)
    if (client?.polls?.mapCache) client.polls.mapCache.set(cacheKey, proxy)
    return proxy
}

module.exports = {
    handlemsg,
    createAutoSaveProxy,
    getOrCreateProfile,
    getOrCreateSettings,
    sendModLog,
    cleanupGuildData,
    getVoicePanelData,
    getSetupControls,
    getOrCreateTicketPanel,
    getOrCreateReactionRolePanel,
    createPoll
}
