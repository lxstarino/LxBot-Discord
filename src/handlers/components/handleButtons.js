const fs = require("fs")

module.exports = (client) => {
    client.buttons = new Map()
    if (!fs.existsSync("./src/buttons")) {
        fs.mkdirSync("./src/buttons")
    }

    const buttonFiles = fs.readdirSync("./src/buttons").filter(file => file.endsWith(".js"))
    for (const file of buttonFiles) {
        const button = require(`../../buttons/${file}`)
        client.buttons.set(button.customId, button)
    }
}
