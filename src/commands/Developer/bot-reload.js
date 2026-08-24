const { SlashCommandBuilder } = require("@discordjs/builders")

module.exports = {
    devOnly: true,
    data: new SlashCommandBuilder()
    .setName("bot-reload")
    .setDescription("Reload a specific command from the bot files")
    .addStringOption(option => option
        .setName("command")
        .setDescription("The name of the command to reload")
        .setRequired(true)
    ),
    async execute(client, interaction) {
        const Cmd = interaction.options.get("command").value

        let ls = client.getLanguage(interaction.guild?.id)
        const { handlemsg } = require(`${process.cwd()}/src/utils/functions`)

        const reloadLs = ls["cmds"]["bot-reload"] || ls["cmds"]["bot-reloadcmd"] || {}

        const Command = client.commands.get(Cmd)
        if(Command){
            const Folder = Command.Folder

            delete require.cache[require.resolve(`../../../src/commands/${Folder}/${Command.data.name}`)]
            interaction.client.commands.delete(Command);

            const newCommand = require(`../../../src/commands/${Folder}/${Command.data.name}`)
            const properties = {Folder, ...newCommand}

            interaction.client.commands.set(newCommand.data.name, properties);

            client.successEmbed({type: "reply", ephemeral: true, desc: handlemsg(reloadLs["success"] || "Reloaded command `{command}` successfully", {command: newCommand.data.name})}, interaction)
        } else {
            throw({title: reloadLs["invalid_title"] || "Invalid Command", desc: handlemsg(reloadLs["invalid_desc"] || "Available commands: {commands}", {commands: client.commands.map(cmd => {return ` \`${cmd.data.name}\``})})})
        }

    }
}