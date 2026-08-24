const { SlashCommandBuilder } = require("discord.js")
const { PermissionsBitField } = require("discord.js")

module.exports = {
    data: new SlashCommandBuilder()
        .setName("economy-manage")
        .setDescription("Manage users' economy balances (Admin only)")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .addSubcommand(sub => sub
            .setName("add")
            .setDescription("Add money to a user's balance")
            .addUserOption(opt => opt
                .setName("user")
                .setDescription("The user to receive money")
                .setRequired(true)
            )
            .addIntegerOption(opt => opt
                .setName("amount")
                .setDescription("The amount of money to add")
                .setRequired(true)
                .setMinValue(1)
            )
            .addStringOption(opt => opt
                .setName("type")
                .setDescription("Where to add the money")
                .addChoices(
                    { name: "Wallet", value: "wallet" },
                    { name: "Bank", value: "bank" }
                )
                .setRequired(false)
            )
        )
        .addSubcommand(sub => sub
            .setName("remove")
            .setDescription("Remove money from a user's balance")
            .addUserOption(opt => opt
                .setName("user")
                .setDescription("The user to lose money")
                .setRequired(true)
            )
            .addIntegerOption(opt => opt
                .setName("amount")
                .setDescription("The amount of money to remove")
                .setRequired(true)
                .setMinValue(1)
            )
            .addStringOption(opt => opt
                .setName("type")
                .setDescription("Where to remove the money from")
                .addChoices(
                    { name: "Wallet", value: "wallet" },
                    { name: "Bank", value: "bank" }
                )
                .setRequired(false)
            )
        )
        .addSubcommand(sub => sub
            .setName("set")
            .setDescription("Set a user's balance to a specific amount")
            .addUserOption(opt => opt
                .setName("user")
                .setDescription("The user whose balance will be set")
                .setRequired(true)
            )
            .addIntegerOption(opt => opt
                .setName("amount")
                .setDescription("The new balance amount")
                .setRequired(true)
                .setMinValue(0)
            )
            .addStringOption(opt => opt
                .setName("type")
                .setDescription("Which balance to set")
                .addChoices(
                    { name: "Wallet", value: "wallet" },
                    { name: "Bank", value: "bank" }
                )
                .setRequired(false)
            )
        ),

    async execute(client, interaction) {
        const subcommand = interaction.options.getSubcommand()
        const targetUser = interaction.options.getUser("user")
        const amount = interaction.options.getInteger("amount")
        const type = interaction.options.getString("type") || "wallet"

        let ls = client.getLanguage(interaction.guild?.id)
        const { getOrCreateProfile, handlemsg } = require(`${process.cwd()}/src/utils/functions`)

        if (targetUser.bot) {
            return client.errEmbed({
                type: "reply",
                ephemeral: true,
                title: ls["cmds"]["economy-manage"]["title"],
                desc: ls["cmds"]["transfer"]["err_bot"] || "You cannot manage money for a bot!"
            }, interaction)
        }

        const profile = await getOrCreateProfile(client, targetUser.id, interaction.guild.id)

        const typeStr = type === "bank"
            ? (ls["cmds"]["economy-manage"]["bank"] || "bank")
            : (ls["cmds"]["economy-manage"]["wallet"] || "wallet")

        if (subcommand === "add") {
            profile[type] = (profile[type] || 0) + amount

            client.Embed([{
                title: ls["cmds"]["economy-manage"]["title"],
                desc: handlemsg(ls["cmds"]["economy-manage"]["add_success"], {
                    amount: String(amount),
                    user: targetUser.id,
                    type: typeStr
                }),
                timestamp: interaction.createdTimestamp
            }], undefined, "reply", true, interaction)

        } else if (subcommand === "remove") {
            const currentVal = profile[type] || 0
            const newVal = Math.max(0, currentVal - amount)
            profile[type] = newVal

            client.Embed([{
                title: ls["cmds"]["economy-manage"]["title"],
                desc: handlemsg(ls["cmds"]["economy-manage"]["remove_success"], {
                    amount: String(amount),
                    user: targetUser.id,
                    type: typeStr
                }),
                timestamp: interaction.createdTimestamp
            }], undefined, "reply", true, interaction)

        } else if (subcommand === "set") {
            profile[type] = amount

            client.Embed([{
                title: ls["cmds"]["economy-manage"]["title"],
                desc: handlemsg(ls["cmds"]["economy-manage"]["set_success"], {
                    amount: String(amount),
                    user: targetUser.id,
                    type: typeStr
                }),
                timestamp: interaction.createdTimestamp
            }], undefined, "reply", true, interaction)
        }
    }
}
