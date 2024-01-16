const { SlashCommandBuilder } = require("@discordjs/builders")

module.exports = {
    data: new SlashCommandBuilder()
    .setName("genpw")
    .setDescription("Generate a password"),
    async execute(client, interaction){
        let characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz123456789:$*."

        let pw = ""
        for(i = 0; i < 16; i++){
            pw += characters.charAt(Math.floor(Math.random() * characters.length))
        }

        client.successEmbed({
            type: "reply",
            ephemeral: true,
            desc: "Password generated! Take a look in your DM's"
        }, interaction)

        
        client.basicEmbed({
            ephemeral: true,
            title: "Your Password",
            desc: pw
        }, interaction.user)
    }
}
