const fs = require("fs")
const { REST, Routes } = require("discord.js")

module.exports = (client) => {
    const commands = []
    const commandFolders = fs.readdirSync("./src/commands")

    commandFolders.forEach(Folder => {
        const commandFiles = fs.readdirSync(`./src/commands/${Folder}/`).filter(file => file.endsWith(".js"))

        commandFiles.forEach(commandFile => {
            try {
                const command = require(`../commands/${Folder}/${commandFile}`)

                if (!command || !command.data || !command.execute) {
                    console.warn(`[WARN] Command file "${commandFile}" in "${Folder}" is missing "data" or "execute" properties. Skipping.`);
                    return;
                }

                if (typeof command.data.setDMPermission === "function") {
                    command.data.setDMPermission(!command.guildOnly)
                }

                const properties = { Folder, ...command }
                client.commands.set(command.data.name, properties)
                commands.push(command.data.toJSON())
            } catch (err) {
                console.error(`[ERROR] Failed to load command "${commandFile}" in "${Folder}":`, err);
            }
        })
    })

    const isFirstShard = !client.shard || (client.shard.ids && client.shard.ids.includes(0))

    if (isFirstShard) {
        const restClient = new REST({ version: "10" }).setToken(process.env.token)

        restClient.put(Routes.applicationCommands(process.env.appid), {
            body: commands
        })
            .then(() => console.log("> Commands successfully registered!"))
            .catch(console.error)
    }
}
