const { MongoDBProvider } = require('../../../shared/mongodb/db.provider');
const { removeUnicode } = require('../../../utils/util');
const DATABASE_COLLECTION = "card_vehical";
const q = require('q');

class CardVehicalService {
    constructor() { }

    checkExist(dbname_prefix, code) {
        let dfd = q.defer();
        MongoDBProvider.load_onOffice(dbname_prefix, DATABASE_COLLECTION, { code: { $eq: code } }).then(function (res) {
            if (res[0]) {
                dfd.resolve(false);
            } else {
                dfd.resolve(true);
            }
        }, function (err) {
            dfd.reject({ path: "CardVehicalService.checkExist.db", err });
        });

        return dfd.promise;
    }

    load(dbname_prefix, filter, top, offset, sort) {
        return MongoDBProvider.load_onOffice(dbname_prefix, DATABASE_COLLECTION,
            filter, top, offset, sort, { entity: false });
    }

    count(dbname_prefix, filter) {
        return MongoDBProvider.count_onOffice(dbname_prefix, DATABASE_COLLECTION, filter);
    }

    insert(dbname_prefix, username, name, code) {
        return MongoDBProvider.insert_onOffice(dbname_prefix, DATABASE_COLLECTION, username,
            { name, code });
    }

    update(dbname_prefix, username, id, name) {
        return MongoDBProvider.update_onOffice(
            dbname_prefix,
            DATABASE_COLLECTION,
            username,
            { _id: { $eq: new require('mongodb').ObjectID(id) } },
            { $set: { name} },
        );
    }

    delete(dbname_prefix, id, username) {
        return MongoDBProvider.delete_onOffice(dbname_prefix, DATABASE_COLLECTION, username,
            { $and: [{ _id: { $eq: new require('mongodb').ObjectID(id) } }, { isactive: { $ne: true } }] });
    }

}

exports.CardVehicalService = new CardVehicalService();
