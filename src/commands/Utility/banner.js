const { SlashCommandBuilder } = require("discord.js")
const { handlemsg } = require("../../utils/stringUtils")

module.exports = {
    guildOnly: false,
    cooldown: 3,
    data: new SlashCommandBuilder()
        .setName("banner")
        .setDescription("Displays a User Banner")
        .addUserOption((option) => option
            .setName("target")
            .setDescription("The user whose banner you want to display")
            .setRequired(false)
        ),
    async execute(client, interaction) {
        const user = interaction.options.getUser("target") || interaction.user

        const ls = client.getLanguage(interaction.guild?.id)

        try {
            const fullUser = await client.users.fetch(user.id, { force: true })
            const bannerUrl = fullUser.bannerURL({ size: 1024 })

            if (bannerUrl) {
                client.Embed([{
                    title: handlemsg(ls["cmds"]["banner"]["title"], { user: fullUser.tag }),
                    image: bannerUrl,
                    color: fullUser.hexAccentColor || null,
                }], undefined, "reply", false, interaction)
            } else {
                client.errEmbed({
                    type: "reply",
                    desc: handlemsg(ls["cmds"]["banner"]["desc1"], { target: fullUser.tag })
                }, interaction)
            }
        } catch (err) {
            console.error("[banner] Failed to fetch user banner:", err)
            client.errEmbed({
                type: "reply",
                desc: ls["cmds"]["banner"]["desc2"]
            }, interaction)
        }
    }
}
