const { SlashCommandBuilder } = require("@discordjs/builders")
const valorant = require("../../api/valorant")
const vl = new valorant()

module.exports = {
    cooldown: {
        time: 45000,
        users: []
    },
    data: new SlashCommandBuilder()
    .setName("vl-stats")
    .setDescription("Sends stats of a valorant user")
    .addStringOption((option) => option
        .setName("username")
        .setDescription("Players username")
        .setMaxLength(16)
        .setMinLength(3)
        .setRequired(true)
    ).addStringOption((option) => option
        .setName("tagline")
        .setDescription("Players tagline")
        .setMaxLength(5)
        .setMinLength(3)
        .setRequired(true)
    ),
    async execute(client, interaction){
        if(!this.cooldown.users.includes(interaction.user.id)){
            this.cooldown.users.push(interaction.user.id)
            setTimeout(() => {
                const index = this.cooldown.users.indexOf(interaction.user.id)
                this.cooldown.users.splice(index, 1)
            }, this.cooldown.time)
        }

        const username = interaction.options.getString("username")
        const tagline = interaction.options.getString("tagline")

        await interaction.deferReply()

        const account = await vl.getAccount({name: username, tagline: tagline})
        const mmr = await vl.getMMR({name: username, tagline: tagline})

        if(account.errors || mmr.errors) throw({title: "Valorant Stats", desc: `Acc: ${account.errors ? account.errors[0].message : ""}\n> MMR: ${mmr.errors ? mmr.errors[0].message : ""}`})

        var TotalWins = 0
        var TotalMatches = 0
        Object.entries(mmr.data.by_season).map(([key, val]) => {
            if(val.wins != undefined){
                TotalWins += val.wins
            }
            if(val.number_of_games != undefined){
                TotalMatches += val.number_of_games
            }
        })

        client.basicEmbed({
            type: "editReply",
            author: {name: `Stats requested by ${interaction.user.tag}`, iconURL: `${interaction.user.displayAvatarURL()}`},
            thumbnail: mmr.data.current_data.images.small, 
            image: account.data.card.wide,
            title: `${account.data.name}#${account.data.tag}`,
            desc: account.data.puuid,
            fields: [
                {name: "Last RR", value: `${mmr.data.current_data.mmr_change_to_last_game}`, inline: true},
                {name: "Elo", value: `${mmr.data.current_data.elo}`, inline: true},
                {name: "\u200b", value: "\u200b", inline: true},
                {name: "Matches", value: `${TotalMatches}`, inline: true},
                {name: "Wins", value: `${TotalWins}`, inline: true},
                {name: "Winrate", value: `${Math.floor(Math.round(TotalWins / TotalMatches * 100))}%`, inline: true},
                {name: "Peek Rank", value: `${mmr.data.highest_rank.patched_tier}\n in ${mmr.data.highest_rank.season.slice(0, 2).toUpperCase() + ":" + mmr.data.highest_rank.season.slice(2, 4).toUpperCase()}`, inline: true},
                {name: "Current Rank", value: `${mmr.data.current_data.currenttierpatched}`, inline: true},
                {name: "Account Level", value: `${account.data.account_level}`, inline: true},
            ]
        }, interaction)
    }
}
