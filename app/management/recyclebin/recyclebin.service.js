const { MongoDBProvider } = require('../../../shared/mongodb/db.provider');
const q = require('q');
class RecycleBinService {
    constructor() { }
    load(dbname_prefix, filter, top, offset, sort) {
        return MongoDBProvider.load_onManagement(dbname_prefix, "recyclebin"
            , filter, top, offset, sort,
            { _id: true, username: true, time: true, collection: true, dbname: true });
    }

    loadDetails(dbname_prefix, id) {
        return MongoDBProvider.load_onManagement(dbname_prefix, "recyclebin"
            , { _id: { $eq: new require('mongodb').ObjectID(id) } });
    }

    count(dbname_prefix, filter) {
        return MongoDBProvider.count_onManagement(dbname_prefix, "recyclebin", filter);
    }

    delete(dbname_prefix, idAr, username) {
        for (var i in idAr) {
            idAr[i] = new require('mongodb').ObjectID(idAr[i]);
        }
        return MongoDBProvider.delete_onManagement(dbname_prefix, "recyclebin", username,
            { _id: { $in: idAr } });
    }

    restore(dbname_prefix, username, dbname, collection, idAr) {
        let dfd = q.defer();

        for (var i in idAr) {
            idAr[i] = new require('mongodb').ObjectID(idAr[i]);
        }

        MongoDBProvider.load_onManagement(dbname_prefix, "recyclebin", { _id: { $in: idAr } },
            undefined, undefined, undefined,
            { _id: true, data: true }).then(function (data) {
                let dataAr = [];
                for (let i in data) {
                    dataAr.push({
                        _id: data[i]._id,
                        data: data[i].data
                    });
                }
                MongoDBProvider.restore(dbname_prefix,dbname, collection,username, dataAr).then(function () {
                    dfd.resolve(true);
                    dfd = undefined;
                    idAr = undefined;
                    username = undefined;
                }, function (err) {
                    dfd.reject({ path: "RecycleBinService.restore.db", err });
                    err = undefined;
                    idAr = undefined;
                    username = undefined;
                });
            }, function (err) {
                dfd.reject(err);
                err = undefined;
            });
        return dfd.promise;
    }
}


exports.RecycleBinService = new RecycleBinService();