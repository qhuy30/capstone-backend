const { MongoDBProvider } = require('../../../shared/mongodb/db.provider');
const q = require('q');
const { generateSearchText } = require('./../../../utils/util');

class MasterDirectoryService {
    constructor() { }
    getOrderNumber(dbname_prefix){
        let dfd = q.defer();
        MongoDBProvider.load_onManagement(dbname_prefix,"master_directory",{},1,0,{ordernumber:-1}).then(function(data){
            if(data[0]){
                dfd.resolve(data[0].ordernumber+1);
            }else{
                dfd.resolve(1);
            }
        },function(err){
            dfd.reject(err);
        });
        return dfd.promise;
    }

    loadDetails(dbname_prefix, key) {
        return MongoDBProvider.getOne_onManagement(dbname_prefix, "master_directory",
            { key: { $eq: key } });
    }

    load(dbname_prefix, filter, top, offset) {
        return MongoDBProvider.load_onManagement(dbname_prefix, "master_directory", filter,
            top, offset, { ordernumber: 1 });
    }

    count(dbname_prefix, filter) {
        return MongoDBProvider.count_onManagement(dbname_prefix, "master_directory", filter);
    }

    insert(dbname_prefix, username, ordernumber, title, key, extend) {
        let dfd = q.defer();
        MongoDBProvider.load_onManagement(dbname_prefix, "master_directory", { key: { $eq: key } })
            .then(function (data) {
                if (data[0]) {
                    dfd.reject({ path: "MasterDirectoryService.insert.KeyIsExists", mes: "KeyIsExists" });
                } else {
                    MongoDBProvider.insert_onManagement(dbname_prefix,"master_directory", username,
                        { ordernumber, title, key, extend, title_to_search: generateSearchText(title['vi-VN']) }).then(function () {
                            dfd.resolve(true);
                        }, function (err) {
                            dfd.reject(err);
                        });
                }
            }, function (err) {
                dfd.reject(err);
            });
        return dfd.promise;
    }

    update(dbname_prefix, username, id, ordernumber, title, key, extend) {
        let dfd = q.defer();
        MongoDBProvider.load_onManagement(dbname_prefix, "master_directory"
            , {
                $and:
                    [
                        { key: { $eq: key } },
                        { _id: { $ne: new require('mongodb').ObjectID(id) } }
                    ]
            })
            .then(function (data) {
                if (data[0]) {
                    dfd.reject({ path: "MasterDirectoryService.update.KeyIsExists", mes: "KeyIsExists" });
                } else {
                    MongoDBProvider.update_onManagement(dbname_prefix,"master_directory", username,
                        { _id: { $eq: new require('mongodb').ObjectID(id) } },
                        { $set: { ordernumber, title, key, extend, title_to_search: generateSearchText(title['vi-VN']) } }).then(function () {
                            dfd.resolve(true);
                        }, function (err) {
                            dfd.reject(err);
                        });
                }
            }, function (err) {
                dfd.reject(err);
            });
        return dfd.promise;
    }

    delete(dbname_prefix, username, key) {
        
        let dfdAr = [];
        dfdAr.push(MongoDBProvider.delete_onManagement(dbname_prefix, "master_directory",
            username, { key: { $eq: key } }));
        dfdAr.push(MongoDBProvider.delete_onManagement(dbname_prefix, "directory", username,
            { master_key: { $eq: key } }));
        
        return q.all(dfdAr);
    }
}

exports.MasterDirectoryService = new MasterDirectoryService();