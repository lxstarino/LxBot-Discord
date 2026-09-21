const { SlashCommandBuilder } = require("discord.js")
const { handlemsg } = require("../../utils/stringUtils")
const { getOrCreateSettings } = require("../../repositories/SettingsRepository")

module.exports = {
    guildOnly: true,
    data: new SlashCommandBuilder()
        .setName("shop")
        .setDescription("View items available for purchase in the server shop"),
    async execute(client, interaction) {
        const ls = client.getLanguage(interaction.guild?.id)

        const settings = await getOrCreateSettings(client, interaction.guild.id)
        settings.shop_items = (settings.shop_items || []).filter(item => interaction.guild.roles.cache.has(item.roleId))

        if (settings.shop_items.length === 0) {
            return client.Embed([{
                title: ls["cmds"]["shop"]["title"],
                desc: ls["cmds"]["shop"]["empty"],
                timestamp: interaction.createdTimestamp
            }], undefined, "reply", false, interaction)
        }

        const coin = client.appEmojis?.lux_coin || "<:lux_coin:1550631084855922698>"
        const itemsStr = settings.shop_items.map((item, index) => {
            return `**${index + 1}.** <@&${item.roleId}> - **${item.price.toLocaleString()} ${coin}**`
        }).join("\n")

        client.Embed([{
            title: ls["cmds"]["shop"]["title"],
            desc: handlemsg(ls["cmds"]["shop"]["desc"], { items: itemsStr }),
            timestamp: interaction.createdTimestamp
        }], undefined, "reply", false, interaction)
    }
}
