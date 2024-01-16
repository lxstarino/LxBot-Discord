const { SlashCommandBuilder } = require("@discordjs/builders")
const { PermissionsBitField } = require("discord.js")

const fs = require("fs")

module.exports = {
    data: new SlashCommandBuilder()
        .setName("module")
        .setDescription("disables/enables modules for this server")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .addSubcommand(sub => 
            sub.setName("enable").setDescription("enable a module")
        ).addSubcommand(sub => 
            sub.setName("disable").setDescription("disable a module")
        ),
        async execute(client, interaction){
            let modules = fs.readdirSync("./src/commands")
            if(interaction.options.getSubcommand() === "disable"){
                client.basicEmbed({
                    type: "reply",
                    ephemeral: true,
                    title: "Module",
                    desc: `Enter a Module that you want to disable and pay attention to the spelling\nModules to  disable:\n\`${modules.join('`, `')}\``,
                    footer: {text: "Note: You have 30 seconds to provide input until timeout"}
                }, interaction).then(msg => {
                    msg.channel.awaitMessages({
                        filter: m => m.author.id === interaction.user.id, time: 30000, errors: ["time"], max: 1
                    }).then(async collected => {
                        const content = collected.first().content
                        await interaction.channel.bulkDelete(collected)
                        if(content == "Settings"){
                            return client.errEmbed({type: "editReply", title: "Module", desc: "You cant enable/disable settings"}, interaction)
                        }
    
                        if(!modules.includes(content)){
                            return client.errEmbed({type: "editReply", title: "Module", desc: "Run the command again to disable a Module!"}, interaction)
                        } 
                        
                        const settings = client.settings.storage.data.find(x => x.guildId === interaction.guild.id)
                        if(!settings){
                            await client.settings.createData({guildId: interaction.guild.id, disabled_modules: [content]})
                            return client.successEmbed({type: "editReply", title: "Module", desc: "The given module was successfully disabled!"}, interaction)
                        }

                        if(!settings.disabled_modules){
                            settings.disabled_modules = [content]  
                            await client.settings.saveData()
                            return client.successEmbed({type: "editReply", title: "Module", desc: "The given module was successfully disabled!"}, interaction)
                        }

                        if(settings.disabled_modules.includes(content)) {
                            return client.errEmbed({type: "editReply", title: "Module", desc: "The given module is already disabled"}, interaction)
                        }                 
                        
                        settings.disabled_modules.push(`${content}`)
                        await client.settings.saveData()
                        client.successEmbed({type: "editReply", title: "Module", desc: "The given module was successfully disabled!"}, interaction)
                    }).catch(() => {
                        client.errEmbed({type: "editReply", title: "Timeout", desc: "Your time to provide input is expired."}, interaction)
                    })
                })
            } else if(interaction.options.getSubcommand() === "enable"){
                const settings = client.settings.storage.data.find(x => x.guildId === interaction.guild.id)

                if(!settings){
                    await client.settings.createData({guildId: interaction.guild.id, disabled_modules: []})
                    throw({title: "Module", desc: "All Modules are enabled!"})
                }

                if(!settings.disabled_modules){
                    settings.disabled_modules = []  
                    await client.settings.saveData()
                    throw({title: "Module", desc: "All Modules are enabled!"})
                }

                if(settings.disabled_modules.length == 0){
                    throw({title: "Module", desc: "All Modules are enabled!"})
                }

                client.basicEmbed({
                    type: "reply",
                    ephemeral: true,
                    title: "Module",
                    desc: `Enter a Module that you want to enable and pay attention to the spelling\nModules to enable:\n\`${settings.disabled_modules.join('`, `')}\``,
                    footer: {text: "Note: You have 30 seconds to provide input until timeout"}
                }, interaction).then(msg => {
                    msg.channel.awaitMessages({
                        filter: m => m.author.id === interaction.user.id, time: 30000, errors: ["time"], max: 1
                    }).then(async collected => {
                        const content = collected.first().content
                        await interaction.channel.bulkDelete(collected)
                        if(!modules.includes(content) || !settings.disabled_modules.includes(content)){
                            return client.errEmbed({type: "editReply", title: "Module", desc: "Run the command again to enable a Module!"}, interaction)
                        }  

                        settings.disabled_modules.splice(settings.disabled_modules.indexOf(content), 1)    
                        await client.settings.saveData()
                        client.successEmbed({type: "editReply", title: "Module", desc: "The given module was successfully enabled!"}, interaction)    
                    }).catch(() => {
                        client.errEmbed({type: "editReply", title: "Timeout", desc: "Your time to provide input is expired."}, interaction)
                    })
                })
            }
        }
}