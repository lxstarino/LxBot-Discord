const { SlashCommandBuilder } = require("@discordjs/builders")
const { PermissionsBitField, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, ChannelSelectMenuBuilder, RoleSelectMenuBuilder, ButtonStyle, ChannelType } = require("discord.js")

const emojis = {
    "1": "1️⃣",
    "2": "2️⃣",
    "3": "3️⃣",
    "4": "4️⃣",
    "5": "5️⃣",
    "6": "6️⃣",
    "7": "7️⃣",
    "8": "8️⃣",
    "9": "9️⃣",
    "10": "🔟"
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ticket-setup")
        .setDescription("Setup a ticket system on your server")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
    async execute(client, interaction) {
        let ls = client.getLanguage(interaction.guild?.id)
        const { handlemsg } = require(`${process.cwd()}/src/handlers/functions`)

        try {
            let SetupNumber = null
            first_layer()

            async function first_layer() {
                let menuoptions = []
                for (let i = 1; i <= 10; i++) {
                    menuoptions.push({
                        value: `${i} Ticket Panel`,
                        description: handlemsg(ls["cmds"]["t-setup"]["panel_option_desc"], { panel: i }),
                        emoji: emojis[i]
                    })
                }

                let row1 = new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('MenuSelection1')
                        .setMaxValues(1)
                        .setMinValues(1)
                        .setPlaceholder(ls["cmds"]["t-setup"]["placeholder"])
                        .addOptions(
                            menuoptions.slice(0, 5).map(option => {
                                let Obj = {
                                    label: option.label ? option.label.substring(0, 50) : option.value.substring(0, 50),
                                    value: option.value.substring(0, 50),
                                    description: option.description.substring(0, 50),
                                    emoji: option.emoji
                                }
                                return Obj
                            })
                        )
                )

                let row2 = new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('MenuSelection2')
                        .setMaxValues(1)
                        .setMinValues(1)
                        .setPlaceholder(ls["cmds"]["t-setup"]["placeholder"])
                        .addOptions(
                            menuoptions.slice(5, 10).map(option => {
                                let Obj = {
                                    label: option.label ? option.label.substring(0, 50) : option.value.substring(0, 50),
                                    value: option.value.substring(0, 50),
                                    description: option.description.substring(0, 50),
                                    emoji: option.emoji
                                }
                                return Obj
                            })
                        )
                )

                let MenuEmbed = await client.Embed([{
                    thumbnail: "https://cdn.discordapp.com/emojis/1121671709473382420.png",
                    title: ls["cmds"]["t-setup"]["first_layer_title"],
                    desc: ls["cmds"]["t-setup"]["first_layer_desc"],
                    footer: { text: `${interaction.user.tag}` }
                }], [row1, row2], "reply", true, interaction)

                if (!MenuEmbed) return;
                const col = MenuEmbed.createMessageComponentCollector({
                    filter: i => i?.isStringSelectMenu() && i?.user.id == interaction.user.id,
                    time: 90000
                })

                col.on('collect', async (menu) => {
                    col.stop()
                    await menu.deferUpdate()
                    SetupNumber = menu.values[0].split(" ")[0]

                    if (!client.ticket.storage.data.find(x => x.panel === SetupNumber && x.guildId === interaction.guild.id)) {
                        await client.ticket.createData({ guildId: interaction.guild.id, panel: SetupNumber, roles: [], channel: 0, category: 0, })
                    }

                    start_second_layer()
                })

                col.on('end', (c, reason) => {
                    if (reason === "time" && c.size == 0)
                        client.errEmbed({ type: "editReply", title: ls["cmds"]["t-setup"]["timeout_title"], desc: ls["cmds"]["t-setup"]["timeout_desc"], components: [] }, interaction)
                })
            }

            async function start_second_layer() {
                const panel = client.ticket.storage.data.find(x => x.panel === SetupNumber && x.guildId === interaction.guild.id)
                if (!panel) return

                // Fetch and filter assignable roles (below bot and admin role positions, not managed)
                const botMember = interaction.guild.members.me;
                const adminMember = interaction.member;

                const assignableRoles = interaction.guild.roles.cache
                    .filter(role => 
                        role.id !== interaction.guild.id && // Not @everyone
                        !role.managed && // Not bot/integration role
                        role.position < botMember.roles.highest.position && // Below bot
                        role.position < adminMember.roles.highest.position // Below admin
                    )
                    .sort((a, b) => b.position - a.position);

                const rolesArray = Array.from(assignableRoles.values());
                const chunks = [];
                for (let j = 0; j < rolesArray.length; j += 25) {
                    chunks.push(rolesArray.slice(j, j + 25));
                }

                async function getComponents() {
                    const row1 = new ActionRowBuilder().addComponents(
                        new ChannelSelectMenuBuilder()
                            .setCustomId("channel-select")
                            .setPlaceholder(ls["cmds"]["t-setup"]["select_channel"])
                            .addChannelTypes(ChannelType.GuildText)
                    )

                    const comp = [row1]

                    const isDe = client.getLanguage(interaction.guild?.id)?.language === "de";

                    if (chunks.length === 0) {
                        const disabledRow = new ActionRowBuilder().addComponents(
                            new StringSelectMenuBuilder()
                                .setCustomId("ticket-role-toggle-disabled")
                                .setPlaceholder(ls["cmds"]["t-setup"]["no_roles_found"])
                                .setDisabled(true)
                                .addOptions({ label: "None", value: "none" })
                        );
                        comp.push(disabledRow);
                    } else {
                        // Display up to 3 select menus (max 75 roles)
                        const maxChunks = Math.min(chunks.length, 3);
                        for (let c = 0; c < maxChunks; c++) {
                            const chunk = chunks[c];
                            const options = chunk.map(role => {
                                const isAdded = panel.roles.includes(role.id);
                                return {
                                    label: role.name.substring(0, 50),
                                    value: role.id,
                                    description: isAdded 
                                        ? (isDe ? "Klicken zum Entfernen" : "Click to remove") 
                                        : (isDe ? "Klicken zum Hinzufügen" : "Click to add"),
                                    emoji: isAdded ? "✅" : "➕"
                                };
                            });

                            const selectMenu = new StringSelectMenuBuilder()
                                .setCustomId(`ticket-role-toggle-${c}`)
                                .setPlaceholder(ls["cmds"]["t-setup"]["select_role_add"] + (chunks.length > 1 ? ` (${c + 1}/${chunks.length})` : ""))
                                .addOptions(options);

                            comp.push(new ActionRowBuilder().addComponents(selectMenu));
                        }
                    }

                    const categoryExists = panel.category && interaction.guild.channels.cache.has(panel.category)

                    const buttonsRow = new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId("btn-category")
                            .setLabel(categoryExists ? ls["cmds"]["t-setup"]["btn_category_update"] : ls["cmds"]["t-setup"]["btn_category"])
                            .setStyle(ButtonStyle.Secondary)
                            .setEmoji("📋"),
                        new ButtonBuilder()
                            .setCustomId("btn-send")
                            .setLabel(ls["cmds"]["t-setup"]["btn_send"])
                            .setStyle(ButtonStyle.Success)
                            .setEmoji("📨"),
                        new ButtonBuilder()
                            .setCustomId("btn-reset")
                            .setLabel(ls["cmds"]["t-setup"]["btn_reset"])
                            .setStyle(ButtonStyle.Danger)
                            .setEmoji("🔄"),
                        new ButtonBuilder()
                            .setCustomId("btn-cancel")
                            .setLabel(ls["cmds"]["t-setup"]["btn_cancel"])
                            .setStyle(ButtonStyle.Danger)
                            .setEmoji("❌")
                    )
                    comp.push(buttonsRow)
                    return comp
                }

                async function render_panel(i) {
                    const statusTitle = handlemsg(ls["cmds"]["t-setup"]["status_title"], { panel: SetupNumber })
                    let statusDesc = handlemsg(ls["cmds"]["t-setup"]["status_desc"], {
                        panel: SetupNumber,
                        channel: panel.channel && panel.channel !== '0' ? `<#${panel.channel}>` : ls["cmds"]["t-setup"]["not_set"],
                        category: panel.category && panel.category !== '0' ? `<#${panel.category}>` : ls["cmds"]["t-setup"]["not_set"],
                        roles: panel.roles.length > 0 ? panel.roles.map(r => `<@&${r}>`).join(", ") : ls["cmds"]["t-setup"]["no_roles_added"]
                    })

                    const isDe = client.getLanguage(interaction.guild?.id)?.language === "de";

                    // Add warning if roles exceed 75 (max 3 select menus + channel select + buttons = 5 ActionRows)
                    if (chunks.length > 3) {
                        statusDesc += ls["cmds"]["t-setup"]["warning_limit"];
                    }

                    const comps = await getComponents()

                    if (i) {
                        await client.Embed([{
                            thumbnail: "https://cdn.discordapp.com/emojis/1121671709473382420.png",
                            title: statusTitle,
                            desc: statusDesc,
                            footer: { text: `${interaction.user.tag}` }
                        }], comps, "update", undefined, i)
                    } else {
                        await client.Embed([{
                            thumbnail: "https://cdn.discordapp.com/emojis/1121671709473382420.png",
                            title: statusTitle,
                            desc: statusDesc,
                            footer: { text: `${interaction.user.tag}` }
                        }], comps, "editReply", undefined, interaction)
                    }
                }

                await render_panel()

                // Fetch original message again to create collector
                const msg = await interaction.fetchReply().catch(() => null);
                if (!msg) return;
                const collector = msg.createMessageComponentCollector({
                    filter: i => i.user.id === interaction.user.id,
                    time: 300000 // 5 minutes config time
                })

                collector.on("collect", async (i) => {
                    const isDe = client.getLanguage(interaction.guild?.id)?.language === "de";
                    if (i.customId === "channel-select") {
                        panel.channel = i.values[0]
                        await client.ticket.saveData()
                        await render_panel(i)
                    } else if (i.customId.startsWith("ticket-role-toggle-")) {
                        const roleId = i.values[0]
                        if (panel.roles.includes(roleId)) {
                            // Remove role
                            panel.roles = panel.roles.filter(r => r !== roleId)
                        } else {
                            // Add role (up to 5 support roles limit)
                            if (panel.roles.length >= 5) {
                                return i.reply({
                                    content: ls["cmds"]["t-setup"]["err_max_roles"],
                                    ephemeral: true
                                })
                            }
                            panel.roles.push(roleId)
                        }
                        await client.ticket.saveData()
                        await render_panel(i)
                    } else if (i.customId === "btn-category") {
                        if (panel.roles.length === 0) {
                            return i.reply({
                                content: ls["cmds"]["t-setup"]["err_no_roles"],
                                ephemeral: true
                            })
                        }

                        let category = interaction.guild.channels.cache.get(panel.category)

                        if (category) {
                            // Category exists! Update permissions for roles on it
                            await category.permissionOverwrites.edit(interaction.guild.roles.everyone.id, {
                                ViewChannel: false
                            })

                            await category.permissionOverwrites.edit(client.user.id, {
                                ViewChannel: true,
                                ManageChannels: true,
                                SendMessages: true
                            })

                            for (const roleId of panel.roles) {
                                if (interaction.guild.roles.cache.has(roleId)) {
                                    await category.permissionOverwrites.edit(roleId, {
                                        ViewChannel: true,
                                        SendMessages: true
                                    })
                                }
                            }
                            await i.deferUpdate()
                            await render_panel()
                        } else {
                            // Create new Category
                            category = await interaction.guild.channels.create({
                                name: "Tickets",
                                type: ChannelType.GuildCategory,
                                permissionOverwrites: [
                                    {
                                        id: interaction.guild.roles.everyone.id,
                                        deny: [PermissionsBitField.Flags.ViewChannel]
                                    },
                                    {
                                        id: client.user.id,
                                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ManageChannels, PermissionsBitField.Flags.SendMessages]
                                    }
                                ]
                            })

                            for (const roleId of panel.roles) {
                                if (interaction.guild.roles.cache.has(roleId)) {
                                    await category.permissionOverwrites.edit(roleId, {
                                        ViewChannel: true,
                                        SendMessages: true
                                    })
                                }
                            }

                            panel.category = category.id
                            await client.ticket.saveData()
                            await render_panel(i)
                        }
                    } else if (i.customId === "btn-send") {
                        if (panel.roles.length === 0) {
                            return i.reply({
                                content: ls["cmds"]["t-setup"]["err_no_roles"],
                                ephemeral: true
                            })
                        }

                        const channel = interaction.guild.channels.cache.get(panel.channel)
                        if (!channel) {
                            return i.reply({
                                content: ls["cmds"]["t-setup"]["err_no_channel"],
                                ephemeral: true
                            })
                        }

                        const category = interaction.guild.channels.cache.get(panel.category)
                        if (!category) {
                            return i.reply({
                                content: ls["cmds"]["t-setup"]["err_no_category"],
                                ephemeral: true
                            })
                        }

                        const row = new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                                .setCustomId(`open-ticket-${panel.panel}`)
                                .setLabel(ls["cmds"]["t-setup"]["btn_create_ticket"])
                                .setStyle(ButtonStyle.Secondary)
                                .setEmoji("📩")
                        )

                        await client.Embed([{ title: ls["cmds"]["t-setup"]["support_title"], desc: ls["cmds"]["t-setup"]["support_desc"] }], [row], undefined, undefined, channel)

                        collector.stop("sent")
                        client.successEmbed({
                            type: "update",
                            title: ls["cmds"]["t-setup"]["first_layer_title"],
                            desc: handlemsg(ls["cmds"]["t-setup"]["success_desc"], { channel: channel.id }),
                            components: []
                        }, i)
                    } else if (i.customId === "btn-reset") {
                        panel.roles = []
                        panel.channel = 0
                        panel.category = 0
                        await client.ticket.saveData()
                        await render_panel(i)
                    } else if (i.customId === "btn-cancel") {
                        collector.stop("canceled")
                        client.errEmbed({
                            type: "update",
                            title: ls["cmds"]["t-setup"]["canceled_title"],
                            desc: ls["cmds"]["t-setup"]["canceled_desc"],
                            components: []
                        }, i)
                    }
                })

                collector.on("end", async (collected, reason) => {
                    if (reason === "time") {
                        client.errEmbed({
                            type: "editReply",
                            title: ls["cmds"]["t-setup"]["timeout_title"],
                            desc: ls["cmds"]["t-setup"]["timeout_desc"],
                            components: []
                        }, interaction)
                    }
                })
            }
        } catch (err) {
            console.log(err)
        }
    }
}