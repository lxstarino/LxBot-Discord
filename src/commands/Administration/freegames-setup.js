const { SlashCommandBuilder } = require("@discordjs/builders");
const { PermissionsBitField, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const RestoreManager = require(`${process.cwd()}/src/utils/RestoreManager`);
const StorageManager = require(`${process.cwd()}/src/utils/StorageManager`);

const freeGamesStorage = new StorageManager("./src/storages/free-games.json");

async function checkAndAnnounceFreeGames(client) {
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

        if (!Array.isArray(freeGamesStorage.storage.data)) {
            freeGamesStorage.storage.data = [];
        }

        const announcedIds = freeGamesStorage.storage.data;

        const newGames = games.filter(g => !announcedIds.includes(g.id));
        if (newGames.length === 0) {
            console.log("[Free Games Tracker] No new free games found.");
            return;
        }

        console.log(`[Free Games Tracker] Found ${newGames.length} new free games!`);

        for (const game of newGames) {
            const button = new ButtonBuilder()
                .setStyle(ButtonStyle.Link)
                .setLabel("Claim Game")
                .setURL(game.open_giveaway_url || game.gamerpower_url);

            const row = new ActionRowBuilder().addComponents(button);

            for (const guildData of client.settings.storage.data) {
                if (guildData.freegames_channel) {
                    try {
                        const guild = client.guilds.cache.get(guildData.guildId);
                        if (!guild) continue;

                        const channel = guild.channels.cache.get(guildData.freegames_channel);
                        if (!channel) continue;

                        let ls = client.getLanguage(guild.id);

                        const embedData = {
                            title: game.title,
                            url: game.open_giveaway_url || game.gamerpower_url,
                            desc: `**${ls["cmds"]["freegames-setup"]["embed_worth"] || "Worth"}:** ~~${game.worth}~~ **${ls["cmds"]["freegames-setup"]["embed_free"] || "FREE"}**\n\n${game.description}`,
                            fields: [
                                { name: ls["cmds"]["freegames-setup"]["embed_platforms"] || "Platforms", value: game.platforms, inline: true },
                                { name: ls["cmds"]["freegames-setup"]["embed_end_date"] || "End Date", value: game.end_date || "N/A", inline: true },
                                { name: ls["cmds"]["freegames-setup"]["embed_instructions"] || "Instructions", value: game.instructions || "Click the claim button below." }
                            ],
                            image: game.image || game.thumbnail,
                            footer: { text: "Provided by GamerPower.com" },
                            color: 0x00FF00
                        };

                        await client.Embed([embedData], [row], "send", false, channel);
                    } catch (err) {
                        console.error(`[Free Games Tracker] Failed to send notification to guild ${guildData.guildId}:`, err);
                    }
                }
            }

            announcedIds.push(game.id);
        }

        await freeGamesStorage.saveData();
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
        const { handlemsg, getOrCreateSettings } = require(`${process.cwd()}/src/handlers/functions`);

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
            await client.settings.saveData();

            client.Embed([{
                title: ls["cmds"]["freegames-setup"]["title"],
                desc: handlemsg(ls["cmds"]["freegames-setup"]["set_success"], { channel: channel.id }),
                timestamp: interaction.createdTimestamp
            }], undefined, "reply", false, interaction);

        } else if (subcommand === "disable") {
            settings.freegames_channel = null;
            await client.settings.saveData();

            client.Embed([{
                title: ls["cmds"]["freegames-setup"]["title"],
                desc: ls["cmds"]["freegames-setup"]["disabled"],
                timestamp: interaction.createdTimestamp
            }], undefined, "reply", false, interaction);
        }
    }
};
