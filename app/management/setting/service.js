const { MongoDBProvider } = require('../../../shared/mongodb/db.provider');
const { FileConst } = require('../../../shared/file/file.const');
const q = require('q');
const { FileProvider } = require('../../../shared/file/file.provider');
const SESSION_CONST = {};
const FOLDER_CONST = ['management'];
const { StoreConst } = require('../../../shared/store/gcp/store.const');


function generateConfigFileSetting(dbname_prefix, settingObject) {
    let dfd = q.defer();
    let imagesKeyArray = ['logo', 'backgroundLogin', 'background'];
    if (imagesKeyArray.indexOf(settingObject.key) === -1) {
        dfd.resolve(settingObject);
    } else {
        FileProvider.loadFile(dbname_prefix, SESSION_CONST, settingObject.value.nameLib, settingObject.value.name, settingObject.value.timePath, settingObject.value.locate || 'local', FOLDER_CONST, undefined).then((fileObject) => {

            settingObject.value.urlDisplay = fileObject.url;
            dfd.resolve(settingObject);
        }, (err) => {
            dfd.reject(err);
        });
    }
    return dfd.promise;
}

class SettingService {
    constructor() { }


    loadGeneral(dbname_prefix) {
        let dfd = q.defer();
        MongoDBProvider.load_onManagement(dbname_prefix, "setting", { group: { $eq: "general" } }).then(function (data) {
            let dfdArray = [];
            for (var i in data) {
                dfdArray.push(generateConfigFileSetting(dbname_prefix, data[i]));
            }
            q.all(dfdArray).then((result) => {
                dfd.resolve(result);

            }, (err) => {
                dfd.reject(err);

            })
        }, function (err) {
            dfd.reject(err);
        });
        return dfd.promise;
    }

    loadModule(dbname_prefix, module) {
        return MongoDBProvider.load_onManagement(dbname_prefix, "setting", { module: { $eq: module } });
    }

    update(dbname_prefix, username, itemAr) {
        let dfd = q.defer();
        let dfdAr = [];
        for (var i in itemAr) {
            dfdAr.push(MongoDBProvider.update_onManagement(dbname_prefix, "setting", username,
                { _id: { $eq: new require('mongodb').ObjectID(itemAr[i].id) } },
                { $set: { value: itemAr[i].value } }));
        }
        q.all(dfdAr).then(function () {
            dfd.resolve(true);
        }, function (err) {
            dfd.reject({ path: "SettingService.update.db", err: err.toString() });
        });
        return dfd.promise;
    }

    updateImage(dbname_prefix, username, id, image) {

        return MongoDBProvider.update_onManagement(dbname_prefix, "setting", username,
            { _id: { $eq: new require('mongodb').ObjectID(id) } },
            { $set: { value: image } });
    }

    updateImageAndRecoverRecords(dbname_prefix, username, id, image, recoverRecord) {
        return MongoDBProvider.update_onManagement(dbname_prefix, "setting", username,
            { _id: { $eq: new require('mongodb').ObjectID(id) } },
            {
                $set: { value: image },
                $push: { [StoreConst.recoverFound]: recoverRecord }
            });

    }

    getcurrentValueSetting(dbname_prefix, key) {
        let dfd = q.defer();
        MongoDBProvider.load_onManagement(dbname_prefix, "setting",
            { _id: { $eq: new require('mongodb').ObjectID(key.toString()) } }).then(function (data) {
                dfd.resolve(data);
            }, function (err) {
                dfd.reject(err);
            });
        return dfd.promise;
    }

    getCurrentValueByKey(dbname_prefix, key) {
        let dfd = q.defer();
        MongoDBProvider.load_onManagement(dbname_prefix, "setting", { key: { $eq: key } }).then(
            function (data) {
                if (data.length === 0) {
                    return dfd.resolve(null);
                }
                dfd.resolve(data[0]);
            },
            function (err) {
                dfd.reject(err);
            },
        );
        return dfd.promise;
    }

}
exports.SettingService = new SettingService();
