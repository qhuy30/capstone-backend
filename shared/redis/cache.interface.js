const trycatch = require('trycatch');
const   q = require('q');
var initResource = require('../init').init;
const {RedisCore} = require('./redis.core');
const crypto = require('crypto-js');
class CacheInterface{
    constructor(){}
    get(key, subKey,queryKey) {
        let dfd  = q.defer();
        // trycatch(function(){
            RedisCore.get(initResource.connectRedis,key+"+"+subKey).then(function(data){
                let key_e = JSON.stringify(queryKey);
                key_e = crypto.SHA256(key_e).toString();
                if (data == null){  
                    dfd.reject({path:"CacheInterface.get.nulldata",err:"nulldata"});
                }else{
                    data = JSON.parse(data);
                    data = JSON.parse(data);
                    if (data[key_e]){
                        dfd.resolve(data[key_e]);
                    }else{
                        dfd.reject({path:"CacheInterface.get.nodata",err:"nodata"});
                    }
                }
                key = undefined;
                subKey = undefined;
                queryKey = undefined;
                data = undefined;
                key_e = undefined;
                dfd = undefined;
            },function(err){
                dfd.reject(err);
                key = undefined;
                subKey = undefined;
                queryKey = undefined;
                data = undefined;
                key_e = undefine
            });
        // },function(err){
        //     dfd.reject({path:"CacheInterface.get.trycatch",err:err.stack});
        // });
        return dfd.promise;
    }

    put(key, subKey,queryKey, data) {   
        let dfd = q.defer();
        // trycatch(function(){
            let key_e = JSON.stringify(queryKey);
            key_e = crypto.SHA256(key_e).toString();
            RedisCore.get(initResource.connectRedis,key+"+"+subKey).then(function(c_data){
                var temp = {};
                if (c_data!=null){
                    temp = JSON.parse(c_data);
                    temp = JSON.parse(temp);
                }
                
                temp[key_e] = data;
                temp =JSON.stringify(temp);  
                key_e = undefined;
                RedisCore.set(initResource.connectRedis,key+"+"+subKey,temp).then(function(res){
                    dfd.resolve(res);
                    key = undefined;
                    subKey = undefined;
                    queryKey = undefined;
                    data = undefined;
                    res = undefined;
                    c_data = undefined;
                    temp = undefined;
                    dfd = undefined;
                },function(err){
                    dfd.reject(err);
                    key = undefined;
                    subKey = undefined;
                    queryKey = undefined;
                    data = undefined;
                    c_data = undefined;
                    temp = undefined;
                    err = undefined;
                })
            },function(err){
                RedisCore.set(initResource.connectRedis,key+"+"+subKey,JSON.stringify({key_e:data})).then(function(res){
                    
                    dfd.resolve(res);
                    key = undefined;
                    subKey = undefined;
                    queryKey = undefined;
                    data = undefined;
                    res = undefined;
                    dfd = undefined;
                },function(err){
                    dfd.reject(err);
                    key = undefined;
                    subKey = undefined;
                    queryKey = undefined;
                    data = undefined;
                    err = undefined;
                })
            });
        // },function(err){
        //     dfd.reject({path:"CacheInterface.put.trycatch",err:err.stack});
        //     key = undefined;
        //     subKey = undefined;
        //     queryKey = undefined;
        //     data = undefined;
        //     err = undefined;
        // });
        return dfd.promise;
    }

    del(key,subKey) {
        let dfd = q.defer();
        // trycatch(function(){
            RedisCore.del(initResource.connectRedis,key+"+"+subKey).then(function(res){
                dfd.resolve(res);
                key = undefined;
                subKey = undefined;
                res = undefined;
                dfd = undefined;
            },function(err){
                dfd.reject(err);
                key = undefined;
                subKey = undefined;
                err = undefined;
            });
        // },function(err){
        //     dfd.reject({path:"CacheInterface.del.trycatch",err:err.stack});
        //     key = undefined;
        //     subKey = undefined;
        //     err = undefined;
        // });
        return dfd.promise;
    }
}

exports.CacheInterface = new CacheInterface();