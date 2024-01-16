const { EmbedBuilder } = require("discord.js")

module.exports = (client) => {
    client.tempEmbed = function() {
        return new EmbedBuilder()
            .setColor("#f0240c")
    }

    client.successEmbed = function({
        embed: embed = client.tempEmbed(),
        title: title,
        desc: desc,
        color: color,
        type: type,
        components: components,
        ephemeral: ephemeral
    }, interaction){
        if(title){
            embed.setDescription(`${client.emojis.cache.find(emoji => emoji.id === "1194545522967597086") ? `<:check:1194545522967597086> **${title}**\n${desc ? desc : ""}` : `✅ **${title}**\n${desc ? desc : ""}`}`)} 
        else {
            embed.setDescription(`${client.emojis.cache.find(emoji => emoji.id === "1194545522967597086") ? `<:check:1194545522967597086> **Successful**\n${desc ? desc : ""}` : `✅ **Successful**\n${desc ? desc : ""}`}`)
        }
        if(color){embed.setColor(color)}else{embed.setColor("#087c24")}

        return client.sendEmbed({
            type: type,
            embeds: [embed],
            components: components,
            ephemeral: ephemeral
        }, interaction)
    }

    client.errEmbed = function({
        embed: embed = client.tempEmbed(),
        title: title,
        desc: desc,
        color: color,
        type: type,
        components: components,
        ephemeral: ephemeral
    }, interaction){
        if(title){
            embed.setDescription(`${client.emojis.cache.find(emoji => emoji.id === "1194542111056474154") ? `<:error:1194542111056474154> **${title}**\n${desc ? desc : ""}` : `❌ **${title}**\n${desc ? desc : ""}`}`)} 
        else {
            embed.setDescription(`${client.emojis.cache.find(emoji => emoji.id === "1194542111056474154") ? `<:error:1194542111056474154> **Error**\n${desc ? desc : ""}` : `❌ **Error**\n${desc ? desc : ""}`}`)
        }
        if(color){embed.setColor(color)}else{embed.setColor("#e02c44")}
        return client.sendEmbed({
            type: type,
            embeds: [embed],
            components: components,
            ephemeral: ephemeral
        }, interaction)
    }

    client.basicEmbed = function({
        embed: embed = client.tempEmbed(),
        title: title,
        desc: desc,
        color: color,
        image: image,
        url: url,
        author: author,
        thumbnail: thumbnail,
        footer: footer,
        fields: fields,
        timestamp: timestamp,
        type: type,
        components: components,
        ephemeral: ephemeral
    }, interaction){
        if(interaction.guild){
            let hex = client.settings.storage.data.find(x => x.guildId === interaction.guild.id)
            if(hex)
                if(hex.embed_color) 
                    embed.setColor(hex.embed_color)
        }
        if(title) embed.setTitle(title)
        if(desc) embed.setDescription(desc)
        if(color) embed.setColor(color)
        if(image) embed.setImage(image)
        if(url) embed.setURL(url)
        if(fields) embed.addFields(fields)
        if(thumbnail) embed.setThumbnail(thumbnail)
        if(footer) embed.setFooter(footer)
        if(author) embed.setAuthor(author)
        if(timestamp) embed.setTimestamp(timestamp)

        return client.sendEmbed({
            type: type,
            embeds: [embed],
            components: components,
            ephemeral: ephemeral
        }, interaction)
    }

    client.sendEmbed = async function({
        type: type,
        embeds: [embeds],
        components: components,
        ephemeral: ephemeral
    }, interaction){
        switch(type){
            case "reply":
                return await interaction.reply({
                    embeds: [embeds],
                    components: components,
                    ephemeral: ephemeral,
                    fetchReply: true
                }).catch((err) => {console.log("Reply Error:\n" + err)})
            case "editReply":
                return await interaction.editReply({
                    embeds: [embeds],
                    components: components,
                    fetchReply: true
                }).catch((err) => {console.log("EditReply Error:\n" + err)})
            case "update":
                return await interaction.update({
                    embeds: [embeds],
                    components: components,
                    fetchReply: true
                }).catch((err) => {console.log("Update Error:\n" + err)})
            case "followUp":
                return await interaction.followUp({
                    embeds: [embeds],
                    components: components,
                    ephemeral: ephemeral,
                    fetchReply: true
                }).catch((err) => {console.log("followUp Error:\n" + err)})
            default:
                return await interaction.send({
                    embeds: [embeds],
                    components: components,
                    fetchReply: true
                }).catch((err) => {console.log("Send Error:\n" + err)})
        }
    }
}
