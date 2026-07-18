const { SlashCommandBuilder } = require("@discordjs/builders")

module.exports = {
    data: new SlashCommandBuilder()
        .setName("shop")
        .setDescription("View items available for purchase in the server shop"),
    async execute(client, interaction) {
        let ls = client.getLanguage(interaction.guild?.id)
        const { handlemsg, getOrCreateSettings } = require(`${process.cwd()}/src/handlers/functions`)

        const settings = await getOrCreateSettings(client, interaction.guild.id)
        settings.shop_items = settings.shop_items || []

        // Automatic cleanup of deleted roles from the shop database
        const initialCount = settings.shop_items.length
        settings.shop_items = settings.shop_items.filter(item => interaction.guild.roles.cache.has(item.roleId))
        if (settings.shop_items.length !== initialCount) {
            await client.settings.saveData()
        }

        if (settings.shop_items.length === 0) {
            return client.Embed([{
                title: ls["cmds"]["shop"]["title"],
                desc: ls["cmds"]["shop"]["empty"],
                timestamp: interaction.createdTimestamp
            }], undefined, "reply", false, interaction)
        }

        const itemsStr = settings.shop_items.map((item, index) => {
            return `**${index + 1}.** <@&${item.roleId}> - **${item.price.toLocaleString()} 💰**`
        }).join("\n")

        client.Embed([{
            title: ls["cmds"]["shop"]["title"],
            desc: handlemsg(ls["cmds"]["shop"]["desc"], { items: itemsStr }),
            timestamp: interaction.createdTimestamp
        }], undefined, "reply", false, interaction)
    }
}
