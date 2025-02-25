//version 1.0
const redis = require("redis");
const q = require('q');
const trycatch = require('trycatch');

class RedisCore{
    constructor(){}

    getConnect(param){
        if (param.password){
            return redis.createClient({
                host: param.host,
                port: param.port,
                password: param.password
              });
        }else{
            return redis.createClient({
                host: param.host,
                port: param.port
              });
        }
    }

    get(client,key) {
        let dfd  = q.defer();
        // trycatch(function(){
            client.get(key,function(err,data){

                if (err){
                    dfd.reject({path:"RedisCore.get",err});
                }else{
                    dfd.resolve(data);
                }
                err = undefined;
                data = undefined;
                client = undefined;
                key = undefined;
                dfd = undefined;
            });
        // },function(err){
        //     dfd.reject({path:"RedisCore.get.trycatch",err:err.stack});
        //     err = undefined;
        //     client = undefined;
        //     key = undefined;
        // });
        return dfd.promise;
    }

    set(client,key,data){
        let dfd = q.defer();
        // trycatch(function(){
            client.set(key,JSON.stringify(data),function(err,res){
                if (err){
                    console.log(err);
                    dfd.reject({path:"RedisCore.set",err});
                }else{
                    dfd.resolve(res);
                }
                err = undefined;
                res = undefined;
                client = undefined;
                key = undefined;
                data = undefined;
                dfd = undefined;
            });
        // },function(err){
        //     dfd.reject({path:"RedisCore.set.trycatch",err:err.stack});
        //     err = undefined;
        //     client = undefined;
        //     key = undefined;
        //     data = undefined;
        // });
        return dfd.promise;
    }

    del(client,key) {
        let dfd = q.defer();
        // trycatch(function(){
            client.del(key, function(err, res) {
                if (err){
                    dfd.reject({path:"RedisCore.del",err});
                }else{
                    dfd.resolve(res);
                }
                err = undefined;
                res = undefined;
                client = undefined;
                key = undefined;
                dfd = undefined;
            });
        // },function(err){
        //     dfd.reject({path:"RedisCore.del.trycatch",err:err.stack});
        //     err = undefined;
        //     client = undefined;
        //     key = undefined;
        // });    
        return dfd.promise;
    }
}

exports.RedisCore = new RedisCore();