const axios = require("axios")

module.exports = class{
    constructor(baseURL = "https://realbooru.com"){
        this.baseURL = baseURL;
    }

    async _fetch({url, type = "GET"} = {}){
        const response = await axios(url, {method: type}).catch(err => err)
        return response.data
    }

    async getMedia(tag, amount, pages, filter){
        const media_list = []
        for(let i = 0; pages > i; i++){
            const media = await this._fetch({url: `${this.baseURL}/index.php?page=dapi&s=post&q=index&pid=${i}&limit=100&json=1&tags=${tag}`}).catch((err) => console.log(err))

            if(media.length == 0) break
            for(let i = 0; Object.keys(media).length > i; i++){
                
                if(filter){
                    if(Object.values(media)[i].image.endsWith(filter)){
                        media_list.push(`${this.baseURL}/images/${Object.values(media)[i].directory}/${Object.values(media)[i].image}`)
                    }
                } else {
                    media_list.push(`${this.baseURL}/images/${Object.values(media)[i].directory}/${Object.values(media)[i].image}`)
                }
            }
        }

        if(media_list.length == 0) throw({title: "Realbooru", desc: "No media found!"})

        const content = []
        for(let i = 0; amount > i; i++){
            content.push(media_list[Math.floor(Math.random() * media_list.length)])
        }

        return(content)
    }
}
