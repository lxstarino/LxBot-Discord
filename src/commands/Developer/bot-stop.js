const { SlashCommandBuilder } = require("discord.js")

module.exports = {
    guildOnly: false,
    devOnly: true,
    data: new SlashCommandBuilder()
    .setName("bot-stop")
    .setDescription("Stop and terminate all bot processes and shards"),
    async execute(client, interaction){
        const ls = client.getLanguage(interaction.guild?.id)

        await client.Embed([{
            title: ls["cmds"]["bot-stop"]["title"]
        }], undefined, "reply", undefined, interaction)

        if (process.send) {
            process.send({ type: "SHARD_KILL_ALL" })
        }
        process.exit(0)
    }
}
