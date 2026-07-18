const { SlashCommandBuilder } = require("@discordjs/builders")
const { PermissionsBitField, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js")

const fs = require("fs")

module.exports = {
    data: new SlashCommandBuilder()
        .setName("bot-modules")
        .setDescription("Disable/Enable Modules from the bot that are not required for your server.")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
        async execute(client, interaction){
            let ls = client.getLanguage(interaction.guild?.id)
            const { handlemsg, getOrCreateSettings } = require(`${process.cwd()}/src/handlers/functions`)

            const settings = await getOrCreateSettings(client, interaction.guild.id)

            const modules = [
                ...new Set(client.commands.map(cmd => cmd.Folder))
            ]

            const module_select_disable = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                .setCustomId("module-select-disable")
                .setPlaceholder(ls["cmds"]["bot-modules"]["placeholder_disable"])
                .addOptions(
                    modules.filter(x => x !== "Settings").map((module) => {
                        return{
                            label: module,
                            value: module,
                            description: handlemsg(ls["cmds"]["bot-modules"]["desc_disable"], {module: module.toLowerCase()})
                        }
                    }) 
                )
            )

            const module_select_enable = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                .setCustomId("module-select-enable")
                .setPlaceholder(ls["cmds"]["bot-modules"]["placeholder_enable"])
                .addOptions(
                    modules.filter(x => x !== "Settings").map((module) => {
                        return{
                            label: module,
                            value: module,
                            description: handlemsg(ls["cmds"]["bot-modules"]["desc_enable"], {module: module.toLowerCase()})
                        }
                    }) 
                )
            )

            const msg = await client.Embed([{
                title: ls["cmds"]["bot-modules"]["title"],
                thumbnail: `${client.user.displayAvatarURL()}`,
                desc: ls["cmds"]["bot-modules"]["desc"],
                footer: {text: `${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL()}
            }], [module_select_enable, module_select_disable], "reply", true, interaction)

            if (!msg) return;
            const col = msg.createMessageComponentCollector({filter: i => i.user.id === interaction.user.id, time: 120000})
            col.on("collect", async(i) => {
                const innerSettings = await getOrCreateSettings(client, interaction.guild.id)
                switch(i.customId){
                    case "module-select-enable":
                        await i.update({components: [module_select_enable, module_select_disable]})
                        if(innerSettings.disabled_modules && !innerSettings.disabled_modules.includes(i.values[0])){
                            return client.errEmbed({type: "followUp", ephemeral: true, title: ls["cmds"]["bot-modules"]["title"], desc: handlemsg(ls["cmds"]["bot-modules"]["not_found"], {module: i.values[0]}), components: []}, i)
                        }  
    
                        if (innerSettings.disabled_modules) {
                            innerSettings.disabled_modules.splice(innerSettings.disabled_modules.indexOf(i.values[0]), 1)
                            await client.settings.saveData()
                            client.successEmbed({type: "followUp", ephemeral: true, title: ls["cmds"]["bot-modules"]["title"], desc: handlemsg(ls["cmds"]["bot-modules"]["enabled"], {module: i.values[0]}), components: []}, i)
                        } else {
                            innerSettings.disabled_modules = []
                            await client.settings.saveData()
                            client.errEmbed({type: "followUp", ephemeral: true, title: ls["cmds"]["bot-modules"]["title"], desc: handlemsg(ls["cmds"]["bot-modules"]["not_found"], {module: i.values[0]}), components: []}, i)
                        }
                        break;
                    case "module-select-disable":
                        await i.update({components: [module_select_enable, module_select_disable]})
                        if(innerSettings.disabled_modules && innerSettings.disabled_modules.includes(i.values[0])){
                            return client.errEmbed({type: "followUp", ephemeral: true, title: ls["cmds"]["bot-modules"]["title"], desc: handlemsg(ls["cmds"]["bot-modules"]["already_disabled"], {module: i.values[0]}), components: []}, i)
                        }
 
                        if (!innerSettings.disabled_modules) innerSettings.disabled_modules = []
                        innerSettings.disabled_modules.push(i.values[0])
                        await client.settings.saveData()
                        client.successEmbed({type: "followUp", ephemeral: true, title: ls["cmds"]["bot-modules"]["title"], desc: handlemsg(ls["cmds"]["bot-modules"]["disabled"], {module: i.values[0]}), components: []}, i)
                        break;
                }
            })
        }
}