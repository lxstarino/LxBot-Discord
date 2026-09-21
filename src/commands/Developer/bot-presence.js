const { SlashCommandBuilder } = require("discord.js")
const { handlemsg } = require("../../utils/stringUtils")

module.exports = {
    guildOnly: false,
    devOnly: true,
    data: new SlashCommandBuilder()
        .setName("bot-presence")
        .setDescription("Set the presence, activity, and status of the bot")
        .addStringOption((option) => option
            .setName("activity")
            .setDescription("The activity text to display")
            .setRequired(true)
        ).addStringOption((option) => option
            .setName("activitytype")
            .setDescription("The type of activity")
            .setRequired(true)
            .addChoices(
                { name: "Playing", value: "0" },
                { name: "Streaming", value: "1" },
                { name: "Listening", value: "2" },
                { name: "Watching", value: "3" },
                { name: "Custom", value: "4" },
                { name: "Competing", value: "5" }
            )
        ).addStringOption((option) => option
            .setName("activitystatus")
            .setDescription("The presence status of the bot")
            .setRequired(true)
            .addChoices({ name: "Online", value: "online" }, { name: "Idle", value: "idle" }, { name: "Do Not Disturb", value: "dnd" })
        ).addStringOption((option) => option
            .setName("streamurl")
            .setDescription("The Twitch or YouTube stream URL (used if Streaming is selected)")
            .setRequired(false)
        ),
    async execute(client, interaction) {
        const activity = interaction.options.get("activity").value
        const activityType = interaction.options.get("activitytype").value
        const activityStatus = interaction.options.get("activitystatus").value
        const streamUrl = interaction.options.get("streamurl")?.value

        const activityTypes = {
            "0": "Playing",
            "1": "Streaming",
            "2": "Listening",
            "3": "Watching",
            "4": "Custom",
            "5": "Competing"
        }

        const ls = client.getLanguage(interaction.guild?.id)

        const activityData = {
            name: activity,
            type: parseInt(activityType)
        }

        if (parseInt(activityType) === 1) {
            activityData.url = streamUrl || "https://www.twitch.tv/lxstarino"
        }

        client.user.setPresence({ activities: [activityData], status: activityStatus })
        client.Embed([{
            title: ls["cmds"]["bot-presence"]["title"],
            desc: handlemsg(ls["cmds"]["bot-presence"]["desc"], { activity: activity, type: activityTypes[activityType], status: activityStatus })
        }], undefined, "reply", true, interaction)
    }
}
