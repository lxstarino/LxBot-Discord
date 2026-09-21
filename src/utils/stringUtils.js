const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js")

function handlemsg(ls, obj = {}) {
    if (!ls || typeof ls !== "string") return ls || ""
    let res = ls
    Object.entries(obj).forEach(([key, val]) => {
        res = res.replaceAll(`{${key}}`, val !== undefined && val !== null ? val : "")
    })
    return res
}

function getSetupControls({ btn_send = "Send", btn_reset = "Reset", btn_cancel = "Cancel", extra = [] }) {
    const row = new ActionRowBuilder()
    for (const btn of extra) {
        row.addComponents(btn)
    }
    row.addComponents(
        new ButtonBuilder().setCustomId("btn-send").setLabel(btn_send).setStyle(ButtonStyle.Success).setEmoji("📨"),
        new ButtonBuilder().setCustomId("btn-reset").setLabel(btn_reset).setStyle(ButtonStyle.Danger).setEmoji("🔄"),
        new ButtonBuilder().setCustomId("btn-cancel").setLabel(btn_cancel).setStyle(ButtonStyle.Danger).setEmoji("❌")
    )
    return row
}

function createProgressBar(current, max, totalSegments = 10, customEmojis = null) {
    const emojis = customEmojis || require("../core/constants").EMOJIS
    const progress = Math.min(Math.max(max > 0 ? current / max : 0, 0), 1)
    const filled = Math.round(progress * totalSegments)

    if (totalSegments <= 1) {
        return filled >= 1 ? (emojis.bar_single_full || "🟦") : (emojis.bar_single_empty || "⬛")
    }

    let bar = ""
    bar += filled >= 1 ? (emojis.bar_left_full || "🟦") : (emojis.bar_left_empty || "⬛")

    for (let i = 1; i < totalSegments - 1; i++) {
        bar += filled > i ? (emojis.bar_mid_full || "🟦") : (emojis.bar_mid_empty || "⬛")
    }

    bar += filled >= totalSegments ? (emojis.bar_right_full || "🟦") : (emojis.bar_right_empty || "⬛")

    return bar
}

module.exports = {
    handlemsg,
    getSetupControls,
    createProgressBar
}
