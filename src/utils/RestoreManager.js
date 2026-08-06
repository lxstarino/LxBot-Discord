class RestoreManager {
    constructor() {
        this._handlers = []
    }

    register(name, handler) {
        this._handlers.push({ name, handler })
    }

    async restoreAll(client) {
        if (this._handlers.length === 0) return

        console.log(`| [Restore] Running ${this._handlers.length} restore handler(s)...`)

        for (const { name, handler } of this._handlers) {
            try {
                await handler(client)
                console.log(`  > [Restore] "${name}" completed.`)
            } catch (err) {
                console.error(`  > [Restore] "${name}" failed: ${err.message}`)
            }
        }
    }
}

module.exports = new RestoreManager()
