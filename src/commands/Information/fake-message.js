const { SlashCommandBuilder } = require("@discordjs/builders")
const { AttachmentBuilder } = require("discord.js")
const { createCanvas, loadImage, GlobalFonts } = require("@napi-rs/canvas")
const fs = require("fs")
const path = require("path")

const fontsDir = path.join(process.cwd(), "src", "assets", "fonts");
const regularPath = path.join(fontsDir, "ggsans.woff2");
const boldPath = path.join(fontsDir, "ggsansbold.woff2");

let fontsRegistered = false;

async function ensureFonts() {
    if (fontsRegistered) return;

    if (!fs.existsSync(fontsDir)) {
        fs.mkdirSync(fontsDir, { recursive: true });
    }

    // Download regular font if missing
    if (!fs.existsSync(regularPath)) {
        console.log("[Fake-Message] Downloading ggsans.woff2...");
        try {
            const res = await fetch("https://github.com/damnxav/gg-sans-font/raw/main/ggsans.woff2");
            if (res.ok) {
                const arrayBuffer = await res.arrayBuffer();
                fs.writeFileSync(regularPath, Buffer.from(arrayBuffer));
            } else {
                throw new Error(`Failed to download regular font: ${res.status}`);
            }
        } catch (err) {
            console.error("[Fake-Message] Error downloading regular font:", err);
        }
    }

    // Download bold font if missing
    if (!fs.existsSync(boldPath)) {
        console.log("[Fake-Message] Downloading ggsansbold.woff2...");
        try {
            const res = await fetch("https://github.com/damnxav/gg-sans-font/raw/main/ggsansbold.woff2");
            if (res.ok) {
                const arrayBuffer = await res.arrayBuffer();
                fs.writeFileSync(boldPath, Buffer.from(arrayBuffer));
            } else {
                throw new Error(`Failed to download bold font: ${res.status}`);
            }
        } catch (err) {
            console.error("[Fake-Message] Error downloading bold font:", err);
        }
    }

    // Register with GlobalFonts
    try {
        if (fs.existsSync(regularPath)) {
            GlobalFonts.registerFromPath(regularPath, "gg sans");
        }
        if (fs.existsSync(boldPath)) {
            GlobalFonts.registerFromPath(boldPath, "gg sans");
        }
        fontsRegistered = true;
        console.log("[Fake-Message] gg sans fonts registered successfully.");
    } catch (err) {
        console.error("[Fake-Message] Error registering fonts:", err);
    }
}

function getLines(ctx, text, maxWidth) {
    const words = text.split(" ");
    const lines = [];
    let currentLine = "";

    for (let n = 0; n < words.length; n++) {
        let testLine = currentLine + words[n] + " ";
        let metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
            lines.push(currentLine.trim());
            currentLine = words[n] + " ";
        } else {
            currentLine = testLine;
        }
    }
    lines.push(currentLine.trim());
    return lines;
}

module.exports = {
    cooldown: 30,
    data: new SlashCommandBuilder()
        .setName("fake-message")
        .setDescription("Generiert ein gefälschtes Discord-Nachrichten-Bild.")
        .addUserOption((option) => option
            .setName("user")
            .setDescription("Der Benutzer, der die Nachricht geschrieben haben soll")
            .setRequired(true)
        )
        .addStringOption((option) => option
            .setName("message")
            .setDescription("Der Inhalt der gefälschten Nachricht")
            .setRequired(true)
        ),
    async execute(client, interaction) {
        // Defer response since font downloading, canvas drawing, and image fetching can take a moment
        await interaction.deferReply();

        // Ensure the Discord fonts are loaded and registered locally
        await ensureFonts();

        const targetUser = interaction.options.getUser("user");
        const message = interaction.options.getString("message");
        const targetMember = interaction.guild ? interaction.guild.members.cache.get(targetUser.id) : null;

        try {
            // Get user visual properties
            const avatarUrl = targetUser.displayAvatarURL({ extension: "png", size: 128 });
            const displayName = targetMember ? targetMember.displayName : targetUser.username;
            const nameColor = targetMember && targetMember.displayHexColor !== "#000000" ? targetMember.displayHexColor : "#f2f3f5";

            // 1. Measure text & wrap lines
            // We use a temporary canvas context to calculate layout measurements
            const tempCanvas = createCanvas(1, 1);
            const tempCtx = tempCanvas.getContext("2d");
            tempCtx.font = '15px "gg sans", sans-serif';
            const lines = getLines(tempCtx, message, 640); // 750px width - 72px left - 38px right = 640px max width

            // 2. Setup canvas dimensions based on number of wrapped lines
            const canvasHeight = Math.max(72, 52 + lines.length * 20);
            const canvas = createCanvas(750, canvasHeight);
            const ctx = canvas.getContext("2d");

            // Fill background with Discord dark mode color
            ctx.fillStyle = "#313338";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // 3. Draw circular avatar
            const avatar = await loadImage(avatarUrl);
            ctx.save();
            ctx.beginPath();
            ctx.arc(36, 36, 20, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(avatar, 16, 16, 40, 40);
            ctx.restore();

            // 4. Draw user display name
            ctx.fillStyle = nameColor;
            ctx.font = 'bold 16px "gg sans", sans-serif';
            ctx.textBaseline = "alphabetic";
            ctx.fillText(displayName, 72, 31);
            const nameWidth = ctx.measureText(displayName).width;

            // 5. Draw timestamp
            const now = new Date();
            const timeStr = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
            ctx.fillStyle = "#949ba4";
            ctx.font = '12px "gg sans", sans-serif';
            ctx.fillText(timeStr, 72 + nameWidth + 8, 30);

            // 6. Draw message content
            ctx.fillStyle = "#dbdee1";
            ctx.font = '15px "gg sans", sans-serif';
            let currentY = 52;
            for (const line of lines) {
                ctx.fillText(line, 72, currentY);
                currentY += 20;
            }

            // Export to buffer and send
            const buffer = canvas.toBuffer("image/png");
            const attachment = new AttachmentBuilder(buffer, { name: "message.png" });

            await interaction.editReply({ files: [attachment] });
        } catch (err) {
            console.error("[Fake-Message] Error generating fake message image:", err);
            // Inform the user in case of failure
            let ls = client.getLanguage(interaction.guild?.id);
            await interaction.editReply({
                content: ls["errors"]?.["error"] || "Ein Fehler ist aufgetreten beim Generieren des Bildes."
            }).catch(() => { });
        }
    }
}
