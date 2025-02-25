const {AxiosProvider} = require("./axios.provider");

class HTTPRequestInterface{
    constructor(){}

    post(url,body,options){
        return AxiosProvider.post(url,body,options);
    }

    get(url, options){
        return AxiosProvider.get(url,options);
    }

    put(url,body,options){
        return AxiosProvider.put(url,body,options);
    }

    delete(url,body,options){
        return AxiosProvider.delete(url,body,options);
    }
}

exports.HTTPRequestInterface = new HTTPRequestInterface();