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

        let ls = client.getLanguage(interaction.guild?.id)
        const { handlemsg } = require(`${process.cwd()}/src/handlers/functions`)

        if(target.member){
            let files = require("./db/pat-db.json")

            client.Embed([{
                title: `${ls["cmds"]["pat"]["title"]}`,
                desc: `${handlemsg(ls["cmds"]["pat"]["desc"], {user: interaction.user.username, target: target.user.username})}`,
                image: `${files[(Math.floor(Math.random() * files.length))]}`,
                footer: {text: interaction.user.tag}
            }], undefined, "reply", undefined, interaction)
        } else {
            client.errEmbed({
                type: "reply",
                ephemeral: true,
                desc: `${ls["errors"]["unf"]}`
            }, interaction)
        }
    }
}