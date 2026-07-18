const { sendModLog, handlemsg } = require(`${process.cwd()}/src/handlers/functions`)

module.exports = {
    name: "guildMemberUpdate",
    async execute(oldMember, newMember, client) {
        if (!newMember.guild) return

        const oldRoles = oldMember.roles.cache
        const newRoles = newMember.roles.cache

        // Find roles that were added
        const addedRoles = newRoles.filter(r => !oldRoles.has(r.id))
        // Find roles that were removed
        const removedRoles = oldRoles.filter(r => !newRoles.has(r.id))

        // Skip if no role changes
        if (addedRoles.size === 0 && removedRoles.size === 0) return

        let ls = client.getLanguage(newMember.guild.id)

        for (const [, role] of addedRoles) {
            await sendModLog(client, newMember.guild, {
                title: ls["logs"]["role_add_title"],
                desc: handlemsg(ls["logs"]["role_add_desc"], {
                    user: newMember.user.id,
                    tag: newMember.user.tag,
                    role: role.id
                }),
                color: "#2ecc71",
                timestamp: Date.now()
            })
        }

        for (const [, role] of removedRoles) {
            await sendModLog(client, newMember.guild, {
                title: ls["logs"]["role_remove_title"],
                desc: handlemsg(ls["logs"]["role_remove_desc"], {
                    user: newMember.user.id,
                    tag: newMember.user.tag,
                    role: role.id
                }),
                color: "#e74c3c",
                timestamp: Date.now()
            })
        }
    }
}
