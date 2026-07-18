const { SlashCommandBuilder } = require("@discordjs/builders")
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js")

module.exports = {
    data: new SlashCommandBuilder()
        .setName("truth-or-dare")
        .setDescription("Play a game of Truth or Dare")
        .addUserOption((option) => option
            .setName("target")
            .setDescription("The user who should answer/perform this")
            .setRequired(false)
        ),
    async execute(client, interaction) {
        const target = interaction.options.getUser("target") || interaction.user

        let ls = client.getLanguage(interaction.guild?.id)
        const { handlemsg } = require(`${process.cwd()}/src/handlers/functions`)

        // Create the buttons
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("tod-truth")
                    .setLabel(ls["cmds"]["tod"]["truth"])
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId("tod-dare")
                    .setLabel(ls["cmds"]["tod"]["dare"])
                    .setStyle(ButtonStyle.Danger)
            )

        // Send initial embed
        const msg = await client.Embed([{
            title: `🎲 ${ls["cmds"]["tod"]["title"]}`,
            desc: `**<@!${target.id}>**, ${ls["cmds"]["tod"]["choose"]}`,
            timestamp: interaction.createdTimestamp,
            footer: { text: interaction.user.tag }
        }], [row], "reply", undefined, interaction)

        // Create collector
        if (!msg) return;
        const collector = msg.createMessageComponentCollector({ time: 60000 })

        collector.on("collect", async (i) => {
            if (i.user.id !== target.id) {
                return i.reply({
                    content: ls["errors"]["not_your_turn"] || "It's not your turn!",
                    ephemeral: true
                })
            }

            await i.deferUpdate()
            collector.stop("selected")

            const isTruth = i.customId === "tod-truth"
            const type = isTruth ? "truth" : "dare"
            const categoryTitle = isTruth ? ls["cmds"]["tod"]["truth"] : ls["cmds"]["tod"]["dare"]

            let questionText = ""

            try {
                // Fetch from the official truth or dare API
                const res = await fetch(`https://api.truthordarebot.xyz/v1/${type}`)
                if (!res.ok) throw new Error("API response not OK")

                const data = await res.json()

                // Check for localized translation
                const lang = ls.language || "en"
                if (data.translations && data.translations[lang]) {
                    questionText = data.translations[lang]
                } else {
                    questionText = data.question
                }
            } catch (err) {
                // Fallback to local questions if the API fails or is offline
                const list = isTruth ? ls["cmds"]["tod"]["truth_questions"] : ls["cmds"]["tod"]["dare_prompts"]
                questionText = list[Math.floor(Math.random() * list.length)]
            }

            // Disable buttons after selection
            const disabledRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId("tod-truth")
                        .setLabel(ls["cmds"]["tod"]["truth"])
                        .setStyle(ButtonStyle.Success)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId("tod-dare")
                        .setLabel(ls["cmds"]["tod"]["dare"])
                        .setStyle(ButtonStyle.Danger)
                        .setDisabled(true)
                )

            await client.Embed([{
                title: `🎲 ${ls["cmds"]["tod"]["title"]} (${categoryTitle})`,
                desc: `**<@!${target.id}>**:\n\n${questionText}`,
                timestamp: interaction.createdTimestamp,
                footer: { text: interaction.user.tag }
            }], [disabledRow], "editReply", undefined, i)
        })

        collector.on("end", async (collected, reason) => {
            if (reason === "time") {
                // Disable components if they timed out
                const disabledRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId("tod-truth")
                            .setLabel(ls["cmds"]["tod"]["truth"])
                            .setStyle(ButtonStyle.Success)
                            .setDisabled(true),
                        new ButtonBuilder()
                            .setCustomId("tod-dare")
                            .setLabel(ls["cmds"]["tod"]["dare"])
                            .setStyle(ButtonStyle.Danger)
                            .setDisabled(true)
                    )
                
                try {
                    await interaction.editReply({
                        components: [disabledRow]
                    })
                } catch (err) {
                    // Ignore if message was deleted
                }
            }
        })
    }
}
