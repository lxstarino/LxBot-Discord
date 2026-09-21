const { SlashCommandBuilder, PermissionsBitField, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, ChannelSelectMenuBuilder, RoleSelectMenuBuilder, ButtonStyle, ChannelType, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js")

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
        .setName("role-setup")
        .setDescription("Setup a button-role panel on your server")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
    async execute(client, interaction) {
        let ls = client.getLanguage(interaction.guild?.id)
        const { handlemsg, getSetupControls } = require("../../utils/stringUtils")
        const defaultDb = require("../../database/Database")

        try {
            let SetupNumber = null;
            await first_layer();

            async function first_layer() {
                let menuoptions = [];
                for (let i = 1; i <= 10; i++) {
                    menuoptions.push({
                        value: `${i} Role Panel`,
                        description: handlemsg(ls["cmds"]["role-setup"]["panel_option_desc"], { panel: i }),
                        emoji: emojis[i]
                    });
                }

                let row1 = new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('MenuSelection1')
                        .setMaxValues(1)
                        .setMinValues(1)
                        .setPlaceholder(ls["cmds"]["role-setup"]["placeholder"])
                        .addOptions(
                            menuoptions.slice(0, 5).map(option => ({
                                label: option.value.substring(0, 50),
                                value: option.value.substring(0, 50),
                                description: option.description.substring(0, 50),
                                emoji: option.emoji
                            }))
                        )
                );

                let row2 = new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('MenuSelection2')
                        .setMaxValues(1)
                        .setMinValues(1)
                        .setPlaceholder(ls["cmds"]["role-setup"]["placeholder"])
                        .addOptions(
                            menuoptions.slice(5, 10).map(option => ({
                                label: option.value.substring(0, 50),
                                value: option.value.substring(0, 50),
                                description: option.description.substring(0, 50),
                                emoji: option.emoji
                            }))
                        )
                );

                let MenuEmbed = await client.Embed([{
                    thumbnail: "https://cdn.discordapp.com/emojis/1121671709473382420.png",
                    title: ls["cmds"]["role-setup"]["first_layer_title"],
                    desc: ls["cmds"]["role-setup"]["first_layer_desc"],
                    footer: { text: `${interaction.user.tag}` }
                }], [row1, row2], "reply", true, interaction);

                if (!MenuEmbed) return;
                const col = MenuEmbed.createMessageComponentCollector({
                    filter: i => i?.isStringSelectMenu() && i?.user.id === interaction.user.id,
                    time: 90000
                });

                col.on('collect', async (menu) => {
                    col.stop();
                    await menu.deferUpdate();
                    SetupNumber = menu.values[0].split(" ")[0];

                    const database = client.db || defaultDb;
                    let existingPanel = database.getReactionRole(interaction.guild.id, SetupNumber) || {
                        guildId: String(interaction.guild.id),
                        panel: SetupNumber,
                        roles: [],
                        channel: 0,
                        description: null
                    };

                    start_second_layer(existingPanel);
                });

                col.on('end', (c, reason) => {
                    if (reason === "time" && c.size === 0) {
                        client.errEmbed({ type: "editReply", title: ls["cmds"]["role-setup"]["timeout_title"], desc: ls["cmds"]["role-setup"]["timeout_desc"], components: [] }, interaction);
                    }
                });
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
                            .setPlaceholder(ls["cmds"]["role-setup"]["select_channel"])
                            .addChannelTypes(ChannelType.GuildText)
                    );

                    const comp = [row1];

                    if (assignableRoleIds.size === 0) {
                        const disabledRow = new ActionRowBuilder().addComponents(
                            new RoleSelectMenuBuilder()
                                .setCustomId("role-select-disabled")
                                .setPlaceholder(ls["cmds"]["role-setup"]["no_roles_found"])
                                .setDisabled(true)
                        );
                        comp.push(disabledRow);
                    } else {
                        const roleMenu = new RoleSelectMenuBuilder()
                            .setCustomId("role-select")
                            .setPlaceholder(ls["cmds"]["role-setup"]["select_role_add"])
                            .setMinValues(0)
                            .setMaxValues(25);

                        if (panel.roles && panel.roles.length > 0) {
                            roleMenu.addDefaultRoles(panel.roles);
                        }

                        comp.push(new ActionRowBuilder().addComponents(roleMenu));
                    }
                    const extraDescButton = new ButtonBuilder()
                        .setCustomId("btn-desc")
                        .setLabel(ls["cmds"]["role-setup"]["btn_desc"])
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji("📝");

                    const buttonsRow = getSetupControls({
                        btn_send: ls["cmds"]["role-setup"]["btn_send"],
                        btn_reset: ls["cmds"]["role-setup"]["btn_reset"],
                        btn_cancel: ls["cmds"]["role-setup"]["btn_cancel"],
                        extra: [extraDescButton]
                    });

                    comp.push(buttonsRow);
                    return comp;
                }

                async function render_panel(i) {
                    const database = client.db || defaultDb;
                    database.saveReactionRole(panel);

                    const statusTitle = handlemsg(ls["cmds"]["role-setup"]["status_title"], { panel: SetupNumber });
                    let statusDesc = handlemsg(ls["cmds"]["role-setup"]["status_desc"], {
                        panel: SetupNumber,
                        channel: panel.channel && interaction.guild.channels.cache.get(panel.channel) ? `<#${panel.channel}>` : (ls["cmds"]["role-setup"]["not_set"] || "*Not set*"),
                        roles: panel.roles && panel.roles.length > 0 ? panel.roles.map(r => `<@&${r}>`).join(", ") : (ls["cmds"]["role-setup"]["no_roles_added"] || "*No roles*")
                    });

                    const comps = await getComponents();

                    if (i) {
                        await client.Embed([{
                            thumbnail: "https://cdn.discordapp.com/emojis/1121671709473382420.png",
                            title: statusTitle,
                            desc: statusDesc,
                            footer: { text: `${interaction.user.tag}` }
                        }], comps, "update", undefined, i);
                    } else {
                        await client.Embed([{
                            thumbnail: "https://cdn.discordapp.com/emojis/1121671709473382420.png",
                            title: statusTitle,
                            desc: statusDesc,
                            footer: { text: `${interaction.user.tag}` }
                        }], comps, "editReply", undefined, interaction);
                    }
                }

                await render_panel();

                const msg = await interaction.fetchReply().catch(() => null);
                if (!msg) return;
                const collector = msg.createMessageComponentCollector({
                    filter: i => i.user.id === interaction.user.id,
                    time: 300000
                });

                collector.on("collect", async (i) => {
                    if (i.customId === "channel-select") {
                        panel.channel = i.values[0];

                        await render_panel(i);
                    } else if (i.customId === "role-select") {
                        const selectedRoleIds = i.values;
                        const validRoles = [];
                        let limitReached = false;

                        for (const roleId of selectedRoleIds) {
                            if (assignableRoleIds.has(roleId)) {
                                if (validRoles.length < 25) {
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
                                content: ls["cmds"]["role-setup"]["err_max_roles"] || "Maximum roles reached",
                                ephemeral: true
                            });
                            await render_panel();
                        } else {
                            await render_panel(i);
                        }
                    } else if (i.customId === "btn-desc") {
                        const modal = new ModalBuilder()
                            .setCustomId(`modal-role-desc-${SetupNumber}`)
                            .setTitle(ls["cmds"]["role-setup"]["modal_desc_title"]);

                        const textInput = new TextInputBuilder()
                            .setCustomId("input-role-desc")
                            .setLabel(ls["cmds"]["role-setup"]["modal_desc_label"])
                            .setStyle(TextInputStyle.Paragraph)
                            .setPlaceholder(ls["cmds"]["role-setup"]["modal_desc_placeholder"])
                            .setValue(panel.description || ls["cmds"]["role-setup"]["panel_desc"])
                            .setMaxLength(2000)
                            .setRequired(true);

                        modal.addComponents(new ActionRowBuilder().addComponents(textInput));
                        await i.showModal(modal);

                        try {
                            const modalSubmit = await i.awaitModalSubmit({
                                filter: m => m.customId === `modal-role-desc-${SetupNumber}` && m.user.id === interaction.user.id,
                                time: 120000
                            });
                            panel.description = modalSubmit.fields.getTextInputValue("input-role-desc");

                            await render_panel(modalSubmit);
                        } catch (err) {
                            if (err.code !== "InteractionCollectorError") {
                                console.error("[role-setup] Modal submit handling error:", err.message);
                            }
                        }
                    } else if (i.customId === "btn-send") {
                        if (panel.roles.length === 0) {
                            return i.reply({
                                content: ls["cmds"]["role-setup"]["err_no_roles"],
                                ephemeral: true
                            });
                        }

                        const channel = interaction.guild.channels.cache.get(panel.channel);
                        if (!channel) {
                            return i.reply({
                                content: ls["cmds"]["role-setup"]["err_no_channel"],
                                ephemeral: true
                            });
                        }

                        const roleButtons = panel.roles
                            .map(id => interaction.guild.roles.cache.get(id))
                            .filter(Boolean)
                            .map(role => new ButtonBuilder()
                                .setCustomId(`toggle-role-${role.id}`)
                                .setLabel(role.name)
                                .setStyle(ButtonStyle.Primary)
                            );

                        const rows = [];
                        for (let i = 0; i < roleButtons.length; i += 5) {
                            rows.push(new ActionRowBuilder().addComponents(roleButtons.slice(i, i + 5)));
                        }

                        const finalDesc = panel.description || ls["cmds"]["role-setup"]["panel_desc"];
                        const database = client.db || defaultDb;
                        database.saveReactionRole(panel);

                        await client.Embed([{
                            title: ls["cmds"]["role-setup"]["panel_title"],
                            desc: finalDesc
                        }], rows, undefined, undefined, channel);

                        collector.stop("sent");
                        client.successEmbed({
                            type: "update",
                            title: ls["cmds"]["role-setup"]["first_layer_title"],
                            desc: handlemsg(ls["cmds"]["role-setup"]["success_desc"], { channel: channel.id }),
                            components: []
                        }, i);
                    } else if (i.customId === "btn-reset") {
                        panel.roles = [];
                        panel.channel = 0;
                        panel.description = null;

                        await render_panel(i);
                    } else if (i.customId === "btn-cancel") {
                        collector.stop("canceled");
                        client.errEmbed({
                            type: "update",
                            title: ls["cmds"]["role-setup"]["canceled_title"],
                            desc: ls["cmds"]["role-setup"]["canceled_desc"],
                            components: []
                        }, i);
                    }
                });

                collector.on("end", async (collected, reason) => {
                    if (reason === "time") {
                        client.errEmbed({
                            type: "editReply",
                            title: ls["cmds"]["role-setup"]["timeout_title"],
                            desc: ls["cmds"]["role-setup"]["timeout_desc"],
                            components: []
                        }, interaction);
                    }
                });
            }
        } catch (err) {
            console.error(err);
        }
    }
}
