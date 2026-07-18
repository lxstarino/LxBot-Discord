const fs = require("fs")

module.exports = class StorageManager {
    constructor(storage) {
        this.storage = {}
        this.storage.path = storage
        this.storage.data = []
        this.saveTimeout = null

        // Initializes data loading synchronously on bot start
        // to avoid race conditions.
        this._init()

        // Setup process exit listeners to guarantee a final synchronous save before shutdown
        process.once("beforeExit", () => this.forceSaveSync())
        process.once("exit", () => this.forceSaveSync())
        process.once("SIGINT", () => {
            this.forceSaveSync()
            process.exit(0)
        })
        process.once("SIGTERM", () => {
            this.forceSaveSync()
            process.exit(0)
        })
    }

    // Creates new data and appends it to the storage array
    createData(options) {
        return new Promise(async (resolve, reject) => {
            if (!this.init) {
                return reject("Manager is not initialized")
            }
            if (typeof options != "object") {
                return reject("Variable has to be an object")
            }

            this.storage.data.push(options)
            // Persist data asynchronously
            await this.saveData()
            resolve(options)
        })
    }

    // Writes the data array asynchronously to the JSON file with a 1.5s debounce throttle
    async saveData() {
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout)
        }

        this.saveTimeout = setTimeout(async () => {
            this.saveTimeout = null
            try {
                await fs.promises.writeFile(this.storage.path, JSON.stringify(this.storage.data, null, 4), "utf-8")
            } catch (err) {
                console.error(`[StorageManager] Failed to write database to ${this.storage.path}:`, err)
            }
        }, 1500)

        return Promise.resolve()
    }

    // Forces a synchronous write to disk (used on process exit)
    forceSaveSync() {
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout)
            this.saveTimeout = null
        }
        try {
            fs.writeFileSync(this.storage.path, JSON.stringify(this.storage.data, null, 4), "utf-8")
        } catch (err) {
            console.error(`[StorageManager] Failed to force-save database to ${this.storage.path}:`, err)
        }
    }

    // Reads data synchronously from disk (only used on bot startup)
    getData() {
        if (!fs.existsSync(this.storage.path)) {
            // File does not exist yet — create an empty array file
            fs.writeFileSync(this.storage.path, "[]", "utf-8")
            return []
        } else {
            try {
                const fileContent = fs.readFileSync(this.storage.path, "utf-8").trim()
                if (!fileContent) {
                    fs.writeFileSync(this.storage.path, "[]", "utf-8")
                    return []
                }
                let data = JSON.parse(fileContent)
                if (Array.isArray(data)) {
                    return data
                } else {
                    throw new Error("StorageManager: Unsupported storage format")
                }
            } catch (ex) {
                if (ex instanceof SyntaxError || (ex.message && ex.message.includes("Unexpected end of JSON input"))) {
                    console.warn(`[StorageManager] Corrupted or empty JSON in ${this.storage.path}. Resetting to [].`)
                    fs.writeFileSync(this.storage.path, "[]", "utf-8")
                    return []
                } else {
                    throw ex
                }
            }
        }
    }

    // Sets the in-memory data array and marks the manager as initialized
    _init() {
        this.storage.data = this.getData()
        this.init = true
    }
}
