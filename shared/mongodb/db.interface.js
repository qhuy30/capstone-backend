const q = require('q');
const { MongoDBCore } = require('./mongodb.core');
const MongoDBConst = require('./mongodb.const');
const { CacheInterface } = require('../redis/cache.interface');
const { DBConfig } = require('../setup/db.const');
var initResource = require('../init').init;
const { algorithm } = require("../functions/functions");
const _suffixesCount = "_count";

const generateDBname = function (dbname_prefix, dbname) {
    if (dbname_prefix) {
        return dbname_prefix;
    }
    return dbname;
}

const cleanCachingSessionData = function (dbname_prefix, collection) {
    if (MongoDBConst.SessionCollections.includes(collection)) {
        return CacheInterface.del(
            generateDBname(dbname_prefix, MongoDBConst.connectName.management),
            MongoDBConst.nameCollection.user,
        );
    }
    return q.resolve();
};

class MongoDBInterface {
    constructor() { }

    getOne(dbname_prefix, dbname, collection, filter) {
        let dfd = q.defer();
        MongoDBCore.load(initResource.connectMongoDB.db(generateDBname(dbname_prefix, dbname)), { collection, filter, top: 2, offset: 0, sort: { _id: -1 } }).then(function (res) {
            if (res.length == 0) {
                dfd.reject({ path: "MongoDBInterface.getOne.DataIsNotExists", mes: "DataIsNotExists: " + filter.toString() + " on collection:" + collection });
            }
            else if (res.length > 1) {
                dfd.reject({ path: "MongoDBInterface.getOne.DataIsNotUnique", mes: "DataIsNotUnique: " + filter.toString() + " on collection:" + collection });
            }
            else {
                dfd.resolve(res[0]);
            }
        }, function (err) {
            dfd.reject({ path: "MongoDBInterface.getOne.trycatch", err: err.toString() });
            err = undefined;
        });
        return dfd.promise;
    }

    autonumber(dbname_prefix, dbname, collection) {
        return MongoDBCore.autonumber(
            initResource.connectMongoDB.db(
                generateDBname(dbname_prefix, dbname),
            ),
            collection,
            {
                nameCollection: MongoDBConst.sequenceId.nameCollection,
                valueInc: MongoDBConst.sequenceId.valueInc,
            },
        );
    }

    autonumberDaily(dbname_prefix, dbname, collection) {
        return MongoDBCore.autonumberDaily(
            initResource.connectMongoDB.db(
                generateDBname(dbname_prefix, dbname),
            ),
            collection,
            {
                nameCollection: MongoDBConst.sequenceId.nameCollection,
                valueInc: MongoDBConst.sequenceId.valueInc,
            },
        );
    }

    restore(dbname_prefix, dbname, param, data, options) {
        let dfd = q.defer();
        options = options || {};
        if (options.session) {
            let d = new Date();
            let dfdAr = [];
            let idAr = [];
            let dataAr = [];
            for (let i in data) {
                data[i].data.entity.push({
                    "modifiedby": param.username,
                    "modified": d.getTime()
                });
                idAr.push(new require('mongodb').ObjectID(data[i]._id));
                dataAr.push(data[i].data);
            }
            dfdAr.push(MongoDBCore.delete(initResource.connectMongoDB.db(generateDBname(dbname_prefix, MongoDBConst.connectName.management)), { username: param.username, collection: MongoDBConst.nameCollection.recyclebin }, { _id: { $in: idAr } }, options));
            dfdAr.push(MongoDBCore.insertMany(initResource.connectMongoDB.db(generateDBname(dbname_prefix, dbname)), param.collection, dataAr, options));
            
            dfdAr.push(cleanCachingSessionData(dbname_prefix ,param.collection));
            
            dfdAr.push(CacheInterface.del(generateDBname(dbname_prefix, dbname), param.collection));
            dfdAr.push(CacheInterface.del(generateDBname(dbname_prefix, dbname), param.collection + _suffixesCount));
            dfdAr.push(CacheInterface.del(generateDBname(dbname_prefix, MongoDBConst.connectName.management), MongoDBConst.nameCollection.recyclebin));
            dfdAr.push(CacheInterface.del(generateDBname(dbname_prefix, MongoDBConst.connectName.management), MongoDBConst.nameCollection.recyclebin + _suffixesCount));
            q.all(dataAr).then(function (res) {
                dfd.resolve(res);
                res = undefined;
                dfd = undefined;
            }, function (err) {
                dfd.reject({ path: "MongoDBInterface.restore.execute", err });
                err = undefined;
            });
            dbname = undefined;
            d = undefined;
            dfdAr = undefined;
            idAr = undefined;
            dataAr = undefined;
            param = undefined;
            data = undefined;
            options = undefined;
        } else {
            options = options || {};
            options.session = initResource.connectMongoDB.startSession({ mode: "primary" });
            options.session.startTransaction({
                readConcern: { level: 'snapshot' },
                writeConcern: { w: 'majority' },
                readPreference: 'primary'
            });
            let d = new Date();
            let dfdAr = [];
            let idAr = [];
            let dataAr = [];
            for (let i in data) {
                data[i].data._id = new require('mongodb').ObjectID(data[i].data._id);
                data[i].data.entity.his.push({
                    "restoredby": param.username,
                    "restored": d.getTime()
                });
                idAr.push(new require('mongodb').ObjectID(data[i]._id));
                dataAr.push(data[i].data);
            }
            dfdAr.push(MongoDBCore.delete(initResource.connectMongoDB.db(generateDBname(dbname_prefix, MongoDBConst.connectName.management)), { collection: MongoDBConst.nameCollection.recyclebin }, { _id: { $in: idAr } }, options));
            dfdAr.push(MongoDBCore.insertMany(initResource.connectMongoDB.db(generateDBname(dbname_prefix, dbname)), param.collection, dataAr, options));
            dfdAr.push(CacheInterface.del(generateDBname(dbname_prefix, dbname), param.collection));
            dfdAr.push(CacheInterface.del(generateDBname(dbname_prefix, dbname), param.collection + _suffixesCount));
            dfdAr.push(CacheInterface.del(generateDBname(dbname_prefix, MongoDBConst.connectName.management), MongoDBConst.nameCollection.recyclebin));
            dfdAr.push(CacheInterface.del(generateDBname(dbname_prefix, MongoDBConst.connectName.management), MongoDBConst.nameCollection.recyclebin + _suffixesCount));
            q.all(dataAr).then(async function (res) {
                await Promise.all([options.session.commitTransaction()]);
                options.session.endSession();
                dfd.resolve(res);
                res = undefined;
                dfd = undefined;
                options = undefined;
            }, async function (err) {
                await Promise.all([options.session.abortTransaction()]);
                options.session.endSession();
                dfd.reject({ path: "MongoDBInterface.restore.execute", err });
                err = undefined;
                options = undefined;
            });
            dbname = undefined;
            d = undefined;
            dfdAr = undefined;
            idAr = undefined;
            dataAr = undefined;
            param = undefined;
            data = undefined;
        }

        return dfd.promise;
    }

    insertMany(dbname_prefix, dbname, param, data, options) {
        let dfd = q.defer();
        MongoDBCore.insertMany(initResource.connectMongoDB.db(generateDBname(dbname_prefix, dbname)), param.collection, data, options).then(function (res) {
            let dfdAr = [];
            
            dfdAr.push(cleanCachingSessionData(dbname_prefix ,param.collection));
            dfdAr.push(CacheInterface.del(generateDBname(dbname_prefix, dbname), param.collection));
            dfdAr.push(CacheInterface.del(generateDBname(dbname_prefix, dbname), param.collection + _suffixesCount));
            q.all(dfdAr).then(function () {
                dfd.resolve(res);
                res = undefined;
                dfdAr = undefined;
                dbname = undefined;
                param = undefined;
                data = undefined;
                options = undefined;
                dfd = undefined;
            }, function (err) {
                dfd.reject({ path: "MongoDBInterface.insertMany.db", err });
                err = undefined;
                res = undefined;
                dfdAr = undefined;
                dbname = undefined;
                param = undefined;
                data = undefined;
                options = undefined;
            });
        }, function (err) {
            dfd.reject(err);
            err = undefined;
            dbname = undefined;
            param = undefined;
            data = undefined;
            options = undefined;
        });

        return dfd.promise;
    }

    insertEntity(dbname_prefix, dbname, param, data, options) {
        let dfd = q.defer();
        if (DBConfig.checkSubCache(dbname, param.collection)) {
            if (!param.subCache) {
                dfd.reject({ path: "MongoDBInterface.insertEntity.subCacheIsUndifined", err: "subCacheIsUndifined" });
                return dfd.promise;
            }
        }

        let subCache = "";
        param.subCache ? subCache = param.subCache : subCache = subCache;

        let d = new Date();
        if (!data.entity || data.entity.constructor !== Object) {
            data.entity = {};
        }
        let hisItem = {};
        hisItem.createdby = param.username;
        hisItem.created = d.getTime();
        d = undefined;
        hisItem.modifiedby = param.username;
        hisItem.modified = hisItem.created;
        data.entity.his = [hisItem];
        hisItem = undefined;
        MongoDBCore.insert(initResource.connectMongoDB.db(generateDBname(dbname_prefix, dbname)), param.collection, data, options).then(function (res) {
            let dfdAr = [];
            
            dfdAr.push(cleanCachingSessionData(dbname_prefix ,param.collection));
            dfdAr.push(CacheInterface.del(generateDBname(dbname_prefix, dbname), param.collection + subCache));
            dfdAr.push(CacheInterface.del(generateDBname(dbname_prefix, dbname), param.collection + subCache + _suffixesCount));
            q.all(dfdAr).then(function () {
                dfd.resolve(res);
                res = undefined;
                dfdAr = undefined;
                dbname = undefined;
                param = undefined;
                data = undefined;
                options = undefined;
                dfd = undefined;
                subCache = undefined;
            }, function (err) {
                dfd.reject({ path: "MongoDBInterface.insertEntity.db", err });
                err = undefined;
                res = undefined;
                dfdAr = undefined;
                dbname = undefined;
                param = undefined;
                data = undefined;
                options = undefined;
                subCache = undefined;
            });
        }, function (err) {
            dfd.reject(err);
            err = undefined;
            dbname = undefined;
            param = undefined;
            data = undefined;
            options = undefined;
            subCache = undefined;
        });

        return dfd.promise;
    }

    insert(dbname_prefix, dbname, param, data, options) {
        if (DBConfig.checkSubCache(dbname, param.collection)) {
            if (!param.subCache) {
                let dfd = q.defer();
                dfd.reject({ path: "MongoDBInterface.insert.subCacheIsUndifined", err: "subCacheIsUndifined" });
                return dfd.promise;
            }
        }

        if (DBConfig.checkNotEntity(dbname, param.collection)) {
            let dfd = q.defer();

            let subCache = "";
            param.subCache ? subCache = param.subCache : subCache = subCache;

            MongoDBCore.insert(initResource.connectMongoDB.db(generateDBname(dbname_prefix, dbname)), param.collection, data, options).then(function (res) {
                let dfdAr = [];
                dfdAr.push(CacheInterface.del(generateDBname(dbname_prefix, dbname), param.collection + subCache));
                dfdAr.push(CacheInterface.del(generateDBname(dbname_prefix, dbname), param.collection + subCache + _suffixesCount));
                
                dfdAr.push(cleanCachingSessionData(dbname_prefix ,param.collection));
                q.all(dfdAr).then(function () {
                    dfd.resolve(res);
                    res = undefined;
                    dfdAr = undefined;
                    dbname = undefined;
                    param = undefined;
                    data = undefined;
                    options = undefined;
                    dfd = undefined;
                    subCache = undefined;
                }, function (err) {
                    dfd.reject({ path: "MongoDBInterface.insert.db", err });
                    err = undefined;
                    res = undefined;
                    dfdAr = undefined;
                    dbname = undefined;
                    param = undefined;
                    data = undefined;
                    options = undefined;
                    subCache = undefined;
                });
            }, function (err) {
                dfd.reject(err);
                err = undefined;
                dbname = undefined;
                param = undefined;
                data = undefined;
                options = undefined;
                subCache = undefined;
            });

            return dfd.promise;
        } else {
            let obj = new MongoDBInterface();
            return obj.insertEntity(dbname_prefix, dbname, param, data, options);
        }

    }

    insertEntityWithSequenceNumber(dbname_prefix, dbname, param, data, options) {
        let dfd = q.defer();
        let obj = new MongoDBInterface();

        let d = new Date();
        if (!data.entity || data.entity.constructor !== Object) {
            data.entity = {};
        }
        let hisItem = {};
        hisItem.createdby = param.username;
        hisItem.created = d.getTime();
        d = undefined;
        hisItem.modifiedby = param.username;
        hisItem.modified = hisItem.created;
        data.entity.his = [hisItem];
        hisItem = undefined;
        obj.autonumber(dbname_prefix, dbname, param.collection).then(function (sequenceId) {
            data.id = sequenceId;
            sequenceId = undefined;
            obj.insertEntity(dbname_prefix, dbname, param, data, options).then(function (res) {
                dfd.resolve(res);
                err = undefined;
                obj = undefined;
                dbname = undefined;
                param = undefined;
                data = undefined;
                options = undefined;
                dfd = undefined;
            }, function (err) {
                dfd.reject(err);
                err = undefined;
                obj = undefined;
                dbname = undefined;
                param = undefined;
                data = undefined;
                options = undefined;
            });
        }, function (err) {
            dfd.reject(err);
            err = undefined;
            obj = undefined;
            dbname = undefined;
            param = undefined;
            data = undefined;
            options = undefined;
        });

        return dfd.promise;
    }

    insertWithSequenceNumber(dbname_prefix, dbname, param, data, options) {
        if (DBConfig.checkNotEntity(dbname, param.collection)) {
            let dfd = q.defer();
            let obj = new MongoDBInterface();
            obj.autonumber(dbname_prefix, dbname, param.collection).then(function (sequenceId) {
                data.id = sequenceId;
                sequenceId = undefined;
                obj.insert(dbname_prefix, dbname, param, data, options).then(function (res) {
                    dfd.resolve(res);
                    res = undefined;
                    obj = undefined;
                    dbname = undefined;
                    param = undefined;
                    data = undefined;
                    options = undefined;
                    dfd = undefined;
                }, function (err) {
                    dfd.reject(err);
                    err = undefined;
                    obj = undefined;
                    dbname = undefined;
                    param = undefined;
                    data = undefined;
                    options = undefined;

                });
            }, function (err) {
                dfd.reject(err);
                err = undefined;
                obj = undefined;
                dbname = undefined;
                param = undefined;
                data = undefined;
                options = undefined;
            });


            return dfd.promise;
        } else {
            let obj = new MongoDBInterface();
            return obj.insertEntityWithSequenceNumber(dbname_prefix, dbname, param, data, options);
        }

    }

    updateSafe(dbname_prefix, dbname, param, filter, data, options) {
        let dfd = q.defer();

        let subCache = "";
        param.subCache ? subCache = param.subCache : subCache = subCache;

        if (!options || !options.session) {
            options = options || {};
            options.session = initResource.connectMongoDB.startSession({ mode: "primary" });
            options.session.startTransaction({
                readConcern: { level: 'snapshot' },
                writeConcern: { w: 'majority' },
                readPreference: 'primary'
            });
            options.multi = true;
            let obj = new MongoDBInterface();

            obj.load(dbname_prefix, dbname, { filter, collection: param.collection, subCache: param.subCache }).then(function (dataBk) {
                let dfdAr = [];
                let d = new Date();
                for (var i in dataBk) {
                    let itemBk = {
                        time: d.getTime(),
                        username: param.username,
                        collection: param.collection,
                        data: dataBk[i]
                    };
                    dfdAr.push(MongoDBCore.insert(initResource.connectMongoDB.db(generateDBname(dbname_prefix, dbname)), MongoDBConst.nameCollection.backup, itemBk, { session: options.session }));
                    itemBk = undefined;
                }
                dfdAr.push(MongoDBCore.update(initResource.connectMongoDB.db(generateDBname(dbname_prefix, dbname)), param, filter, data, options));

                let itemHis = {
                    modified: d.getTime(),
                    modifiedby: param.username,
                }
                dfdAr.push(MongoDBCore.update(initResource.connectMongoDB.db(generateDBname(dbname_prefix, dbname)), param, filter, { $push: { "entity.his": itemHis } }, options));
                itemHis = undefined;
                q.all(dfdAr).then(function (res) {
                    dfdAr = undefined;
                    let dfdAr2 = [];
                    
                    dfdAr.push(cleanCachingSessionData(dbname_prefix ,param.collection));
                    dfdAr2.push(CacheInterface.del(generateDBname(dbname_prefix, dbname), param.collection + subCache));
                    dfdAr2.push(CacheInterface.del(generateDBname(dbname_prefix, dbname), param.collection + subCache + _suffixesCount));
                    dfdAr2.push(CacheInterface.del(generateDBname(dbname_prefix, MongoDBConst.connectName.management), MongoDBConst.nameCollection.backup + param.collection + subCache));
                    dfdAr2.push(CacheInterface.del(generateDBname(dbname_prefix, MongoDBConst.connectName.management), MongoDBConst.nameCollection.backup + param.collection + subCache + _suffixesCount));

                    q.all(dfdAr2).then(async function () {
                        await Promise.all([options.session.commitTransaction()]);
                        options.session.endSession();
                        dfd.resolve(res);
                        res = undefined;
                        dfdAr = undefined;
                        dbname = undefined;
                        param = undefined;
                        filter = undefined;
                        data = undefined;
                        options = undefined;
                        dfd = undefined;
                        obj = undefined;
                        subCache = undefined;
                    }, async function (err) {
                        await Promise.all([options.session.abortTransaction()]);
                        options.session.endSession();
                        dfd.reject({ path: "MongoDBInterface.updateSafe.db", err });
                        res = undefined;
                        err = undefined;
                        dfdAr = undefined;
                        dbname = undefined;
                        param = undefined;
                        filter = undefined;
                        data = undefined;
                        options = undefined;
                        obj = undefined;
                        subCache = undefined;
                    });
                }, async function (err) {
                    await Promise.all([options.session.abortTransaction()]);
                    options.session.endSession();
                    dfd.reject({ path: "MongoDBInterface.updateSafe.db", err });

                    err = undefined;
                    dfdAr = undefined;
                    dbname = undefined;
                    param = undefined;
                    filter = undefined;
                    data = undefined;
                    options = undefined;
                    obj = undefined;
                    subCache = undefined;
                });
            }, async function (err) {
                await Promise.all([options.session.abortTransaction()]);
                options.session.endSession();
                dfd.reject(err);
                dbname = undefined;
                param = undefined;
                filter = undefined;
                data = undefined;
                options = undefined;
                err = undefined;
                subCache = undefined;
            });
        } else {
            let obj = new MongoDBInterface();
            options = options || {};
            options.multi = true;

            obj.load(dbname_prefix, dbname, { filter, collection: param.collection, subCache: param.subCache }).then(function (dataBk) {
                let dfdAr = [];
                let d = new Date();
                for (var i in dataBk) {
                    let itemBk = {
                        time: d.getTime(),
                        username: param.username,
                        collection: param.collection,
                        data: dataBk[i]
                    };
                    dfdAr.push(MongoDBCore.insert(initResource.connectMongoDB.db(generateDBname(dbname_prefix, MongoDBConst.connectName.management)), MongoDBConst.nameCollection.backup, itemBk, { session: options.session }));
                    itemBk = undefined;
                }
                dfdAr.push(MongoDBCore.update(initResource.connectMongoDB.db(generateDBname(dbname_prefix, dbname)), param, filter, data, options));

                let itemHis = {
                    modified: d.getTime(),
                    modifiedby: param.username,
                }
                dfdAr.push(MongoDBCore.update(initResource.connectMongoDB.db(generateDBname(dbname_prefix, dbname)), param, filter, { $push: { "entity.his": itemHis } }, options));
                itemHis = undefined;
                q.all(dfdAr).then(function (res) {
                    dfdAr = undefined;
                    let dfdAr2 = [];
                    if (MongoDBConst.SessionCollections.includes(param.collection) && dbname === MongoDBConst.connectName.management) {
                        dfdAr.push(CacheInterface.del(generateDBname(dbname_prefix, MongoDBConst.connectName.management), MongoDBConst.nameCollection.user));
                    }
                    dfdAr2.push(CacheInterface.del(generateDBname(dbname_prefix, dbname), param.collection + subCache));
                    dfdAr2.push(CacheInterface.del(generateDBname(dbname_prefix, dbname), param.collection + subCache + _suffixesCount));
                    dfdAr2.push(CacheInterface.del(generateDBname(dbname_prefix, MongoDBConst.connectName.management), MongoDBConst.nameCollection.backup + param.collection + subCache));
                    dfdAr2.push(CacheInterface.del(generateDBname(dbname_prefix, MongoDBConst.connectName.management), MongoDBConst.nameCollection.backup + param.collection + subCache + _suffixesCount));
                    q.all(dfdAr2).then(function () {

                        dfd.resolve(res);
                        res = undefined;
                        dfdAr = undefined;
                        dbname = undefined;
                        param = undefined;
                        filter = undefined;
                        data = undefined;
                        options = undefined;
                        dfd = undefined;
                        subCache = undefined;
                    }, function (err) {
                        dfd.reject({ path: "MongoDBInterface.updateSafe.db", err });
                        res = undefined;
                        err = undefined;
                        dfdAr = undefined;
                        dbname = undefined;
                        param = undefined;
                        filter = undefined;
                        data = undefined;
                        options = undefined;
                        subCache = undefined;
                    });
                }, function (err) {
                    dfd.reject({ path: "MongoDBInterface.updateSafe.db", err });
                    err = undefined;
                    dfdAr = undefined;
                    dbname = undefined;
                    param = undefined;
                    filter = undefined;
                    data = undefined;
                    options = undefined;
                    subCache = undefined;
                });
            }, function (err) {
                dfd.reject(err);
                dbname = undefined;
                param = undefined;
                filter = undefined;
                data = undefined;
                options = undefined;
                err = undefined;
                subCache = undefined;
            });
        }

        return dfd.promise;
    }

    update(dbname_prefix, dbname, param, filter, data, options) {
        if (DBConfig.checkSubCache(dbname, param.collection)) {
            if (!param.subCache) {
                let dfd = q.defer();
                dfd.reject({ path: "MongoDBInterface.update.subCacheIsUndifined", err: "subCacheIsUndifined" });
                return dfd.promise;
            }
        }
        if (DBConfig.checkSafe(dbname, param.collection)) {
            let obj = new MongoDBInterface();
            return obj.updateSafe(dbname_prefix, dbname, param, filter, data, options);
        } else {
            let dfd = q.defer();
            let subCache = "";
            param.subCache ? subCache = param.subCache : subCache = subCache;

            options = options || {};
            options.multi = true;
            MongoDBCore.update(initResource.connectMongoDB.db(generateDBname(dbname_prefix, dbname)), param, filter, data, options).then(function (res) {
                let dfdAr = [];
                dfdAr.push(cleanCachingSessionData(dbname_prefix ,param.collection));
                dfdAr.push(CacheInterface.del(generateDBname(dbname_prefix, dbname), param.collection + subCache));
                dfdAr.push(CacheInterface.del(generateDBname(dbname_prefix, dbname), param.collection + subCache + _suffixesCount));
                dfdAr.push(CacheInterface.del(generateDBname(dbname_prefix, MongoDBConst.connectName.management), MongoDBConst.nameCollection.backup + param.collection + subCache));
                dfdAr.push(CacheInterface.del(generateDBname(dbname_prefix, MongoDBConst.connectName.management), MongoDBConst.nameCollection.backup + param.collection + subCache + _suffixesCount));
                q.all(dfdAr).then(function () {
                    dfd.resolve(res);
                    res = undefined;
                    dfdAr = undefined;
                    dbname = undefined;
                    param = undefined;
                    filter = undefined;
                    data = undefined;
                    options = undefined;
                    dfd = undefined;
                    subCache = undefined;
                }, function (err) {
                    dfd.reject({ path: "MongoDBInterface.update.db", err });
                    res = undefined;
                    err = undefined;
                    dfdAr = undefined;
                    dbname = undefined;
                    param = undefined;
                    filter = undefined;
                    data = undefined;
                    options = undefined;
                });
            }, function (err) {
                dfd.reject(err);
                err = undefined;
                dfdAr = undefined;
                dbname = undefined;
                param = undefined;
                filter = undefined;
                data = undefined;
                options = undefined;
            });
            return dfd.promise;
        }
    }

    deleteSoft(dbname_prefix, dbname, param, filter, options) {
        let dfd = q.defer();
        let obj = new MongoDBInterface();
        let data = { $set: {} };
        data.$set[MongoDBConst.nameField.SoftDelete] = true;
        obj.update(dbname_prefix, dbname, param, filter, data, options).then(function (res) {
            dfd.resolve(res);
            res = undefined;
            dbname = undefined;
            param = undefined;
            filter = undefined;
            options = undefined;
            data = undefined;
            dfd = undefined;
            obj = undefined;
        }, function (err) {
            dfd.reject(err);
            err = undefined;
            dbname = undefined;
            param = undefined;
            filter = undefined;
            options = undefined;
            data = undefined;
            obj = undefined;
        });
        return dfd.promise;
    }

    deleteSafe(dbname_prefix, dbname, param, filter, options) {
        let dfd = q.defer();
        let subCache = "";
        param.subCache ? subCache = param.subCache : subCache = subCache;

        if (options && options.session) {
            let dfdAr1 = [];
            dfdAr1.push(MongoDBCore.delete(initResource.connectMongoDB.db(generateDBname(dbname_prefix, dbname)), param, filter, options));
            for (var i in data) {
                let d = new Date();
                let recyclebinItem = {
                    dbname,
                    username: param.username,
                    data: data[i],
                    time: d.getTime(),
                    collection: param.collection
                };
                
                dfdAr.push(cleanCachingSessionData(dbname_prefix ,param.collection));
                dfdAr1.push(MongoDBCore.insert(initResource.connectMongoDB.db(generateDBname(dbname_prefix, MongoDBConst.connectName.management)), MongoDBConst.nameCollection.recyclebin, recyclebinItem, { session: options.session }));
                dfdAr1.push(CacheInterface.del(generateDBname(dbname_prefix, dbname), param.collection + subCache));
                dfdAr1.push(CacheInterface.del(generateDBname(dbname_prefix, dbname), param.collection + subCache + _suffixesCount));
                dfdAr1.push(CacheInterface.del(generateDBname(dbname_prefix, MongoDBConst.connectName.management), MongoDBConst.nameCollection.recyclebin + param.collection + subCache));
                dfdAr1.push(CacheInterface.del(generateDBname(dbname_prefix, MongoDBConst.connectName.management), MongoDBConst.nameCollection.recyclebin + param.collection + subCache + _suffixesCount));
                d = undefined;
                recyclebinItem = undefined;
            }
            q.all(dfdAr1).then(function () {
                dfd.resolve(true);
                dfdAr1 = undefined;
                dfd = undefined;
                dbname = undefined;
                param = undefined;
                filter = undefined;
                options = undefined;
                subCache = undefined;
            }, function (err) {
                dfd.reject({ path: "MongoDBInterface.deleteSafe.db", err });
                dfdAr1 = undefined;
                err = undefined;
                dbname = undefined;
                param = undefined;
                filter = undefined;
                options = undefined;
                subCache = undefined;
            });
        } else {
            MongoDBCore.load(initResource.connectMongoDB.db(generateDBname(dbname_prefix, dbname)), { collection: param.collection, filter }).then(function (data) {

                var session = initResource.connectMongoDB.startSession({ mode: "primary" });
                session.startTransaction({
                    readConcern: { level: 'snapshot' },
                    writeConcern: { w: 'majority' },
                    readPreference: 'primary'
                });
                options = options || {};
                options.session = session;
                let dfdAr1 = [];

                dfdAr1.push(MongoDBCore.delete(initResource.connectMongoDB.db(generateDBname(dbname_prefix, dbname)), param, filter, options));
                for (var i in data) {
                    let d = new Date();
                    let recyclebinItem = {
                        dbname,
                        username: param.username,
                        data: data[i],
                        time: d.getTime(),
                        collection: param.collection
                    };

                    dfdAr1.push(MongoDBCore.insert(initResource.connectMongoDB.db(generateDBname(dbname_prefix, MongoDBConst.connectName.management)), MongoDBConst.nameCollection.recyclebin, recyclebinItem, { session }));
                    recyclebinItem = undefined;
                }

                q.all(dfdAr1).then(function () {
                    let dfdAr2 = [];
                    
                    dfdAr.push(cleanCachingSessionData(dbname_prefix ,param.collection));
                    dfdAr2.push(CacheInterface.del(generateDBname(dbname_prefix, dbname), param.collection + subCache));
                    dfdAr2.push(CacheInterface.del(generateDBname(dbname_prefix, dbname), param.collection + subCache + _suffixesCount));
                    dfdAr2.push(CacheInterface.del(generateDBname(dbname_prefix, MongoDBConst.connectName.management), MongoDBConst.nameCollection.recyclebin));
                    dfdAr2.push(CacheInterface.del(generateDBname(dbname_prefix, MongoDBConst.connectName.management), MongoDBConst.nameCollection.recyclebin + _suffixesCount));
                    q.all(dfdAr2).then(async function () {

                        await Promise.all([session.commitTransaction()]);
                        session.endSession();
                        session = undefined;

                        dfd.resolve(true);
                        dfdAr = undefined;
                        dbname = undefined;
                        param = undefined;
                        filter = undefined;
                        options = undefined;
                        dfd = undefined;
                        subCache = undefined;
                    }, async function (err) {
                        await Promise.all([session.abortTransaction()]);
                        session.endSession();
                        session = undefined;
                        dfd.reject({ path: "MongoDBInterface.deleteSafe.db", err });
                        err = undefined;
                        res = undefined;
                        dfdAr = undefined;
                        dbname = undefined;
                        param = undefined;
                        filter = undefined;
                        options = undefined;
                        subCache = undefined;
                    });

                }, async function (err) {
                    await Promise.all([session.abortTransaction()]);
                    session.endSession();
                    dfd.reject({ path: "MongoDBInterface.deleteSafe.db", err });
                    err = undefined;
                    dbname = undefined;
                    param = undefined;
                    filter = undefined;
                    options = undefined;
                    subCache = undefined;
                });
            }, function (err) {
                dfd.reject(err);
                err = undefined;
                dbname = undefined;
                param = undefined;
                filter = undefined;
                options = undefined;
                subCache = undefined;
            });
        }
        return dfd.promise;
    }

    delete(dbname_prefix, dbname, param, filter, options) {
        if (DBConfig.checkSubCache(dbname, param.collection)) {
            if (!param.subCache) {
                let dfd = q.defer();
                dfd.reject({ path: "MongoDBInterface.delete.subCacheIsUndifined", err: "subCacheIsUndifined" });
                return dfd.promise;
            }
        }
        if (DBConfig.checkSoftDelete(dbname, param.collection)) {
            let obj = new MongoDBInterface();
            return obj.deleteSoft(dbname_prefix, dbname, param, filter, options);
        }
        else {

            if (DBConfig.checkSafe(dbname, param.collection)) {
                let obj = new MongoDBInterface();
                return obj.deleteSafe(dbname_prefix, dbname, param, filter, options);
            } else {
                let dfd = q.defer();
                let subCache = "";
                param.subCache ? subCache = param.subCache : subCache = subCache;
                MongoDBCore.delete(initResource.connectMongoDB.db(generateDBname(dbname_prefix, dbname)), param, filter, options).then(function (res) {
                    let dfdAr = [];
                    dfdAr.push(CacheInterface.del(generateDBname(dbname_prefix, dbname), param.collection + subCache));
                    dfdAr.push(CacheInterface.del(generateDBname(dbname_prefix, dbname), param.collection + subCache + _suffixesCount));
                    
                    dfdAr.push(cleanCachingSessionData(dbname_prefix ,param.collection));
                    q.all(dfdAr).then(function () {
                        dfd.resolve(res);
                        res = undefined;
                        dfdAr = undefined;
                        dbname = undefined;
                        param = undefined;
                        filter = undefined;
                        options = undefined;
                        dfd = undefined;
                        subCache = undefined;
                    }, function (err) {
                        dfd.reject({ path: "MongoDBInterface.delete.db", err });
                        err = undefined;
                        res = undefined;
                        dfdAr = undefined;
                        dbname = undefined;
                        param = undefined;
                        filter = undefined;
                        options = undefined;
                        subCache = undefined;
                    });
                }, function (err) {
                    dfd.reject(err);
                    err = undefined;
                    dbname = undefined;
                    param = undefined;
                    filter = undefined;
                    options = undefined;
                    subCache = undefined;
                });
                return dfd.promise;
            }
        }
    }

    load(dbname_prefix, dbname, query) {
        let dfd = q.defer();
        query.filter = query.filter || {};
        query.top = query.top || MongoDBConst.limitItem;
        if (query.unlimited) { query.top = 0; }
        if (DBConfig.checkSubCache(dbname, query.collection)) {
            if (!query.subCache) {
                dfd.reject({ path: "MongoDBInterface.load.subCacheIsUndifined", err: "subCacheIsUndifined" });
                return dfd.promise;
            }
        }

        let subCache = "";
        query.subCache ? subCache = query.subCache : subCache = subCache;

        if (DBConfig.checkSoftDelete(dbname, query.collection)) {
            let tempfilter = {
                $and: [
                    {}
                ]
            };
            tempfilter.$and[0][MongoDBConst.nameField.SoftDelete] = { $ne: true };
            tempfilter.$and.push(query.filter);
            query.filter = tempfilter;
            tempfilter = undefined;
        }
        CacheInterface.get(
            generateDBname(dbname_prefix, dbname),
            query.collection + subCache,
            {
                filter: query.filter || {},
                sort: query.sort || {},
                top: query.top,
                offset: query.offset || 0,
                keys: query.keys || {}
            }).then(function (res_Cache) {
                dfd.resolve(res_Cache);
                query = undefined;
                res_Cache = undefined;
                dfd = undefined;
                subCache = undefined;
            }, function () {

                MongoDBCore.load(initResource.connectMongoDB.db(generateDBname(dbname_prefix, dbname)), query).then(function (res) {

                    CacheInterface.put(generateDBname(dbname_prefix, dbname),
                        query.collection + subCache,
                        {
                            filter: query.filter || {},
                            sort: query.sort || {},
                            top: query.top,
                            offset: query.offset || 0,
                            keys: query.keys || {}
                        }, res).then(function () {
                            dfd.resolve(res);
                            res = undefined;
                            query = undefined;
                            dfd = undefined;
                            subCache = undefined;
                        }, function (err) {
                            dfd.reject(err);
                        });
                }, function (err) {
                    dfd.reject(err);
                    err = undefined;
                    query = undefined;
                    subCache = undefined;
                });
            });

        return dfd.promise;
    }

    count(dbname_prefix, dbname, query) {
        let dfd = q.defer();
        if (DBConfig.checkSubCache(dbname, query.collection)) {
            if (!query.subCache) {
                dfd.reject({ path: "MongoDBInterface.count.subCacheIsUndifined", err: "subCacheIsUndifined" });
                return dfd.promise;
            }
        }

        let subCache = "";
        query.subCache ? subCache = query.subCache : subCache = subCache;
        if (DBConfig.checkSoftDelete(dbname, query.collection)) {
            let tempfilter = {
                $and: [
                    {}
                ]
            };
            tempfilter.$and[0][MongoDBConst.nameField.SoftDelete] = { $ne: true };
            tempfilter.$and.push(query.filter);
            query.filter = tempfilter;
            tempfilter = undefined;
        }

        CacheInterface.get(
            generateDBname(dbname_prefix, dbname),
            query.collection + subCache + _suffixesCount,
            {
                filter: query.filter || {},
                sort: query.sort || {},
                top: query.top || 0,
                offset: query.offset || 0
            }).then(function (res_Cache) {
                dfd.resolve(res_Cache);
                query = undefined;
                res_Cache = undefined;
                dfd = undefined;
                subCache = undefined;
            }, function () {
                MongoDBCore.count(initResource.connectMongoDB.db(generateDBname(dbname_prefix, dbname)), query).then(function (res) {
                    CacheInterface.put(generateDBname(dbname_prefix, dbname),
                        query.collection + subCache + _suffixesCount,
                        {
                            filter: query.filter || {},
                            sort: query.sort || {},
                            top: query.top || 0,
                            offset: query.offset || 0
                        }, res).then(function () {
                            dfd.resolve(res);
                            res = undefined;
                            query = undefined;
                            dfd = undefined;
                            subCache = undefined;
                        });
                }, function (err) {
                    dfd.reject(err);
                    err = undefined;
                    query = undefined;
                    subCache = undefined;
                });
            });

        return dfd.promise;
    }

    load_aggregate(dbname_prefix, dbname, query) {
        let dfd = q.defer();
        // CacheInterface.get(
        //     generateDBname(dbname_prefix, dbname),
        //     query.collection,
        //     {
        //         filter: query.filter || {}
        //     }).then(function (res_Cache) {

        //         let temp = algorithm.copyValue(res_Cache);

        //         dfd.resolve(temp);
        //         temp = undefined;
        //         query = undefined;
        //         res_Cache = undefined;
        //         dfd = undefined;
        //     }, function () {

                MongoDBCore.aggregate(initResource.connectMongoDB.db(generateDBname(dbname_prefix, dbname)), query.collection, query.filter).then(function (res) {

                    // CacheInterface.put(generateDBname(dbname_prefix, dbname),
                    //     query.collection,
                    //     {
                    //         filter: query.filter || {}
                    //     }, res).then(function () {

                            let temp = algorithm.copyValue(res);

                            dfd.resolve(temp);
                        //     res = undefined;
                        //     temp = undefined;
                        //     query = undefined;
                        //     dfd = undefined;
                        // });
                }, function (err) {
                    dfd.reject(err);
                    err = undefined;
                    query = undefined;
                });
            // });

        return dfd.promise;
    }

    startTransaction() {
        var session = initResource.connectMongoDB.startSession({ mode: "primary" });
        session.startTransaction(
            {
                readConcern: { level: 'snapshot' },
                writeConcern: { w: 'majority' },
                readPreference: 'primary'
            });
        return session;
    }

    executeTransaction(executeFunction) {
        let dfd = q.defer();
        let obj = new MongoDBInterface();
        var session = obj.startTransaction();
        executeFunction(session).then(async function () {
            await Promise.all([session.commitTransaction()]);
            session.endSession();
            session = undefined;
            dfd.resolve(true);
        }, async function (err) {
            await Promise.all([session.abortTransaction()]);
            session.endSession();
            dfd.reject(err);
        });
        return dfd.promise;
    }

    createIndex(dbname_prefix, dbname, collection, keys, type) {
        return MongoDBCore.createIndex(initResource.connectMongoDB.db(generateDBname(dbname_prefix, dbname)), collection, keys, type || { background: true });
    }

    removeIndex(dbname_prefix, dbname, collection, filter) {
        return MongoDBCore.removeIndex(initResource.connectMongoDB.db(generateDBname(dbname_prefix, dbname)), collection, filter);
    }

    createCollection(dbname_prefix, dbname, collection) {
        return MongoDBCore.createCollection(initResource.connectMongoDB.db(generateDBname(dbname_prefix, dbname)), collection);
    }

    listCollection(dbname_prefix, dbname) {
        return MongoDBCore.listCollection(initResource.connectMongoDB.db(generateDBname(dbname_prefix, dbname)));
    }

    clearAllData(dbname_prefix, dbname) {
        return MongoDBCore.clearAllData(initResource.connectMongoDB.db(generateDBname(dbname_prefix, dbname)), dbname);
    }

    clearAllIndexes(dbname_prefix, dbname) {
        return MongoDBCore.clearAllIndexes(initResource.connectMongoDB.db(generateDBname(dbname_prefix, dbname)), dbname);
    }
}

exports.MongoDBInterface = new MongoDBInterface();