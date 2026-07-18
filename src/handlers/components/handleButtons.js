const fs = require("fs")

module.exports = (client) => {
    // Initialize a Map to store all registered buttons on the client
    client.buttons = new Map()
    if (!fs.existsSync("./src/buttons")) {
        fs.mkdirSync("./src/buttons")
    }
    
    // Read all JavaScript files from the buttons directory
    const buttonFiles = fs.readdirSync("./src/buttons").filter(file => file.endsWith(".js"))
    for (const file of buttonFiles) {
        const button = require(`../../buttons/${file}`)
        // Store each button module using its customId as key
        client.buttons.set(button.customId, button)
    }
}
