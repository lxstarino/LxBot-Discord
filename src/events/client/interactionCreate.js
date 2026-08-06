const { Collection } = require("discord.js")
const { handlemsg } = require(`${process.cwd()}/src/handlers/functions`)

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

        const settings = interaction.guild ? client.settings.mapCache?.get(interaction.guild.id) : null
        let ls = client.getLanguage(interaction.guild?.id)

        const handleExecutionError = async (err, interaction) => {
            console.error(err)

            let title = err.title ? err.title : (ls["errors"]["error"] || "Error")
            let desc = `> ${err.desc ? err.desc : err}`

            if (err.code === 50013 || err.message?.includes("Missing Permissions")) {
                title = ls["errors"]["mp"] || "Missing Permissions"
                desc = `> ${ls["events"]["interactionCreate"]["err_bot_missing_perms"]}`
            }

            if (interaction.deferred || interaction.replied) {
                await client.errEmbed({
                    type: "editReply",
                    ephemeral: true,
                    title: title,
                    desc: desc
                }, interaction).catch(() => { })
            } else {
                await client.errEmbed({
                    type: "reply",
                    ephemeral: true,
                    title: title,
                    desc: desc
                }, interaction).catch(() => { })
            }
        }

        if (interaction.isCommand()) {
            const command = client.commands.get(interaction.commandName)

            if (!command) return
            if (!interaction.guild) return client.errEmbed({ type: "reply", ephemeral: true, desc: ls["events"]["interactionCreate"]["err_server_only"] }, interaction)
            if (command.devOnly && !developers.includes(interaction.user.id)) return client.errEmbed({ type: "reply", ephemeral: true, desc: ls["events"]["interactionCreate"]["err_dev_only"] }, interaction)
            if (command.nsfw && !interaction.channel.nsfw) return client.errEmbed({ type: "reply", ephemeral: true, desc: ls["events"]["interactionCreate"]["err_nsfw_only"] }, interaction)

            if (settings) {
                if (settings.disabled_modules) {
                    if (settings.disabled_modules.includes(command.Folder)) {
                        return client.errEmbed({ type: "reply", ephemeral: true, desc: ls["events"]["interactionCreate"]["err_disabled"] }, interaction)
                    }
                }
            }

            let cooldownAmount = 0;
            if (command.cooldown) {
                cooldownAmount = typeof command.cooldown === "object" ? (command.cooldown.time || 0) : (command.cooldown * 1000);
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
                        const timeLeft = (expirationTime - now) / 1000
                        return client.errEmbed({
                            type: "reply",
                            ephemeral: true,
                            title: ls["events"]["interactionCreate"]["cooldown_title"],
                            desc: handlemsg(ls["events"]["interactionCreate"]["cooldown_desc"], { time: timeLeft.toFixed(1) })
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
                    if (timestamps) {
                        timestamps.delete(interaction.user.id)
                    }
                }

                await handleExecutionError(err, interaction)
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
                    await handleExecutionError(err, interaction)
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
                    await handleExecutionError(err, interaction)
                }
            }
        }
    }
}