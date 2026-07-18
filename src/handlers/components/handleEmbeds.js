const { EmbedBuilder } = require("discord.js")

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
        if (title) {
            embed.setDescription(`${client.emojis.cache.find(emoji => emoji.id === "1194545522967597086") ? `<:check:1194545522967597086> **${title}**\n${desc ? desc : ""}` : `✅ **${title}**\n${desc ? desc : ""}`}`)
        }
        else {
            embed.setDescription(`${client.emojis.cache.find(emoji => emoji.id === "1194545522967597086") ? `<:check:1194545522967597086> **Successful**\n${desc ? desc : ""}` : `✅ **Successful**\n${desc ? desc : ""}`}`)
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
        if (title) {
            embed.setDescription(`${client.emojis.cache.find(emoji => emoji.id === "1194542111056474154") ? `<:error:1194542111056474154> **${title}**\n${desc ? desc : ""}` : `❌ **${title}**\n${desc ? desc : ""}`}`)
        }
        else {
            embed.setDescription(`${client.emojis.cache.find(emoji => emoji.id === "1194542111056474154") ? `<:error:1194542111056474154> **Error**\n${desc ? desc : ""}` : `❌ **Error**\n${desc ? desc : ""}`}`)
        }
        if (color) { embed.setColor(color) } else { embed.setColor("#e02c44") }
        return client.sendEmbed({
            type: type,
            embeds: [embed],
            components: components,
            ephemeral: ephemeral
        }, interaction)
    }

    /**
     * Sends one or more Embeds
     * @param {Array<Object>} embedList 
     * @param {Array<Object>} componentList 
     * @param {Enumerator} msgType
     * @param {boolean} ephemeral 
     * @param {Object} interaction 
     * @returns {Promise} 
     */

    client.Embed = function (embedList, componentList, msgType, ephemeral, interaction, fileList = [], content) {
        const embeds = [];
        for (const {
            embed = client.tempEmbed(),
            title,
            desc,
            color,
            image,
            url,
            author,
            thumbnail,
            footer,
            fields,
            timestamp,
        } of embedList) {
            if (interaction && interaction.guild) {
                let hex = client.settings.storage.data.find(x => x.guildId === interaction.guild.id)
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
        switch (type) {
            case "reply":
                return await interaction.reply({
                    content: content,
                    embeds: embeds,
                    components: components,
                    files: files,
                    ephemeral: ephemeral,
                    fetchReply: true
                }).catch((err) => { console.log("Reply Error:\n" + err) })
            case "editReply":
                return await interaction.editReply({
                    content: content,
                    embeds: embeds,
                    components: components,
                    files: files,
                    fetchReply: true
                }).catch((err) => { console.log("EditReply Error:\n" + err) })
            case "update":
                return await interaction.update({
                    content: content,
                    embeds: embeds,
                    components: components,
                    files: files,
                    fetchReply: true
                }).catch((err) => { console.log("Update Error:\n" + err) })
            case "followUp":
                return await interaction.followUp({
                    content: content,
                    embeds: embeds,
                    components: components,
                    files: files,
                    ephemeral: ephemeral,
                    fetchReply: true
                }).catch((err) => { console.log("followUp Error:\n" + err) })
            default:
                return await interaction.send({
                    content: content,
                    embeds: embeds,
                    components: components,
                    files: files,
                    fetchReply: true
                }).catch((err) => { console.log("Send Error:\n" + err) })
        }
    }
}
