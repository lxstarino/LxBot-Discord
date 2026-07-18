module.exports = {
    customId: "toggle-role-",
    async execute(client, interaction, ls, handlemsg) {
        const roleId = interaction.customId.replace("toggle-role-", "");
        const member = interaction.member;

        const getTranslation = (key, replaceObj = {}) => {
            return handlemsg(ls["cmds"]["role-setup"][key] || "", replaceObj);
        };

        const role = interaction.guild.roles.cache.get(roleId);
        if (!role) {
            return await interaction.reply({
                content: getTranslation("not_found"),
                ephemeral: true
            });
        }

        // Check if the bot has permission to manage the role (hierarchy rule)
        const botMember = interaction.guild.members.me;
        if (role.position >= botMember.roles.highest.position) {
            return await interaction.reply({
                content: getTranslation("hierarchy_error", { roleName: role.name }),
                ephemeral: true
            });
        }

        try {
            if (member.roles.cache.has(roleId)) {
                await member.roles.remove(roleId);
                await interaction.reply({
                    content: getTranslation("removed", { roleName: role.name }),
                    ephemeral: true
                });
            } else {
                await member.roles.add(roleId);
                await interaction.reply({
                    content: getTranslation("added", { roleName: role.name }),
                    ephemeral: true
                });
            }
        } catch (err) {
            console.error("[Reaction-Roles] Failed to toggle role:", err);
            await interaction.reply({
                content: getTranslation("error"),
                ephemeral: true
            }).catch(() => {});
        }
    }
};
