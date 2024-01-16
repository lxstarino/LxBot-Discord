const axios = require("axios")

module.exports = class{
    constructor(baseURL = "https://api.rule34.xxx"){
        this.baseURL = baseURL;
    }

    async _fetch({url, type = "GET"} = {}){
        const response = await axios(url, {method: type}).catch(err => err)
        return response.data
    }

    async getMedia(tag, amount, pages, filter){
        const media_list = []
        for(let i = 0; pages > i; i++){
            const media = await this._fetch({url: `${this.baseURL}/index.php?page=dapi&s=post&q=index&limit=100&json=1&pid=${i}&tags=${tag}`})
            if(media.length == 0) break
            for(let i = 0; Object.keys(media).length > i; i++){
                if(filter){
                    if(Object.values(media)[i].file_url.endsWith(filter)){
                        media_list.push(Object.values(media)[i].file_url)
                    }
                } else {
                    media_list.push(Object.values(media)[i].file_url)
                }
            }
        }

        if(media_list.length == 0) throw({title: "Rule34", desc: "No media found!"})

        const media = []
        for(let i = 0; amount > i; i++){
            media.push(media_list[Math.floor(Math.random() * media_list.length)])
        }
        return(media)
    }
}

