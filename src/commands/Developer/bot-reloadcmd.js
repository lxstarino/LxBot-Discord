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

        const Command = client.commands.get(Cmd)
        if(Command){
            const Folder = Command.Folder

            delete require.cache[require.resolve(`../../../src/commands/${Folder}/${Command.data.name}`)]
            interaction.client.commands.delete(Command);
    
            const newCommand = require(`../../../src/commands/${Folder}/${Command.data.name}`)
            const properties = {Folder, ...newCommand}
    
            interaction.client.commands.set(newCommand.data.name, properties);

            client.successEmbed({type: "reply", ephemeral: true, desc: `\`${newCommand.data.name}\` successfully reloaded!`}, interaction)
        } else {
            throw({title: "Command not found", desc: `Provide a valid command!\n\nValid Commands:\n${client.commands.map(cmd => {return ` \`${cmd.data.name}\``})}`})
        }

    }  
}