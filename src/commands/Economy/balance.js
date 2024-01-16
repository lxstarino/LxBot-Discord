const { SlashCommandBuilder } = require("@discordjs/builders")

module.exports = {
    data: new SlashCommandBuilder()
    .setName("balance")
    .setDescription("Check your or a users balance")
    .addUserOption((option) => option
        .setName("target")
        .setDescription("target")
    ),
    async execute(client, interaction) {
        const target = interaction.options.get("target") || interaction

        const settings = client.settings.storage.data.find(x => x.guildId === interaction.guild.id)
        let ls = settings ? settings.language ? require(`${process.cwd()}/src/languages/${settings.language}.json`) : require(`${process.cwd()}/src/languages/en.json`) : require(`${process.cwd()}/src/languages/en.json`)
        const { handlemsg } = require(`${process.cwd()}/src/handlers/functions`)

        const profile = client.economy.storage.data.find(x => x.userId === target.user.id && x.guildId === interaction.guild.id)
        if(profile){
            client.basicEmbed({
                type: "reply",
                thumbnail: `${target.user.displayAvatarURL()}`,
                title: `${handlemsg(ls["cmds"]["balance"]["title"], {target: target.user.tag})}`,
                fields: [
                    {name: `${ls["cmds"]["balance"]["fields"]["wallet"]}`, value: `${handlemsg(ls["cmds"]["balance"]["fields"]["wallet_value"], {wallet: profile.wallet})}`, inline: true},
                    {name: `${ls["cmds"]["balance"]["fields"]["bank"]}`, value: `${handlemsg(ls["cmds"]["balance"]["fields"]["bank_value"], {bank: profile.bank})}`, inline: true}
                ],
            }, interaction)
        } else {
            if(target.user.id != interaction.user.id) throw({title: `${ls["errors"]["npf"]["title"]}`, desc: `${handlemsg(ls["errors"]["npf"]["desc"], {target: target.user.id})}`})
            await client.economy.createData({guildId: interaction.guild.id, userId: target.user.id, wallet: 0, bank: 0, daily: 0, weekly: 0, monthly: 0})

            client.successEmbed({
                type: "reply",
                ephemeral: true,
                title: `${ls["success"]["pfc"]["title"]}`,
                desc: `${ls["success"]["pfc"]["desc"]}`
            }, interaction)
        }
    }
}
