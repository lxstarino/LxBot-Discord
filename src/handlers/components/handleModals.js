const fs = require("fs")

module.exports = (client) => {
    client.modals = new Map()
    if (!fs.existsSync("./src/modals")) {
        fs.mkdirSync("./src/modals")
    }

    const modalFiles = fs.readdirSync("./src/modals").filter(file => file.endsWith(".js"))
    for (const file of modalFiles) {
        const modal = require(`../../modals/${file}`)
        client.modals.set(modal.customId, modal)
    }
}
