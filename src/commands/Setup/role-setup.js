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
        .setName("role-setup")
        .setDescription("Setup a button-role panel on your server")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
    async execute(client, interaction) {
        let ls = client.getLanguage(interaction.guild?.id)
        const settings = client.settings.storage.data.find(x => x.guildId === interaction.guild?.id);
        const lang = settings?.language === "de" ? "de" : "en";
        const { handlemsg } = require(`${process.cwd()}/src/handlers/functions`)
        const getTranslation = (key, replaceObj = {}) => {
            return handlemsg(ls["cmds"]["role-setup"][key] || "", replaceObj)
        };

        try {
            let SetupNumber = null;
            await first_layer();

            async function first_layer() {
                let menuoptions = [];
                for (let i = 1; i <= 10; i++) {
                    menuoptions.push({
                        value: `${i} Role Panel`,
                        description: getTranslation("panel_option_desc", { panel: i }),
                        emoji: emojis[i]
                    });
                }

                let row1 = new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('MenuSelection1')
                        .setMaxValues(1)
                        .setMinValues(1)
                        .setPlaceholder(getTranslation("placeholder"))
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
                        .setPlaceholder(getTranslation("placeholder"))
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
                    title: getTranslation("first_layer_title"),
                    desc: getTranslation("first_layer_desc"),
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

                    if (!client.reactionRoles.storage.data.find(x => x.panel === SetupNumber && x.guildId === interaction.guild.id)) {
                        await client.reactionRoles.createData({ guildId: interaction.guild.id, panel: SetupNumber, roles: [], channel: 0 });
                    }

                    start_second_layer();
                });

                col.on('end', (c, reason) => {
                    if (reason === "time" && c.size === 0) {
                        client.errEmbed({ type: "editReply", title: getTranslation("timeout_title"), desc: getTranslation("timeout_desc"), components: [] }, interaction);
                    }
                });
            }

            async function start_second_layer() {
                const panel = client.reactionRoles.storage.data.find(x => x.panel === SetupNumber && x.guildId === interaction.guild.id);
                if (!panel) return;

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
                            .setPlaceholder(getTranslation("select_channel"))
                            .addChannelTypes(ChannelType.GuildText)
                    );

                    const comp = [row1];

                    if (chunks.length === 0) {
                        const disabledRow = new ActionRowBuilder().addComponents(
                            new StringSelectMenuBuilder()
                                .setCustomId("role-toggle-disabled")
                                .setPlaceholder(getTranslation("no_roles_found"))
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
                                        ? (lang === "de" ? "Klicken zum Entfernen" : "Click to remove")
                                        : (lang === "de" ? "Klicken zum Hinzufügen" : "Click to add"),
                                    emoji: isAdded ? "✅" : "➕"
                                };
                            });

                            const selectMenu = new StringSelectMenuBuilder()
                                .setCustomId(`role-toggle-${c}`)
                                .setPlaceholder(getTranslation("select_role_add") + (chunks.length > 1 ? ` (${c + 1}/${chunks.length})` : ""))
                                .addOptions(options);

                            comp.push(new ActionRowBuilder().addComponents(selectMenu));
                        }
                    }

                    const buttonsRow = new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId("btn-send")
                            .setLabel(getTranslation("btn_send"))
                            .setStyle(ButtonStyle.Success)
                            .setEmoji("📨"),
                        new ButtonBuilder()
                            .setCustomId("btn-reset")
                            .setLabel(getTranslation("btn_reset"))
                            .setStyle(ButtonStyle.Danger)
                            .setEmoji("🔄"),
                        new ButtonBuilder()
                            .setCustomId("btn-cancel")
                            .setLabel(getTranslation("btn_cancel"))
                            .setStyle(ButtonStyle.Danger)
                            .setEmoji("❌")
                    );
                    comp.push(buttonsRow);
                    return comp;
                }

                async function render_panel(i) {
                    const statusTitle = getTranslation("status_title", { panel: SetupNumber });
                    let statusDesc = getTranslation("status_desc", {
                        panel: SetupNumber,
                        channel: panel.channel && panel.channel !== '0' ? `<#${panel.channel}>` : getTranslation("not_set"),
                        roles: panel.roles.length > 0 ? panel.roles.map(r => `<@&${r}>`).join(", ") : getTranslation("no_roles_added")
                    });

                    // Add warning if roles exceed 75 (max 3 select menus + channel select + buttons = 5 ActionRows)
                    if (chunks.length > 3) {
                        statusDesc += getTranslation("warning_limit");
                    }

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
                    time: 300000 // 5 minutes
                });

                collector.on("collect", async (i) => {
                    if (i.customId === "channel-select") {
                        panel.channel = i.values[0];
                        await client.reactionRoles.saveData();
                        await render_panel(i);
                    } else if (i.customId.startsWith("role-toggle-")) {
                        const roleId = i.values[0];
                        if (panel.roles.includes(roleId)) {
                            // Remove role
                            panel.roles = panel.roles.filter(r => r !== roleId);
                        } else {
                            // Add role (up to 5 roles on a single message)
                            if (panel.roles.length >= 10) {
                                return i.reply({
                                    content: lang === "de" ? "Du kannst maximal 10 Rollen zu einem Panel hinzufügen!" : "You can add a maximum of 5 roles to a single panel!",
                                    ephemeral: true
                                });
                            }
                            panel.roles.push(roleId);
                        }
                        await client.reactionRoles.saveData();
                        await render_panel(i);
                    } else if (i.customId === "btn-send") {
                        if (panel.roles.length === 0) {
                            return i.reply({
                                content: getTranslation("err_no_roles"),
                                ephemeral: true
                            });
                        }

                        const channel = interaction.guild.channels.cache.get(panel.channel);
                        if (!channel) {
                            return i.reply({
                                content: getTranslation("err_no_channel"),
                                ephemeral: true
                            });
                        }

                        // Chunk buttons into ActionRows of max 5 buttons each
                        const rows = [];
                        let currentRow = new ActionRowBuilder();

                        for (let index = 0; index < panel.roles.length; index++) {
                            const roleId = panel.roles[index];
                            const role = interaction.guild.roles.cache.get(roleId);
                            if (!role) continue;

                            const button = new ButtonBuilder()
                                .setCustomId(`toggle-role-${roleId}`)
                                .setLabel(role.name)
                                .setStyle(ButtonStyle.Primary);

                            currentRow.addComponents(button);

                            if (currentRow.components.length === 5 || index === panel.roles.length - 1) {
                                rows.push(currentRow);
                                currentRow = new ActionRowBuilder();
                            }
                        }

                        // Send the Button Roles message to the target channel
                        await client.Embed([{
                            title: getTranslation("panel_title"),
                            desc: getTranslation("panel_desc")
                        }], rows, undefined, undefined, channel);

                        collector.stop("sent");
                        client.successEmbed({
                            type: "update",
                            title: getTranslation("first_layer_title"),
                            desc: getTranslation("success_desc", { channel: channel.id }),
                            components: []
                        }, i);
                    } else if (i.customId === "btn-reset") {
                        panel.roles = [];
                        panel.channel = 0;
                        await client.reactionRoles.saveData();
                        await render_panel(i);
                    } else if (i.customId === "btn-cancel") {
                        collector.stop("canceled");
                        client.errEmbed({
                            type: "update",
                            title: getTranslation("canceled_title"),
                            desc: getTranslation("canceled_desc"),
                            components: []
                        }, i);
                    }
                });

                collector.on("end", async (collected, reason) => {
                    if (reason === "time") {
                        client.errEmbed({
                            type: "editReply",
                            title: getTranslation("timeout_title"),
                            desc: getTranslation("timeout_desc"),
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
