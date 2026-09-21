const { SlashCommandBuilder } = require("discord.js")
const { handlemsg } = require("../../utils/stringUtils")

module.exports = {
    guildOnly: false,
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
        const Cmd = interaction.options.getString("command")

        const ls = client.getLanguage(interaction.guild?.id)
        const reloadLs = ls["cmds"]?.["bot-reload"] || {}

        const Command = client.commands.get(Cmd)
        if (Command) {
            const Folder = Command.Folder
            const fileName = Command.data.name

            delete require.cache[require.resolve(`../${Folder}/${fileName}`)]
            interaction.client.commands.delete(Command.data.name)

            const newCommand = require(`../${Folder}/${fileName}`)
            const properties = { Folder, ...newCommand }

            interaction.client.commands.set(newCommand.data.name, properties)

            client.successEmbed({
                type: "reply",
                ephemeral: true,
                desc: handlemsg(reloadLs["success"] || "Reloaded command `{command}` successfully", { command: newCommand.data.name })
            }, interaction)
        } else {
            throw ({
                title: reloadLs["invalid_title"] || "Invalid Command",
                desc: handlemsg(reloadLs["invalid_desc"] || "Available commands: {commands}", {
                    commands: client.commands.map(cmd => ` \`${cmd.data.name}\``).join(",")
                })
            })
        }
    }
}
