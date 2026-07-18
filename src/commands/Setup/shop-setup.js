const { SlashCommandBuilder } = require("@discordjs/builders")
const { PermissionsBitField } = require("discord.js")

module.exports = {
    data: new SlashCommandBuilder()
        .setName("shop-setup")
        .setDescription("Configure the server role shop")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .addSubcommand(subcmd => subcmd
            .setName("add")
            .setDescription("Add a role to the shop")
            .addRoleOption(opt => opt
                .setName("role")
                .setDescription("The role to add")
                .setRequired(true)
            )
            .addIntegerOption(opt => opt
                .setName("price")
                .setDescription("The price of the role")
                .setRequired(true)
                .setMinValue(1)
            )
        )
        .addSubcommand(subcmd => subcmd
            .setName("remove")
            .setDescription("Remove a role from the shop")
            .addRoleOption(opt => opt
                .setName("role")
                .setDescription("The role to remove")
                .setRequired(true)
            )
        )
        .addSubcommand(subcmd => subcmd
            .setName("list")
            .setDescription("List all roles currently in the shop")
        ),
    async execute(client, interaction) {
        const subcommand = interaction.options.getSubcommand()

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

        if (subcommand === "add") {
            const role = interaction.options.getRole("role")
            const price = interaction.options.getInteger("price")

            if (price < 1) {
                return client.errEmbed({
                    type: "reply",
                    ephemeral: true,
                    title: ls["cmds"]["shop-setup"]["title"],
                    desc: ls["cmds"]["shop-setup"]["invalid_price"]
                }, interaction)
            }

            const exists = settings.shop_items.find(item => item.roleId === role.id)
            if (exists) {
                return client.errEmbed({
                    type: "reply",
                    ephemeral: true,
                    title: ls["cmds"]["shop-setup"]["title"],
                    desc: ls["cmds"]["shop-setup"]["already_added"]
                }, interaction)
            }

            settings.shop_items.push({
                roleId: role.id,
                price: price
            })

            await client.settings.saveData()

            client.Embed([{
                title: ls["cmds"]["shop-setup"]["title"],
                desc: handlemsg(ls["cmds"]["shop-setup"]["added"], { role: role.id, price: price.toLocaleString() }),
                timestamp: interaction.createdTimestamp
            }], undefined, "reply", false, interaction)

        } else if (subcommand === "remove") {
            const role = interaction.options.getRole("role")

            const index = settings.shop_items.findIndex(item => item.roleId === role.id)
            if (index === -1) {
                return client.errEmbed({
                    type: "reply",
                    ephemeral: true,
                    title: ls["cmds"]["shop-setup"]["title"],
                    desc: ls["cmds"]["shop-setup"]["not_in_shop"]
                }, interaction)
            }

            settings.shop_items.splice(index, 1)
            await client.settings.saveData()

            client.Embed([{
                title: ls["cmds"]["shop-setup"]["title"],
                desc: handlemsg(ls["cmds"]["shop-setup"]["removed"], { role: role.id }),
                timestamp: interaction.createdTimestamp
            }], undefined, "reply", false, interaction)

        } else if (subcommand === "list") {
            if (settings.shop_items.length === 0) {
                return client.Embed([{
                    title: ls["cmds"]["shop-setup"]["title"],
                    desc: ls["cmds"]["shop"]["empty"],
                    timestamp: interaction.createdTimestamp
                }], undefined, "reply", false, interaction)
            }

            const listStr = settings.shop_items.map((item, index) => {
                return `**${index + 1}.** <@&${item.roleId}> - **${item.price.toLocaleString()} 💰**`
            }).join("\n")

            client.Embed([{
                title: ls["cmds"]["shop-setup"]["title"],
                desc: listStr,
                timestamp: interaction.createdTimestamp
            }], undefined, "reply", false, interaction)
        }
    }
}
