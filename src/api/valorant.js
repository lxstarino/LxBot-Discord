const axios = require("axios")

module.exports = class{
    constructor(baseURL = "https://api.henrikdev.xyz/valorant/"){
        this.baseURL = baseURL;
    }

    _validate(input){
        for(let i = 0; Object.keys(input).length > i; i++){
            if(Object.values(input)[i] == null) throw `Empty Argument: ${Object.keys(input)[i]}`
        }
    }

    _parsebody(body){
        if(body.errors) return body.errors
        return body.status ? body.data : body
    }

    _parseres(res){
        return{
            url: res.config.url,
            status: res.response ? res.response.status : res.status,
            data: res.response ? 0 : this._parsebody(res.data),
            errors: res.response ? this._parsebody(res.response.data) : 0
        }
    }

    async _fetch({url, type = "GET"} = {}){
        const response = await axios(url, {method: type}).catch(err => err)
        return this._parseres(response)
    }

    async getAccount({name, tagline}){
        this._validate({name, tagline})
        return await this._fetch({
            url: `${this.baseURL}v1/account/${name}/${tagline}`
        })
    }

    async getMMR({name, tagline}){
        this._validate({name, tagline})
        return await this._fetch({
            url: `${this.baseURL}v2/mmr/eu/${name}/${tagline}`
        })
    }

    async getLb({region}){
        this._validate({region})
        return await this._fetch({
            url: `${this.baseURL}v1/leaderboard/${region}`
        })
    }

    async getMatches({name, tagline, region, mType}){
        this._validate({name, tagline, region, mType})
        return await this._fetch({
            url: `${this.baseURL}v3/matches/${region}/${name}/${tag}?filter=${mType}`
        })
    }
}

