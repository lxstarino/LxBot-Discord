const { SlashCommandBuilder } = require("discord.js")
const { handlemsg } = require("../../utils/stringUtils")
const files = require("../../assets/data/poke-db.json")

module.exports = {
    guildOnly: false,
    cooldown: 3,
    data: new SlashCommandBuilder()
        .setName("poke")
        .setDescription("Poke Someone")
        .addUserOption((option) => option
            .setName("target")
            .setDescription("target")
            .setRequired(true)
        ),
    async execute(client, interaction) {
        const targetUser = interaction.options.getUser("target")
        const ls = client.getLanguage(interaction.guild?.id)

        if (targetUser) {
            client.Embed([{
                title: `${ls["cmds"]["poke"]["title"]}`,
                desc: `${handlemsg(ls["cmds"]["poke"]["desc"], { user: interaction.user.username, target: targetUser.username })}`,
                image: `${files[(Math.floor(Math.random() * files.length))]}`,
                footer: { text: interaction.user.tag }
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
