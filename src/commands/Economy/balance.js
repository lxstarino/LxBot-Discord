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

        let ls = client.getLanguage(interaction.guild?.id)
        const { handlemsg, getOrCreateProfile } = require(`${process.cwd()}/src/handlers/functions`)

        const profile = await getOrCreateProfile(client, target.user.id, interaction.guild.id)

        client.Embed([{
            thumbnail: `${target.user.displayAvatarURL()}`,
            title: `${handlemsg(ls["cmds"]["balance"]["title"], {target: target.user.tag})}`,
            fields: [
                {name: `${ls["cmds"]["balance"]["fields"]["wallet"]}`, value: `${handlemsg(ls["cmds"]["balance"]["fields"]["wallet_value"], {wallet: profile.wallet})}`, inline: true},
                {name: `${ls["cmds"]["balance"]["fields"]["bank"]}`, value: `${handlemsg(ls["cmds"]["balance"]["fields"]["bank_value"], {bank: profile.bank})}`, inline: true}
            ],
        }], undefined, "reply", undefined, interaction)
    }
}
