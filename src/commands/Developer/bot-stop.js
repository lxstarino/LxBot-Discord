const { SlashCommandBuilder } = require("@discordjs/builders")

module.exports = {
    devOnly: true,
    data: new SlashCommandBuilder()
    .setName("bot-stop")
    .setDescription("Stops the bot"),
    async execute(client, interaction){
        let ls = client.getLanguage(interaction.guild?.id)

        await client.Embed([{
            title: ls["cmds"]["bot-stop"]["title"]
        }], undefined, "reply", undefined, interaction)
        process.exit(0)
    }
}
