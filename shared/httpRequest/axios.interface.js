const axios = require('axios');

class AxiosInterface {
    constructor(){}

    post(url,body,options){
        return axios.post(url,body,options);
    }

    get(url, options){
        return axios.get(url,options);
    }

    put(url,body,options){
        return axios.put(url,body,options);
    }

    delete(url,body,options){
        return axios.delete(url,body,options);
    }
}

exports.AxiosInterface = new AxiosInterface();