
const { AttachmentBuilder, SlashCommandBuilder } = require("discord.js")
const { createCanvas, loadImage, GlobalFonts } = require("@napi-rs/canvas")
const fs = require("fs")
const path = require("path")

const fontsDir = path.join(__dirname, "..", "..", "assets", "fonts");
const regularPath = path.join(fontsDir, "ggsans.woff2");
const boldPath = path.join(fontsDir, "ggsansbold.woff2");

let fontsRegistered = false;

function ensureFonts() {
    if (fontsRegistered) return;

    try {
        if (fs.existsSync(regularPath)) {
            GlobalFonts.registerFromPath(regularPath, "gg sans");
        }
        if (fs.existsSync(boldPath)) {
            GlobalFonts.registerFromPath(boldPath, "gg sans");
        }
        fontsRegistered = true;
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
    guildOnly: false,
    cooldown: 15,
    data: new SlashCommandBuilder()
        .setName("fake-message")
        .setDescription("Generate a fake Discord message image")
        .addUserOption((option) => option
            .setName("user")
            .setDescription("The user who supposedly sent the message")
            .setRequired(true)
        )
        .addStringOption((option) => option
            .setName("message")
            .setDescription("The content of the fake message")
            .setRequired(true)
        ),
    async execute(client, interaction) {
        await interaction.deferReply();
        ensureFonts();

        const targetUser = interaction.options.getUser("user");
        const message = interaction.options.getString("message");
        const targetMember = interaction.guild ? interaction.guild.members.cache.get(targetUser.id) : null;

        try {
            const avatarUrl = targetUser.displayAvatarURL({ extension: "png", size: 128 });
            const displayName = targetMember ? targetMember.displayName : targetUser.username;
            const nameColor = targetMember && targetMember.displayHexColor !== "#000000" ? targetMember.displayHexColor : "#f2f3f5";

            const tempCanvas = createCanvas(1, 1);
            const tempCtx = tempCanvas.getContext("2d");
            tempCtx.font = '15px "gg sans", sans-serif';
            const lines = getLines(tempCtx, message, 640);

            const canvasHeight = Math.max(72, 52 + lines.length * 20);
            const canvas = createCanvas(750, canvasHeight);
            const ctx = canvas.getContext("2d");

            ctx.fillStyle = "#313338";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const avatar = await loadImage(avatarUrl);
            ctx.save();
            ctx.beginPath();
            ctx.arc(36, 36, 20, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(avatar, 16, 16, 40, 40);
            ctx.restore();

            ctx.fillStyle = nameColor;
            ctx.font = 'bold 16px "gg sans", sans-serif';
            ctx.textBaseline = "alphabetic";
            ctx.fillText(displayName, 72, 31);
            const nameWidth = ctx.measureText(displayName).width;

            const now = new Date();
            const timeStr = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
            ctx.fillStyle = "#949ba4";
            ctx.font = '12px "gg sans", sans-serif';
            ctx.fillText(timeStr, 72 + nameWidth + 8, 30);

            ctx.fillStyle = "#dbdee1";
            ctx.font = '15px "gg sans", sans-serif';
            let currentY = 52;
            for (const line of lines) {
                ctx.fillText(line, 72, currentY);
                currentY += 20;
            }

            const buffer = canvas.toBuffer("image/png");
            const attachment = new AttachmentBuilder(buffer, { name: "message.png" });

            await interaction.editReply({ files: [attachment] });
        } catch (err) {
            console.error("[Fake-Message] Error generating fake message image:", err);
            const ls = client.getLanguage(interaction.guild?.id);
            await interaction.editReply({
                content: ls?.cmds?.["fake-message"]?.error || ls?.errors?.error || "An error occurred while generating the image."
            }).catch((err) => console.error("[fake-message] Failed to edit reply with error message:", err.message));
        }
    }
}
