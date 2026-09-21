
const { ButtonStyle, ComponentType, SlashCommandBuilder } = require("discord.js")
const { handlemsg } = require("../../utils/stringUtils")

const winCombos = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
]

function checkWinner(board) {
    for (const [a, b, c] of winCombos) {
        if (board[a] !== " " && board[a] === board[b] && board[a] === board[c]) {
            return board[a]
        }
    }
    return board.includes(" ") ? null : "tie"
}

module.exports = {
    guildOnly: true,
    cooldown: 10,
    data: new SlashCommandBuilder()
        .setName("tictactoe")
        .setDescription("Play Tic-Tac-Toe with another user using buttons")
        .addUserOption(option => option
            .setName("opponent")
            .setDescription("The user you want to play against")
            .setRequired(true)
        ),
    async execute(client, interaction) {
        const ls = client.getLanguage(interaction.guild?.id)

        const challenger = interaction.user
        const opponent = interaction.options.getUser("opponent")

        if (opponent.bot) {
            return client.errEmbed({
                type: "reply",
                ephemeral: true,
                desc: ls["cmds"]["tictactoe"]["bot_opponent"]
            }, interaction)
        }

        if (opponent.id === challenger.id) {
            return client.errEmbed({
                type: "reply",
                ephemeral: true,
                desc: ls["cmds"]["tictactoe"]["self_opponent"]
            }, interaction)
        }

        await interaction.deferReply().catch((err) => console.error("[tictactoe] Failed to defer reply:", err.message))

        await client.sendContainer({
            sections: [
                {
                    text: [
                        `**${ls["cmds"]["tictactoe"]["invite_title"] || "⚔️ Tic-Tac-Toe Challenge"}**`,
                        handlemsg(ls["cmds"]["tictactoe"]["invite_desc"] || "<@!{challenger}> challenges <@!{opponent}>!", {
                            challenger: challenger.id,
                            opponent: opponent.id
                        })
                    ]
                },
                {
                    type: "action_row",
                    buttons: [
                        {
                            customId: "ttt-accept",
                            label: ls["cmds"]["tictactoe"]["btn_accept"] || "Annehmen",
                            style: ButtonStyle.Success,
                            emoji: "✅"
                        },
                        {
                            customId: "ttt-decline",
                            label: ls["cmds"]["tictactoe"]["btn_decline"] || "Ablehnen",
                            style: ButtonStyle.Danger,
                            emoji: "❌"
                        }
                    ]
                }
            ],
            accentColor: "#5865F2",
            type: "editReply"
        }, interaction)

        const inviteMsg = await interaction.fetchReply().catch(() => null)
        if (!inviteMsg) return

        const inviteCollector = inviteMsg.createMessageComponentCollector({
            filter: i => i.user.id === opponent.id,
            time: 60000,
            componentType: ComponentType.Button
        })

        let gameStarted = false

        inviteCollector.on("collect", async (i) => {
            if (i.customId === "ttt-decline") {
                inviteCollector.stop("declined")
                return await client.sendContainer({
                    sections: [
                        {
                            text: `❌ **Herausforderung abgelehnt** von <@!${opponent.id}>.`
                        }
                    ],
                    accentColor: "#E74C3C",
                    type: "update"
                }, i)
            }

            if (i.customId === "ttt-accept") {
                gameStarted = true
                inviteCollector.stop("accepted")
                await startGame(i)
            }
        })

        inviteCollector.on("end", async (collected, reason) => {
            if (!gameStarted && reason !== "declined") {
                await client.sendContainer({
                    sections: [
                        {
                            text: `⏳ **Einladung abgelaufen** für <@!${opponent.id}>.`
                        }
                    ],
                    accentColor: "#95A5A6",
                    type: "editReply"
                }, interaction).catch((err) => console.error("[tictactoe] Failed to send expired invite container:", err.message))
            }
        })

        async function startGame(triggerInteraction) {
            const board = [" ", " ", " ", " ", " ", " ", " ", " ", " "]
            let currentPlayer = "X"
            let turnUser = challenger

            const buildBoardSections = (statusText, winner = null, disabled = false) => {
                let accent = "#5865F2"
                if (winner === "X" || winner === "O") accent = "#2ECC71"
                if (winner === "tie") accent = "#F1C40F"
                if (winner === "timeout") accent = "#E74C3C"

                const activeAvatar = (winner && winner !== "tie" && winner !== "timeout")
                    ? (winner === "X" ? challenger.displayAvatarURL({ extension: "png", size: 256 }) : opponent.displayAvatarURL({ extension: "png", size: 256 }))
                    : turnUser.displayAvatarURL({ extension: "png", size: 256 })

                const boardSections = [
                    {
                        text: [
                            `**🎮 Tic-Tac-Toe** (❌ <@!${challenger.id}> vs ⭕ <@!${opponent.id}>)`,
                            statusText
                        ],
                        accessory: {
                            type: "thumbnail",
                            url: activeAvatar,
                            description: "Player Avatar"
                        }
                    }
                ]

                for (let r = 0; r < 3; r++) {
                    const rowButtons = []
                    for (let c = 0; c < 3; c++) {
                        const index = r * 3 + c
                        const cellValue = board[index]

                        let style = ButtonStyle.Secondary
                        let label = "-"

                        if (cellValue === "X") {
                            style = ButtonStyle.Primary
                            label = "X"
                        } else if (cellValue === "O") {
                            style = ButtonStyle.Success
                            label = "O"
                        }

                        rowButtons.push({
                            customId: `ttt-cell-${index}`,
                            label: cellValue === " " ? "➖" : label,
                            style: style,
                            disabled: disabled || cellValue !== " "
                        })
                    }
                    boardSections.push({
                        type: "action_row",
                        buttons: rowButtons
                    })
                }

                return { sections: boardSections, accentColor: accent }
            }

            const initialStatus = `🎲 **Am Zug:** <@!${turnUser.id}> (\`X\`)`
            const gameData = buildBoardSections(initialStatus)

            await client.sendContainer({
                sections: gameData.sections,
                accentColor: gameData.accentColor,
                type: "update"
            }, triggerInteraction)

            const gameCollector = inviteMsg.createMessageComponentCollector({
                filter: i => i.user.id === turnUser.id,
                time: 300000,
                componentType: ComponentType.Button
            })

            gameCollector.on("collect", async (i) => {
                const index = parseInt(i.customId.replace("ttt-cell-", ""), 10)
                board[index] = currentPlayer

                const result = checkWinner(board)
                if (result) {
                    gameCollector.stop(result)

                    let endStatus = ""
                    if (result === "tie") {
                        endStatus = `🤝 **Unentschieden!** Niemand gewinnt.`
                    } else {
                        const winnerUser = result === "X" ? challenger : opponent
                        endStatus = `🏆 **Sieg!** <@!${winnerUser.id}> (\`${result}\`) gewinnt das Spiel!`
                    }

                    const endData = buildBoardSections(endStatus, result, true)
                    return await client.sendContainer({
                        sections: endData.sections,
                        accentColor: endData.accentColor,
                        type: "update"
                    }, i)
                }

                currentPlayer = currentPlayer === "X" ? "O" : "X"
                turnUser = currentPlayer === "X" ? challenger : opponent

                gameCollector.filter = (btnInt) => btnInt.user.id === turnUser.id

                const nextTurnStatus = `🎲 **Am Zug:** <@!${turnUser.id}> (\`${currentPlayer}\`)`
                const nextData = buildBoardSections(nextTurnStatus)

                await client.sendContainer({
                    sections: nextData.sections,
                    accentColor: nextData.accentColor,
                    type: "update"
                }, i)
            })

            gameCollector.on("end", async (collected, reason) => {
                if (reason === "time") {
                    const timeoutStatus = `⏳ **Zeit abgelaufen!** Inaktivität.`
                    const timeoutData = buildBoardSections(timeoutStatus, "timeout", true)
                    await client.sendContainer({
                        sections: timeoutData.sections,
                        accentColor: timeoutData.accentColor,
                        type: "editReply"
                    }, interaction).catch((err) => console.error("[tictactoe] Failed to send timeout container:", err.message))
                }
            })
        }
    }
}
