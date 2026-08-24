const { AttachmentBuilder } = require("discord.js")
const { createCanvas, loadImage } = require("@napi-rs/canvas")

async function generateWelcomeCard(avatarUrl, username, memberCount) {
    const canvas = createCanvas(700, 250);
    const ctx = canvas.getContext("2d");

    const backgroundUrl = "https://cdn.discordapp.com/attachments/1280995343567294514/1541395305998712892/image.png?ex=6a8d6fbe&is=6a8c1e3e&hm=228164fb811231a5fd406ff9e9c296be2155a54e703dcb3ffa5dd16a6884db09&";
    const background = await loadImage(backgroundUrl);
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const avatar = await loadImage(avatarUrl);
    ctx.save();
    ctx.beginPath();
    ctx.arc(125, 125, 75, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, 50, 50, 150, 150);
    ctx.restore();

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(125, 125, 75, 0, Math.PI * 2, true);
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 36px sans-serif";
    ctx.fillText("Welcome!", 240, 95);

    ctx.fillStyle = "#e0a3ff";
    ctx.font = "bold 38px sans-serif";
    let displayName = username;
    if (displayName.length > 15) {
        displayName = displayName.substring(0, 15) + "...";
    }
    ctx.fillText(displayName, 240, 148);

    ctx.fillStyle = "#c0c0c0";
    ctx.font = "24px sans-serif";
    ctx.fillText(`Member #${memberCount}`, 240, 192);

    return canvas.toBuffer("image/png");
}

module.exports = {
    name: "guildMemberAdd",
    async execute(member, client) {

        const { getOrCreateSettings, handlemsg } = require(`${process.cwd()}/src/utils/functions`)
        const settings = client.settings.mapCache?.get(member.guild.id) || await getOrCreateSettings(client, member.guild.id)
        let ls = client.getLanguage(member.guild?.id)

        if (settings) {
            if (settings.welcomestate == true) {
                let channel = settings.welcomechannel ? member.guild.channels.cache.get(settings.welcomechannel) : null;
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
            }

            const roleId = settings.autorole
            if (roleId) {
                const role = member.guild.roles.cache.get(roleId)
                if (role && role.id !== member.guild.id) {
                    await member.roles.add(role.id).catch((err) => {
                        console.error(`[Auto-Role] Failed to add role ${role.name} to user ${member.user.tag}:`, err)
                    })
                }
            }
        }

    }
}
