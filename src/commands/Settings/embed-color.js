const { SlashCommandBuilder } = require("@discordjs/builders")
const { PermissionsBitField } = require("discord.js")

module.exports = {
    data: new SlashCommandBuilder()
        .setName("embed-color")
        .setDescription("change the color of the embed")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .addStringOption(option => 
            option.setName("hex-color")
            .setDescription("Provide a hex color to change the color of the basic embed. Example: fffff")
            .setMaxLength(6)
            .setMinLength(6)
            .setRequired(true)),
        async execute(client, interaction){
            const hex = interaction.options.get("hex-color").value

            let reg = /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i;
            if(reg.test(`#${hex}`)){
                const settings = client.settings.storage.data.find(x => x.guildId === interaction.guild.id)
                if(settings){
                    settings.embed_color = `#${hex}`

                    await client.settings.saveData()
                    client.successEmbed({type: "reply", ephemeral: true, title: "Embed", desc: `Embed Color was successfully changed to \`#${hex}\`!`}, interaction)
                } else {
                    await client.settings.createData({guildId: interaction.guild.id, embed_color: `#${hex}`})
                    client.successEmbed({type: "reply", ephemeral: true, title: "Embed", desc: `Embed Color was successfully changed to \`#${hex}\`!`}, interaction)
                }
            } else {
                throw({title: "Embed", desc: "Provide a valid Hex Color!"})
            }
        }
}