const { SlashCommandBuilder } = require("discord.js")
const { handlemsg } = require("../../utils/stringUtils")
const { getOrCreateProfile } = require("../../repositories/ProfileRepository")
const { getOrCreateSettings } = require("../../repositories/SettingsRepository")
const EconomyService = require("../../services/EconomyService")

module.exports = {
    guildOnly: true,
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

        const ls = client.getLanguage(interaction.guild?.id)

        const settings = await getOrCreateSettings(client, interaction.guild.id)
        settings.shop_items = (settings.shop_items || []).filter(item => interaction.guild.roles.cache.has(item.roleId))

        const shopItem = settings.shop_items.find(item => item.roleId === role.id)
        if (!shopItem) {
            return client.errEmbed({
                type: "reply",
                ephemeral: true,
                desc: handlemsg(ls["cmds"]["buy"]["not_for_sale"], { role: role.id })
            }, interaction)
        }

        const profile = await getOrCreateProfile(client, interaction.user.id, interaction.guild.id)

        if (profile.wallet < shopItem.price) {
            return client.errEmbed({
                type: "reply",
                ephemeral: true,
                desc: handlemsg(ls["cmds"]["buy"]["nem"], { role: role.id, price: shopItem.price.toLocaleString() })
            }, interaction)
        }

        const member = interaction.member
        if (member.roles.cache.has(role.id)) {
            return client.errEmbed({
                type: "reply",
                ephemeral: true,
                desc: handlemsg(ls["cmds"]["buy"]["already_has"], { role: role.id })
            }, interaction)
        }

        EconomyService.removeWallet(profile, shopItem.price)

        try {
            await member.roles.add(role)
        } catch (err) {
            console.error("Failed to add role:", err)
            EconomyService.addWallet(profile, shopItem.price)

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
