const { MongoDBProvider } = require('../../../shared/mongodb/db.provider');
const q = require('q');
class ConfigTableService {
    constructor() {}
    load(dbname_prefix, filter) {
        return MongoDBProvider.load_onManagement(dbname_prefix, 'config_table', filter);
    }

    insert(dbname_prefix, username, project, department, config) {
        let dfd = q.defer();
        MongoDBProvider.insert_onManagement(dbname_prefix, 'config_table', username, { username, project, department, config }).then(
            function () {
                dfd.resolve(true);
            },
            function (err) {
                dfd.reject(err);
            }
        );
        return dfd.promise;
    }

    update(dbname_prefix, username, id, config) {
        let dfd = q.defer();
        MongoDBProvider.update_onManagement(dbname_prefix, 'config_table', username, { _id: { $eq: new require('mongodb').ObjectID(id) } }, { $set: { config } }).then(
            function () {
                dfd.resolve(true);
            },
            function (err) {
                dfd.reject(err);
            }
        );
        return dfd.promise;
    }
}

exports.ConfigTableService = new ConfigTableService();
