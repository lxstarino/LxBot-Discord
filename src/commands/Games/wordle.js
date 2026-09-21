const {
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    AttachmentBuilder
} = require("discord.js")
const { createCanvas } = require("@napi-rs/canvas")
const { handlemsg } = require("../../utils/stringUtils")

const WORD_LIST_EN = [
    "APPLE", "BEACH", "BRAIN", "BREAD", "CHAIR", "CHESS", "CLOUD", "CROWN", "DANCE", "DREAM",
    "EARTH", "FLAME", "FRUIT", "GHOST", "GLASS", "GRAPE", "HEART", "HOUSE", "JUICE", "KNIFE",
    "LEMON", "LIGHT", "MAGIC", "MONEY", "MUSIC", "NIGHT", "OCEAN", "PAINT", "PARTY", "PIZZA",
    "PLANT", "POWER", "QUEEN", "RADIO", "RIVER", "ROBOT", "SHARK", "SMILE", "SPACE", "STARS",
    "STONE", "STORM", "SUGAR", "SWORD", "TIGER", "TRAIN", "TRUTH", "VOICE", "WATER", "WORLD",
    "YOUTH", "ZEBRA", "ANGEL", "BLACK", "BLOOD", "BOARD", "BRAVE", "BUILD", "CANDY", "CHAIN",
    "CHEST", "CLOCK", "COURT", "CROSS", "DEATH", "DRAFT", "EAGLE", "FAITH", "FIELD", "FIGHT",
    "FLASH", "FLOOR", "FOCUS", "FORCE", "GIANT", "GLOBE", "GRAIN", "GREEN", "GUARD", "GUIDE",
    "HAVEN", "HONEY", "HORSE", "HOTEL", "IMAGE", "INDEX", "JUDGE", "KINGS", "LASER", "LEVEL",
    "LUNCH", "MARCH", "MATCH", "METAL", "MODEL", "MOTOR", "MOUNT", "MOUSE", "NOBLE", "NORTH",
    "NURSE", "OPERA", "ORDER", "PANEL", "PAPER", "PEACE", "PHASE", "PILOT", "PITCH", "PLATE",
    "POINT", "POUND", "PRIDE", "PRIZE", "PULSE", "RADAR", "RANGE", "RATIO", "RIDER", "ROBIN",
    "ROYAL", "SCALE", "SCOPE", "SCORE", "SENSE", "SHADOW", "SHARP", "SHEET", "SHIELD", "SHOCK",
    "SHORE", "SIGHT", "SKILL", "SMOKE", "SOLAR", "SOLID", "SOUND", "SOUTH", "SPARK", "SPEED",
    "SPORT", "STAGE", "STAND", "STEEL", "STICK", "STOCK", "STYLE", "SWEET", "TABLE", "TASTE",
    "THEME", "TITLE", "TOWER", "TRACK", "TRADE", "TRAIL", "TREND", "TRIAL", "TRUCK", "UNCLE",
    "UNION", "UNITY", "VALUE", "VAPOR", "VAULT", "VIDEO", "VIRUS", "VISIT", "WASTE", "WATCH",
    "WHEAT", "WHEEL", "WHITE", "WINDY", "WINTER", "WOMAN", "WORRY", "YIELD"
]

const WORD_LIST_DE = [
    "ABEND", "ACHSE", "ADLER", "ALARM", "AMPEL", "ANGST", "ANKER", "APFEL", "ARENA", "ARMUT",
    "ASCHE", "ATLAS", "AUTOR", "BAUER", "BEERE", "BERGE", "BESEN", "BEUTE", "BIBER", "BIENE",
    "BISON", "BLATT", "BLICK", "BLITZ", "BLOCK", "BLUME", "BODEN", "BOGEN", "BOHNE", "BONUS",
    "BRAUT", "BRIEF", "BRUST", "BUCHE", "BUSCH", "CHAMP", "CHAOS", "CLOWN", "CREME", "DAMPF",
    "DAUER", "DECKE", "DEGEN", "DEICH", "DICHT", "DIEBE", "DRAHT", "DRAMA", "DRECK", "DURST",
    "EBENE", "EICHE", "EIMER", "EISEN", "ENGEL", "ENKEL", "ERNTE", "ESSEN", "FABEL", "FADEN",
    "FAHNE", "FAHRT", "FALKE", "FALLE", "FARBE", "FAUST", "FEDER", "FEIER", "FEIND", "FELGE",
    "FESTE", "FEUER", "FIGUR", "FILME", "FINTE", "FISCH", "FLUCH", "FLUSS", "FOLGE", "FORUM",
    "FOTOS", "FRAGE", "FRONT", "FROST", "FUCHS", "FUNDE", "GABEL", "GARBE", "GASSE", "GEBER",
    "GEBET", "GEBOT", "GEIST", "GEIGE", "GELBE", "GENIE", "GERTE", "GLANZ", "GLEIS", "GLIED",
    "GNADE", "GURKE", "HAFEN", "HAGEL", "HALLE", "HALTE", "HANDY", "HARFE", "HAUBE", "HAUPT",
    "HEBEL", "HECKE", "HEIDE", "HERDE", "HITZE", "HOBEL", "HONIG", "HOTEL", "HUMOR", "HUNDE",
    "HYMNE", "IKONE", "IMAGE", "INSEL", "JACKE", "JUBEL", "KABEL", "KAMIN", "KANAL", "KANNE",
    "KAPPE", "KARTE", "KATER", "KATZE", "KEGEL", "KERZE", "KETTE", "KISTE", "KLANG", "KLEID",
    "KLEIN", "KLIMA", "KNOPF", "KOMET", "KRAFT", "KREBS", "KREIS", "KREUZ", "KRIEG", "KRONE",
    "KUGEL", "KUNST", "LAMPE", "LANZE", "LAUFE", "LAUNE", "LEBEN", "LEDER", "LEINE", "LICHT",
    "LIEBE", "LINIE", "LIPPE", "LISTE", "LITER", "LOGIK", "LUCHS", "MAGEN", "MAGIE", "MAUER",
    "MEILE", "MENGE", "MILCH", "MINZE", "MITTE", "MODEM", "MONAT", "MOTOR", "MOTTE", "MUSIK",
    "NACHT", "NADEL", "NAGEL", "NATUR", "NEBEL", "NELKE", "NETZE", "NOTEN", "NUDEL", "ONKEL",
    "OPFER", "OPTIK", "ORDEN", "ORGAN", "OTTER", "OZEAN", "PANDA", "PANIK", "PAPPE", "PAUSE",
    "PERLE", "PFEIL", "PFERD", "PFOTE", "PILOT", "PIRAT", "PLATZ", "POKAL", "PRINZ", "PROBE",
    "PUDEL", "PUMPE", "PUNKT", "PUPPE", "QUARZ", "RADIO", "RASEN", "RAUCH", "REGEN", "REICH",
    "REISE", "RIESE", "RINGE", "ROBBE", "ROBOT", "ROSEN", "RUDER", "RUINE", "SACHE", "SAHNE",
    "SALAT", "SALBE", "SAMEN", "SAUNA", "SCHAF", "SCHAL", "SCHAU", "SCHUH", "SCHUB", "SEIDE",
    "SEIFE", "SEITE", "SONNE", "SPEER", "SPIEL", "SPORT", "STADT", "STAHL", "STALL", "STAMM",
    "STAND", "STARK", "STAUB", "STEIN", "STERN", "STIFT", "STOCK", "STOFF", "STOLZ", "STURZ",
    "STROH", "STROM", "STUFE", "STUHL", "STURM", "SUCHE", "SUMME", "SUPPE", "TABAK", "TAFEL",
    "TANTE", "TASSE", "TAUBE", "TEICH", "TIGER", "TISCH", "TITEL", "TONNE", "TORTE", "TRAUM",
    "TREUE", "TRIEB", "TRINK", "TRITT", "TROST", "TULPE", "UNRUH", "VATER", "VOGEL", "WAGEN",
    "WANGE", "WANNE", "WARTE", "WEBER", "WELLE", "WERTE", "WESPE", "WESTE", "WETTE", "WICHT",
    "WIESE", "WILLE", "WIPPE", "WOCHE", "WOLKE", "WOLLE", "WORTE", "WURST", "ZANGE", "ZEBRA",
    "ZEILE", "ZIEGE", "ZELLE", "ZITAT", "ZUNFT", "ZUNGE", "ZWEIG", "ZWERG"
]

function evaluateGuess(guess, target) {
    const result = Array(5).fill("⬛")
    const targetCounts = {}

    for (const ch of target) {
        targetCounts[ch] = (targetCounts[ch] || 0) + 1
    }

    for (let i = 0; i < 5; i++) {
        if (guess[i] === target[i]) {
            result[i] = "🟩"
            targetCounts[guess[i]]--
        }
    }

    for (let i = 0; i < 5; i++) {
        if (result[i] !== "🟩") {
            const ch = guess[i]
            if (targetCounts[ch] && targetCounts[ch] > 0) {
                result[i] = "🟨"
                targetCounts[ch]--
            }
        }
    }

    return result
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + width - radius, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
    ctx.lineTo(x + width, y + height - radius)
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    ctx.lineTo(x + radius, y + height)
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
    ctx.closePath()
}

function generateWordleCanvas(guesses, results) {
    const tileSize = 68
    const gap = 10
    const padding = 10

    const width = 5 * tileSize + 4 * gap + 2 * padding
    const height = 6 * tileSize + 5 * gap + 2 * padding

    const canvas = createCanvas(width, height)
    const ctx = canvas.getContext("2d")

    const COLORS = {
        correct: "#538D4E",
        present: "#B59F3B",
        absent: "#3A3A3C",
        emptyBg: "rgba(35, 35, 38, 0.5)",
        emptyBorder: "#3A3A3C",
        textLight: "#FFFFFF"
    }

    const boardStartX = padding
    const boardStartY = padding

    for (let r = 0; r < 6; r++) {
        for (let c = 0; c < 5; c++) {
            const x = boardStartX + c * (tileSize + gap)
            const y = boardStartY + r * (tileSize + gap)

            if (r < guesses.length) {
                const evalType = results[r][c]
                let bgColor = COLORS.absent
                if (evalType === "🟩") bgColor = COLORS.correct
                else if (evalType === "🟨") bgColor = COLORS.present

                ctx.fillStyle = bgColor
                drawRoundedRect(ctx, x, y, tileSize, tileSize, 8)
                ctx.fill()

                const letter = guesses[r][c]
                ctx.fillStyle = COLORS.textLight
                ctx.font = "bold 36px Arial, sans-serif"
                ctx.textAlign = "center"
                ctx.textBaseline = "middle"
                ctx.fillText(letter, x + tileSize / 2, y + tileSize / 2 + 1)
            } else {
                ctx.fillStyle = COLORS.emptyBg
                drawRoundedRect(ctx, x, y, tileSize, tileSize, 8)
                ctx.fill()
                ctx.strokeStyle = COLORS.emptyBorder
                ctx.lineWidth = 2.5
                ctx.stroke()
            }
        }
    }

    return canvas.toBuffer("image/png")
}

module.exports = {
    guildOnly: false,
    cooldown: 120,
    data: new SlashCommandBuilder()
        .setName("wordle")
        .setDescription("Play a game of Wordle (guess the 5-letter word in 6 tries)")
        .addStringOption(option => option
            .setName("language")
            .setDescription("Choose word language (Default: English)")
            .addChoices(
                { name: "English", value: "en" },
                { name: "Deutsch", value: "de" }
            )
            .setRequired(false)
        ),
    async execute(client, interaction) {
        const chosenLang = interaction.options.getString("language") || "en"
        const pool = chosenLang === "de" ? WORD_LIST_DE : WORD_LIST_EN
        let targetWord = pool[Math.floor(Math.random() * pool.length)]

        const ls = client.getLanguage(chosenLang)

        let guesses = []
        let results = []
        let gameOver = false
        let modalCounter = 0

        const buildActiveComponents = () => {
            return [
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId("wordle-guess")
                        .setLabel(ls["cmds"]["wordle"]["btn_guess"] || "Enter Guess")
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji("📝"),
                    new ButtonBuilder()
                        .setCustomId("wordle-cancel")
                        .setLabel(ls["cmds"]["wordle"]["btn_cancel"] || "Cancel")
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji("❌")
                )
            ]
        }

        const buildDisabledComponents = () => {
            return [
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId("wordle-guess")
                        .setLabel(ls["cmds"]["wordle"]["btn_guess"] || "Enter Guess")
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji("📝")
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId("wordle-cancel")
                        .setLabel(ls["cmds"]["wordle"]["btn_cancel"] || "Cancel")
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji("❌")
                        .setDisabled(true)
                )
            ]
        }

        const createGameState = (desc, color = "#57F287") => {
            const buffer = generateWordleCanvas(guesses, results)
            const attachment = new AttachmentBuilder(buffer, { name: "wordle.png" })
            const langLabel = chosenLang === "de" ? "Deutsch" : "English"
            const title = `${ls["cmds"]["wordle"]["title"] || "Wordle"} • ${langLabel}`

            const embed = client.tempEmbed()
                .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
                .setTitle(title)
                .setDescription(desc)
                .setImage("attachment://wordle.png")
                .setColor(color)

            return { embed, attachment }
        }

        const initialDesc = ls["cmds"]["wordle"]["desc_playing"] || "Guess the secret **5-letter word** in **6 attempts**!"
        const { embed: initialEmbed, attachment: initialAttachment } = createGameState(initialDesc, "#57F287")

        const replyMsg = await client.Embed([initialEmbed], buildActiveComponents(), "reply", false, interaction, [initialAttachment])
        if (!replyMsg) return

        const collector = replyMsg.createMessageComponentCollector({
            idle: 600000
        })

        collector.on("collect", async (i) => {
            if (i.user.id !== interaction.user.id) {
                return i.reply({
                    content: `❌ ${ls["errors"]["not_your_turn"] || "This game belongs to another player!"}`,
                    ephemeral: true
                }).catch((err) => console.error("[wordle] Failed to send not-your-turn reply:", err.message))
            }

            if (i.customId === "wordle-cancel") {
                gameOver = true
                collector.stop("cancelled")
                const cancelDesc = handlemsg(ls["cmds"]["wordle"]["desc_cancel"], {
                    word: targetWord
                })
                const { embed: cancelEmbed, attachment: cancelAttachment } = createGameState(cancelDesc, "#ED4245")

                await i.update({
                    embeds: [cancelEmbed],
                    files: [cancelAttachment],
                    components: []
                }).catch(async () => {
                    await interaction.editReply({
                        embeds: [cancelEmbed],
                        files: [cancelAttachment],
                        components: []
                    }).catch((err) => console.error("[wordle] Failed to edit reply on cancel fallback:", err.message))
                })
                return
            }

            if (i.customId === "wordle-guess") {
                modalCounter++
                const modalId = `wmodal_${interaction.id}_${modalCounter}`

                const placeholder = chosenLang === "de" ? "z.B. TRAUM" : "e.g. CRANE"

                const modal = new ModalBuilder()
                    .setCustomId(modalId)
                    .setTitle(ls["cmds"]["wordle"]["modal_title"] || "Wordle - Enter Guess")
                    .addComponents(
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId("word_input")
                                .setLabel(ls["cmds"]["wordle"]["modal_label"] || "Enter your 5-letter word")
                                .setPlaceholder(placeholder)
                                .setStyle(TextInputStyle.Short)
                                .setMinLength(5)
                                .setMaxLength(5)
                                .setRequired(true)
                        )
                    )

                await i.showModal(modal).catch((err) => console.error("[wordle] Failed to show guess modal:", err.message))

                const submitted = await i.awaitModalSubmit({
                    filter: m => m.customId === modalId && m.user.id === interaction.user.id,
                    time: 300000
                }).catch(() => null)

                if (!submitted) return

                let rawInput = submitted.fields.getTextInputValue("word_input").trim().toUpperCase()

                if (rawInput.length !== 5) {
                    return submitted.reply({
                        content: `❌ ${ls["cmds"]["wordle"]["err_length"] || "Your guess must be exactly 5 letters long!"}`,
                        ephemeral: true
                    }).catch((err) => console.error("[wordle] Failed to reply invalid length error:", err.message))
                }

                if (!/^[A-Z]+$/.test(rawInput)) {
                    return submitted.reply({
                        content: `❌ ${ls["cmds"]["wordle"]["err_alpha"] || "Your guess must only contain letters (A-Z)!"}`,
                        ephemeral: true
                    }).catch((err) => console.error("[wordle] Failed to reply non-alpha error:", err.message))
                }

                await submitted.deferUpdate().catch((err) => console.error("[wordle] Failed to defer update modal submission:", err.message))

                const evalRes = evaluateGuess(rawInput, targetWord)
                guesses.push(rawInput)
                results.push(evalRes)

                const isWon = rawInput === targetWord
                const isLost = !isWon && guesses.length >= 6

                let updatedDesc = initialDesc
                let updatedColor = "#57F287"
                let updatedComponents = buildActiveComponents()

                if (isWon) {
                    gameOver = true
                    collector.stop("won")
                    updatedDesc = handlemsg(ls["cmds"]["wordle"]["desc_win"], {
                        attempts: guesses.length,
                        word: targetWord
                    })
                    updatedColor = "#57F287"
                    updatedComponents = []
                } else if (isLost) {
                    gameOver = true
                    collector.stop("lost")
                    updatedDesc = handlemsg(ls["cmds"]["wordle"]["desc_lose"], {
                        word: targetWord
                    })
                    updatedColor = "#ED4245"
                    updatedComponents = []
                } else {
                    collector.resetTimer()
                }

                const { embed: updatedEmbed, attachment: updatedAttachment } = createGameState(updatedDesc, updatedColor)

                await interaction.editReply({
                    embeds: [updatedEmbed],
                    files: [updatedAttachment],
                    components: updatedComponents
                }).catch((err) => console.error("[wordle] Failed to edit reply with guess result:", err.message))
            }
        })

        collector.on("end", async (collected, reason) => {
            if (reason === "time" && !gameOver) {
                await interaction.editReply({
                    components: buildDisabledComponents()
                }).catch((err) => console.error("[wordle] Failed to disable components on collector end:", err.message))
            }
        })
    }
}
