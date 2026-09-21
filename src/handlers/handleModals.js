const fs = require("fs")
const path = require("path")
const { Collection } = require("discord.js")

module.exports = (client) => {
    client.modals = client.modals || new Collection()
    const modalsDir = path.join(__dirname, "..", "components", "modals")
    if (!fs.existsSync(modalsDir)) return

    const modalFiles = fs.readdirSync(modalsDir).filter(file => file.endsWith(".js"))
    for (const file of modalFiles) {
        const modal = require(path.join(modalsDir, file))
        client.modals.set(modal.customId, modal)
    }
}
