const { EMOJIS } = require("../core/constants")

const fishList = {
    common: [
        { key: "cod", emoji: "🐟", value: 150 },
        { key: "salmon", emoji: "🐟", value: 200 },
        { key: "trout", emoji: "🐠", value: 180 },
        { key: "carp", emoji: "🐟", value: 220 },
        { key: "tuna", emoji: "🐟", value: 250 },
        { key: "shrimp", emoji: "🦐", value: 120 },
        { key: "crab", emoji: "🦀", value: 280 }
    ],
    uncommon: [
        { key: "clownfish", emoji: "🐠", value: 400 },
        { key: "pufferfish", emoji: "🐡", value: 500 },
        { key: "catfish", emoji: "🐟", value: 450 },
        { key: "lobster", emoji: "🦞", value: 600 },
        { key: "swordfish", emoji: "🗡️", value: 750 },
        { key: "jellyfish", emoji: "🪼", value: 550 },
        { key: "electric_eel", emoji: "⚡", value: 700 }
    ],
    rare: [
        { key: "squid", emoji: "🦑", value: 1200 },
        { key: "shark", emoji: "🦈", value: 2500 },
        { key: "octopus", emoji: "🐙", value: 1600 },
        { key: "manta_ray", emoji: "🪸", value: 1900 },
        { key: "anglerfish", emoji: "🏮", value: 2200 },
        { key: "hammerhead", emoji: "🦈", value: 3000 }
    ],
    legendary: [
        { key: "seadragon", emoji: "🐉", value: 10000 },
        { key: "kraken", emoji: "🐙", value: 15000 },
        { key: "megalodon", emoji: "🦈", value: 20000 },
        { key: "leviathan", emoji: "🌊", value: 30000 },
        { key: "golden_koi", emoji: "✨", value: 25000 }
    ]
}

const oreList = {
    common: [
        { key: "stone", emoji: "🪨", value: 50 },
        { key: "coal", emoji: "⬛", value: 100 },
        { key: "copper", emoji: "🥉", value: 150 },
        { key: "tin", emoji: "⚪", value: 180 }
    ],
    uncommon: [
        { key: "iron", emoji: "🔩", value: 250 },
        { key: "silver", emoji: "🥈", value: 400 },
        { key: "lapis", emoji: "🟦", value: 500 },
        { key: "quartz", emoji: "🔮", value: 600 }
    ],
    rare: [
        { key: "gold", emoji: "🪙", value: 800 },
        { key: "platinum", emoji: "🔵", value: 1200 },
        { key: "emerald", emoji: "🟢", value: 1800 },
        { key: "ruby", emoji: "🔴", value: 2400 },
        { key: "amethyst", emoji: "🟣", value: 2800 }
    ],
    legendary: [
        { key: "diamond", emoji: "💎", value: 5000 },
        { key: "titanium", emoji: "🛡️", value: 8000 },
        { key: "obsidian", emoji: "🖤", value: 10000 },
        { key: "tanzanite", emoji: "🔷", value: 15000 },
        { key: "black_opal", emoji: "🔮", value: 20000 },
        { key: "painite", emoji: "🔴", value: 25000 },
        { key: "rhodium", emoji: "✨", value: 30000 }
    ]
}

const huntList = {
    common: [
        { key: "rabbit", emoji: "🐇", value: 120 },
        { key: "chicken", emoji: "🐔", value: 140 },
        { key: "duck", emoji: "🦆", value: 160 },
        { key: "turkey", emoji: "🦃", value: 190 },
        { key: "fox", emoji: "🦊", value: 230 },
        { key: "boar", emoji: "🐗", value: 270 }
    ],
    uncommon: [
        { key: "deer", emoji: "🦌", value: 450 },
        { key: "wolf", emoji: "🐺", value: 550 },
        { key: "bear", emoji: "🐻", value: 650 },
        { key: "bison", emoji: "🦬", value: 720 },
        { key: "alligator", emoji: "🐊", value: 800 }
    ],
    rare: [
        { key: "lion", emoji: "🦁", value: 1400 },
        { key: "tiger", emoji: "🐅", value: 1800 },
        { key: "elephant", emoji: "🐘", value: 2300 },
        { key: "rhino", emoji: "🦏", value: 2700 },
        { key: "mammoth", emoji: "🦣", value: 3200 }
    ],
    legendary: [
        { key: "griffin", emoji: "🦅", value: 10000 },
        { key: "chimera", emoji: "🦁", value: 15000 },
        { key: "hydra", emoji: "🐍", value: 20000 },
        { key: "phoenix", emoji: "🪶", value: 25000 },
        { key: "dragon", emoji: "🐉", value: 35000 }
    ]
}

const chestList = [
    {
        key: "wooden_crate",
        emoji: "🪵",
        source: "fish",
        dropChance: 0.12,
        minCoins: 500,
        maxCoins: 2500,
        bonusItems: [
            { type: "fish", key: "salmon", count: 1, chance: 0.35 },
            { type: "tool", key: "better_bait", count: 1, chance: 0.25 }
        ]
    },
    {
        key: "sunken_chest",
        emoji: "🪸",
        source: "fish",
        dropChance: 0.03,
        minCoins: 5000,
        maxCoins: 20000,
        bonusItems: [
            { type: "fish", key: "shark", count: 1, chance: 0.30 },
            { type: "fish", key: "golden_koi", count: 1, chance: 0.10 },
            { type: "tool", key: "golden_bait", count: 10, chance: 0.30 }
        ]
    },
    {
        key: "miner_crate",
        emoji: "⛏️",
        source: "mine",
        dropChance: 0.12,
        minCoins: 500,
        maxCoins: 2500,
        bonusItems: [
            { type: "ore", key: "iron", count: 2, chance: 0.35 },
            { type: "tool", key: "iron_pickaxe", count: 25, chance: 0.20 }
        ]
    },
    {
        key: "ancient_chest",
        emoji: "👑",
        source: "mine",
        dropChance: 0.03,
        minCoins: 7500,
        maxCoins: 30000,
        bonusItems: [
            { type: "ore", key: "diamond", count: 1, chance: 0.35 },
            { type: "ore", key: "obsidian", count: 1, chance: 0.20 },
            { type: "tool", key: "gold_pickaxe", count: 40, chance: 0.25 }
        ]
    }
]

const toolList = [
    { key: "better_bait", emoji: "🪱", type: "bait", durability: 1, recipe: { shrimp: 3, crab: 1 }, perks: { luckBonus: 15 } },
    { key: "golden_bait", emoji: "🪝", type: "bait", durability: 10, recipe: { golden_koi: 1, squid: 2 }, perks: { luckBonus: 30, minRarity: "uncommon" } },
    { key: "iron_pickaxe", emoji: EMOJIS.iron_pickaxe || "⛏️", type: "pickaxe", durability: 25, recipe: { iron: 5, stone: 10 }, perks: { luckBonus: 10 } },
    { key: "gold_pickaxe", emoji: EMOJIS.gold_pickaxe || "⛏️", type: "pickaxe", durability: 40, recipe: { gold: 5, iron: 3 }, perks: { luckBonus: 25 } },
    { key: "diamond_pickaxe", emoji: EMOJIS.diamond_pickaxe || "⛏️", type: "pickaxe", durability: 100, recipe: { diamond: 5, platinum: 2, obsidian: 1 }, perks: { luckBonus: 50, minRarity: "uncommon" } },
    { key: "iron_sword", emoji: EMOJIS.iron_sword || "⚔️", type: "sword", durability: 25, recipe: { iron: 5, stone: 10 }, perks: { luckBonus: 10 } },
    { key: "gold_sword", emoji: EMOJIS.gold_sword || "⚔️", type: "sword", durability: 40, recipe: { gold: 5, iron: 3 }, perks: { luckBonus: 25 } },
    { key: "diamond_sword", emoji: EMOJIS.diamond_sword || "⚔️", type: "sword", durability: 100, recipe: { diamond: 5, platinum: 2, obsidian: 1 }, perks: { luckBonus: 50, minRarity: "uncommon" } }
]

const fishDetails = {}
const fishPrices = {}
for (const items of Object.values(fishList)) {
    for (const item of items) {
        fishDetails[item.key] = { emoji: item.emoji, value: item.value }
        fishPrices[item.key] = item.value
    }
}

const oreDetails = {}
const orePrices = {}
for (const items of Object.values(oreList)) {
    for (const item of items) {
        oreDetails[item.key] = { emoji: item.emoji, value: item.value }
        orePrices[item.key] = item.value
    }
}

const huntDetails = {}
const huntPrices = {}
for (const items of Object.values(huntList)) {
    for (const item of items) {
        huntDetails[item.key] = { emoji: item.emoji, value: item.value }
        huntPrices[item.key] = item.value
    }
}

const toolDetails = {}
for (const item of toolList) {
    toolDetails[item.key] = {
        emoji: item.emoji,
        type: item.type,
        durability: item.durability,
        recipe: item.recipe,
        perks: item.perks
    }
}

const chestDetails = {}
for (const chest of chestList) {
    chestDetails[chest.key] = {
        emoji: chest.emoji,
        source: chest.source,
        dropChance: chest.dropChance,
        minCoins: chest.minCoins,
        maxCoins: chest.maxCoins,
        bonusItems: chest.bonusItems
    }
}

module.exports = {
    fishList,
    oreList,
    huntList,
    toolList,
    chestList,
    fishDetails,
    fishPrices,
    oreDetails,
    orePrices,
    huntDetails,
    huntPrices,
    toolDetails,
    chestDetails
}
