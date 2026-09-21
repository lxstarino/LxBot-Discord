const { GatewayIntentBits, Partials } = require("discord.js")

const EMOJIS = {
    success: "<:sucessfull:1550625611477942432>",
    error: "<:error:1550625609053503608>",
    nitro: "<:nitro:1550625610185965658>",
    boosts: "<:boosts:1550623972830355638>",
    twitch: "<:twitch:1550622850539458670>",
    youtube: "<:youtube:1551306003063242934>",
    steam: "<:steam:1550626219920195735>",
    lux_coin: "<:lux_coin:1550631084855922698>",
    lux_wallet: "<:lux_wallet:1550640829620559982>",
    lux_bank: "<:lux_bank:1550640811853611180>",
    epicgames: "<:epicgames:1550631998161166459>",
    github: "<:github:1550651201442414622>",
    lx_logo: "<:lx_logo:1550651032076554311>",
    house_brave: "<:house_brave:1550625606717145089>",
    house_brilliance: "<:house_brilliance:1550625608021577738>",
    house_balance: "<:house_balance:1550625605735682058>",
    bar_left_full: "<:bar_left_full:1550665460834631830>",
    bar_left_empty: "<:bar_left_empty:1550665459060445214>",
    bar_mid_full: "<:bar_mid_full:1550665464147878038>",
    bar_mid_empty: "<:bar_mid_empty:1550665462180741171>",
    bar_right_full: "<:bar_right_full:1550665466299678790>",
    bar_right_empty: "<:bar_right_empty:1550665465163157524>",
    bar_single_full: "<:bar_single_full:1550665468522537110>",
    bar_single_empty: "<:bar_single_empty:1550665467339997214>",
    iron_pickaxe: "<:iron_pickaxe:1551584695643279360>",
    gold_pickaxe: "<:gold_pickaxe:1551584685933469696>",
    diamond_pickaxe: "<:diamond_pickaxe:1551584673111478402>",
    iron_sword: "<:iron_sword:1551586284521128036>",
    gold_sword: "<:gold_sword:1551586283443195984>",
    diamond_sword: "<:diamond_sword:1551586281492844585>"
}

module.exports = {
    INTENTS: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates
    ],
    PARTIALS: [
        Partials.Channel,
        Partials.Message
    ],
    CACHE: {
        PROFILES_TTL_MS: 30 * 60 * 1000,
        PROFILES_MAX_SIZE: 5000,
        SETTINGS_TTL_MS: 30 * 60 * 1000,
        SETTINGS_MAX_SIZE: 1000
    },
    COLORS: {
        DEFAULT: "#5865F2",
        SUCCESS: "#2ecc71",
        ERROR: "#e74c3c",
        WARNING: "#f39c12"
    },
    DEFAULT_SHARDS: 2,
    DEFAULT_SHARD_TIMEOUT: 60000,
    EMOJIS,
    emojis: EMOJIS
}
