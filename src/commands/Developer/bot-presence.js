const { SlashCommandBuilder } = require("@discordjs/builders")

module.exports = {
    devOnly: true,
    data: new SlashCommandBuilder()
    .setName("bot-presence")
    .setDescription("Sets the presence of bot")
    .addStringOption((option) => option
        .setName("activity")
        .setDescription("The bots activity text")
        .setRequired(true)
    ).addStringOption((option) => option
        .setName("activitytype")
        .setDescription("The bots activity type")
        .setRequired(true)
        .addChoices({name: "Listening" , value: "2"}, {name: "Competing", value: "5"}, {name: "Playing", value: "0"}, {name: "Watching", value: "3"}, {name: "Custom", value: "4"})
    ).addStringOption((option) => option
        .setName("activitystatus")
        .setDescription("The bots presence type")
        .setRequired(true)
        .addChoices({name: "online" , value: "online"}, {name: "idle", value: "idle"}, {name: "do not disturb", value: "dnd"})
    ),
    async execute(client, interaction){
        const activity = interaction.options.get("activity").value
        const activityType = interaction.options.get("activitytype").value
        const activityStatus = interaction.options.get("activitystatus").value

        const activityTypes = {
            "0": "Playing",
            "2": "Listening",
            "3": "Watching",
            "4": "Custom",
            "5": "Competing"
        }

        client.user.setPresence({activities: [{ name: activity, type: parseInt(activityType) }], status: activityStatus})
        client.basicEmbed({
            ephemeral: true,
            type: "reply",
            title: "Bot Presence",
            desc: `**Activity set to**:\n${activity}\n\n**Activity Type set to**:\n${activityTypes[activityType]}\n\n**Presence set to**:\n${activityStatus}`
        }, interaction)
    }
}
