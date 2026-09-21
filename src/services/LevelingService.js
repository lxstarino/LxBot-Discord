const ProfileRepository = require("../repositories/ProfileRepository")
const { handlemsg } = require("../utils/stringUtils")

class LevelingService {
    static getRequiredXp(level) {
        const lvl = Math.max(1, parseInt(level, 10) || 1)
        return lvl * lvl * 100
    }

    static async checkAndAssignRewards(member, currentLevel, levelRoles) {
        if (!member || !Array.isArray(levelRoles) || levelRoles.length === 0) {
            return []
        }

        const awardedRoles = []
        for (const reward of levelRoles) {
            if (currentLevel >= reward.level && !member.roles.cache.has(reward.roleId)) {
                try {
                    await member.roles.add(reward.roleId)
                    awardedRoles.push(`<@&${reward.roleId}>`)
                } catch (err) {
                    console.error(`[LevelRoles] Failed to assign role ${reward.roleId} to user ${member.id}:`, err.message)
                }
            }
        }
        return awardedRoles
    }

    static async processMessageXp(client, message, settings) {
        if (!message || !message.guild || !message.member || message.author.bot) return null
        if (settings?.disabled_modules && settings.disabled_modules.includes("Leveling")) return null

        const cacheKey = `${message.guild.id}:${message.author.id}`
        const cachedProfile = client.economy?.get(cacheKey)

        const now = Date.now()
        const cooldown = 15000
        if (cachedProfile && cachedProfile.lastXpMessage && (now - cachedProfile.lastXpMessage) < cooldown) {
            return null
        }

        const profile = cachedProfile || await ProfileRepository.getOrCreate(client, message.author.id, message.guild.id)

        const xpGained = Math.floor(Math.random() * 11) + 15
        profile.xp = (profile.xp || 0) + xpGained
        profile.lastXpMessage = now

        const currentLevel = profile.level || 1
        const neededXp = LevelingService.getRequiredXp(currentLevel)

        if (profile.xp >= neededXp) {
            profile.level = currentLevel + 1
            profile.xp -= neededXp

            const awardedRoles = await LevelingService.checkAndAssignRewards(
                message.member,
                profile.level,
                settings.level_roles
            )

            const ls = client.getLanguage(message.guild.id)
            let desc = handlemsg(ls["events"]["messageCreate"]["level_up_desc"], {
                user: message.author.id,
                level: profile.level
            })
            if (awardedRoles.length > 0 && ls["events"]["messageCreate"]["level_up_reward"]) {
                desc += handlemsg(ls["events"]["messageCreate"]["level_up_reward"], {
                    roles: awardedRoles.join(", ")
                })
            }

            const levelUpEmbed = {
                title: ls["events"]["messageCreate"]["level_up_title"],
                description: desc
            }

            client.Embed([levelUpEmbed], undefined, undefined, undefined, message.channel, undefined, `<@${message.author.id}>`)

            return { leveledUp: true, newLevel: profile.level, awardedRoles }
        }

        return { leveledUp: false, xpGained }
    }
}

module.exports = LevelingService
