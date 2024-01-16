const { SlashCommandBuilder } = require("@discordjs/builders")

module.exports = {
    data: new SlashCommandBuilder()
    .setName("banner")
    .setDescription("Displays a User Banner")
    .addUserOption((option) => option
        .setName("target")
        .setDescription("target")
    ),
    async execute(client, interaction){
        const target = interaction.options.get("target") || interaction

        const settings = client.settings.storage.data.find(x => x.guildId === interaction.guild.id)
        let ls = settings ? settings.language ? require(`${process.cwd()}/src/languages/${settings.language}.json`) : require(`${process.cwd()}/src/languages/en.json`) : require(`${process.cwd()}/src/languages/en.json`)
        const { handlemsg } = require(`${process.cwd()}/src/handlers/functions`)

        await fetch(`https://discord.com/api/v8/users/${target.user.id}`, {
            headers: { Authorization: `Bot ${client.token}` }
        }).then(async res => {
            const {banner, accent_color} = await res.json()

            if(banner){
                const format = banner.startsWith("a_") ? ".gif" : ".png"

                client.basicEmbed({
                    type: "reply",
                    title: `${target.user.tag}'s banner`,
                    image: `https://cdn.discordapp.com/banners/${target.user.id}/${banner}${format}?size=1024`,
                    color: accent_color,
                    footer: {text: `${interaction.user.tag}`}
                }, interaction)
            } else if(accent_color) {
                client.basicEmbed({
                    type: "reply",
                    desc: `${handlemsg(ls["cmds"]["banner"]["desc"], {target: target.user.tag})}`,
                    color: accent_color,
                    footer: {text: `${interaction.user.tag}`}
                }, interaction) 
            } else {
                throw({title: "Banner", desc: `${handlemsg(ls["cmds"]["banner"]["desc2"], {target: target.user.tag})}`})
            }
        }).catch(() => {
            throw({title: "Banner", desc: ls["cmds"]["banner"]["desc3"]})
        })
    }
}