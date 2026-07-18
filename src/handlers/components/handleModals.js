const fs = require("fs")

module.exports = (client) => {
    // Initialize a Map to store all registered modals on the client
    client.modals = new Map()
    if (!fs.existsSync("./src/modals")) {
        fs.mkdirSync("./src/modals")
    }
    
    // Read all JavaScript files from the modals directory
    const modalFiles = fs.readdirSync("./src/modals").filter(file => file.endsWith(".js"))
    for (const file of modalFiles) {
        const modal = require(`../../modals/${file}`)
        // Store each modal module using its customId as key
        client.modals.set(modal.customId, modal)
    }
}
