const { SlashCommandBuilder } = require("@discordjs/builders")
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require("discord.js")

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
        let ls = client.getLanguage(interaction.guild?.id)
        const { handlemsg } = require(`${process.cwd()}/src/handlers/functions`)

        const challenger = interaction.user
        const opponent = interaction.options.getUser("opponent")

        if (opponent.bot) {
            return client.errEmbed({
                type: "reply",
                ephemeral: true,
                title: ls["cmds"]["tictactoe"]["title"],
                desc: ls["cmds"]["tictactoe"]["bot_opponent"]
            }, interaction)
        }

        if (opponent.id === challenger.id) {
            return client.errEmbed({
                type: "reply",
                ephemeral: true,
                title: ls["cmds"]["tictactoe"]["title"],
                desc: ls["cmds"]["tictactoe"]["self_opponent"]
            }, interaction)
        }

        const inviteRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("ttt-accept")
                .setLabel(ls["cmds"]["tictactoe"]["btn_accept"])
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId("ttt-decline")
                .setLabel(ls["cmds"]["tictactoe"]["btn_decline"])
                .setStyle(ButtonStyle.Danger)
        )

        const inviteEmbed = client.tempEmbed()
            .setDescription(`⚔️ <@!${challenger.id}> challenges <@!${opponent.id}> to Tic-Tac-Toe!`)
            .setColor("#5865F2")

        const inviteMsg = await interaction.reply({
            embeds: [inviteEmbed],
            components: [inviteRow],
            fetchReply: true
        }).catch((err) => { console.log("Invite Error:\n" + err); return null; })

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
                const embed = client.tempEmbed()
                    .setDescription(`❌ Challenge declined by <@!${opponent.id}>.`)
                    .setColor("#E74C3C")
                await i.update({
                    embeds: [embed],
                    components: []
                }).catch(() => {})
                return
            }

            if (i.customId === "ttt-accept") {
                gameStarted = true
                inviteCollector.stop("accepted")
                await i.deferUpdate().catch(() => {})
                await startGame()
            }
        })

        inviteCollector.on("end", async (collected, reason) => {
            if (!gameStarted && reason !== "declined") {
                const embed = client.tempEmbed()
                    .setDescription(`⏳ Invitation expired for <@!${opponent.id}>.`)
                    .setColor("#95A5A6")
                await inviteMsg.edit({
                    embeds: [embed],
                    components: []
                }).catch(() => {})
            }
        })

        async function startGame() {
            const board = [" ", " ", " ", " ", " ", " ", " ", " ", " "]
            let currentPlayer = "X"
            let turnUser = challenger

            const buildBoardComponents = (disabled = false) => {
                const rows = []
                for (let r = 0; r < 3; r++) {
                    const row = new ActionRowBuilder()
                    for (let c = 0; c < 3; c++) {
                        const index = r * 3 + c
                        const cellValue = board[index]

                        let style = ButtonStyle.Secondary
                        if (cellValue === "X") style = ButtonStyle.Primary
                        if (cellValue === "O") style = ButtonStyle.Success

                        row.addComponents(
                            new ButtonBuilder()
                                .setCustomId(`ttt-cell-${index}`)
                                .setLabel(cellValue === " " ? "\u200b" : cellValue)
                                .setStyle(style)
                                .setDisabled(disabled || cellValue !== " ")
                        )
                    }
                    rows.push(row)
                }
                return rows
            }

            const gameEmbed = (statusText, color = null) => {
                const embed = client.tempEmbed()
                    .setDescription(`🎮 **Tic-Tac-Toe**\n❌ <@!${challenger.id}> vs ⭕ <@!${opponent.id}>\n\n${statusText}`)

                if (color) {
                    embed.setColor(color)
                } else if (interaction.guild) {
                    const hex = client.settings.mapCache?.get(interaction.guild.id)
                    if (hex && hex.embed_color) {
                        embed.setColor(hex.embed_color)
                    } else {
                        embed.setColor("#5865F2")
                    }
                } else {
                    embed.setColor("#5865F2")
                }
                return embed
            }

            const initialStatus = handlemsg(ls["cmds"]["tictactoe"]["game_start"], { player: turnUser.id })

            const gameMessage = await inviteMsg.edit({
                embeds: [gameEmbed(initialStatus)],
                components: buildBoardComponents()
            }).catch(() => null)

            if (!gameMessage) return

            const gameCollector = gameMessage.createMessageComponentCollector({
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
                    let embedColor = "#95A5A6"
                    if (result === "tie") {
                        endStatus = ls["cmds"]["tictactoe"]["tie"]
                    } else {
                        const winnerUser = result === "X" ? challenger : opponent
                        endStatus = handlemsg(ls["cmds"]["tictactoe"]["winner"], { player: winnerUser.id, symbol: result })
                        embedColor = "#2ECC71"
                    }

                    await i.update({
                        embeds: [gameEmbed(endStatus, embedColor)],
                        components: buildBoardComponents(true)
                    }).catch(() => {})
                    return
                }

                currentPlayer = currentPlayer === "X" ? "O" : "X"
                turnUser = currentPlayer === "X" ? challenger : opponent

                gameCollector.filter = (btnInt) => btnInt.user.id === turnUser.id

                const nextTurnStatus = handlemsg(ls["cmds"]["tictactoe"]["your_turn"], { player: turnUser.id, symbol: currentPlayer })

                await i.update({
                    embeds: [gameEmbed(nextTurnStatus)],
                    components: buildBoardComponents()
                }).catch(() => {})
            })

            gameCollector.on("end", async (collected, reason) => {
                if (reason === "time") {
                    const embed = gameEmbed(ls["cmds"]["tictactoe"]["timeout"], "#E74C3C")
                    await gameMessage.edit({
                        embeds: [embed],
                        components: buildBoardComponents(true)
                    }).catch(() => {})
                }
            })
        }
    }
}
