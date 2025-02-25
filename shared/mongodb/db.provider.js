const { MongoDBInterface } = require('./db.interface');
const settings = require('./mongodb.const');
class MongoDBProvider {
    constructor() { }
    loadAggregate(dbname_prefix, dbname, collection, filter) {
        return MongoDBInterface.load_aggregate(dbname_prefix, dbname, { collection, filter });
    }

    loadAggregate_onManagement(dbname_prefix, collection, filter) {
        return MongoDBInterface.load_aggregate(dbname_prefix, settings.connectName.management, { collection, filter });
    }

    loadAggregate_onOffice(dbname_prefix, collection, filter) {
        return MongoDBInterface.load_aggregate(dbname_prefix, settings.connectName.office, { collection, filter });
    }

    loadAggregate_onBasic(dbname_prefix, collection, filter) {
        return MongoDBInterface.load_aggregate(dbname_prefix, settings.connectName.basic, { collection, filter });
    }

    load(dbname_prefix, dbname, collection, filter, top, offset, sort, keys,unlimited) {
        return MongoDBInterface.load(dbname_prefix, dbname, { collection, filter, top, offset, sort, keys,unlimited });
    }

    load_onManagement(dbname_prefix, collection, filter, top, offset, sort, keys,unlimited) {
        return MongoDBInterface.load(dbname_prefix, settings.connectName.management, { collection, filter, top, offset, sort, keys,unlimited });
    }

    load_onOffice(dbname_prefix, collection, filter, top, offset, sort, keys,unlimited) {
        return MongoDBInterface.load(dbname_prefix, settings.connectName.office, { collection, filter, top, offset, sort, keys,unlimited });
    }

    load_onEducation(dbname_prefix, collection, filter, top, offset, sort, keys,unlimited) {
        return MongoDBInterface.load(dbname_prefix, settings.connectName.education, { collection, filter, top, offset, sort, keys,unlimited });
    }

    load_onBasic(dbname_prefix, collection, filter, top, offset, sort, keys,unlimited) {
        return MongoDBInterface.load(dbname_prefix, settings.connectName.basic, { collection, filter, top, offset, sort, keys,unlimited });
    }

    getOne(dbname_prefix, dbname, collection, filter) {
        return MongoDBInterface.getOne(dbname_prefix, dbname, collection, filter);
    }

    getOne_onManagement(dbname_prefix, collection, filter) {
        return MongoDBInterface.getOne(dbname_prefix, settings.connectName.management, collection, filter);
    }

    getOne_onBasic(dbname_prefix, collection, filter) {
        return MongoDBInterface.getOne(dbname_prefix, settings.connectName.basic, collection, filter);
    }

    getOne_onOffice(dbname_prefix, collection, filter) {
        return MongoDBInterface.getOne(dbname_prefix, settings.connectName.office, collection, filter);
    }

    getOne_onEducation(dbname_prefix, collection, filter) {
        return MongoDBInterface.getOne(dbname_prefix, settings.connectName.education, collection, filter);
    }

    count(dbname_prefix, dbname, collection, filter) {
        return MongoDBInterface.count(dbname_prefix, dbname, { collection, filter });
    }

    count_onManagement(dbname_prefix, collection, filter) {
        return MongoDBInterface.count(dbname_prefix, settings.connectName.management, { collection, filter });
    }

    count_onOffice(dbname_prefix, collection, filter) {
        return MongoDBInterface.count(dbname_prefix, settings.connectName.office, { collection, filter });
    }

    count_onBasic(dbname_prefix, collection, filter) {
        return MongoDBInterface.count(dbname_prefix, settings.connectName.basic, { collection, filter });
    }

    count_onEducation(dbname_prefix, collection, filter) {
        return MongoDBInterface.count(dbname_prefix, settings.connectName.education, { collection, filter });
    }

    restore(dbname_prefix, dbname, collection,username, data, options) {
        return MongoDBInterface.restore(dbname_prefix, dbname, {collection,username}, data, options);
    }

    insert(dbname_prefix, dbname, collection, username, data, options) {
        return MongoDBInterface.insert(dbname_prefix, dbname, { collection, username }, data, options);
    }

    insertMany(dbname_prefix, dbname, collection, username, data, options) {
        return MongoDBInterface.insertMany(
            dbname_prefix, dbname,
            { collection, username },
            data,
            options);
    }

    insertMany_onManagement(dbname_prefix, collection,username, data, options) {
        return MongoDBInterface.insertMany(
            dbname_prefix, settings.connectName.management,
            {collection,username},
            data,
            options);
    }

    insertMany_onBasic(dbname_prefix, collection,username, data, options) {
        return MongoDBInterface.insertMany(
            dbname_prefix, settings.connectName.basic,
            {collection,username},
            data,
            options);
    }

    insertMany_onOffice(dbname_prefix, collection,username, data, options) {
        return MongoDBInterface.insertMany(
            dbname_prefix, settings.connectName.office,
            {collection,username},
            data,
            options);
    }

    insertMany_onEducation(dbname_prefix, collection,username, data, options) {
        return MongoDBInterface.insertMany(
            dbname_prefix, settings.connectName.education,
            {collection,username},
            data,
            options);
    }



    insert_onManagement(dbname_prefix, collection, username, data, options) {
        return MongoDBInterface.insert(dbname_prefix, settings.connectName.management, { collection, username }, data, options);
    }

    insert_onBasic(dbname_prefix, collection, username, data, options) {
        return MongoDBInterface.insert(dbname_prefix, settings.connectName.basic, { collection, username }, data, options);
    }

    insert_onOffice(dbname_prefix, collection, username, data, options) {
        return MongoDBInterface.insert(dbname_prefix, settings.connectName.office, { collection, username }, data, options);
    }

    insert_onEducation(dbname_prefix, collection, username, data, options) {
        return MongoDBInterface.insert(dbname_prefix, settings.connectName.education, { collection, username }, data, options);
    }


    insertWithSequenceNumber(dbname_prefix, dbname, collection,username, data, options) {
        return MongoDBInterface.insertWithSequenceNumber(
            dbname_prefix,
            dbname,
            { collection, username },
            data,
            options,
        );
    }

    insertWithSequenceNumber_onManagement(dbname_prefix, collection,username, data, options) {
        return MongoDBInterface.insertWithSequenceNumber(dbname_prefix,
            settings.connectName.management,
            {collection,username},
            data,
            options);
    }


    update(dbname_prefix, dbname, collection,username, filter, data, options) {
        return MongoDBInterface.update(dbname_prefix, dbname, {collection,username}, filter, data, options);
    }

    update_onManagement(dbname_prefix, collection,username, filter, data, options) {
        return MongoDBInterface.update(dbname_prefix, settings.connectName.management, {collection,username}, filter, data, options);
    }

    update_onBasic(dbname_prefix, collection,username, filter, data, options) {
        return MongoDBInterface.update(dbname_prefix, settings.connectName.basic, {collection,username}, filter, data, options);
    }

    update_onOffice(dbname_prefix, collection,username, filter, data, options) {
        return MongoDBInterface.update(dbname_prefix, settings.connectName.office, {collection,username}, filter, data, options);
    }

    update_onEducation(dbname_prefix, collection,username, filter, data, options) {
        return MongoDBInterface.update(dbname_prefix, settings.connectName.education, {collection,username}, filter, data, options);
    }

    delete(dbname_prefix, dbname, collection,username, filter, options) {
        return MongoDBInterface.delete(dbname_prefix, dbname, {collection,username}, filter, options);
    }

    delete_onManagement(dbname_prefix, collection,username, filter, options) {
        return MongoDBInterface.delete(dbname_prefix, settings.connectName.management, {collection,username}, filter, options);
    }

    delete_onEducation(dbname_prefix, collection,username, filter, options) {
        return MongoDBInterface.delete(dbname_prefix, settings.connectName.education, {collection,username}, filter, options);
    }

    delete_onBasic(dbname_prefix, collection,username, filter, options) {
        return MongoDBInterface.delete(dbname_prefix, settings.connectName.basic, {collection,username}, filter, options);
    }

    delete_onOffice(dbname_prefix, collection,username, filter, options) {
        return MongoDBInterface.delete(dbname_prefix, settings.connectName.office, {collection,username}, filter, options);
    }

    createIndex_onManagement(dbname_prefix, collection, keys, type) {
        return MongoDBInterface.createIndex(dbname_prefix, settings.connectName.management, collection, keys, type);
    }

    createIndex_onBasic(dbname_prefix, collection, keys, type) {
        return MongoDBInterface.createIndex(dbname_prefix, settings.connectName.basic, collection, keys, type);
    }

    createIndex_onOffice(dbname_prefix, collection, keys, type) {
        return MongoDBInterface.createIndex(dbname_prefix, settings.connectName.office, collection, keys, type);
    }

    createIndex_onEducation(dbname_prefix, collection, keys, type) {
        return MongoDBInterface.createIndex(dbname_prefix, settings.connectName.education, collection, keys, type);
    }

    removeIndex_onManagement(dbname_prefix, collection, filter) {
        return MongoDBInterface.removeIndex(dbname_prefix, settings.connectName.management, collection, filter);
    }

    removeIndex_onBasic(dbname_prefix, collection, filter) {
        return MongoDBInterface.removeIndex(dbname_prefix, settings.connectName.basic, collection, filter);
    }

    removeIndex_onOffice(dbname_prefix, collection, filter) {
        return MongoDBInterface.removeIndex(dbname_prefix, settings.connectName.office, collection, filter);
    }

    removeIndex_onEducation(dbname_prefix, collection, filter) {
        return MongoDBInterface.removeIndex(dbname_prefix, settings.connectName.education, collection, filter);
    }


    createCollection(dbname_prefix, dbname, name) {
        return MongoDBInterface.createCollection(dbname_prefix, dbname, name);
    }

    createCollection_onManagement(dbname_prefix, name) {
        return MongoDBInterface.createCollection(dbname_prefix, settings.connectName.management, name);
    }

    createCollection_onBasic(dbname_prefix, name) {
        return MongoDBInterface.createCollection(dbname_prefix, settings.connectName.basic, name);
    }

    createCollection_onOffice(dbname_prefix, name) {
        return MongoDBInterface.createCollection(dbname_prefix, settings.connectName.office, name);
    }

    listCollection_onManagement(dbname_prefix) {
        return MongoDBInterface.listCollection(dbname_prefix, settings.connectName.management);
    }

    listCollection_onBasic(dbname_prefix) {
        return MongoDBInterface.listCollection(dbname_prefix, settings.connectName.basic);
    }

    listCollection_onOffice(dbname_prefix) {
        return MongoDBInterface.listCollection(dbname_prefix, settings.connectName.office);
    }

    clearAllData(dbname_prefix, dbname) {
        return MongoDBInterface.clearAllData(dbname_prefix, dbname);
    }

    clearAllIndexes(dbname_prefix, dbname) {
        return MongoDBInterface.clearAllIndexes(dbname_prefix, dbname);
    }

    executeTransaction(exeFunc) {
        return MongoDBInterface.executeTransaction(exeFunc);
    }

    getAutoIncrementNumber_onManagement(dbname_prefix, key) {
        return MongoDBInterface.autonumber(
            dbname_prefix,
            settings.connectName.management,
            key,
        );
    }

    getAutoIncrementNumberDaily_onManagement(dbname_prefix, key) {
        return MongoDBInterface.autonumberDaily(
            dbname_prefix,
            settings.connectName.management,
            key,
        );
    }

}

exports.MongoDBProvider = new MongoDBProvider();