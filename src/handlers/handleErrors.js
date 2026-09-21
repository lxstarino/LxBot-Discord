const crypto = require("crypto")

function getTimestamp() {
    const now = new Date()
    return now.toISOString().replace("T", " ").substring(0, 19)
}

function generateErrorId() {
    return "ERR-" + crypto.randomBytes(3).toString("hex").toUpperCase()
}

const NOISE_CODES = new Set([
    10062,
    40060,
    50007,
    10008,
    10003,
    10015
])

const NOISE_MESSAGES = [
    "Unknown interaction",
    "Interaction has already been acknowledged",
    "Cannot send messages to this user",
    "Unknown Message",
    "Unknown Channel",
    "ECONNRESET",
    "ETIMEDOUT",
    "UND_ERR_CONNECT_TIMEOUT",
    "socket hang up"
]

function isNoiseError(err) {
    if (!err) return true
    if (err.code && NOISE_CODES.has(err.code)) return true
    const msg = String(err.message || err)
    return NOISE_MESSAGES.some(pattern => msg.includes(pattern))
}

function formatStackOrigin(stack) {
    if (!stack || typeof stack !== "string") return null
    const lines = stack.split("\n").map(l => l.trim())
    const frameLines = lines.filter(l => l.startsWith("at "))

    const localFrame = frameLines.find(l => l.includes("src") && !l.includes("node_modules"))
    const target = localFrame || frameLines[0]
    if (!target) return null

    const match = target.match(/at\s+(?:(.+?)\s+\((?:.*[\\/])?(src[\\/].+?)\)|(?:.*[\\/])?(src[\\/].+))/i)
    if (match) {
        const fn = match[1]
        const fileLine = match[2] || match[3]
        return fn ? `${fileLine.replace(/\\/g, "/")} (${fn})` : fileLine.replace(/\\/g, "/")
    }

    return target.replace(/^at\s+/, "").replace(/.*[\\/](src[\\/].*)/, "$1").replace(/\\/g, "/")
}

function extractInteractionContext(interaction) {
    if (!interaction) return null

    let type = "Interaction"
    let target = "Unknown"

    if (typeof interaction.isChatInputCommand === "function" && interaction.isChatInputCommand()) {
        type = "Slash Command"
        target = `/${interaction.commandName}`
        try {
            const sub = interaction.options?.getSubcommand(false)
            const subGroup = interaction.options?.getSubcommandGroup(false)
            if (subGroup) target += ` ${subGroup}`
            if (sub) target += ` ${sub}`

            const opts = interaction.options?.data
            const flatOpts = []
            const collectOpts = (list) => {
                if (!list) return
                for (const o of list) {
                    if (o.value !== undefined) flatOpts.push(`${o.name}: ${o.value}`)
                    if (o.options) collectOpts(o.options)
                }
            }
            collectOpts(opts)
            if (flatOpts.length > 0) target += ` (${flatOpts.join(", ")})`
        } catch { }
    } else if (typeof interaction.isButton === "function" && interaction.isButton()) {
        type = "Button"
        target = `ID: [${interaction.customId}]`
    } else if (typeof interaction.isModalSubmit === "function" && interaction.isModalSubmit()) {
        type = "Modal Submit"
        target = `ID: [${interaction.customId}]`
    } else if (typeof interaction.isAnySelectMenu === "function" && interaction.isAnySelectMenu()) {
        type = "Select Menu"
        const values = interaction.values ? ` -> ${interaction.values.join(", ")}` : ""
        target = `ID: [${interaction.customId}]${values}`
    } else if (interaction.customId) {
        type = "Component"
        target = `ID: [${interaction.customId}]`
    }

    const user = interaction.user
        ? `${interaction.user.tag || interaction.user.username} (ID: ${interaction.user.id})`
        : null

    const guild = interaction.guild
        ? `${interaction.guild.name} (ID: ${interaction.guild.id})`
        : "Direct Messages"

    const channel = interaction.channel
        ? `#${interaction.channel.name || interaction.channel.id} (ID: ${interaction.channel.id})`
        : null

    return { type, target, user, guild, channel }
}

function printCompactError(type, ctx, err, errorId = null) {
    const time = getTimestamp()
    const idTag = errorId ? ` [ID: ${errorId}]` : ""
    const header = `[${type.toUpperCase()}] ${time}${idTag}${ctx?.target ? ` | ${ctx.type}: ${ctx.target}` : ""}`
    console.error(`\n${header}`)

    if (ctx && (ctx.user || ctx.guild || ctx.channel)) {
        const parts = []
        if (ctx.user) parts.push(`User: ${ctx.user}`)
        if (ctx.guild) parts.push(`Server: ${ctx.guild}`)
        if (ctx.channel) parts.push(`Kanal: ${ctx.channel}`)
        console.error(`  Kontext: ${parts.join(" | ")}`)
    }

    const errName = err?.name || (err?.title || "Error")
    const errMsg = err?.message || (err?.desc ? err.desc : String(err))
    let errorLine = `  Fehler:  ${errName}: ${errMsg}`
    if (err?.code || err?.status || err?.method) {
        const apiParts = []
        if (err.code) apiParts.push(`Code ${err.code}`)
        if (err.method || err.url) apiParts.push(`${err.method || "GET"} ${err.url || ""}`)
        if (err.status) apiParts.push(`Status ${err.status}`)
        errorLine += ` [${apiParts.join(" | ")}]`
    }
    console.error(errorLine)

    const origin = formatStackOrigin(err?.stack)
    if (origin) {
        console.error(`  Quelle:  ${origin}`)
    }
    console.error("")
}

module.exports = (client) => {

    client.handleExecutionError = async (err, interaction, existingErrorId = null) => {
        if (!err || isNoiseError(err)) {
            if (err) {
                console.log(`[IGNORED NOISE] ${getTimestamp()} | ${err.code ? `Code ${err.code}: ` : ""}${err.message || err}`)
            }
            return
        }

        let errorId = existingErrorId
        const isPermissionError = err.code === 50013 || err.code === 50001 || err.message?.includes("Missing Permissions") || err.message?.includes("Missing Access")
        const isCustomError = Boolean(err.desc)

        if (!isPermissionError && !isCustomError && !errorId) {
            errorId = generateErrorId()
        }

        const ctx = extractInteractionContext(interaction)
        printCompactError("Execution Error", ctx, err, errorId)

        if (!interaction) return

        try {
            const ls = client.getLanguage(interaction.guild?.id)
            let title = ls?.errors?.unexpected_title || "Unerwarteter Fehler"
            let desc = `> ${ls?.errors?.unexpected_desc || "Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es später erneut."}`
            if (errorId) {
                desc += `\n> \`ID: ${errorId}\``
            }

            if (isPermissionError) {
                title = ls?.errors?.mp || "Missing Permissions"
                desc = `> ${ls?.events?.interactionCreate?.err_bot_missing_perms || "Bot is missing permissions to access or send messages in this channel."}`
            } else if (isCustomError) {
                title = err.title ? err.title : (ls?.errors?.error || "Fehler")
                desc = `> ${err.desc}`
            }

            const isHandled = interaction.deferred || interaction.replied

            await client.errEmbed({
                type: isHandled ? "editReply" : "reply",
                ephemeral: true,
                title: title,
                desc: desc
            }, interaction).catch((embedErr) => {
                if (!isNoiseError(embedErr)) {
                    console.error("[handleExecutionError] Failed to send error embed:", embedErr.message)
                }
            })
        } catch (embedErr) {
            if (!isNoiseError(embedErr)) {
                console.error("[handleExecutionError] Failed in embed catch:", embedErr.message)
            }
        }
    }

    process.on("unhandledRejection", async (err) => {
        if (isNoiseError(err)) {
            console.log(`[IGNORED NOISE] ${getTimestamp()} | ${err?.code ? `Code ${err.code}: ` : ""}${err?.message || err}`)
            return
        }

        const errorId = generateErrorId()
        printCompactError("Unhandled Promise Rejection", null, err, errorId)

        const lastInteraction = client.lastInteraction
        if (lastInteraction && (Date.now() - (lastInteraction.createdTimestamp || 0) < 15000)) {
            client.lastInteraction = null
            await client.handleExecutionError(err, lastInteraction, errorId)
        }
    })

    process.on("uncaughtException", async (err, origin) => {
        if (isNoiseError(err)) {
            console.log(`[IGNORED NOISE] ${getTimestamp()} | ${err?.code ? `Code ${err.code}: ` : ""}${err?.message || err}`)
            return
        }

        const errorId = generateErrorId()
        printCompactError(`Uncaught Exception (${origin || "process"})`, null, err, errorId)

        const lastInteraction = client.lastInteraction
        if (lastInteraction && (Date.now() - (lastInteraction.createdTimestamp || 0) < 15000)) {
            client.lastInteraction = null
            await client.handleExecutionError(err, lastInteraction, errorId)
        }
    })

    process.on("warning", (warning) => {
        console.warn(`[Process Warning] ${warning?.message || warning}`)
    })

    if (client && typeof client.on === "function") {
        client.on("error", (err) => {
            if (isNoiseError(err)) {
                console.log(`[IGNORED NOISE] ${getTimestamp()} | ${err?.code ? `Code ${err.code}: ` : ""}${err?.message || err}`)
                return
            }
            printCompactError("Discord Client Error", null, err)
        })
    }
}
