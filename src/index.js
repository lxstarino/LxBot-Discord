require("dotenv").config()
const Logger = require("./core/Logger")
Logger.init()

const isShard = Boolean(process.env.SHARDS !== undefined)

if (!isShard) {
    const ShardManager = require("./core/ShardManager")
    ShardManager.start()
} else {
    const ExtendedClient = require("./core/ExtendedClient")
    const client = new ExtendedClient()
    client.loadHandlers()
    client.start(process.env.token)
}
