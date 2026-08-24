const { SlashCommandBuilder } = require("@discordjs/builders");
const { PermissionsBitField, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const RestoreManager = require(`${process.cwd()}/src/utils/RestoreManager`);

const db = require(`${process.cwd()}/src/utils/Database`);

async function checkAndAnnounceFreeGames(client) {
    if (client.shard && client.shard.ids[0] !== 0) return;

    try {
        console.log("[Free Games Tracker] Checking for new free games...");

        const response = await fetch("https://www.gamerpower.com/api/filter?platform=steam.epic-games-store&type=game", { signal: AbortSignal.timeout(10000) });

        if (!response.ok) {
            console.error(`[Free Games Tracker] API request failed with status: ${response.status}`);
            return;
        }

        const games = await response.json();
        if (!Array.isArray(games)) {
            console.warn("[Free Games Tracker] Received invalid data format from GamerPower API.");
            return;
        }

        const database = client.db || db;
        const activeIds = games.map(g => Number(g.id)).filter(id => !isNaN(id));

        if (activeIds.length > 0 && typeof database.syncActiveFreeGames === "function") {
            database.syncActiveFreeGames(activeIds);
        }

        const announcedIds = database.getAnnouncedGames();

        const newGames = games.filter(g => !announcedIds.includes(Number(g.id)));
        if (newGames.length === 0) {
            console.log("[Free Games Tracker] No new free games found.");
            return;
        }

        console.log(`[Free Games Tracker] Found ${newGames.length} new free games!`);

        const allSettings = database.getAllSettings();

        for (const game of newGames) {
            const gameData = {
                title: game.title,
                url: game.open_giveaway_url || game.gamerpower_url,
                worth: game.worth,
                description: game.description,
                platforms: game.platforms,
                end_date: game.end_date,
                instructions: game.instructions,
                image: game.image || game.thumbnail
            };

            const announceFunc = async (c, { gameData }) => {
                const database = c.db || require(`${process.cwd()}/src/utils/Database`);
                const allSettings = database.getAllSettings();
                const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

                const button = new ButtonBuilder()
                    .setStyle(ButtonStyle.Link)
                    .setLabel("Claim Game")
                    .setURL(gameData.url);
                const row = new ActionRowBuilder().addComponents(button);

                for (const guildData of allSettings) {
                    if (guildData.freegames_channel) {
                        try {
                            const guild = c.guilds.cache.get(guildData.guildId);
                            if (!guild) continue;

                            const channel = guild.channels.cache.get(guildData.freegames_channel);
                            if (!channel) continue;

                            let ls = typeof c.getLanguage === "function" ? c.getLanguage(guild.id) : null;
                            if (!ls) continue;

                            const embedData = {
                                title: gameData.title,
                                url: gameData.url,
                                desc: `**${ls["cmds"]["freegames-setup"]["embed_worth"] || "Worth"}:** ~~${gameData.worth}~~ **${ls["cmds"]["freegames-setup"]["embed_free"] || "FREE"}**\n\n${gameData.description}`,
                                fields: [
                                    { name: ls["cmds"]["freegames-setup"]["embed_platforms"] || "Platforms", value: gameData.platforms, inline: true },
                                    { name: ls["cmds"]["freegames-setup"]["embed_end_date"] || "End Date", value: gameData.end_date || "N/A", inline: true },
                                    { name: ls["cmds"]["freegames-setup"]["embed_instructions"] || "Instructions", value: gameData.instructions || "Click the claim button below." }
                                ],
                                image: gameData.image,
                                footer: { text: "Provided by GamerPower.com" },
                                color: 0x00FF00
                            };

                            if (typeof c.Embed === "function") {
                                await c.Embed([embedData], [row], "send", false, channel);
                            }
                        } catch (err) {
                            console.error(`[Free Games Tracker] Failed to send notification to guild ${guildData.guildId}:`, err);
                        }
                    }
                }
            };

            if (client.shard) {
                await client.shard.broadcastEval(announceFunc, { context: { gameData } });
            } else {
                await announceFunc(client, { gameData });
            }

            (client.db || db).addAnnouncedGame(game.id);
        }
    } catch (err) {
        console.error("[Free Games Tracker] Error checking free games:", err);
    }
}

RestoreManager.register("Free Games Tracker", async (client) => {
    checkAndAnnounceFreeGames(client);

    setInterval(() => {
        checkAndAnnounceFreeGames(client);
    }, 60 * 60 * 1000);
});

module.exports = {
    data: new SlashCommandBuilder()
        .setName("freegames-setup")
        .setDescription("Configure the automatic Steam & Epic Games free games tracker")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .addSubcommand(subcmd => subcmd
            .setName("set")
            .setDescription("Set the channel where free games announcements will be sent")
            .addChannelOption(opt => opt
                .setName("channel")
                .setDescription("The text channel to send announcements to")
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)
            )
        )
        .addSubcommand(subcmd => subcmd
            .setName("disable")
            .setDescription("Disable the free games tracker announcements")
        ),
    async execute(client, interaction) {
        const subcommand = interaction.options.getSubcommand();

        let ls = client.getLanguage(interaction.guild?.id);
        const { handlemsg, getOrCreateSettings } = require(`${process.cwd()}/src/utils/functions`);

        const settings = await getOrCreateSettings(client, interaction.guild.id);

        if (subcommand === "set") {
            const channel = interaction.options.getChannel("channel");

            const botMember = interaction.guild.members.me;
            const perms = channel.permissionsFor(botMember);
            if (!perms.has(PermissionsBitField.Flags.SendMessages) || !perms.has(PermissionsBitField.Flags.EmbedLinks)) {
                return client.errEmbed({
                    type: "reply",
                    ephemeral: true,
                    title: ls["cmds"]["freegames-setup"]["title"],
                    desc: handlemsg(ls["cmds"]["freegames-setup"]["err_perms"], { channel: channel.id })
                }, interaction);
            }

            settings.freegames_channel = channel.id;

            client.Embed([{
                title: ls["cmds"]["freegames-setup"]["title"],
                desc: handlemsg(ls["cmds"]["freegames-setup"]["set_success"], { channel: channel.id }),
                timestamp: interaction.createdTimestamp
            }], undefined, "reply", true, interaction);

        } else if (subcommand === "disable") {
            settings.freegames_channel = null;

            client.Embed([{
                title: ls["cmds"]["freegames-setup"]["title"],
                desc: ls["cmds"]["freegames-setup"]["disabled"],
                timestamp: interaction.createdTimestamp
            }], undefined, "reply", true, interaction);
        }
    }
};
