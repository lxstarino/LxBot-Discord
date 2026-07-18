/**
 * RestoreManager — a centralized registry for post-restart feature restoration.
 *
 * How it works:
 *  - Features call `RestoreManager.register(name, handlerFn)` at module load time.
 *  - On the `ready` event, `RestoreManager.restoreAll(client)` is called once,
 *    which runs every registered handler in order.
 *
 * Example usage in any feature file:
 *
 *   const RestoreManager = require('../utils/RestoreManager')
 *   RestoreManager.register('My Feature', async (client) => {
 *       // ... restore logic here ...
 *   })
 */
class RestoreManager {
    constructor() {
        this._handlers = []
    }

    /**
     * Register a restore handler.
     * @param {string} name     - Human-readable name shown in console logs.
     * @param {Function} handler - async (client) => void
     */
    register(name, handler) {
        this._handlers.push({ name, handler })
    }

    /**
     * Run all registered restore handlers sequentially.
     * Called once by the `ready` event after the bot is online.
     * @param {import("discord.js").Client} client
     */
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
