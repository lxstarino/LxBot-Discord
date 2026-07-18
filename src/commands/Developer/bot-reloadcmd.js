const {SlashCommandBuilder} = require("@discordjs/builders")
const fs = require("fs")

module.exports = {
    devOnly: true,
    data: new SlashCommandBuilder()
    .setName("bot-reloadcmd")
    .setDescription("Reload a command from bot")
    .addStringOption(option => option
        .setName("command")
        .setDescription("The command you want to reload")
        .setRequired(true)
    ),
    async execute(client, interaction) {
        const Cmd = interaction.options.get("command").value

        let ls = client.getLanguage(interaction.guild?.id)
        const { handlemsg } = require(`${process.cwd()}/src/handlers/functions`)

        const Command = client.commands.get(Cmd)
        if(Command){
            const Folder = Command.Folder

            delete require.cache[require.resolve(`../../../src/commands/${Folder}/${Command.data.name}`)]
            interaction.client.commands.delete(Command);
    
            const newCommand = require(`../../../src/commands/${Folder}/${Command.data.name}`)
            const properties = {Folder, ...newCommand}
    
            interaction.client.commands.set(newCommand.data.name, properties);

            client.successEmbed({type: "reply", ephemeral: true, desc: handlemsg(ls["cmds"]["bot-reloadcmd"]["success"], {command: newCommand.data.name})}, interaction)
        } else {
            throw({title: ls["cmds"]["bot-reloadcmd"]["invalid_title"], desc: handlemsg(ls["cmds"]["bot-reloadcmd"]["invalid_desc"], {commands: client.commands.map(cmd => {return ` \`${cmd.data.name}\``})})})
        }

    }  
}