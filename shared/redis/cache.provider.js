const {CacheInterface} = require('./cache.interface');

class CacheProvider{
    constructor(){}
    get(key,subKey,queryKey){
        return CacheInterface.get(key,subKey,queryKey);
    }

    put(key,subKey,queryKey,data){
        return CacheInterface.put(key,subKey,queryKey,data);
    }

    del(key,subKey){
        return CacheInterface.del(key,subKey);
    }
}

exports.CacheProvider = new CacheProvider();