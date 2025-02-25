const ManagementConst = require('./db/management/concern');
const OfficeConst = require('./db/office/concern');
const BasicConst = require('./db/basic/concern');
const DBConst = require('../mongodb/mongodb.const');
class DBConfig {
    constructor() { }

    getCollectionConfig(dbname, collection) {
        let result = {};
        switch (dbname) {
            case DBConst.connectName.management:
                result = ManagementConst[collection] ? ManagementConst[collection] : {};
                break;
            case DBConst.connectName.office:
                result = OfficeConst[collection] ? OfficeConst[collection] : {};
                break;
            case DBConst.connectName.basic:
                result = BasicConst[collection] ? BasicConst[collection] : {};
                break;
        }
        return result;
    }

    checkSoftDelete(dbname, collection) {
        let obj = new DBConfig();
        let thisConfig = obj.getCollectionConfig(dbname, collection);
        if (thisConfig.softDelete) {
            return true;
        }
        return false;
    }

    getNumberOfVersion(dbname, collection) {
        let obj = new DBConfig();
        let thisConfig = obj.getCollectionConfig(dbname, collection);
        if (thisConfig.safeVersion) {
            return thisConfig.safeVersion;
        }
        return 0;
    }

    checkSafe(dbname, collection) {
        let obj = new DBConfig();
        let thisConfig = obj.getCollectionConfig(dbname, collection);

        if (thisConfig.safeVersion) {
            return true;
        }
        return false;
    }

    checkNotEntity(dbname, collection) {
        let obj = new DBConfig();
        let thisConfig = obj.getCollectionConfig(dbname, collection);
        if (thisConfig.notEntity) {
            return true;
        }
        return false;
    }

    checkSubCache(dbname, collection) {
        let obj = new DBConfig();
        let thisConfig = obj.getCollectionConfig(dbname, collection);
        if (thisConfig.subCache) {
            return true;
        }
        return false;
    }
}

exports.DBConfig = new DBConfig();