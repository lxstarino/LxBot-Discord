const fs = require("fs")
const path = require("path")
const { Collection } = require("discord.js")

module.exports = (client) => {
    client.buttons = client.buttons || new Collection()
    const buttonsDir = path.join(__dirname, "..", "components", "buttons")
    if (!fs.existsSync(buttonsDir)) return

    const buttonFiles = fs.readdirSync(buttonsDir).filter(file => file.endsWith(".js"))
    for (const file of buttonFiles) {
        const button = require(path.join(buttonsDir, file))
        client.buttons.set(button.customId, button)
    }
}
