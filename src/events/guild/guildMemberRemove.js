const { sendModLog, handlemsg } = require(`${process.cwd()}/src/handlers/functions`)

module.exports = {
    name: "guildMemberRemove",
    async execute(member, client) {
        if (!member.guild) return

        let ls = client.getLanguage(member.guild.id)

        // Build a list of the member's roles (excluding @everyone)
        const roles = member.roles.cache
            .filter(r => r.id !== member.guild.id)
            .map(r => `<@&${r.id}>`)
            .join(", ") || "None"

        await sendModLog(client, member.guild, {
            title: ls["logs"]["member_leave_title"],
            desc: handlemsg(ls["logs"]["member_leave_desc"], {
                tag: member.user.tag,
                userId: member.user.id,
                roles: roles
            }),
            color: "#95a5a6",
            timestamp: Date.now()
        })
    }
}
