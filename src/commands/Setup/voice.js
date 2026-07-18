const { SlashCommandBuilder } = require("@discordjs/builders")

module.exports = {
    data: new SlashCommandBuilder()
        .setName("voice")
        .setDescription("Manage your temporary voice channel privacy")
        .addSubcommand(sub => sub
            .setName("lock")
            .setDescription("Lock your channel so other members cannot join (Make private)")
        )
        .addSubcommand(sub => sub
            .setName("unlock")
            .setDescription("Unlock your channel so anyone can join (Make public)")
        ),

    async execute(client, interaction) {
        const subcommand = interaction.options.getSubcommand()
        const ls = client.getLanguage(interaction.guild?.id)
        const { getOrCreateSettings } = require(`${process.cwd()}/src/handlers/functions`)

        const settings = await getOrCreateSettings(client, interaction.guild.id)
        const voiceChannel = interaction.member.voice.channel

        // 1. Check if the user is in a voice channel
        if (!voiceChannel) {
            return client.errEmbed({
                type: "reply",
                ephemeral: true,
                title: ls["cmds"]["voice"]["title"],
                desc: ls["cmds"]["voice"]["not_in_voice"]
            }, interaction)
        }

        // 2. Check if it's a tracked temporary voice channel and find owner
        const tempChan = settings.temp_voice_channels?.find(c => {
            const chId = typeof c === "string" ? c : c.channelId
            return chId === voiceChannel.id
        })

        if (!tempChan) {
            return client.errEmbed({
                type: "reply",
                ephemeral: true,
                title: ls["cmds"]["voice"]["title"],
                desc: ls["cmds"]["voice"]["not_in_voice"]
            }, interaction)
        }

        // 3. Check owner ID from DB tracking (handling fallback to old string list format if any)
        const ownerId = typeof tempChan === "string" ? null : tempChan.ownerId
        if (ownerId && ownerId !== interaction.user.id) {
            return client.errEmbed({
                type: "reply",
                ephemeral: true,
                title: ls["cmds"]["voice"]["title"],
                desc: ls["cmds"]["voice"]["not_owner"]
            }, interaction)
        }

        // Execute lock / unlock subcommands
        if (subcommand === "lock") {
            // Deny Connect permission for @everyone role in this channel
            await voiceChannel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                Connect: false
            })

            client.Embed([{
                title: ls["cmds"]["voice"]["title"],
                desc: ls["cmds"]["voice"]["locked"],
                timestamp: interaction.createdTimestamp
            }], undefined, "reply", false, interaction)

        } else if (subcommand === "unlock") {
            // Reset Connect permission for @everyone role in this channel
            await voiceChannel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                Connect: null
            })

            client.Embed([{
                title: ls["cmds"]["voice"]["title"],
                desc: ls["cmds"]["voice"]["unlocked"],
                timestamp: interaction.createdTimestamp
            }], undefined, "reply", false, interaction)
        }
    }
}
