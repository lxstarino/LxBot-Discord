class TTLCache {
    constructor(options = {}) {
        this.ttlMs = options.ttlMs || 30 * 60 * 1000
        this.maxSize = options.maxSize || 5000
        this._map = new Map()

        const sweepInterval = options.sweepIntervalMs || 5 * 60 * 1000
        this._sweepTimer = setInterval(() => this.sweep(), sweepInterval)
        if (this._sweepTimer.unref) {
            this._sweepTimer.unref()
        }
    }

    set(key, value, customTtl) {
        const ttl = customTtl !== undefined ? customTtl : this.ttlMs
        const expiresAt = ttl > 0 ? Date.now() + ttl : Infinity

        if (this._map.has(key)) {
            this._map.delete(key)
        } else if (this._map.size >= this.maxSize) {
            const oldestKey = this._map.keys().next().value
            if (oldestKey !== undefined) {
                this._map.delete(oldestKey)
            }
        }

        this._map.set(key, { value, expiresAt })
        return this
    }

    get(key) {
        const entry = this._map.get(key)
        if (!entry) return undefined

        if (Date.now() > entry.expiresAt) {
            this._map.delete(key)
            return undefined
        }

        this._map.delete(key)
        entry.expiresAt = this.ttlMs > 0 ? Date.now() + this.ttlMs : Infinity
        this._map.set(key, entry)

        return entry.value
    }

    has(key) {
        const entry = this._map.get(key)
        if (!entry) return false

        if (Date.now() > entry.expiresAt) {
            this._map.delete(key)
            return false
        }

        return true
    }

    delete(key) {
        return this._map.delete(key)
    }

    clear() {
        this._map.clear()
    }

    sweep() {
        const now = Date.now()
        for (const [key, entry] of this._map.entries()) {
            if (now > entry.expiresAt) {
                this._map.delete(key)
            }
        }
    }

    get size() {
        this.sweep()
        return this._map.size
    }

    *keys() {
        const now = Date.now()
        for (const [key, entry] of this._map.entries()) {
            if (now <= entry.expiresAt) {
                yield key
            }
        }
    }

    *values() {
        const now = Date.now()
        for (const [key, entry] of this._map.entries()) {
            if (now <= entry.expiresAt) {
                yield entry.value
            }
        }
    }

    *entries() {
        const now = Date.now()
        for (const [key, entry] of this._map.entries()) {
            if (now <= entry.expiresAt) {
                yield [key, entry.value]
            }
        }
    }

    [Symbol.iterator]() {
        return this.entries()
    }

    forEach(callback, thisArg) {
        const now = Date.now()
        for (const [key, entry] of this._map.entries()) {
            if (now <= entry.expiresAt) {
                callback.call(thisArg, entry.value, key, this)
            }
        }
    }

    destroy() {
        if (this._sweepTimer) {
            clearInterval(this._sweepTimer)
            this._sweepTimer = null
        }
        this._map.clear()
    }
}

module.exports = TTLCache
