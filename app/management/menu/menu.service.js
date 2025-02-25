const { MongoDBProvider } = require('../../../shared/mongodb/db.provider');
const q = require('q');
class MenuService {
    constructor() { }

    load(dbname_prefix, id) {
        let dfd = q.defer();
        MongoDBProvider.getOne_onManagement(dbname_prefix,"menu",{ _id: { $eq: new require('mongodb').ObjectID(id) } }).then(function(data){
           
            dfd.resolve(data.items);
        },function(err){
            dfd.reject(err);
        });
        return dfd.promise;
    }

    getOrderNumberMenu(dbname_prefix, id) {
        let dfd = q.defer();

        MongoDBProvider.loadAggregate_onManagement(dbname_prefix, "menu", [
            { $unwind: "$items" },
            {
                $match: { _id: { $eq: new require('mongodb').ObjectID(id) } }
            }, {
                $group:
                {
                    _id: "$_id",
                    maxordernumber: { $max: "$items.ordernumber" }
                }
            }
        ]).then(function (res) {
            if (res[0]) {
                dfd.resolve(res[0].maxordernumber + 1);
            } else {
                dfd.resolve(1);
            }
            res = undefined;
            dfd = undefined;
            id = undefined;
        }, function (err) {
            dfd.reject({ status: 502, err });
            err = undefined;
            id = undefined;
        });
        return dfd.promise;
    }

    insertAsComponent(dbname_prefix, username, id, title, keyOfMenu, ordernumber, isactive) {
        let d = new Date();
        return MongoDBProvider.update_onManagement(dbname_prefix, "menu", username,
            { _id: { $eq: new require('mongodb').ObjectID(id) } },
            {
                $push: { "items": { ordernumber, title, key: keyOfMenu, type: "component", isactive, id: username + d.getTime() } }
            });
    }

    insertAsUrl(dbname_prefix, username, id, url, ordernumber, isactive, title) {
        let d = new Date();
        return MongoDBProvider.update_onManagement(dbname_prefix, "menu", username
            , { _id: { $eq: new require('mongodb').ObjectID(id) } },
            {
                $push: { "items": { ordernumber, url, type: "url", isactive, id: username + d.getTime(), title } }
            });
    }

    updateAsComponent(dbname_prefix, username, id, title, keyOfMenu, ordernumber, isactive, idofmenu) {
        return MongoDBProvider.update_onManagement(dbname_prefix, "menu", username,
            {
                $and: [
                    { _id: { $eq: new require('mongodb').ObjectID(id) } },
                    { "items.id": { $eq: idofmenu } }
                ]
            },
            {
                $set: { "items.$.ordernumber": ordernumber, "items.$.key": keyOfMenu, "items.$.isactive": isactive, "items.$.url": "", "items.$.type": "component", "items.$.title": title }
            });
    }

    updateAsUrl(dbname_prefix, username, id, url, ordernumber, isactive, idofmenu, title) {
        return MongoDBProvider.update_onManagement(dbname_prefix, "menu", username,
            {
                $and: [
                    { _id: { $eq: new require('mongodb').ObjectID(id) } },
                    { "items.id": { $eq: idofmenu } }
                ]
            },
            {
                $set: { "items.$.ordernumber": ordernumber, "items.$.key": "", "items.$.isactive": isactive, "items.$.url": url, "items.$.type": "url", "items.$.title": title }
            });
    }

    delete(dbname_prefix, username, id, idofmenu) {
        return MongoDBProvider.update_onManagement(dbname_prefix, "menu", username,
            { _id: { $eq: new require('mongodb').ObjectID(id) } }
            ,
            {
                $pull: { "items": { id: { $eq: idofmenu } } }
            })
    }

}

exports.MenuService = new MenuService();