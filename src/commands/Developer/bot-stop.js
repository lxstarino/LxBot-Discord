const { SlashCommandBuilder } = require("@discordjs/builders")

module.exports = {
    devOnly: true,
    data: new SlashCommandBuilder()
    .setName("bot-stop")
    .setDescription("Stops the bot"),
    async execute(client, interaction){
        await client.basicEmbed({
            type: "reply",
            title: "Bot stopped"
        },interaction)
        process.exit(0)
    }
}
