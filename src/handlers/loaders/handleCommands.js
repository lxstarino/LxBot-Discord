require("dotenv").config()
const fs = require("fs")
const { REST, Routes, Collection } = require("discord.js")

const commands = []
module.exports = (client) => {
    const commandFolders = fs.readdirSync("./src/commands")

    commandFolders.forEach(Folder => {
        const commandFiles = fs.readdirSync(`./src/commands/${Folder}/`).filter(file => file.endsWith(".js"))

        commandFiles.forEach(commandFile => {
            try {
                const command = require(`../../commands/${Folder}/${commandFile}`)

                if (!command || !command.data || !command.execute) {
                    console.warn(`[WARN] Command file "${commandFile}" in "${Folder}" is missing "data" or "execute" properties. Skipping.`);
                    return;
                }

                const properties = { Folder, ...command }
                client.commands.set(command.data.name, properties)
                commands.push(command.data.toJSON())
            } catch (err) {
                console.error(`[ERROR] Failed to load command "${commandFile}" in "${Folder}":`, err);
            }
        })
    })



    const restClient = new REST({ version: "10" }).setToken(process.env.token)

    restClient.put(Routes.applicationCommands(process.env.appid), {
        body: commands
    })
        .then(() => console.log("> Commands successfully registered!"))
        .catch(console.error)
}










