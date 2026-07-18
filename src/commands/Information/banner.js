const { SlashCommandBuilder } = require("@discordjs/builders")

module.exports = {
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

        let ls = client.getLanguage(interaction.guild?.id)
        const { handlemsg } = require(`${process.cwd()}/src/handlers/functions`)

        try {
            const res = await fetch(`https://discord.com/api/v10/users/${user.id}`, {
                headers: { Authorization: `Bot ${client.token}` }
            })
            
            if (!res.ok) {
                return client.errEmbed({
                    type: "reply",
                    desc: ls["cmds"]["banner"]["desc2"]
                }, interaction)
            }

            const { banner, accent_color } = await res.json()
            const embedColor = accent_color ? `#${accent_color.toString(16).padStart(6, "0")}` : null

            if (banner) {
                const format = banner.startsWith("a_") ? ".gif" : ".png"
                client.Embed([{
                    title: handlemsg(ls["cmds"]["banner"]["title"], { user: user.tag }),
                    image: `https://cdn.discordapp.com/banners/${user.id}/${banner}${format}?size=1024`,
                    color: embedColor,
                }], undefined, "reply", false, interaction)
            } else {
                client.errEmbed({
                    type: "reply",
                    desc: `${handlemsg(ls["cmds"]["banner"]["desc1"], { target: user.tag })}`
                }, interaction)
            }
        } catch (err) {
            console.error(err)
            client.errEmbed({
                type: "reply",
                desc: ls["cmds"]["banner"]["desc2"]
            }, interaction)
        }
    }
}