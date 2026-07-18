const { SlashCommandBuilder } = require("@discordjs/builders")

module.exports = {
    data: new SlashCommandBuilder()
        .setName("buy")
        .setDescription("Purchase a role from the server shop")
        .addRoleOption((option) => option
            .setName("role")
            .setDescription("The role you want to purchase")
            .setRequired(true)
        ),
    async execute(client, interaction) {
        const role = interaction.options.getRole("role")

        let ls = client.getLanguage(interaction.guild?.id)
        const { handlemsg, getOrCreateProfile, getOrCreateSettings } = require(`${process.cwd()}/src/handlers/functions`)

        const settings = await getOrCreateSettings(client, interaction.guild.id)
        settings.shop_items = settings.shop_items || []

        // Automatic cleanup of deleted roles from the shop database
        const initialCount = settings.shop_items.length
        settings.shop_items = settings.shop_items.filter(item => interaction.guild.roles.cache.has(item.roleId))
        if (settings.shop_items.length !== initialCount) {
            await client.settings.saveData()
        }

        const shopItem = settings.shop_items.find(item => item.roleId === role.id)
        if (!shopItem) {
            return client.errEmbed({
                type: "reply",
                ephemeral: true,
                title: ls["cmds"]["buy"]["title"],
                desc: handlemsg(ls["cmds"]["buy"]["not_for_sale"], { role: role.id })
            }, interaction)
        }

        const profile = await getOrCreateProfile(client, interaction.user.id, interaction.guild.id)

        if (profile.wallet < shopItem.price) {
            return client.errEmbed({
                type: "reply",
                ephemeral: true,
                title: ls["cmds"]["buy"]["title"],
                desc: handlemsg(ls["cmds"]["buy"]["nem"], { role: role.id, price: shopItem.price.toLocaleString() })
            }, interaction)
        }

        // Check if user already has the role
        const member = await interaction.guild.members.fetch(interaction.user.id)
        if (member.roles.cache.has(role.id)) {
            return client.errEmbed({
                type: "reply",
                ephemeral: true,
                title: ls["cmds"]["buy"]["title"],
                desc: handlemsg(ls["cmds"]["buy"]["already_has"], { role: role.id })
            }, interaction)
        }

        // Deduct money and save database
        profile.wallet -= shopItem.price
        await client.economy.saveData()

        try {
            await member.roles.add(role)
        } catch (err) {
            console.error("Failed to add role:", err)
            // Refund the user if assignment fails
            profile.wallet += shopItem.price
            await client.economy.saveData()
            throw ({
                title: ls["cmds"]["buy"]["title"],
                desc: "Could not assign role. Make sure the bot's role is positioned above the purchased role and has 'Manage Roles' permission!"
            })
        }

        client.Embed([{
            title: ls["cmds"]["buy"]["title"],
            desc: handlemsg(ls["cmds"]["buy"]["success"], { role: role.id, price: shopItem.price.toLocaleString() }),
            timestamp: interaction.createdTimestamp
        }], undefined, "reply", false, interaction)
    }
}
