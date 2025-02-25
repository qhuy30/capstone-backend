//version 1.0
const mongodb = require('mongodb');
const q = require('q');
const MongoClient = mongodb.MongoClient;
const trycatch = require('trycatch');
const MongoConst = require('./mongodb.const');
const algorithm = require('../functions/functions').algorithm;
const checkExceedThreshold = function (query) {

    if (query.unlimited) {
        return true;
    }
    if (query.top > MongoConst.limitItem) {
        return false;
    }
    return true;
}
class MongoDBCore {
    constructor() { }

    getConnect(param) {
        let dfd = q.defer();
        trycatch(function () {
            MongoClient.connect(param.connectString, {
                poolSize: MongoConst.poolSize,
                bufferMaxEntries: MongoConst.bufferMaxEntries,
                useNewUrlParser: MongoConst.useNewUrlParser,
                useUnifiedTopology: MongoConst.useUnifiedTopology
            }, function (err, db) {
                if (err) {
                    dfd.reject({ path: "MongoDBCore.getConnect", err: JSON.stringify(err) });
                } else {
                    dfd.resolve(db);
                }
                err = undefined;
                db = undefined;
                param = undefined;
            });
        }, function (err) {
            dfd.reject({ path: "MongoDBCore.getConnect.trycatch", err: err.stack });
            err = undefined;
            param = undefined;
        });
        return dfd.promise;
    }

    autonumber(db, collection, param) {
        let dfd = q.defer();
        trycatch(function () {
            db.collection(param.nameCollection).findOneAndUpdate({ "name": collection },
                { $set: { "name": collection }, $inc: { "value": param.valueInc } },
                { upsert: true, new: true },
                function (err, result) {
                    if (err) {
                        dfd.reject({ path: "MongoDBCore.autonumber", err });
                    } else {
                        if (result.lastErrorObject.updatedExisting) {
                            dfd.resolve(result.value.value + 1);
                        } else {
                            dfd.resolve(1);
                        }
                    }

                    err = undefined;
                    result = undefined;
                    db = undefined;
                    collection = undefined;
                    param = undefined;
                    dfd = undefined;
                });
        }, function (err) {
            dfd.reject({ path: "MongoDBCore.autonumber.trycatch", err: err.stack });
            err = undefined;
            db = undefined;
            collection = undefined;
            param = undefined;
        });
        return dfd.promise;
    }

    autonumberDaily(db, collection, param) {
        let dfd = q.defer();
        trycatch(function () {
            const today = new Date();
            const myToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
            db.collection(param.nameCollection).findOneAndUpdate(
                { "name": collection, "date": myToday },
                { $set: { "name": collection }, $inc: { "value": param.valueInc } },
                { upsert: true, new: true },
                function (err, result) {
                    if (err) {
                        dfd.reject({ path: "MongoDBCore.autonumber", err });
                    } else {
                        if (result.lastErrorObject.updatedExisting) {
                            dfd.resolve(result.value.value + 1);
                        } else {
                            dfd.resolve(1);
                        }
                    }

                    err = undefined;
                    result = undefined;
                    db = undefined;
                    collection = undefined;
                    param = undefined;
                    dfd = undefined;
                });
        }, function (err) {
            dfd.reject({ path: "MongoDBCore.autonumber.trycatch", err: err.stack });
            err = undefined;
            db = undefined;
            collection = undefined;
            param = undefined;
        });
        return dfd.promise;
    }

    insert(db, collection, data, options) {
        let dfd = q.defer();
        trycatch(function () {
            db.collection(collection).insertOne(data, options, function (err, res) {
                if (err) {
                    dfd.reject({ path: "MongoDBCore.insertOne", err });
                }
                else {
                    dfd.resolve(res);
                }
                err = undefined;
                res = undefined;
                db = undefined;
                collection = undefined;
                data = undefined;
                options = undefined;
            });
        }, function (err) {
            dfd.reject({ path: "MongoDBCore.insert.trycatch", err: err.stack });
            err = undefined;
            db = undefined;
            collection = undefined;
            data = undefined;
            options = undefined;
        });
        return dfd.promise;
    }

    insertMany(db, collection, data, options) {
        let dfd = q.defer();
        trycatch(function () {
            db.collection(collection).insertMany(data, options, function (err, res) {
                if (err) {
                    dfd.reject({ path: "MongoDBCore.insertMany", err });
                }
                else {
                    dfd.resolve(res);
                }
                err = undefined;
                res = undefined;
                db = undefined;
                collection = undefined;
                data = undefined;
                options = undefined;
            });
        }, function (err) {
            dfd.reject({ path: "MongoDBCore.insertMany.trycatch", err: err.stack });
            err = undefined;
            db = undefined;
            collection = undefined;
            data = undefined;
            options = undefined;
        });
        return dfd.promise;
    }

    update(db, param, filter, data, options) {

        let dfd = q.defer();
        trycatch(function () {
            db.collection(param.collection).update(
                filter,
                data, options, function (err, results) {
                    if (!err) {
                        dfd.resolve(results);
                    }
                    else {
                        console.log(err);
                        dfd.reject({ path: "MongoDBCore.update", err:JSON.stringify(err) });
                    }
                    err = undefined;
                    results = undefined;
                    db = undefined;
                    filter = undefined;
                    param = undefined;
                    data = undefined;
                    options = undefined;
                }
            );
        }, function (err) {
            console.log(err);
            dfd.reject({ path: "MongoDBCore.update.trycatch", err: JSON.stringify(err.stack)  });
            err = undefined;
            db = undefined;
            filter = undefined;
            param = undefined;
            data = undefined;
            options = undefined;
        });
        return dfd.promise;
    }

    delete(db, param, filter, options) {
        let dfd = q.defer();
        trycatch(function () {
            db.collection(param.collection).deleteMany(
                filter,
                options,
                function (err, results) {
                    if (!err) {
                        dfd.resolve(results);
                    }
                    else {
                        dfd.reject({ path: "MongoDBCore.delete", err });
                    }
                    err = undefined;
                    results = undefined;
                    db = undefined;
                    param = undefined;
                    filter = undefined;
                    options = undefined;
                }
            );
        }, function (err) {
            dfd.reject({ path: "MongoDBCore.delete.trycatch", err: err.stack });
            err = undefined;
            db = undefined;
            param = undefined;
            filter = undefined;
            options = undefined;
        });
        return dfd.promise;
    }

    load(db, query) {
        let dfd = q.defer();
        query.top = query.top || MongoConst.limitItem;
        if (query.unlimited) {query.top=0;}
        if (checkExceedThreshold(query)) {

            query.keys = query.keys || {};

            if (algorithm.countPropertyObject(query.keys) > 0) {
                for (var i in MongoConst.sensetiveField) {
                    delete query.keys[MongoConst.sensetiveField[i]];
                }
            } else {
                for (var i in MongoConst.sensetiveField) {
                    query.keys[MongoConst.sensetiveField[i]] = false;
                }
            }
            
            trycatch(function () {
                db.collection(query.collection).find(query.filter || {}).sort(query.sort || {}).skip(query.offset || 0).limit(query.top || 0).project(query.keys || {}).toArray(function (err, results) {
                    if (!err) {

                        dfd.resolve(results);
                    }
                    else {
                        dfd.reject({ path: "MongoDBCore.load", err });
                        console.log(err);
                    }
                    err = undefined;
                    results = undefined;
                    db = undefined;
                    query = undefined;
                });
            }, function (err) {
                dfd.reject({ path: "MongoDBCore.load.trycacth", err: err.stack });

                err = undefined;
                db = undefined;
                query = undefined;
            });
        } else {
            dfd.reject({ path: "MongoDBCore.load.exceedThreshold", err: "exceedThreshold" });
            query = undefined;
        }
        return dfd.promise;
    }

    count(db, query) {
        let dfd = q.defer();

        query.keys = query.keys || {};
        if (algorithm.countPropertyObject(query.keys) > 0) {
            for (var i in MongoConst.sensetiveField) {
                delete query.keys[MongoConst.sensetiveField[i]];
            }
        } else {
            for (var i in MongoConst.sensetiveField) {
                query.keys[MongoConst.sensetiveField[i]] = false;
            }
        }


        trycatch(function () {
            db.collection(query.collection).find(query.filter || {}).count(function (err, results) {
                if (!err) {
                    dfd.resolve(results);
                }
                else {
                    dfd.reject({ path: "MongoDBCore.count", err });
                }
                err = undefined;
                results = undefined;
                db = undefined;
                query = undefined;
            });
        }, function (err) {
            dfd.reject({ path: "MongoDBCore.count.trycacth", err: err.stack });
            err = undefined;
            db = undefined;
            query = undefined;
        });

        return dfd.promise;
    }

    getIndex(db, collection) {
        let dfd = q.defer();
        trycatch(function () {
            db.collection(collection).indexes(function (err, indexes) {
                if (err) {
                    dfd.reject({ path: "MongoDBCore.getIndex", err });
                } else {
                    dfd.resolve(indexes);
                }
                err = undefined;
                indexes = undefined;
                db = undefined;
                collection = undefined;
            });
        }, function (err) {
            dfd.reject({ path: "MongoDBCore.getIndex.trycatch", err: err.stack });
            err = undefined;
            db = undefined;
            collection = undefined;
        });
        return dfd.promise;
    }

    createIndex(db, collection, keys, types) {
        let dfd = q.defer();
        trycatch(function () {
            db.collection(collection).createIndex(keys, types || {}, function (err, results) {
                if (err) {
                    console.log(err);
                    dfd.reject({ path: "MongoDBCore.createIndex", err });
                }
                else {
                    dfd.resolve(results);
                }

                err = undefined;
                results = undefined;
                db = undefined;
                collection = undefined;
                keys = undefined;
                types = undefined;
            });
        }, function (err) {
            dfd.reject({ path: "MongoDBCore.createIndex.trycacth", err: err.stack });
            err = undefined;
            db = undefined;
            collection = undefined;
            keys = undefined;
            types = undefined;
        });
        return dfd.promise;
    }

    removeIndex(db, collection, filter) {
        let dfd = q.defer();
        trycatch(function () {
            db.collection(collection).dropIndex(
                filter,
                function (err, results) {
                    if (err) {
                        dfd.reject({ path: "MongoDBCore.removeIndex", err });
                    } else {
                        dfd.resolve(results);
                    }
                    err = undefined;
                    results = undefined;
                    db = undefined;
                    collection = undefined;
                    filter = undefined;
                }
            );
        }, function (err) {
            dfd.reject({ path: "MongoDBCore.removeIndex.trycacth", err: err.stack });
            err = undefined;
            db = undefined;
            collection = undefined;
            filter = undefined;
        });
        return dfd.promise;
    }


    aggregate(db, collection, pipiline, options) {
        let dfd = q.defer();
        trycatch(function () {
            options = options || {};
            db.collection(collection).aggregate(pipiline, options).toArray(function (err, res) {
                if (err) {
                    console.log(err);
                    dfd.reject({ path: "MongoDBCore.aggregate", err: err.toString() });
                } else {
                    dfd.resolve(res);
                }
                err = undefined;
                res = undefined;
                db = undefined;
                collection = undefined;
                pipiline = undefined;
                options = undefined;
            });
        }, function (err) {
            dfd.reject({ path: "MongoDBCore.aggregate.trycacth", err: err.stack });
            err = undefined;
            db = undefined;
            collection = undefined;
            pipiline = undefined;
            options = undefined;
        });
        return dfd.promise;
    }

    createCollection(con, name) {
        let dfd = q.defer();
        trycatch(function () {
            con.createCollection(name, function (err, res) {
                if (err) {
                    dfd.reject({ path: "MongoDBCore.createCollection", err });
                } else {
                    dfd.resolve(res);
                }
                err = undefined;
                res = undefined;
                con = undefined;
                name = undefined;
            });
        }, function (err) {
            dfd.reject({ path: "MongoDBCore.createCollection.trycacth", err: err.stack });
            err = undefined;
            con = undefined;
            name = undefined;
        });
        return dfd.promise;
    }

    listCollection(con) {
        let dfd = q.defer();
        trycatch(function () {
            con.listCollections().toArray(function (err, res) {
                if (err) {
                    dfd.reject({ path: "MongoDBCore.listCollection", err });
                } else {
                    dfd.resolve(res);
                }
                err = undefined;
                res = undefined;
                con = undefined;
            });
        }, function (err) {
            dfd.reject({ path: "MongoDBCore.listCollection.trycacth", err: err.stack });
            err = undefined;
            con = undefined;
        });
        return dfd.promise;
    }

    clearAllData(con, dbName) {
        let dfd = q.defer();
        trycatch(function () {
            // Chọn database 
            
            // Lấy danh sách collections
            con.listCollections().toArray(function(err, collections) {
                if (err) {
                    dfd.reject({ path: "MongoDBCore.clearAllData.listCollections", err });
                    return;
                }
    
                // Tạo mảng các deferred để xóa dữ liệu từng collection
                let deferreds = collections.map(collection => {
                    let collectionDfd = q.defer();
                    con.collection(collection.name).deleteMany({}, function(err, result) {
                        if (err) {
                            collectionDfd.reject({ 
                                path: "MongoDBCore.clearAllData.deleteMany", 
                                collection: collection.name,
                                err 
                            });
                        } else {
                            collectionDfd.resolve({
                                collection: collection.name,
                                deletedCount: result.deletedCount
                            });
                        }
                    });
                    return collectionDfd.promise;
                });
    
                // Đợi tất cả các operations hoàn thành
                q.all(deferreds)
                    .then(function(results) {
                        const totalDeleted = results.reduce((sum, result) => 
                            sum + result.deletedCount, 0
                        );
                        dfd.resolve({
                            message: "Clear all data",
                            details: results,
                            totalDeleted: totalDeleted
                        });
                    })
                    .catch(function(err) {
                        dfd.reject({ 
                            path: "MongoDBCore.clearAllData.deleteAll", 
                            err 
                        });
                    })
                    .finally(function() {
                        collections = undefined;
                        deferreds = undefined;
                        db = undefined;
                        con = undefined;
                        dbName = undefined;
                    });
            });
        }, function (err) {
            dfd.reject({ 
                path: "MongoDBCore.clearAllData.trycatch", 
                err: err.stack 
            });
            err = undefined;
            con = undefined;
            dbName = undefined;
        });
        return dfd.promise;
    }

    clearAllIndexes(con, dbName) {
        let dfd = q.defer();
        
        trycatch(function () {
            // Get list of collections
            con.listCollections().toArray(function(err, collections) {
                if (err) {
                    dfd.reject({ 
                        path: "MongoDBCore.clearAllIndexes.listCollections", 
                        err 
                    });
                    return;
                }
                
                // Create array of deferreds to drop indexes for each collection
                let deferreds = collections.map(function(collection) {
                    let collectionDfd = q.defer();
                    
                    // Drop all indexes except the default _id index
                    con.collection(collection.name).dropIndexes(
                        function(err, result) {
                            if (err) {
                                collectionDfd.reject({
                                    path: "MongoDBCore.clearAllIndexes.dropIndexes",
                                    collection: collection.name,
                                    err
                                });
                            } else {
                                collectionDfd.resolve({
                                    collection: collection.name,
                                    droppedIndexes: result
                                });
                            }
                            
                            // Clean up references
                            err = undefined;
                            result = undefined;
                        }
                    );
                    
                    return collectionDfd.promise;
                });
                
                // Wait for all index drop operations to complete
                q.all(deferreds)
                    .then(function(results) {
                        dfd.resolve({
                            message: "Cleared all indexes",
                            details: results,
                            totalCollections: results.length
                        });
                    })
                    .catch(function(err) {
                        dfd.reject({ 
                            path: "MongoDBCore.clearAllIndexes.dropAll", 
                            err 
                        });
                    })
                    .finally(function() {
                        // Clean up references
                        collections = undefined;
                        deferreds = undefined;
                    });
            });
        }, function (err) {
            dfd.reject({ 
                path: "MongoDBCore.clearAllIndexes.trycatch", 
                err: err.stack 
            });
            err = undefined;
        });
        
        return dfd.promise;
    }

}

exports.MongoDBCore = new MongoDBCore();