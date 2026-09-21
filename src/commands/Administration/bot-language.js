const { PermissionsBitField, ActionRowBuilder, StringSelectMenuBuilder, SlashCommandBuilder } = require("discord.js")
const { handlemsg } = require("../../utils/stringUtils")
const { getOrCreateSettings } = require("../../repositories/SettingsRepository")

const LANGUAGES = {
    de: { name: "Deutsch", flag: "🇩🇪" },
    en: { name: "English", flag: "🇬🇧" }
}

module.exports = {
    guildOnly: true,
    data: new SlashCommandBuilder()
        .setName("bot-language")
        .setDescription("Configure the bot language for this server")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),

    async execute(client, interaction) {
        const settings = await getOrCreateSettings(client, interaction.guild.id)

        function buildView(currentLang) {
            const ls = client.getLanguage(interaction.guild?.id)
            const tLs = ls["cmds"]?.["bot-language"] || {}
            const curInfo = LANGUAGES[currentLang] || LANGUAGES.en

            const embed = client.tempEmbed()
                .setTitle(tLs["title"] || "🌐 Language Settings")
                .setDescription(handlemsg(tLs["desc"] || "Manage the language for **{guild}**.\n\n> **Current Language:** {current_flag} **{current_name}**\n\nSelect a new language from the dropdown menu below:", {
                    guild: interaction.guild?.name || "Server",
                    current_flag: curInfo.flag,
                    current_name: curInfo.name
                }))

            if (interaction.guild?.iconURL()) {
                embed.setThumbnail(interaction.guild.iconURL({ dynamic: true }))
            }

            const menu = new StringSelectMenuBuilder()
                .setCustomId("bot-language-select")
                .setPlaceholder(tLs["placeholder"] || "Select a language...")
                .addOptions(
                    {
                        label: tLs["lang_de"] || "Deutsch",
                        value: "de",
                        description: tLs["lang_de_desc"] || "Setze die Bot-Sprache auf Deutsch",
                        emoji: "🇩🇪",
                        default: currentLang === "de"
                    },
                    {
                        label: tLs["lang_en"] || "English",
                        value: "en",
                        description: tLs["lang_en_desc"] || "Set the bot language to English",
                        emoji: "🇬🇧",
                        default: currentLang === "en"
                    }
                )

            const row = new ActionRowBuilder().addComponents(menu)
            return { embed, components: [row] }
        }

        const initialView = buildView(settings.language || "en")
        const msg = await client.Embed([initialView.embed], initialView.components, "reply", true, interaction)

        if (!msg) return

        const collector = msg.createMessageComponentCollector({
            filter: i => i.user.id === interaction.user.id,
            time: 120000
        })

        collector.on("collect", async (i) => {
            const selectedLang = i.values[0]
            settings.language = selectedLang

            const updatedView = buildView(selectedLang)
            const updatedLs = client.getLanguage(interaction.guild?.id)
            const updatedTLs = updatedLs["cmds"]?.["bot-language"] || {}
            const selInfo = LANGUAGES[selectedLang] || LANGUAGES.en

            await i.update({
                embeds: [updatedView.embed],
                components: updatedView.components
            }).catch((err) => console.error("[bot-language] Failed to update language selection:", err.message))

            client.successEmbed({
                type: "reply",
                ephemeral: true,
                desc: handlemsg(updatedTLs["success"] || "Server language has been updated to {flag} **{language}**!", {
                    flag: selInfo.flag,
                    language: selInfo.name
                })
            }, i).catch((err) => console.error("[bot-language] Failed to send success embed:", err.message))
        })

        collector.on("end", async () => {
            const disabledMenu = new StringSelectMenuBuilder()
                .setCustomId("bot-language-select-disabled")
                .setPlaceholder("Selection expired")
                .setDisabled(true)
                .addOptions({ label: "Expired", value: "expired" })

            await interaction.editReply({
                components: [new ActionRowBuilder().addComponents(disabledMenu)]
            }).catch((err) => console.error("[bot-language] Failed to edit reply on collector end:", err.message))
        })
    }
}
