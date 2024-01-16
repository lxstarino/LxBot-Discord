require("dotenv").config()
const fs = require("fs")
const StorageManager = require("./utils/StorageManager")
const { Client, Collection, GatewayIntentBits } = require("discord.js")

const client = new Client({
    intents: [        
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers
    ]
})

client.commands = new Collection()

const folders = fs.readdirSync("./src/handlers").filter(dir => !dir.endsWith(".js"))

process.on('unhandledRejection', error => {
	console.error(`Unhandled promise rejection:`, error);
});



for(directory of folders){
	const handlers = fs.readdirSync(`./src/handlers/${directory}`).filter(file => file.endsWith(".js"))
	for(file of handlers){
		require(`./handlers/${directory}/${file}`)(client)
	}
}



const EcoManager = new StorageManager("./src/jsondb/economy.json")
client.economy = EcoManager

const Ticket = new StorageManager("./src/jsondb/ticket.json")
client.ticket = Ticket

const Settings = new StorageManager("./src/jsondb/settings.json")
client.settings = Settings

client.login(process.env.token)

