const { SlashCommandBuilder } = require("@discordjs/builders")

module.exports = {
    data: new SlashCommandBuilder()
    .setName("pat")
    .setDescription("Pat Someone")
    .addUserOption((option) => option
        .setName("target")
        .setDescription("target")
        .setRequired(true)
    ),
    async execute(client, interaction) {
        const target = interaction.options.get("target")

        const settings = client.settings.storage.data.find(x => x.guildId === interaction.guild.id)
        let ls = settings ? settings.language ? require(`${process.cwd()}/src/languages/${settings.language}.json`) : require(`${process.cwd()}/src/languages/en.json`) : require(`${process.cwd()}/src/languages/en.json`)
        const { handlemsg } = require(`${process.cwd()}/src/handlers/functions`)

        if(target.member){
            let files = require("./db/pat-db.json")

            client.basicEmbed({
                type: "reply",
                title: `${ls["cmds"]["pat"]["title"]}`,
                desc: `${handlemsg(ls["cmds"]["pat"]["desc"], {user: interaction.user.username, target: target.user.username})}`,
                image: `${files[(Math.floor(Math.random() * files.length))]}`,
                footer: {text: interaction.user.tag}
            }, interaction)
        } else {
            client.errEmbed({
                type: "reply",
                ephemeral: true,
                desc: `${ls["errors"]["unf"]}`
            }, interaction)
        }
    }
}