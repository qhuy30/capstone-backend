const trycatch = require('trycatch');
const q = require('q');
var initResource = require('../init').init;
const { RedisCore } = require('./redis.core');
const { prefixSession } = require('../redis/redis.const');
const { nameCollection } = require('../mongodb/mongodb.const');

class SessionInterface {
    constructor() { }

    get(dbname, username) {
        let dfd = q.defer();
        trycatch(function () {
            RedisCore.get(initResource.connectRedis, dbname + "+" + nameCollection.user).then(function (res) {
                if (res == null) {
                    dfd.reject({ path: "SessionInterface.get.nulldata", err: "nulldata" });
                } else {
                    res = JSON.parse(res);
                    res = JSON.parse(res);
                    if (res[prefixSession + username]) {
                        dfd.resolve(res[prefixSession + username]);
                    } else {
                        dfd.reject({ path: "SessionInterface.get.notsession", err: "notsession" });
                    }
                }
                res = undefined;
                username = undefined;
            }, function (err) {
                dfd.reject(err);
                err = undefined;
                username = undefined;
            });
        }, function (err) {
            dfd.reject({ path: "SessionInterface.get.trycatch", err: err.stack });
            err = undefined;
            username = undefined;
        });
        return dfd.promise;
    }

    set(dbname, username, data) {
        let dfd = q.defer();
        trycatch(function () {
            RedisCore.get(initResource.connectRedis, dbname + "+" + nameCollection.user).then(function (cacheData) {
                var temp = {};
                if (cacheData!=null){
                    temp = JSON.parse(cacheData);
                    temp = JSON.parse(temp);
                }
                
                temp[prefixSession + username] = data;
                temp = JSON.stringify(temp);
                RedisCore.set(initResource.connectRedis, dbname + "+" + nameCollection.user, temp).then(function (res) {
                    dfd.resolve(res);
                    res = undefined;
                    username = undefined;
                    data = undefined;
                    dfd = undefined;
                }, function (err) {
                    dfd.reject(err);
                    err = undefined;
                    username = undefined;
                    data = undefined;
                });
                temp = undefined;
                cacheData = undefined;
            }, function (err) {
                dfd.reject(err);
                err = undefined;
                username = undefined;
            });

        }, function (err) {
            dfd.reject({ path: "SessionInterface.set.trycatch", err: err.stack });
            err = undefined;
            username = undefined;
        });
        return dfd.promise;
    }

    del(dbname, username) {
        let dfd = q.defer();
        trycatch(function () {
            RedisCore.get(initResource.connectRedis, dbname + "+" + nameCollection.user).then(function (cacheData) {
                if (cacheData == null) {
                    cacheData = {};
                } else {
                    cacheData = JSON.parse(cacheData);
                }
                delete cacheData[prefixSession + username];
                cacheData = JSON.stringify(cacheData);
                RedisCore.set(initResource.connectRedis, dbname + "+" + nameCollection.user, cacheData).then(function (res) {
                    dfd.resolve(res);
                    res = undefined;
                    username = undefined;
                    cacheData = undefined;
                    dfd = undefined;
                }, function (err) {
                    dfd.reject(err);
                    err = undefined;
                    username = undefined;
                    cacheData = undefined;
                });
            }, function (err) {
                dfd.reject(err);
                err = undefined;
                username = undefined;
            });

        }, function (err) {
            dfd.reject({ path: "SessionInterface.del.trycatch", err: err.stack });
            err = undefined;
            username = undefined;
        });
        return dfd.promise;
    }

    clear(dbname) {
        let dfd = q.defer();
        trycatch(function () {
            RedisCore.del(initResource.connectRedis, dbname + "+" + nameCollection.user).then(function (res) {
                dfd.resolve(res);
                res = undefined;
                dbname = undefined;
                dfd = undefined;
            }, function (err) {
                dfd.reject(err);
                err = undefined;
                dbname = undefined;
            });
        }, function (err) {
            dfd.reject({ path: "SessionInterface.clear.trycatch", err: err.stack });
            err = undefined;
            dbname = undefined;
        });
        return dfd.promise;
    }
}

exports.SessionInterface = new SessionInterface();