const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require("discord.js")
const { handlemsg } = require("../../utils/stringUtils")

function checkWinner(board) {
    const rows = 6
    const cols = 7

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols - 3; c++) {
            const val = board[r][c]
            if (val !== " " && val === board[r][c+1] && val === board[r][c+2] && val === board[r][c+3]) {
                return val
            }
        }
    }

    for (let r = 0; r < rows - 3; r++) {
        for (let c = 0; c < cols; c++) {
            const val = board[r][c]
            if (val !== " " && val === board[r+1][c] && val === board[r+2][c] && val === board[r+3][c]) {
                return val
            }
        }
    }

    for (let r = 0; r < rows - 3; r++) {
        for (let c = 0; c < cols - 3; c++) {
            const val = board[r][c]
            if (val !== " " && val === board[r+1][c+1] && val === board[r+2][c+2] && val === board[r+3][c+3]) {
                return val
            }
        }
    }

    for (let r = 3; r < rows; r++) {
        for (let c = 0; c < cols - 3; c++) {
            const val = board[r][c]
            if (val !== " " && val === board[r-1][c+1] && val === board[r-2][c+2] && val === board[r-3][c+3]) {
                return val
            }
        }
    }

    for (let r = 0; r < rows; r++) {
        if (board[r].includes(" ")) return null
    }
    return "tie"
}

module.exports = {
    guildOnly: true,
    cooldown: 10,
    data: new SlashCommandBuilder()
        .setName("connect4")
        .setDescription("Play Connect 4 with another user")
        .addUserOption(option => option
            .setName("opponent")
            .setDescription("The user you want to play against")
            .setRequired(true)
        ),
    async execute(client, interaction) {
        let ls = client.getLanguage(interaction.guild?.id)

        const challenger = interaction.user
        const opponent = interaction.options.getUser("opponent")

        if (opponent.bot) {
            return client.errEmbed({
                type: "reply",
                ephemeral: true,
                desc: ls["cmds"]["connect4"]["bot_opponent"]
            }, interaction)
        }

        if (opponent.id === challenger.id) {
            return client.errEmbed({
                type: "reply",
                ephemeral: true,
                desc: ls["cmds"]["connect4"]["self_opponent"]
            }, interaction)
        }

        const inviteRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("c4-accept")
                .setLabel(ls["cmds"]["connect4"]["btn_accept"])
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId("c4-decline")
                .setLabel(ls["cmds"]["connect4"]["btn_decline"])
                .setStyle(ButtonStyle.Danger)
        )

        const inviteDesc = handlemsg(ls["cmds"]["connect4"]["invite_desc"] || "⚔️ <@!{challenger}> challenges <@!{opponent}> to Connect 4!", {
            challenger: challenger.id,
            opponent: opponent.id
        })
        const inviteEmbed = client.tempEmbed()
            .setDescription(inviteDesc)
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
            if (i.customId === "c4-decline") {
                inviteCollector.stop("declined")
                const embed = client.tempEmbed()
                    .setDescription(`❌ Challenge declined by <@!${opponent.id}>.`)
                    .setColor("#E74C3C")
                await i.update({
                    embeds: [embed],
                    components: []
                }).catch((err) => console.error("[connect4] Failed to update declined invite:", err.message))
                return
            }

            if (i.customId === "c4-accept") {
                gameStarted = true
                inviteCollector.stop("accepted")
                await i.deferUpdate().catch((err) => console.error("[connect4] Failed to defer update:", err.message))
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
                }).catch((err) => console.error("[connect4] Failed to edit expired invite message:", err.message))
            }
        })

        async function startGame() {
            const board = [
                [" ", " ", " ", " ", " ", " ", " "],
                [" ", " ", " ", " ", " ", " ", " "],
                [" ", " ", " ", " ", " ", " ", " "],
                [" ", " ", " ", " ", " ", " ", " "],
                [" ", " ", " ", " ", " ", " ", " "],
                [" ", " ", " ", " ", " ", " ", " "]
            ]
            let currentPlayer = "R"
            let turnUser = challenger

            const buildBoardComponents = (disabled = false) => {
                const row1 = new ActionRowBuilder()
                const row2 = new ActionRowBuilder()

                for (let c = 0; c < 7; c++) {
                    const isColumnFull = board[0][c] !== " "
                    const btn = new ButtonBuilder()
                        .setCustomId(`c4-col-${c}`)
                        .setLabel(`${c + 1}`)
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(disabled || isColumnFull)

                    if (c < 4) {
                        row1.addComponents(btn)
                    } else {
                        row2.addComponents(btn)
                    }
                }
                return [row1, row2]
            }

            const drawTextBoard = () => {
                let text = ""
                for (let r = 0; r < 6; r++) {
                    const rowSymbols = []
                    for (let c = 0; c < 7; c++) {
                        const val = board[r][c]
                        if (val === "R") rowSymbols.push("🔴")
                        else if (val === "Y") rowSymbols.push("🟡")
                        else rowSymbols.push("⚪")
                    }
                    text += rowSymbols.join(" ") + "\n"
                }
                text += "1️⃣ 2️⃣ 3️⃣ 4️⃣ 5️⃣ 6️⃣ 7️⃣"
                return text
            }

            const gameEmbed = (statusText, color = null) => {
                const embed = client.tempEmbed()
                    .setDescription(`🎮 **Connect 4**\n🔴 <@!${challenger.id}> vs 🟡 <@!${opponent.id}>\n\n${drawTextBoard()}\n\n${statusText}`)

                if (color) {
                    embed.setColor(color)
                } else if (interaction.guild) {
                    const hex = client.settings?.mapCache?.get(interaction.guild.id) || (client.db ? client.db.getSettings(interaction.guild.id) : null)
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

            const initialStatus = handlemsg(ls["cmds"]["connect4"]["game_start"], { player: turnUser.id })

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
                const col = parseInt(i.customId.replace("c4-col-", ""), 10)

                let rowPlaced = -1
                for (let r = 5; r >= 0; r--) {
                    if (board[r][col] === " ") {
                        board[r][col] = currentPlayer
                        rowPlaced = r
                        break
                    }
                }

                if (rowPlaced === -1) {
                    await i.deferUpdate().catch((err) => console.error("[connect4] Failed to defer invalid move update:", err.message))
                    return
                }

                const result = checkWinner(board)
                if (result) {
                    gameCollector.stop(result)

                    let endStatus = ""
                    let embedColor = "#95A5A6"
                    if (result === "tie") {
                        endStatus = ls["cmds"]["connect4"]["tie"]
                    } else {
                        const winnerUser = result === "R" ? challenger : opponent
                        const symbolText = result === "R" ? "🔴" : "🟡"
                        endStatus = handlemsg(ls["cmds"]["connect4"]["winner"], { player: winnerUser.id, symbol: symbolText })
                        embedColor = "#2ECC71"
                    }

                    await i.update({
                        embeds: [gameEmbed(endStatus, embedColor)],
                        components: buildBoardComponents(true)
                    }).catch((err) => console.error("[connect4] Failed to update winner screen:", err.message))
                    return
                }

                currentPlayer = currentPlayer === "R" ? "Y" : "R"
                turnUser = currentPlayer === "R" ? challenger : opponent

                gameCollector.filter = (btnInt) => btnInt.user.id === turnUser.id

                const nextSymbolText = currentPlayer === "R" ? "🔴" : "🟡"
                const nextTurnStatus = handlemsg(ls["cmds"]["connect4"]["your_turn"], { player: turnUser.id, symbol: nextSymbolText })

                await i.update({
                    embeds: [gameEmbed(nextTurnStatus)],
                    components: buildBoardComponents()
                }).catch((err) => console.error("[connect4] Failed to update board for next turn:", err.message))
            })

            gameCollector.on("end", async (collected, reason) => {
                if (reason === "time") {
                    const embed = gameEmbed(ls["cmds"]["connect4"]["timeout"], "#E74C3C")
                    await gameMessage.edit({
                        embeds: [embed],
                        components: buildBoardComponents(true)
                    }).catch((err) => console.error("[connect4] Failed to edit game message on timeout:", err.message))
                }
            })
        }
    }
}
