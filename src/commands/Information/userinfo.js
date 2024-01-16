const { SlashCommandBuilder } = require("@discordjs/builders")

module.exports = {
    data: new SlashCommandBuilder()
    .setName("userinfo")
    .setDescription("Displays Information about a User")
    .addUserOption((option) => option
        .setName("target")
        .setDescription("target")
    ),
    async execute(client, interaction){
        const target = interaction.options.get("target") || interaction

        const settings = client.settings.storage.data.find(x => x.guildId === interaction.guild.id)
        let ls = settings ? settings.language ? require(`${process.cwd()}/src/languages/${settings.language}.json`) : require(`${process.cwd()}/src/languages/en.json`) : require(`${process.cwd()}/src/languages/en.json`)
        const { handlemsg } = require(`${process.cwd()}/src/handlers/functions`)

        const Badges = {
            "HypeSquadOnlineHouse1": `${client.emojis.cache.find(emoji => emoji.id === "1194675493362995220")}`,
            "HypeSquadOnlineHouse2": `${client.emojis.cache.find(emoji => emoji.id === "1194675488120115261")}`,
            "HypeSquadOnlineHouse3": `${client.emojis.cache.find(emoji => emoji.id === "1194675491135819917")}`,
        }

        const flags = target.user.flags.toArray()

        if(target.member){
            const member_roles = target.member._roles

            client.basicEmbed({
                type: "reply",
                thumbnail: `${target.user.displayAvatarURL()}`,
                fields: [
                    {name: `${target.user.tag} ${Badges[flags[0]] || ""}`, value: `<@!${target.user.id}>`, inline: false},
                    {name: `${ls["cmds"]["userinfo"]["joinedon"]}`, value: `🗓️ <t:${Math.round(target.member.joinedTimestamp / 1000)}:D>`, inline: true},
                    {name: `${ls["cmds"]["userinfo"]["registeredon"]}`, value: `🗓️ <t:${Math.round(target.user.createdTimestamp / 1000)}:D>`, inline: true},
                    {name: `\u200b`, value: `\u200b`, inline: true},
                    {name: `${handlemsg(ls["cmds"]["userinfo"]["roles"], {size: member_roles.length})}`, value: `${member_roles.length > 0 ? "<@&" +  member_roles.join("> <@&") + ">" : "This user dont have any roles"}`, inline: false},
                    {name: `${ls["cmds"]["userinfo"]["avatar"]}`, value: `[Link](${target.user.displayAvatarURL({size: 1024})})`, inline: true},
                    {name: `MFA`, value: `${target.user.mfaEnabled ? "Enabled" : "Disabled"}`, inline: true}, 
                    {name: `Bot`, value: `${target.user.bot ? "Yes" : "No"}`, inline: true},
                ],
                timestamp: interaction.createdTimestamp,
                footer: {text: `ID: ${target.user.id}`}
            }, interaction)
        } else {
            client.basicEmbed({
                type: "reply",
                thumbnail: `${target.user.displayAvatarURL()}`,
                fields: [
                    {name: `${target.user.tag} ${Badges[flags[0]]}`, value: `<@!${target.user.id}>`, inline: false},
                    {name: `${ls["cmds"]["userinfo"]["registeredon"]}`, value: `🗓️ <t:${Math.round(target.user.createdTimestamp / 1000)}>`, inline: false},
                    {name: `${ls["cmds"]["userinfo"]["avatar"]}`, value: `[Link](${target.user.displayAvatarURL({size: 1024})})`, inline: true},
                    {name: `MFA`, value: `${target.user.mfaEnabled ? "Enabled" : "Disabled"}`, inline: true}, 
                    {name: `Bot`, value: `${target.user.bot ? "Yes" : "No"}`, inline: true},
                ],
                timestamp: interaction.createdTimestamp,
                footer: {text: `ID: ${target.user.id}`}
            }, interaction)
        }

    }
}
