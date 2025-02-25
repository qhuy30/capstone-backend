const { MongoDBProvider } = require('../../../shared/mongodb/db.provider');
const q = require('q');
const { generateSearchText } = require('./../../../utils/util');
const { LogProvider } = require("@shared/log_nohierarchy/log.provider");
class DirectoryService {
    constructor() { }

    getOrderNumber(dbname_prefix, master_key) {
        let dfd = q.defer();
        MongoDBProvider.load_onManagement(dbname_prefix, "directory",
            { master_key: { $eq: master_key } }, 1, 0, { ordernumber: -1 }).then(function (data) {
                if (data[0]) {
                    dfd.resolve(data[0].ordernumber + 1);
                } else {
                    dfd.resolve(1);
                }
            }, function (err) {
                dfd.reject(err);
            });
        return dfd.promise;
    }

    loadDetails(dbname_prefix, field, id,master_key) {
        let filter = {};
        if (field) {
            if (field === "_id") {
                filter = { _id: { $eq: new require('mongodb').ObjectID(id) } };
            } else {
                filter ={$and:[{},{}]};
                filter.$and[0][field] = { $eq: id };
                filter.$and[1].master_key = { $eq: master_key };
            }
        } else {
            filter = { _id: { $eq: new require('mongodb').ObjectID(id) } };
        }
        return MongoDBProvider.getOne_onManagement(dbname_prefix, "directory", filter);
    }

    load(dbname_prefix, filter, top, offset) {
        return MongoDBProvider.load_onManagement(dbname_prefix, "directory", filter,
            top, offset, { ordernumber: -1 });
    }

    count(dbname_prefix, filter) {
        return MongoDBProvider.count_onManagement(dbname_prefix, "directory", filter);
    }

    insert(dbname_prefix, username, master_key, ordernumber, title, value, item, isactive) {
        let dfd = q.defer();
        MongoDBProvider.getOne_onManagement(dbname_prefix, "master_directory", { key: { $eq: master_key } }).then(function () {
            let d = new Date();
            item.master_key = master_key;
            item.ordernumber = ordernumber;
            item.title = title;
            item.value = value;
            item.isactive = isactive;
            item.id = d.getTime();
            item.title_to_search = generateSearchText(item.title["vi-VN"]);
            MongoDBProvider.insert_onManagement(dbname_prefix, "directory", username, item).then(function (data) {
                dfd.resolve(data.ops[0]);
            }, function (err) {
                dfd.reject(err);
            });
        }, function (err) {
            dfd.reject(err);
        });

        return dfd.promise;
    }

    update(dbname_prefix, username, id, ordernumber, title, value, item, isactive) {
        item.title_to_search = generateSearchText(title["vi-VN"]);
        item.ordernumber = ordernumber;
        item.title = title;
        item.value = value;
        item.isactive = isactive;
        return MongoDBProvider.update_onManagement(dbname_prefix, "directory", username
            , { _id: { $eq: new require('mongodb').ObjectID(id) } }, { $set: item });
    }

    delete(dbname_prefix, username, id) {
        let dfd = q.defer();
        MongoDBProvider.load_onManagement(dbname_prefix,"directory",{ _id: { $eq: new require('mongodb').ObjectID(id) } }).then(function(data){
            if(data[0]){
                if(data[0].isactive){
                    dfd.reject({path:"DirectoryService.delete.DataIsActive",mes:"DataIsActive"});
                }else{
                    MongoDBProvider.delete_onManagement(dbname_prefix, "directory", username,
                    { _id: { $eq: new require('mongodb').ObjectID(id) } }).then(function(){
                        dfd.resolve(true);
                    },function(err){
                        dfd.reject(err);
                    });
                }
            }else{
                dfd.reject({path:"DirectoryService.delete.DataIsNotExists",mes:"DataIsNotExists"});
            }

        },function(err){
            dfd.reject(err);
        });

        return dfd.promise;
    }

    loadDetailsMany(dbname_prefix, field, ids,master_key){
        let filter = {};
        if (field) {
            if (field === "_id") {
                filter = { _id: { $eq: new require('mongodb').ObjectID(id) } };
            } else {
                filter ={$and:[{},{}]};
                filter.$and[0][field] = { $in: ids };
                filter.$and[1].master_key = { $eq: master_key };
            }
        } else {
            filter = { _id: { $eq: new require('mongodb').ObjectID(id) } };
        }
        return MongoDBProvider.load_onManagement(dbname_prefix, "directory", filter);
    }

    loadByMasterKey(dbname_prefix, master_key) {
        const dfd = q.defer();
        q.fcall(() => {
            return MongoDBProvider.load_onManagement(dbname_prefix, "directory", { master_key: { $eq: master_key } });
        })
            .then((result) => {
                return dfd.resolve(result);
            })
            .catch((error) => {
                LogProvider.error(
                    error.message || error.mes,
                    "DirectoryService.loadByMasterKey.err",
                    "error",
                    "DirectoryService",
                );
                return dfd.reject(error);
            });
        return dfd.promise;
    }

}

exports.DirectoryService = new DirectoryService();
