const { SlashCommandBuilder } = require("@discordjs/builders")
const { PermissionsBitField } = require("discord.js")

module.exports = {
    data: new SlashCommandBuilder()
        .setName("bot-embed")
        .setDescription("Change the color of the bot's embed")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .addStringOption(option => 
            option.setName("hex-color")
            .setDescription("Provide a hex color to change the color of the basic embed. Example: #ffffff")
            .setMaxLength(7)
            .setMinLength(7)
            .setRequired(true)),
        async execute(client, interaction){
            const hex = interaction.options.get("hex-color").value

            let ls = client.getLanguage(interaction.guild?.id)
            const { handlemsg, getOrCreateSettings } = require(`${process.cwd()}/src/handlers/functions`)

            const settings = await getOrCreateSettings(client, interaction.guild.id)

            let reg = /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i;
            if(reg.test(`${hex}`)){
                settings.embed_color = `${hex}`
                await client.settings.saveData()
                client.successEmbed({type: "reply", ephemeral: true, title: ls["cmds"]["bot-embed"]["title"], desc: handlemsg(ls["cmds"]["bot-embed"]["success"], {hex: hex})}, interaction)
            } else {
                throw({title: ls["cmds"]["bot-embed"]["title"], desc: ls["cmds"]["bot-embed"]["invalid"]})
            }
        }
}