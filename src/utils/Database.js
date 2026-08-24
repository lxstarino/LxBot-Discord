const fs = require("fs")
const path = require("path")
const DatabaseConstructor = require("better-sqlite3")

class Database {
    constructor() {
        const databaseDir = path.join(process.cwd(), "src", "database")
        if (!fs.existsSync(databaseDir)) {
            fs.mkdirSync(databaseDir, { recursive: true })
        }

        const dbPath = path.join(databaseDir, "bot.db")
        this.db = new DatabaseConstructor(dbPath, {
            readonly: false,
            fileMustExist: false,
            timeout: 5000
        })

        this.db.pragma("journal_mode = WAL")
        this.db.pragma("busy_timeout = 5000")
        this.db.pragma("synchronous = NORMAL")

        this._initTables()
        this._prepareStatements()
    }

    _initTables() {
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS settings (
                guild_id TEXT PRIMARY KEY,
                data TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS profiles (
                guild_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                wallet INTEGER DEFAULT 0,
                bank INTEGER DEFAULT 0,
                xp INTEGER DEFAULT 0,
                level INTEGER DEFAULT 1,
                birthday_day INTEGER DEFAULT NULL,
                birthday_month INTEGER DEFAULT NULL,
                data TEXT NOT NULL,
                PRIMARY KEY (guild_id, user_id)
            );

            CREATE INDEX IF NOT EXISTS idx_profiles_eco ON profiles (guild_id, (wallet + bank) DESC);
            CREATE INDEX IF NOT EXISTS idx_profiles_lvl ON profiles (guild_id, level DESC, xp DESC);
            CREATE INDEX IF NOT EXISTS idx_profiles_bday ON profiles (birthday_month, birthday_day);

            CREATE TABLE IF NOT EXISTS tickets (
                id TEXT PRIMARY KEY,
                guild_id TEXT NOT NULL,
                panel TEXT NOT NULL,
                data TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_tickets_guild ON tickets (guild_id);

            CREATE TABLE IF NOT EXISTS polls (
                poll_id TEXT PRIMARY KEY,
                guild_id TEXT NOT NULL,
                channel_id TEXT,
                data TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_polls_guild ON polls (guild_id);

            CREATE TABLE IF NOT EXISTS reaction_roles (
                id TEXT PRIMARY KEY,
                guild_id TEXT NOT NULL,
                panel TEXT NOT NULL,
                data TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_reaction_roles_guild ON reaction_roles (guild_id);

            CREATE TABLE IF NOT EXISTS free_games (
                game_id INTEGER PRIMARY KEY,
                announced_at INTEGER NOT NULL
            );
        `)
    }

    _prepareStatements() {
        this.stmtGetSettings = this.db.prepare("SELECT data FROM settings WHERE guild_id = ?")
        this.stmtSaveSettings = this.db.prepare(`
            INSERT INTO settings (guild_id, data) VALUES (?, ?)
            ON CONFLICT(guild_id) DO UPDATE SET data = excluded.data
        `)
        this.stmtGetAllSettings = this.db.prepare("SELECT data FROM settings")

        this.stmtGetProfile = this.db.prepare("SELECT data FROM profiles WHERE guild_id = ? AND user_id = ?")
        this.stmtSaveProfile = this.db.prepare(`
            INSERT INTO profiles (guild_id, user_id, wallet, bank, xp, level, birthday_day, birthday_month, data)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(guild_id, user_id) DO UPDATE SET
                wallet = excluded.wallet,
                bank = excluded.bank,
                xp = excluded.xp,
                level = excluded.level,
                birthday_day = excluded.birthday_day,
                birthday_month = excluded.birthday_month,
                data = excluded.data
        `)
        this.stmtGetAllProfiles = this.db.prepare("SELECT data FROM profiles")
        this.stmtGetEcoLb = this.db.prepare(`
            SELECT data FROM profiles 
            WHERE guild_id = ? AND (wallet + bank) > 0 
            ORDER BY (wallet + bank) DESC 
            LIMIT ?
        `)
        this.stmtGetLvlLb = this.db.prepare(`
            SELECT data FROM profiles 
            WHERE guild_id = ? AND (level > 1 OR xp > 0) 
            ORDER BY level DESC, xp DESC 
            LIMIT ?
        `)
        this.stmtGetBirthdays = this.db.prepare(`
            SELECT data FROM profiles 
            WHERE birthday_day = ? AND birthday_month = ?
        `)

        this.stmtGetTicket = this.db.prepare("SELECT data FROM tickets WHERE id = ?")
        this.stmtSaveTicket = this.db.prepare(`
            INSERT INTO tickets (id, guild_id, panel, data) VALUES (?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET data = excluded.data
        `)

        this.stmtDeleteTicket = this.db.prepare("DELETE FROM tickets WHERE id = ?")

        this.stmtGetPoll = this.db.prepare("SELECT data FROM polls WHERE poll_id = ?")
        this.stmtSavePoll = this.db.prepare(`
            INSERT INTO polls (poll_id, guild_id, channel_id, data) VALUES (?, ?, ?, ?)
            ON CONFLICT(poll_id) DO UPDATE SET data = excluded.data
        `)
        this.stmtGetAllPolls = this.db.prepare("SELECT data FROM polls")
        this.stmtDeletePoll = this.db.prepare("DELETE FROM polls WHERE poll_id = ?")

        this.stmtGetReactionRole = this.db.prepare("SELECT data FROM reaction_roles WHERE id = ?")
        this.stmtSaveReactionRole = this.db.prepare(`
            INSERT INTO reaction_roles (id, guild_id, panel, data) VALUES (?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET data = excluded.data
        `)

        this.stmtDeleteReactionRole = this.db.prepare("DELETE FROM reaction_roles WHERE id = ?")

        this.stmtGetFreeGames = this.db.prepare("SELECT game_id FROM free_games")
        this.stmtSaveFreeGame = this.db.prepare(`
            INSERT OR IGNORE INTO free_games (game_id, announced_at) VALUES (?, ?)
        `)

        this.stmtDeleteGuildSettings = this.db.prepare("DELETE FROM settings WHERE guild_id = ?")
        this.stmtDeleteGuildProfiles = this.db.prepare("DELETE FROM profiles WHERE guild_id = ?")
        this.stmtDeleteGuildTickets = this.db.prepare("DELETE FROM tickets WHERE guild_id = ?")
        this.stmtDeleteGuildPolls = this.db.prepare("DELETE FROM polls WHERE guild_id = ?")
        this.stmtDeleteGuildReactionRoles = this.db.prepare("DELETE FROM reaction_roles WHERE guild_id = ?")
    }

    getSettings(guildId) {
        if (!guildId) return null
        const row = this.stmtGetSettings.get(String(guildId))
        if (!row) return null
        try {
            return JSON.parse(row.data)
        } catch {
            return null
        }
    }

    saveSettings(settings) {
        if (!settings || !settings.guildId) return
        const guildId = String(settings.guildId)
        const dataStr = JSON.stringify(settings)
        this.stmtSaveSettings.run(guildId, dataStr)
        return settings
    }

    getAllSettings() {
        const rows = this.stmtGetAllSettings.all()
        return rows.map(r => {
            try { return JSON.parse(r.data) } catch { return null }
        }).filter(Boolean)
    }

    getProfile(guildId, userId) {
        if (!guildId || !userId) return null
        const row = this.stmtGetProfile.get(String(guildId), String(userId))
        if (!row) return null
        try {
            return JSON.parse(row.data)
        } catch {
            return null
        }
    }

    saveProfile(profile) {
        if (!profile || !profile.guildId || !profile.userId) return
        const guildId = String(profile.guildId)
        const userId = String(profile.userId)
        const wallet = Number(profile.wallet) || 0
        const bank = Number(profile.bank) || 0
        const xp = Number(profile.xp) || 0
        const level = Number(profile.level) || 1
        const bdayDay = profile.birthday ? Number(profile.birthday.day) : null
        const bdayMonth = profile.birthday ? Number(profile.birthday.month) : null
        const dataStr = JSON.stringify(profile)

        this.stmtSaveProfile.run(guildId, userId, wallet, bank, xp, level, bdayDay, bdayMonth, dataStr)
        return profile
    }

    getAllProfiles() {
        const rows = this.stmtGetAllProfiles.all()
        return rows.map(r => {
            try { return JSON.parse(r.data) } catch { return null }
        }).filter(Boolean)
    }

    getEconomyLeaderboard(guildId, limit = 10) {
        if (!guildId) return []
        const rows = this.stmtGetEcoLb.all(String(guildId), Number(limit))
        return rows.map(r => {
            try { return JSON.parse(r.data) } catch { return null }
        }).filter(Boolean)
    }

    getLevelLeaderboard(guildId, limit = 10) {
        if (!guildId) return []
        const rows = this.stmtGetLvlLb.all(String(guildId), Number(limit))
        return rows.map(r => {
            try { return JSON.parse(r.data) } catch { return null }
        }).filter(Boolean)
    }

    getTodayBirthdays(day, month) {
        const rows = this.stmtGetBirthdays.all(Number(day), Number(month))
        return rows.map(r => {
            try { return JSON.parse(r.data) } catch { return null }
        }).filter(Boolean)
    }

    getTicket(guildId, panel) {
        const id = `${guildId}:${panel}`
        const row = this.stmtGetTicket.get(id)
        if (!row) return null
        try { return JSON.parse(row.data) } catch { return null }
    }

    saveTicket(ticket) {
        if (!ticket || !ticket.guildId || !ticket.panel) return
        const id = `${ticket.guildId}:${ticket.panel}`
        const guildId = String(ticket.guildId)
        const panel = String(ticket.panel)
        const dataStr = JSON.stringify(ticket)
        this.stmtSaveTicket.run(id, guildId, panel, dataStr)
        return ticket
    }



    deleteTicket(guildId, panel) {
        const id = `${guildId}:${panel}`
        this.stmtDeleteTicket.run(id)
    }

    getPoll(pollId) {
        if (!pollId) return null
        const row = this.stmtGetPoll.get(String(pollId))
        if (!row) return null
        try { return JSON.parse(row.data) } catch { return null }
    }

    savePoll(poll) {
        if (!poll || !poll.pollId) return
        const pollId = String(poll.pollId)
        const guildId = String(poll.guildId || "")
        const channelId = String(poll.channelId || "")
        const dataStr = JSON.stringify(poll)
        this.stmtSavePoll.run(pollId, guildId, channelId, dataStr)
        return poll
    }

    getAllPolls() {
        const rows = this.stmtGetAllPolls.all()
        return rows.map(r => {
            try { return JSON.parse(r.data) } catch { return null }
        }).filter(Boolean)
    }

    deletePoll(pollId) {
        if (!pollId) return
        this.stmtDeletePoll.run(String(pollId))
    }

    getReactionRole(guildId, panel) {
        const id = `${guildId}:${panel}`
        const row = this.stmtGetReactionRole.get(id)
        if (!row) return null
        try { return JSON.parse(row.data) } catch { return null }
    }

    saveReactionRole(rr) {
        if (!rr || !rr.guildId || !rr.panel) return
        const id = `${rr.guildId}:${rr.panel}`
        const guildId = String(rr.guildId)
        const panel = String(rr.panel)
        const dataStr = JSON.stringify(rr)
        this.stmtSaveReactionRole.run(id, guildId, panel, dataStr)
        return rr
    }



    deleteReactionRole(guildId, panel) {
        const id = `${guildId}:${panel}`
        this.stmtDeleteReactionRole.run(id)
    }

    getAnnouncedGames() {
        const rows = this.stmtGetFreeGames.all()
        return rows.map(r => Number(r.game_id))
    }

    addAnnouncedGame(gameId) {
        if (!gameId) return
        this.stmtSaveFreeGame.run(Number(gameId), Date.now())
    }

    syncActiveFreeGames(activeGameIds) {
        if (!Array.isArray(activeGameIds)) return
        if (activeGameIds.length === 0) {
            this.db.prepare("DELETE FROM free_games").run()
            return
        }
        const numericIds = activeGameIds.map(Number).filter(id => !isNaN(id))
        if (numericIds.length === 0) return
        const placeholders = numericIds.map(() => "?").join(",")
        this.db.prepare(`DELETE FROM free_games WHERE game_id NOT IN (${placeholders})`).run(...numericIds)
    }

    cleanupGuild(guildId) {
        if (!guildId) return
        const gId = String(guildId)
        const tx = this.db.transaction(() => {
            this.stmtDeleteGuildSettings.run(gId)
            this.stmtDeleteGuildProfiles.run(gId)
            this.stmtDeleteGuildTickets.run(gId)
            this.stmtDeleteGuildPolls.run(gId)
            this.stmtDeleteGuildReactionRoles.run(gId)
        })
        tx()
    }
}

module.exports = new Database()
