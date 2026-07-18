module.exports = {
    handlemsg,
    getOrCreateProfile,
    getOrCreateSettings,
    sendModLog
}


function handlemsg(ls, obj) {
    Object.entries(obj).map(([key, val]) => {
        ls = ls.replaceAll(`{${key}}`, val)
    })
    return ls
}

async function getOrCreateProfile(client, userId, guildId) {
    let profile = client.economy.storage.data.find(
        x => x.userId === userId && x.guildId === guildId
    );
    if (!profile) {
        profile = { guildId, userId, wallet: 0, bank: 0, daily: 0, weekly: 0, monthly: 0, work: 0, crime: 0, xp: 0, level: 1, lastXpMessage: 0, warnings: [], inventory: { fish: {} }, birthday: null };
        await client.economy.createData(profile);
    }
    return profile;
}

async function getOrCreateSettings(client, guildId) {
    let settings = client.settings.storage.data.find(x => x.guildId === guildId);
    if (!settings) {
        settings = {
            guildId,
            language: "en",
            disabled_modules: [],
            embed_color: null,
            welcomestate: false,
            welcomechannel: null,
            welcomerole: null,
            welcomecard: false,
            shop_items: [],
            logchannel: null,
            birthdaychannel: null,
            counting_channel: null,
            counting_current: 0,
            counting_highscore: 0,
            counting_last_user: null,
            voice_creator_channel: null,
            temp_voice_channels: []
        };
        await client.settings.createData(settings);
    }
    return settings;
}

async function sendModLog(client, guild, embedData) {
    const settings = await getOrCreateSettings(client, guild.id)
    if (!settings || !settings.logchannel) return

    const channel = guild.channels.cache.get(settings.logchannel)
    if (!channel) return

    client.Embed([embedData], undefined, "send", false, channel)
}
