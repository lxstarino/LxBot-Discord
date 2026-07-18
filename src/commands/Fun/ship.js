const { SlashCommandBuilder } = require("@discordjs/builders")

function getShipPercentage(id1, id2) {
    const sorted = [id1, id2].sort()
    const combined = sorted.join("")
    let hash = 0
    for (let i = 0; i < combined.length; i++) {
        hash = combined.charCodeAt(i) + ((hash << 5) - hash)
    }
    return Math.abs(hash % 101)
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ship")
        .setDescription("Love compatibility matchmaking checker")
        .addUserOption((option) => option
            .setName("user1")
            .setDescription("First user")
            .setRequired(true)
        )
        .addUserOption((option) => option
            .setName("user2")
            .setDescription("Second user (optional, defaults to yourself)")
            .setRequired(false)
        ),
    async execute(client, interaction) {
        const u1 = interaction.options.getUser("user1")
        const u2 = interaction.options.getUser("user2") || interaction.user

        let ls = client.getLanguage(interaction.guild?.id)
        const { handlemsg } = require(`${process.cwd()}/src/handlers/functions`)

        const percentage = getShipPercentage(u1.id, u2.id)

        // Choose comments based on percentage
        let commentKey = "comment_0"
        if (percentage > 90) {
            commentKey = "comment_5"
        } else if (percentage > 80) {
            commentKey = "comment_4"
        } else if (percentage > 60) {
            commentKey = "comment_3"
        } else if (percentage > 30) {
            commentKey = "comment_2"
        } else if (percentage > 10) {
            commentKey = "comment_1"
        }

        const comment = ls["cmds"]["ship"][commentKey]

        // Build a visual love progress bar (10 blocks)
        const filledBlocks = Math.round(percentage / 10)
        const emptyBlocks = 10 - filledBlocks
        const bar = "❤️".repeat(filledBlocks) + "🖤".repeat(emptyBlocks)

        client.Embed([{
            title: ls["cmds"]["ship"]["title"],
            desc: handlemsg(ls["cmds"]["ship"]["desc"], {
                user1: u1.id,
                user2: u2.id,
                percentage: String(percentage),
                bar: bar,
                comment: comment
            }),
            timestamp: interaction.createdTimestamp
        }], undefined, "reply", false, interaction)
    }
}
