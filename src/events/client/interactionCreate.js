const { Collection } = require("discord.js")
const { handlemsg } = require("../../utils/stringUtils")

const developers = process.env.developers
    ? process.env.developers.split(",").map(id => id.trim())
    : ["399301340326789120", "619915409885364245"]

module.exports = {
    name: "interactionCreate",
    async execute(interaction, client) {
        client.lastInteraction = interaction
        setTimeout(() => {
            if (client.lastInteraction === interaction) {
                client.lastInteraction = null
            }
        }, 15000)

        const settings = interaction.guild
            ? (client.settings?.get(interaction.guild.id) || client.db?.getSettings(interaction.guild.id))
            : null
        const ls = client.getLanguage(interaction.guild?.id)

        if (interaction.isCommand()) {
            const command = client.commands.get(interaction.commandName)

            if (!command) return
            if (!interaction.guild && command.guildOnly) return client.errEmbed({ type: "reply", ephemeral: true, desc: ls["events"]["interactionCreate"]["err_server_only"] }, interaction)
            if (command.devOnly && !developers.includes(interaction.user.id)) return client.errEmbed({ type: "reply", ephemeral: true, desc: ls["events"]["interactionCreate"]["err_dev_only"] }, interaction)
            if (command.nsfw && interaction.guild && !interaction.channel?.nsfw) return client.errEmbed({ type: "reply", ephemeral: true, desc: ls["events"]["interactionCreate"]["err_nsfw_only"] }, interaction)

            if (settings?.disabled_modules?.includes(command.Folder)) {
                return client.errEmbed({ type: "reply", ephemeral: true, desc: ls["events"]["interactionCreate"]["err_disabled"] }, interaction)
            }

            let cooldownAmount = 0
            if (command.cooldown) {
                cooldownAmount = typeof command.cooldown === "object" ? (command.cooldown.time || 0) : (command.cooldown * 1000)
            }

            if (cooldownAmount > 0) {
                if (!client.cooldowns.has(command.data.name)) {
                    client.cooldowns.set(command.data.name, new Collection())
                }

                const now = Date.now()
                const timestamps = client.cooldowns.get(command.data.name)
                if (timestamps.has(interaction.user.id)) {
                    const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount
                    if (now < expirationTime) {
                        const expiryTimestamp = Math.floor(expirationTime / 1000)
                        return client.errEmbed({
                            type: "reply",
                            ephemeral: true,
                            title: ls["events"]["interactionCreate"]["cooldown_title"],
                            desc: handlemsg(ls["events"]["interactionCreate"]["cooldown_desc"], { time: `<t:${expiryTimestamp}:R>` })
                        }, interaction)
                    }
                }

                timestamps.set(interaction.user.id, now)
            }

            try {
                await command.execute(client, interaction)
            } catch (err) {
                if (cooldownAmount > 0) {
                    const timestamps = client.cooldowns.get(command.data.name)
                    if (timestamps) timestamps.delete(interaction.user.id)
                }

                await client.handleExecutionError?.(err, interaction)
            }
        }

        if (interaction.isButton()) {
            let button = client.buttons.get(interaction.customId)
            if (!button) {
                for (const [key, btn] of client.buttons.entries()) {
                    if (interaction.customId.startsWith(key)) {
                        button = btn
                        break
                    }
                }
            }

            if (button) {
                try {
                    await button.execute(client, interaction, ls, handlemsg)
                } catch (err) {
                    await client.handleExecutionError?.(err, interaction)
                }
            }
        }

        if (interaction.isModalSubmit()) {
            let modal = client.modals.get(interaction.customId)
            if (!modal) {
                for (const [key, mdl] of client.modals.entries()) {
                    if (interaction.customId.startsWith(key)) {
                        modal = mdl
                        break
                    }
                }
            }

            if (modal) {
                try {
                    await modal.execute(client, interaction, ls, handlemsg)
                } catch (err) {
                    await client.handleExecutionError?.(err, interaction)
                }
            }
        }
    }
}
