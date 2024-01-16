const { SlashCommandBuilder } = require("@discordjs/builders")
const { PermissionsBitField, ChannelType } = require("discord.js")

module.exports = {
    data: new SlashCommandBuilder()
    .setName("poll")
    .setDescription("Conduct a Poll")
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
    .addStringOption((option) => option
        .setName("question")
        .setDescription("question")
        .setRequired(true)
        .setMaxLength(1028)
    ).addChannelOption((option) => option
        .setName("channel")
        .setDescription("channel")
        .addChannelTypes(ChannelType.GuildText)
    ),
    async execute(client, interaction){
        const channel = interaction.options.get("channel") || interaction
        const question = interaction.options.get("question").value
        
        const settings = client.settings.storage.data.find(x => x.guildId === interaction.guild.id)
        let ls = settings ? settings.language ? require(`${process.cwd()}/src/languages/${settings.language}.json`) : require(`${process.cwd()}/src/languages/en.json`) : require(`${process.cwd()}/src/languages/en.json`)
        const { handlemsg } = require(`${process.cwd()}/src/handlers/functions`)
        
        const msg = await client.basicEmbed({
            title: `${ls["cmds"]["poll"]["title"]}`,
            desc: `${handlemsg(ls["cmds"]["poll"]["desc"], {user: interaction.user.tag, question: question})}`,
            footer: {iconURL: `${interaction.user.displayAvatarURL()}`,text: `${handlemsg(ls["cmds"]["poll"]["createdby"], {user: interaction.user.tag})}`}
        }, channel.channel)
        
        msg.react("✅")
        msg.react("❌")
        
        client.successEmbed({
            type: "reply",
            ephemeral: true,
            desc: `${handlemsg(ls["cmds"]["poll"]["pollcreated"], {channel: channel.channel.id})}`,
        }, interaction)
    }
}
