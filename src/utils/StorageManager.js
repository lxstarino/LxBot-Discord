const fs = require("fs")

module.exports = class StorageManager{
    constructor(storage){
        this.storage = {}

        this.storage.path = storage
        this.storage.data = []

        this._init()
    }

    createData(options){
        return new Promise(async (resolve, reject) => {
            if(!this.init){
                return reject("Manager is not initialized")
            }
            if(typeof options != "object"){
                return reject("Variable has to be an object")
            }

            this.storage.data.push(options)
            this.saveData()
            resolve(options)
        })
    }

    async saveData(){
        fs.writeFileSync(this.storage.path, JSON.stringify(this.storage.data, 0, 4), "utf-8")
        return
    }

    async getData(){
        if(!fs.existsSync(this.storage.path)){
            throw "StorageManager: Path not found"
        } else {
            try{
                let data = await JSON.parse(fs.readFileSync(this.storage.path))
                if(Array.isArray(data)){
                    return data
                } else {
                    throw "StorageManager: Unsupported storage format"
                }
            } catch (ex){
                if(ex.message === "Unexpected end of JSON input"){
                    throw ("StorageManager: Unsupported storage format", ex)
                } else {
                    throw ex
                }
            }
        }
    }

    async _init() {
        this.storage.data = await this.getData()
        this.init = true
    }
}
