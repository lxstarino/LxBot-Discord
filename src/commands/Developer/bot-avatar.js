const { SlashCommandBuilder } = require("@discordjs/builders")

module.exports = {
    devOnly: true,
    data: new SlashCommandBuilder()
        .setName("bot-avatar")
        .setDescription("Set a server-specific avatar for the bot")
        .addAttachmentOption((option) => option
            .setName("avatar")
            .setDescription("The avatar image file to set for this server")
            .setRequired(true)
        ),
    async execute(client, interaction) {
        const attachment = interaction.options.getAttachment("avatar");

        let ls = client.getLanguage(interaction.guild?.id);
        const { handlemsg } = require(`${process.cwd()}/src/utils/functions`);

        try {
            const response = await fetch(attachment.url);
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            const contentType = response.headers.get("content-type") || "image/png";
            const base64 = buffer.toString("base64");
            const dataURI = `data:${contentType};base64,${base64}`;

            await client.rest.patch(`/guilds/${interaction.guild.id}/members/@me`, {
                body: { avatar: dataURI }
            });

            client.Embed([{
                title: ls["cmds"]["bot-avatar"]["title"],
                desc: ls["cmds"]["bot-avatar"]["desc"]
            }], undefined, "reply", true, interaction);
        } catch (error) {
            console.error(error);
            client.Embed([{
                title: ls["cmds"]["bot-avatar"]["error_title"],
                desc: handlemsg(ls["cmds"]["bot-avatar"]["error"], { error: error.message })
            }], undefined, "reply", true, interaction);
        }
    }
}
