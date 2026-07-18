const { SlashCommandBuilder } = require("@discordjs/builders")

module.exports = {
    data: new SlashCommandBuilder()
    .setName("hug")
    .setDescription("Hug Someone")
    .addUserOption((option) => option
        .setName("target")
        .setDescription("target")
        .setRequired(true)
    ),
    async execute(client, interaction) {
        const target = interaction.options.get("target")

        if(target.member){
            let files = require("./db/hug-db.json")

            let ls = client.getLanguage(interaction.guild?.id)
            const { handlemsg } = require(`${process.cwd()}/src/handlers/functions`)

            client.Embed([{
                title: `${ls["cmds"]["hug"]["title"]}`,
                desc: `${handlemsg(ls["cmds"]["hug"]["desc"], {user: interaction.user.username, target: target.user.username})}`,
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