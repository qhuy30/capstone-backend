const {HTTPRequestInterface} = require("./http.interface");
const {HTTPConst:{commonOptions}} =require('./http.const');
const {tenantBackend} = require("../../utils/setting");

function setOptions(overrideOps){
    let overideOptions = JSON.parse(JSON.stringify(commonOptions));
    if(overrideOps && typeof overrideOps ==='object'){  
        overideOptions[i] =  overrideOps[i];
    }
    return overideOptions;
}

class HTTPRequestProvider{
    constructor(){}

    optionsCommon(){
      return {
        headers:{
            "Content-Type": "application/json",
            "Accept": "application/json;odata=verbose"
        }
      }  
    }

    postToTenantBackend(path,body,options){
        const url = tenantBackend + path;
        let overideOptions = setOptions(options);
        return HTTPRequestInterface.post(url,body,overideOptions);
    }

    getToTenantBackend(path,options){
        const url = tenantBackend + path;
        let overideOptions = setOptions(options);
        return HTTPRequestInterface.get(url,overideOptions);
    }

    putToTenantBackend(path,body,options){
        const url = tenantBackend + path;
        let overideOptions = setOptions(options);
        return HTTPRequestInterface.put(url,body,overideOptions);
    }

    deleteToTenantBackend(path,body,options){
        const url = tenantBackend + path;
        let overideOptions = setOptions(options);
        return HTTPRequestInterface.delete(url,body,overideOptions);
    }

    get(url,options){
        return HTTPRequestInterface.get(url,options);
    }
}

exports.HTTPRequestProvider = new HTTPRequestProvider();