const { SlashCommandBuilder } = require("discord.js")
const { handlemsg } = require("../../utils/stringUtils")
const { getOrCreateSettings } = require("../../repositories/SettingsRepository")

module.exports = {
    guildOnly: true,
    cooldown: 3,
    data: new SlashCommandBuilder()
        .setName("countinginfo")
        .setDescription("Show current counting game status"),

    async execute(client, interaction) {
        const ls = client.getLanguage(interaction.guild?.id)

        const settings = await getOrCreateSettings(client, interaction.guild.id)

        if (!settings.counting_channel) {
            return client.Embed([{
                title: ls["cmds"]["counting"]["title"],
                desc: ls["cmds"]["counting"]["not_set"],
                timestamp: interaction.createdTimestamp
            }], undefined, "reply", false, interaction)
        }

        const lastUserText = settings.counting_last_user
            ? `<@!${settings.counting_last_user}>`
            : ls["cmds"]["counting"]["no_last_user"]

        client.Embed([{
            title: ls["cmds"]["counting"]["title"],
            desc: handlemsg(ls["cmds"]["counting"]["info_desc"], {
                current: String(settings.counting_current || 0),
                highscore: String(settings.counting_highscore || 0),
                last_user: lastUserText
            }),
            timestamp: interaction.createdTimestamp
        }], undefined, "reply", false, interaction)
    }
}
