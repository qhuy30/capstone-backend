const { MongoDBProvider } = require('../../../shared/mongodb/db.provider');
const q = require('q');
const { removeUnicode } = require('../../../utils/util');
class GroupService {
    constructor() { }
    load(dbname_prefix, filter, top, offset, sort) {
        return MongoDBProvider.load_onManagement(dbname_prefix, "group",
            filter, top, offset, sort, { entity: false });
    }

    count(dbname_prefix, filter) {
        return MongoDBProvider.count_onManagement(dbname_prefix, "group", filter);
    }

    checkExistUser(dbname_prefix, account) {
        let dfd = q.defer();
        MongoDBProvider.load_onManagement(dbname_prefix, "user", { username: { $eq: account } }).then(function (res) {
            if (res[0]) {
                dfd.resolve(true);
            } else {
                dfd.reject({ path: "GroupService.checkExistUser.UserIsNotExist", err: "UserIsNotExist" });
            }
            res = undefined;
            dfd = undefined;
            account = undefined;
            res = undefined;
        }, function (err) {
            dfd.reject({ path: "GroupService.checkExistUser.db", err });
            err = undefined;
            account = undefined;
        });

        return dfd.promise;
    }

    insert(dbname_prefix, username, title, isactive) {
        return MongoDBProvider.insert_onManagement(dbname_prefix, "group", username,
            { title, title_search: removeUnicode(title),isactive, rule: [], role: [], user: [] });
    }

    update(dbname_prefix, username, id, title, isactive, user, role, competence) {
        return MongoDBProvider.update_onManagement(
            dbname_prefix,
            'group',
            username,
            { _id: { $eq: new require('mongodb').ObjectID(id) } },
            { $set: { title, title_search: removeUnicode(title), isactive, user, role, competence } },
        );
    }

    delete(dbname_prefix, id, username) {
        return MongoDBProvider.delete_onManagement(dbname_prefix, "group", username,
            { $and: [{ _id: { $eq: new require('mongodb').ObjectID(id) } }, { isactive: { $ne: true } }] });
    }



    pushRule(dbname_prefix, username, id, rule) {
        let dfd = q.defer();
        MongoDBProvider.update_onManagement(dbname_prefix, "group", username,
            { _id: { $eq: new require('mongodb').ObjectID(id) } },
            {
                $pull: { rule: {  rule :{$eq:rule.rule } } }
            }).then(function(){
                MongoDBProvider.update_onManagement(dbname_prefix, "group", username,
                { _id: { $eq: new require('mongodb').ObjectID(id) } },
                {
                    $push: { rule  : rule}
                }).then(function(){
                    dfd.resolve(true);
                },function(err){
                    dfd.reject(err);
                });
            },function(err){
                dfd.reject(err);
            });
        return dfd.promise;
    }


    removeRule(dbname_prefix, username, id, rule) {
        return MongoDBProvider.update_onManagement(dbname_prefix, "group", username,
            { _id: { $eq: new require('mongodb').ObjectID(id) } }, { $pull: { rule: {  rule : rule.rule } } });
    }

}


exports.GroupService = new GroupService();
