const { EmbedBuilder, Routes } = require("discord.js")

module.exports = (client) => {
    client.tempEmbed = function () {
        return new EmbedBuilder()
            .setColor("#000000")
    }

    client.successEmbed = function ({
        embed: embed = client.tempEmbed(),
        title: title,
        desc: desc,
        color: color,
        type: type,
        components: components,
        ephemeral: ephemeral
    }, interaction) {
        const emoji = client.appEmojis?.success || "<:sucessfull:1550625611477942432>"
        if (title) {
            embed.setDescription(`${emoji} **${title}**\n${desc ? desc : ""}`)
        } else {
            embed.setDescription(`${emoji} ${desc ? desc : ""}`)
        }
        if (color) { embed.setColor(color) } else { embed.setColor("#087c24") }

        return client.sendEmbed({
            type: type,
            embeds: [embed],
            components: components,
            ephemeral: ephemeral
        }, interaction)
    }

    client.errEmbed = function ({
        embed: embed = client.tempEmbed(),
        title: title,
        desc: desc,
        color: color,
        type: type,
        components: components,
        ephemeral: ephemeral
    }, interaction) {
        const emoji = client.appEmojis?.error || "<:error:1550625609053503608>"
        if (title) {
            embed.setDescription(`${emoji} **${title}**\n${desc ? desc : ""}`)
        } else {
            embed.setDescription(`${emoji} ${desc ? desc : ""}`)
        }
        if (color) { embed.setColor(color) } else { embed.setColor("#e02c44") }
        return client.sendEmbed({
            type: type,
            embeds: [embed],
            components: components,
            ephemeral: ephemeral
        }, interaction)
    }

    client.Embed = function (embedList, componentList, msgType, ephemeral, interaction, fileList = [], content) {
        const embeds = [];
        for (const item of embedList) {
            let embed;
            let title, desc, color, image, url, author, thumbnail, footer, fields, timestamp;

            if (item && typeof item === "object" && typeof item.setTitle === "function") {
                embed = item;
            } else if (item && typeof item === "object") {
                embed = item.embed || client.tempEmbed();
                title = item.title;
                desc = item.desc || item.description;
                color = item.color;
                image = item.image;
                url = item.url;
                author = item.author;
                thumbnail = item.thumbnail;
                footer = item.footer;
                fields = item.fields;
                timestamp = item.timestamp;
            } else {
                embed = client.tempEmbed();
            }
            const targetGuildId = interaction?.guild?.id || interaction?.guildId;
            if (targetGuildId) {
                const hex = client.settings?.get(targetGuildId) || (client.db ? client.db.getSettings(targetGuildId) : null);
                if (hex && hex.embed_color) {
                    embed.setColor(hex.embed_color);
                }
            }

            if (title) embed.setTitle(title);
            if (desc) embed.setDescription(desc);
            if (color) embed.setColor(color);
            if (image) embed.setImage(image);
            if (url) embed.setURL(url);
            if (author) embed.setAuthor(author);
            if (thumbnail) embed.setThumbnail(thumbnail);
            if (footer) embed.setFooter(footer);
            if (fields) embed.addFields(fields);
            if (timestamp) {
                if (timestamp instanceof Date || typeof timestamp === "number") {
                    embed.setTimestamp(timestamp);
                } else {
                    const numericTimestamp = Number(timestamp);
                    if (!isNaN(numericTimestamp) && String(timestamp).trim() !== "") {
                        embed.setTimestamp(new Date(numericTimestamp));
                    } else {
                        const parsedDate = new Date(timestamp);
                        if (!isNaN(parsedDate.getTime())) {
                            embed.setTimestamp(parsedDate);
                        } else if (timestamp === true) {
                            embed.setTimestamp();
                        }
                    }
                }
            }
            embeds.push(embed);
        }
        return client.sendEmbed({
            type: msgType,
            content: content,
            embeds: embeds,
            components: componentList,
            files: fileList,
            ephemeral: ephemeral
        }, interaction);
    }

    client.sendEmbed = async function ({
        type: type,
        content: content,
        embeds: embeds,
        components: components,
        files: files,
        ephemeral: ephemeral
    }, interaction) {
        if (type === "reply" && interaction && typeof interaction.isRepliable === "function" && interaction.isRepliable()) {
            if (interaction.deferred && !interaction.replied) {
                type = "editReply";
            } else if (interaction.replied) {
                type = "followUp";
            }
        }

        switch (type) {
            case "reply":
                return await interaction.reply({
                    content: content,
                    embeds: embeds,
                    components: components,
                    files: files,
                    ephemeral: ephemeral,
                    fetchReply: true
                }).catch((err) => { console.error("Reply Error:\n", err) })
            case "editReply":
                return await interaction.editReply({
                    content: content,
                    embeds: embeds,
                    components: components,
                    files: files,
                    fetchReply: true
                }).catch((err) => { console.error("EditReply Error:\n", err) })
            case "update":
                return await interaction.update({
                    content: content,
                    embeds: embeds,
                    components: components,
                    files: files,
                    fetchReply: true
                }).catch((err) => { console.error("Update Error:\n", err) })
            case "edit":
                return await interaction.edit({
                    content: content,
                    embeds: embeds,
                    components: components,
                    files: files
                }).catch((err) => {
                    if (err.code !== 10008) {
                        console.error("Edit Error:\n", err.message || err)
                    }
                })
            case "followUp":
                return await interaction.followUp({
                    content: content,
                    embeds: embeds,
                    components: components,
                    files: files,
                    ephemeral: ephemeral,
                    fetchReply: true
                }).catch((err) => { console.error("followUp Error:\n", err) })
            default:
                return await interaction.send({
                    content: content,
                    embeds: embeds,
                    components: components,
                    files: files,
                    fetchReply: true
                }).catch((err) => { console.error("Send Error:\n", err) })
        }
    }

    client.sendContainer = async function ({
        accentColor,
        sections = [],
        containers = null,
        type = "editReply",
        ephemeral = false,
        fallbackEmbed
    }, interaction) {
        let defaultColorInt = 0x5865F2
        if (interaction && interaction.guild) {
            const hex = client.settings?.get(interaction.guild.id) || (client.db ? client.db.getSettings(interaction.guild.id) : null)
            if (hex && hex.embed_color) {
                defaultColorInt = parseInt(hex.embed_color.replace("#", ""), 16) || 0x5865F2
            }
        }

        const parseColor = (col) => {
            if (!col) return defaultColorInt
            return typeof col === "number" ? col : parseInt(String(col).replace("#", ""), 16) || defaultColorInt
        }

        const parseEmoji = (e) => {
            if (!e) return undefined
            if (typeof e === "object") return e
            const match = String(e).match(/^<(a)?:([a-zA-Z0-9_]+):([0-9]+)>$/)
            if (match) {
                return { animated: Boolean(match[1]), name: match[2], id: match[3] }
            }
            return { name: String(e) }
        }

        const buildContainerObject = (secList, col) => {
            const containerComponents = []
            for (const sec of (secList || [])) {

                if (sec && typeof sec.toJSON === "function") {
                    containerComponents.push(sec.toJSON())
                    continue
                }

                if (sec.type === "separator" || sec.type === 14) {
                    containerComponents.push({
                        type: 14,
                        divider: sec.divider !== undefined ? sec.divider : true,
                        spacing: sec.spacing || 1
                    })
                    continue
                }

                if (sec.type === "media_gallery" || sec.type === 12 || sec.images || sec.media) {
                    const items = (sec.images || sec.media || []).map(img => ({
                        media: { url: typeof img === "string" ? img : (img.url || img.media?.url) },
                        description: img.description || "image"
                    }))
                    if (items.length > 0) {
                        containerComponents.push({
                            type: 12,
                            items: items.slice(0, 10)
                        })
                    }
                    continue
                }

                if (sec.type === "action_row" || sec.type === 1 || sec.buttons || sec.components) {
                    const rowItems = (sec.buttons || sec.components || []).map(btn => {
                        if (btn && typeof btn.toJSON === "function") return btn.toJSON()
                        if (btn.type === 3 || btn.type === "string_select") {
                            return {
                                type: 3,
                                custom_id: btn.customId || btn.custom_id,
                                placeholder: btn.placeholder,
                                min_values: btn.minValues || btn.min_values || 1,
                                max_values: btn.maxValues || btn.max_values || 1,
                                disabled: btn.disabled || false,
                                options: (btn.options || []).map(opt => ({
                                    label: opt.label,
                                    value: opt.value,
                                    description: opt.description,
                                    emoji: parseEmoji(opt.emoji),
                                    default: opt.default || false
                                }))
                            }
                        }
                        return {
                            type: 2,
                            style: btn.style || (btn.url ? 5 : 2),
                            url: btn.url,
                            custom_id: btn.customId || btn.custom_id,
                            label: btn.label,
                            disabled: btn.disabled || false,
                            emoji: parseEmoji(btn.emoji)
                        }
                    })
                    containerComponents.push({
                        type: 1,
                        components: rowItems
                    })
                    continue
                }

                if (sec.type === "select_menu" || sec.type === "string_select" || sec.type === "user_select" || sec.type === "role_select" || sec.type === "channel_select" || sec.type === "mentionable_select" || [3, 5, 6, 7, 8].includes(sec.type)) {
                    let selectType = 3
                    if (sec.type === "user_select" || sec.type === 5) selectType = 5
                    else if (sec.type === "role_select" || sec.type === 6) selectType = 6
                    else if (sec.type === "mentionable_select" || sec.type === 7) selectType = 7
                    else if (sec.type === "channel_select" || sec.type === 8) selectType = 8

                    const selectComponent = {
                        type: selectType,
                        custom_id: sec.customId || sec.custom_id || `select_${Date.now()}`,
                        placeholder: sec.placeholder,
                        min_values: sec.minValues || sec.min_values || 1,
                        max_values: sec.maxValues || sec.max_values || 1,
                        disabled: sec.disabled || false
                    }

                    if (selectType === 3) {
                        selectComponent.options = (sec.options || []).map(opt => ({
                            label: opt.label,
                            value: opt.value,
                            description: opt.description,
                            emoji: parseEmoji(opt.emoji),
                            default: opt.default || false
                        }))
                    } else if (selectType === 8 && (sec.channelTypes || sec.channel_types)) {
                        selectComponent.channel_types = sec.channelTypes || sec.channel_types
                    }

                    if (sec.defaultValues || sec.default_values) {
                        selectComponent.default_values = sec.defaultValues || sec.default_values
                    }

                    containerComponents.push({
                        type: 1,
                        components: [selectComponent]
                    })
                    continue
                }

                const rawText = sec.text || sec.content || ""
                const formattedContent = Array.isArray(rawText) ? rawText.join("\n") : String(rawText)

                if (!sec.accessory) {
                    containerComponents.push({
                        type: 10,
                        content: formattedContent
                    })
                    continue
                }

                let accessoryObj = null
                if (sec.accessory.type === "thumbnail" || sec.accessory.type === 11 || (typeof sec.accessory === "object" && sec.accessory.url && !sec.accessory.style && (sec.accessory.url.includes("avatar") || sec.accessory.url.includes(".jpg") || sec.accessory.url.includes(".png")))) {
                    accessoryObj = {
                        type: 11,
                        media: {
                            url: sec.accessory.url || sec.accessory
                        },
                        description: sec.accessory.description || "thumbnail"
                    }
                } else if (sec.accessory.type === "button" || sec.accessory.type === 2 || sec.accessory.url || sec.accessory.customId) {
                    accessoryObj = {
                        type: 2,
                        style: sec.accessory.style || (sec.accessory.url ? 5 : 2),
                        url: sec.accessory.url,
                        custom_id: sec.accessory.customId,
                        label: sec.accessory.label,
                        disabled: sec.accessory.disabled || false,
                        emoji: parseEmoji(sec.accessory.emoji)
                    }
                } else {
                    accessoryObj = sec.accessory
                }

                containerComponents.push({
                    type: 9,
                    components: [
                        {
                            type: 10,
                            content: formattedContent
                        }
                    ],
                    accessory: accessoryObj
                })
            }

            return {
                type: 17,
                accent_color: parseColor(col),
                components: containerComponents
            }
        }

        let containerList = []
        if (Array.isArray(containers) && containers.length > 0) {
            containerList = containers.map(c => buildContainerObject(c.sections, c.accentColor || c.accent_color || accentColor))
        } else {
            containerList = [buildContainerObject(sections, accentColor)]
        }

        let flags = 32768
        if (ephemeral) flags |= 64

        const payload = {
            flags: flags,
            components: containerList
        }

        try {
            if (type === "update" && interaction && interaction.id && interaction.token) {
                return await client.rest.post(
                    Routes.interactionCallback(interaction.id, interaction.token),
                    { body: { type: 7, data: payload } }
                )
            } else if (type === "editReply" && interaction && interaction.applicationId && interaction.token) {
                return await client.rest.patch(
                    Routes.webhookMessage(interaction.applicationId, interaction.token, "@original"),
                    { body: payload }
                )
            } else if (type === "reply" && interaction && interaction.id && interaction.token) {
                return await client.rest.post(
                    Routes.interactionCallback(interaction.id, interaction.token),
                    { body: { type: 4, data: payload } }
                )
            } else if (type === "followUp" && interaction && interaction.applicationId && interaction.token) {
                return await client.rest.post(
                    Routes.webhook(interaction.applicationId, interaction.token),
                    { body: payload }
                )
            } else if (type === "send" || (interaction && interaction.isTextBased && interaction.isTextBased() && !interaction.token)) {
                const channelId = interaction.channelId || interaction.id
                return await client.rest.post(
                    Routes.channelMessages(channelId),
                    { body: payload }
                )
            } else if (type === "edit" || (interaction && interaction.channelId && interaction.id && !interaction.token)) {
                return await client.rest.patch(
                    Routes.channelMessage(interaction.channelId, interaction.id),
                    { body: payload }
                )
            } else {
                return await interaction.editReply(payload)
            }
        } catch (err) {
            console.error("[sendContainer] Failed to send Components V2 payload, falling back to standard Embed:", err.message)
            if (fallbackEmbed) {
                return await client.Embed(fallbackEmbed.embeds || [fallbackEmbed], fallbackEmbed.components || [], type, ephemeral, interaction)
            }
        }
    }
}
