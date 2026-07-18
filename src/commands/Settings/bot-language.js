const { SlashCommandBuilder } = require("@discordjs/builders")
const { PermissionsBitField, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js")

module.exports = {
    data: new SlashCommandBuilder()
        .setName("bot-language")
        .setDescription("Set the language of the bot")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
        async execute(client, interaction){
            let ls = client.getLanguage(interaction.guild?.id)
            const { handlemsg, getOrCreateSettings } = require(`${process.cwd()}/src/handlers/functions`)

            const settings = await getOrCreateSettings(client, interaction.guild.id)

            const language_select = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                .setCustomId("module-select-enable")
                .setPlaceholder(ls["cmds"]["bot-language"]["placeholder"])
                .addOptions(
                    {
                        label: "Deutsch",
                        value: "de",
                    },
                    {
                        label: "English",
                        value: "en"
                    }
                )
            )

            const msg = await client.Embed([{
                type: "reply",
                image: "https://cdn.discordapp.com/attachments/1394394240242684106/1394395050645000263/page1.png?ex=6876a716&is=68755596&hm=3c60de0ae038a40be6211907ce24e21f47b4f72dc96e58be87f087a851f47169&"
            },{
                type: "reply",
                thumbnail: interaction.user.displayAvatarURL(),
                desc: ls["cmds"]["bot-language"]["desc"],
                image: "https://cdn.discordapp.com/attachments/1394394240242684106/1394410565446795295/underline_.png?ex=6876b589&is=68756409&hm=c182bae67eb7fc5a3530b4df68c22120e02dc84970d51ee4b7051855d2a5b4f1&",
            }], [language_select], "reply", true, interaction)

            if (!msg) return;
            const col = msg.createMessageComponentCollector({filter: i => i.user.id === interaction.user.id, time: 120000})
            col.on("collect", async(i) => {
                const innerSettings = await getOrCreateSettings(client, interaction.guild.id)
                innerSettings.language = i.values.toString()
                await client.settings.saveData()
                client.successEmbed({type: "reply", ephemeral: true, desc: handlemsg(ls["cmds"]["bot-language"]["success"], {language: i.values.toString()})}, i)
            })
        }
}