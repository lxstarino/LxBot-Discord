const { SlashCommandBuilder } = require("@discordjs/builders")
const { PermissionsBitField, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js")
const RestoreManager = require(`${process.cwd()}/src/utils/RestoreManager`)

const POLL_EMOJIS = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣"]
const POLL_BUTTON_STYLES = [ButtonStyle.Primary, ButtonStyle.Success, ButtonStyle.Danger, ButtonStyle.Secondary, ButtonStyle.Primary]

// ─── Shared helpers (used both on creation and on restore) ───────────────────

function buildComponents(options, disabled = false) {
    const rows = []
    for (let i = 0; i < options.length; i += 3) {
        const row = new ActionRowBuilder()
        options.slice(i, i + 3).forEach((opt, ci) => {
            const idx = i + ci
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId(`poll_vote_${idx}`)
                    .setLabel(`${POLL_EMOJIS[idx]} ${opt}`)
                    .setStyle(POLL_BUTTON_STYLES[idx])
                    .setDisabled(disabled)
            )
        })
        rows.push(row)
    }
    return rows
}

function getColor(client, guildId) {
    const hex = client.settings.storage.data.find(x => x.guildId === guildId)?.embed_color?.replace("#", "") || "5865F2"
    return parseInt(hex, 16)
}

function buildResultsText(options, voterMap, handlemsg, ls) {
    const totalVotes = Object.keys(voterMap).length
    return options.map((opt, i) => {
        const count = Object.values(voterMap).filter(v => v === i).length
        const percent = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0
        const bar = "█".repeat(Math.round(percent / 10)) + "░".repeat(10 - Math.round(percent / 10))
        return handlemsg(ls["cmds"]["poll"]["result_line"], {
            emoji: POLL_EMOJIS[i], option: opt, count: String(count), percent: String(percent)
        }) + `\n\`${bar}\``
    }).join("\n\n")
}

function buildEmbed(title, question, options, voterMap, endsAt, creatorTag, creatorAvatar, client, guildId, handlemsg, ls) {
    const ts = Math.floor(endsAt / 1000)
    return {
        title,
        description: `${handlemsg(ls["cmds"]["poll"]["desc"], { question })}\n\n${buildResultsText(options, voterMap, handlemsg, ls)}\n\n⏰ Ends <t:${ts}:R>`,
        color: getColor(client, guildId),
        footer: { text: handlemsg(ls["cmds"]["poll"]["createdby"], { user: creatorTag }), icon_url: creatorAvatar },
        timestamp: new Date().toISOString()
    }
}

function attachCollector(client, pollMsg, pollData, handlemsg) {
    const { pollId, question, options, endsAt, creatorTag, creatorAvatar, guildId } = pollData
    const remaining = endsAt - Date.now()

    if (remaining <= 0) {
        finalisePoll(client, pollMsg, pollData, handlemsg)
        return
    }

    const ls = client.getLanguage(guildId)
    const collector = pollMsg.createMessageComponentCollector({ time: remaining })

    collector.on("collect", async (i) => {
        if (!i.customId.startsWith("poll_vote_")) return
        const optionIdx = parseInt(i.customId.replace("poll_vote_", ""))

        // Update voterMap in memory and persist
        pollData.voterMap[i.user.id] = optionIdx
        const record = client.polls.storage.data.find(p => p.pollId === pollId)
        if (record) {
            record.voterMap = pollData.voterMap
            await client.polls.saveData()
        }

        await i.update({
            embeds: [buildEmbed(ls["cmds"]["poll"]["title"], question, options, pollData.voterMap, endsAt, creatorTag, creatorAvatar, client, guildId, handlemsg, ls)],
            components: buildComponents(options, false)
        }).catch(() => { })
    })

    collector.on("end", () => finalisePoll(client, pollMsg, pollData, handlemsg))
}

async function finalisePoll(client, pollMsg, pollData, handlemsg) {
    const { pollId, question, options, voterMap, creatorTag, creatorAvatar, guildId } = pollData
    const ls = client.getLanguage(guildId)
    const totalVotes = Object.keys(voterMap).length
    const finalResults = buildResultsText(options, voterMap, handlemsg, ls)

    await pollMsg.edit({
        embeds: [{
            title: ls["cmds"]["poll"]["results_title"],
            description: handlemsg(ls["cmds"]["poll"]["results_desc"], { question, results: finalResults })
                + `\n\n📊 **Total votes: ${totalVotes}**`,
            color: getColor(client, guildId),
            footer: { text: handlemsg(ls["cmds"]["poll"]["createdby"], { user: creatorTag }), icon_url: creatorAvatar },
            timestamp: new Date().toISOString()
        }],
        components: buildComponents(options, true)
    }).catch(() => { })

    // Remove from storage
    const idx = client.polls.storage.data.findIndex(p => p.pollId === pollId)
    if (idx !== -1) {
        client.polls.storage.data.splice(idx, 1)
        await client.polls.saveData()
    }
}

// ─── Restore handler — registered once, called by RestoreManager on ready ────

RestoreManager.register("Polls", async (client) => {
    const { handlemsg } = require(`${process.cwd()}/src/handlers/functions`)
    const activePolls = [...(client.polls?.storage?.data || [])]
    if (activePolls.length === 0) return

    for (const pollData of activePolls) {
        try {
            const guild = client.guilds.cache.get(pollData.guildId)
            if (!guild) continue
            const channel = guild.channels.cache.get(pollData.channelId)
            if (!channel) continue
            const message = await channel.messages.fetch(pollData.messageId).catch(() => null)
            if (!message) continue
            attachCollector(client, message, pollData, handlemsg)
        } catch (err) {
            console.error(`  > [Poll Restore] Failed for poll ${pollData.pollId}: ${err.message}`)
        }
    }
})

// ─── Command definition ───────────────────────────────────────────────────────

module.exports = {
    data: new SlashCommandBuilder()
        .setName("poll")
        .setDescription("Create an interactive poll with up to 5 options")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .addStringOption((option) => option
            .setName("question")
            .setDescription("The poll question")
            .setRequired(true)
            .setMaxLength(256)
        )
        .addStringOption((option) => option
            .setName("option1")
            .setDescription("First option")
            .setRequired(true)
            .setMaxLength(80)
        )
        .addStringOption((option) => option
            .setName("option2")
            .setDescription("Second option")
            .setRequired(true)
            .setMaxLength(80)
        )
        .addStringOption((option) => option
            .setName("option3")
            .setDescription("Third option (optional)")
            .setRequired(false)
            .setMaxLength(80)
        )
        .addStringOption((option) => option
            .setName("option4")
            .setDescription("Fourth option (optional)")
            .setRequired(false)
            .setMaxLength(80)
        )
        .addStringOption((option) => option
            .setName("option5")
            .setDescription("Fifth option (optional)")
            .setRequired(false)
            .setMaxLength(80)
        )
        .addChannelOption((option) => option
            .setName("channel")
            .setDescription("Channel to send the poll to (default: current channel)")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(false)
        )
        .addIntegerOption((option) => option
            .setName("duration")
            .setDescription("Poll duration in minutes (default: 60, max: 10080 / 1 week)")
            .setMinValue(1)
            .setMaxValue(10080)
            .setRequired(false)
        ),

    async execute(client, interaction) {
        const question = interaction.options.getString("question")
        const targetChannel = interaction.options.getChannel("channel") || interaction.channel
        const durationMs = (interaction.options.getInteger("duration") || 60) * 60 * 1000

        const ls = client.getLanguage(interaction.guild?.id)
        const { handlemsg } = require(`${process.cwd()}/src/handlers/functions`)

        const options = ["option1", "option2", "option3", "option4", "option5"]
            .map(name => interaction.options.getString(name))
            .filter(Boolean)

        // Permission check
        const perms = targetChannel.permissionsFor(interaction.guild.members.me)
        if (!perms.has(PermissionsBitField.Flags.SendMessages) || !perms.has(PermissionsBitField.Flags.EmbedLinks)) {
            return client.errEmbed({
                type: "reply", ephemeral: true,
                title: ls["cmds"]["poll"]["title"],
                desc: handlemsg(ls["cmds"]["poll"]["missing_perms"], { channel: targetChannel.id })
            }, interaction)
        }

        const endsAt = Date.now() + durationMs
        const pollData = {
            pollId: null, // filled after send
            guildId: interaction.guild.id,
            channelId: targetChannel.id,
            messageId: null, // filled after send
            question, options, endsAt,
            creatorTag: interaction.user.tag,
            creatorAvatar: interaction.user.displayAvatarURL(),
            voterMap: {}
        }

        const pollMsg = await targetChannel.send({
            embeds: [buildEmbed(ls["cmds"]["poll"]["title"], question, options, {}, endsAt, pollData.creatorTag, pollData.creatorAvatar, client, interaction.guild.id, handlemsg, ls)],
            components: buildComponents(options, false)
        })

        // Now we have the message ID — save to storage
        pollData.pollId = pollMsg.id
        pollData.messageId = pollMsg.id
        await client.polls.createData(pollData)

        // Attach the live collector
        attachCollector(client, pollMsg, pollData, handlemsg)

        // Confirm to admin
        client.successEmbed({
            type: "reply", ephemeral: true,
            desc: handlemsg(ls["cmds"]["poll"]["pollcreated"], { channel: targetChannel.id }),
        }, interaction)
    }
}
