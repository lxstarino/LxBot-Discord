const { SlashCommandBuilder, PermissionsBitField, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, ChannelSelectMenuBuilder, RoleSelectMenuBuilder, ButtonStyle, ChannelType } = require("discord.js")

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

const defaultDb = require("../../database/Database")
const { handlemsg, getSetupControls } = require("../../utils/stringUtils")

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ticket-setup")
        .setDescription("Setup a ticket system on your server")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
    async execute(client, interaction) {
        let ls = client.getLanguage(interaction.guild?.id)

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

                    const database = client.db || defaultDb
                    let panel = database.getTicket(interaction.guild.id, SetupNumber) || {
                        guildId: String(interaction.guild.id),
                        panel: SetupNumber,
                        roles: [],
                        channel: 0,
                        category: 0
                    }

                    start_second_layer(panel)
                })

                col.on('end', (c, reason) => {
                    if (reason === "time" && c.size == 0)
                        client.errEmbed({ type: "editReply", title: ls["cmds"]["t-setup"]["timeout_title"], desc: ls["cmds"]["t-setup"]["timeout_desc"], components: [] }, interaction)
                })
            }

            async function start_second_layer(panel) {
                if (!panel) return;

                const botMember = interaction.guild.members.me;
                const adminMember = interaction.member;

                const assignableRoles = interaction.guild.roles.cache
                    .filter(role =>
                        role.id !== interaction.guild.id &&
                        !role.managed &&
                        role.position < botMember.roles.highest.position &&
                        role.position < adminMember.roles.highest.position
                    )
                    .sort((a, b) => b.position - a.position);

                const assignableRoleIds = new Set(assignableRoles.map(r => r.id));

                async function getComponents() {
                    const row1 = new ActionRowBuilder().addComponents(
                        new ChannelSelectMenuBuilder()
                            .setCustomId("channel-select")
                            .setPlaceholder(ls["cmds"]["t-setup"]["select_channel"])
                            .addChannelTypes(ChannelType.GuildText)
                    )

                    const comp = [row1]

                    if (assignableRoleIds.size === 0) {
                        const disabledRow = new ActionRowBuilder().addComponents(
                            new RoleSelectMenuBuilder()
                                .setCustomId("ticket-role-select-disabled")
                                .setPlaceholder(ls["cmds"]["t-setup"]["no_roles_found"])
                                .setDisabled(true)
                        );
                        comp.push(disabledRow);
                    } else {
                        const roleMenu = new RoleSelectMenuBuilder()
                            .setCustomId("ticket-role-select")
                            .setPlaceholder(ls["cmds"]["t-setup"]["select_role_add"] || "Search and select roles")
                            .setMinValues(0)
                            .setMaxValues(5);

                        if (panel.roles && panel.roles.length > 0) {
                            roleMenu.addDefaultRoles(panel.roles);
                        }

                        comp.push(new ActionRowBuilder().addComponents(roleMenu));
                    }

                    const categoryExists = panel.category && interaction.guild.channels.cache.has(panel.category)
                    const extraCategoryButton = new ButtonBuilder()
                        .setCustomId("btn-category")
                        .setLabel(categoryExists ? ls["cmds"]["t-setup"]["btn_category_update"] : ls["cmds"]["t-setup"]["btn_category"])
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji("📋");

                    const buttonsRow = getSetupControls({
                        btn_send: ls["cmds"]["t-setup"]["btn_send"],
                        btn_reset: ls["cmds"]["t-setup"]["btn_reset"],
                        btn_cancel: ls["cmds"]["t-setup"]["btn_cancel"],
                        extra: [extraCategoryButton]
                    });

                    comp.push(buttonsRow)
                    return comp
                }

                async function render_panel(i) {
                    const database = client.db || defaultDb
                    database.saveTicket(panel)

                    const statusTitle = handlemsg(ls["cmds"]["t-setup"]["status_title"], { panel: SetupNumber })
                    let statusDesc = handlemsg(ls["cmds"]["t-setup"]["status_desc"], {
                        panel: SetupNumber,
                        channel: panel.channel && panel.channel !== '0' ? `<#${panel.channel}>` : ls["cmds"]["t-setup"]["not_set"],
                        category: panel.category && panel.category !== '0' ? `<#${panel.category}>` : ls["cmds"]["t-setup"]["not_set"],
                        roles: panel.roles.length > 0 ? panel.roles.map(r => `<@&${r}>`).join(", ") : ls["cmds"]["t-setup"]["no_roles_added"]
                    })
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

                const msg = await interaction.fetchReply().catch(() => null);
                if (!msg) return;
                const collector = msg.createMessageComponentCollector({
                    filter: i => i.user.id === interaction.user.id,
                    time: 300000
                })

                collector.on("collect", async (i) => {
                    if (i.customId === "channel-select") {
                        panel.channel = i.values[0]

                        await render_panel(i)
                    } else if (i.customId === "ticket-role-select") {
                        const selectedRoleIds = i.values;
                        const validRoles = [];
                        let limitReached = false;

                        for (const roleId of selectedRoleIds) {
                            if (assignableRoleIds.has(roleId)) {
                                if (validRoles.length < 5) {
                                    validRoles.push(roleId);
                                } else {
                                    limitReached = true;
                                }
                            }
                        }

                        panel.roles = validRoles;

                        if (validRoles.length < selectedRoleIds.length || limitReached) {
                            await i.deferUpdate();
                            await interaction.followUp({
                                content: ls["cmds"]["t-setup"]["err_role_limit"],
                                ephemeral: true
                            });
                            await render_panel();
                        } else {
                            await render_panel(i);
                        }
                    } else if (i.customId === "btn-category") {
                        if (panel.roles.length === 0) {
                            return i.reply({
                                content: ls["cmds"]["t-setup"]["err_no_roles"],
                                ephemeral: true
                            })
                        }

                        let category = interaction.guild.channels.cache.get(panel.category)

                        if (category) {
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

                        const database = client.db || defaultDb
                        database.saveTicket(panel)

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
            console.error("[ticket-setup] Execution error:", err)
        }
    }
}