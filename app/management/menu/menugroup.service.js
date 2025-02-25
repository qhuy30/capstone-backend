const { MongoDBProvider } = require('../../../shared/mongodb/db.provider');
const q = require('q');
class MenuGroupService {
    constructor() { }
    load(dbname_prefix) {
        return MongoDBProvider.load_onManagement(dbname_prefix, "menu", {});
    }

    loadAllMenu(dbname_prefix) {
        let filter = { isactive: { $eq: true } };
        
        return MongoDBProvider.load_onManagement(dbname_prefix, "menu", filter);

    }

    insert(dbname_prefix, type, ordernumber, title, username, isactive, icon) {
        return MongoDBProvider.insert_onManagement(dbname_prefix, "menu", username,
            { type, ordernumber, title, items: [], isactive, icon });
    }

    getOrderNumberMenuGroup(dbname_prefix) {
        let dfd = q.defer();
        MongoDBProvider.load_onManagement(dbname_prefix, "menu", {  },
            1, 0, { ordernumber: -1 }, { ordernumber: true }).then(function (res) {
                if (res[0]) {
                    dfd.resolve(res[0].ordernumber + 1);
                } else {
                    dfd.resolve(1);
                }

            }, function (err) {
                dfd.reject({ path: "MenuGroupService.getOrderNumberMenuGroup.db", err });
            });
        return dfd.promise;
    }

    update(dbname_prefix, id, ordernumber, title, username, isactive, icon) {
        return MongoDBProvider.update_onManagement(dbname_prefix, "menu", username,
            { _id: { $eq: new require('mongodb').ObjectID(id) } },
            { $set: { ordernumber, title, isactive, icon } });
    }

    delete(dbname_prefix,id, username) {
        return MongoDBProvider.delete_onManagement(dbname_prefix,"menu", username , 
        { _id: { $eq: new require('mongodb').ObjectID(id) } });
    }
}

exports.MenuGroupService = new MenuGroupService();