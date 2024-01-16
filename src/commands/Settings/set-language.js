const { SlashCommandBuilder } = require("@discordjs/builders")
const { PermissionsBitField } = require("discord.js")

module.exports = {
    data: new SlashCommandBuilder()
        .setName("set-language")
        .setDescription("Set the language of the bot")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .addStringOption(option => 
            option.setName("language")
            .setDescription("The language the bot should use")
            .setRequired(true)
            .addChoices(
                {name: "Deutsch 🇩🇪", value: "de"},
                {name: "English 🇬🇧", value: "en"},
            )
        ),
        async execute(client, interaction){
            const ls = interaction.options.get("language").value

            const settings = client.settings.storage.data.find(x => x.guildId === interaction.guild.id)
            if(settings){
                settings.language = ls

                await client.settings.saveData()
                client.successEmbed({type: "reply", ephemeral: true, desc: `The bot language was successfully changed to \`#${ls}\`!\nNote: The translation is not 100% completed`}, interaction)
            } else {
                await client.settings.createData({guildId: interaction.guild.id, language: `${ls}`})
                client.successEmbed({type: "reply", ephemeral: true, desc: `The bot language was successfully changed to \`#${ls}\`!\nNote: The translation is not 100% completed`}, interaction)
            }
        }
}