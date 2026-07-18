const { AttachmentBuilder } = require("discord.js")
const { createCanvas, loadImage } = require("@napi-rs/canvas")

async function generateWelcomeCard(avatarUrl, username, memberCount) {
    const canvas = createCanvas(700, 250);
    const ctx = canvas.getContext("2d");

    // Load custom background image
    const backgroundUrl = "https://cdn.discordapp.com/attachments/1517162401357627463/1528077451811361010/image.png?ex=6a5cfc86&is=6a5bab06&hm=925855c1a3fb2c8e3fc7a04e1550416547ccf9a17c6d406b800ff3ac06964de1&";
    const background = await loadImage(backgroundUrl);
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

    // Semi-transparent overlay to ensure high contrast for text
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw circular avatar
    const avatar = await loadImage(avatarUrl);
    ctx.save();
    ctx.beginPath();
    ctx.arc(125, 125, 75, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, 50, 50, 150, 150);
    ctx.restore();

    // Draw circular border
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(125, 125, 75, 0, Math.PI * 2, true);
    ctx.stroke();

    // Render "Welcome!" title
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 36px sans-serif";
    ctx.fillText("Welcome!", 240, 95);

    // Render username (truncated if too long to fit nicely)
    ctx.fillStyle = "#e0a3ff";
    ctx.font = "bold 38px sans-serif";
    let displayName = username;
    if (displayName.length > 15) {
        displayName = displayName.substring(0, 15) + "...";
    }
    ctx.fillText(displayName, 240, 148);

    // Render member count
    ctx.fillStyle = "#c0c0c0";
    ctx.font = "24px sans-serif";
    ctx.fillText(`Member #${memberCount}`, 240, 192);

    return canvas.toBuffer("image/png");
}

module.exports = {
    name: "guildMemberAdd",
    async execute(member, client) {

        const settings = client.settings.storage.data.find(x => x.guildId === member.guild.id)
        let ls = client.getLanguage(member.guild?.id)
        const { handlemsg } = require(`${process.cwd()}/src/handlers/functions`)

        if (settings) {
            if (settings.welcomestate == true) {
                let channel = member.guild.channels.cache.find(c => c.id === settings.welcomechannel);
                if (channel != undefined) {
                    const welcomeMsg = handlemsg(ls["events"]["onjoin"]["joinmsg"], {
                        user: member.user.id,
                        guildname: member.guild.name,
                        membercount: member.guild.memberCount
                    });

                    if (settings.welcomecard === true) {
                        try {
                            const avatarUrl = member.user.displayAvatarURL({ extension: "png", size: 512 });
                            const imageBuffer = await generateWelcomeCard(avatarUrl, member.user.username, member.guild.memberCount);
                            const attachment = new AttachmentBuilder(imageBuffer, { name: "welcome.png" });

                            client.Embed([{
                                title: `${member.guild.name}`,
                                desc: welcomeMsg,
                                image: "attachment://welcome.png"
                            }], undefined, undefined, undefined, channel, [attachment]);
                        } catch (err) {
                            console.error("[Welcome-Setup] Failed to generate welcome card image locally, falling back to text:", err);
                            client.Embed([{
                                title: `${member.guild.name}`,
                                desc: welcomeMsg
                            }], undefined, undefined, undefined, channel)
                        }
                    } else {
                        client.Embed([{
                            title: `${member.guild.name}`,
                            desc: welcomeMsg
                        }], undefined, undefined, undefined, channel)
                    }
                }

                let role = member.guild.roles.cache.find(r => r.id === settings.welcomerole);
                if (role != undefined && role.id !== member.guild.id) {
                    await member.roles.add(role.id).catch((err) => {
                        console.error(`[Welcome-Setup] Failed to add role ${role.name} to user ${member.user.tag}:`, err)
                    })
                }
            }
        }
    }
}
