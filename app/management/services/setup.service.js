const { MongoDBProvider } = require('../../../shared/mongodb/db.provider');
const { ConfigSetup } = require('../../../shared/setup/config.const');

const management = require('./../mapConcern');
const officeMap = require('./../../office/mapConcern');
const basicMap = require('./../../basic/mapConcern');
const educationMap = require('./../../education/mapConcern');
const { FileProvider } = require('../../../shared/file/file.provider');

const { FileConst } = require('../../../shared/file/file.const');
const q = require('q');

function getAllMap() {
    let maps = [];
    for (var i in management) {
        for (var j in management[i]) {
            maps.push(management[i][j]);
        }
    }
    for (var i in officeMap) {
        for (var j in officeMap[i]) {
            maps.push(officeMap[i][j]);
        }
    }
    for (var i in basicMap) {
        for (var j in basicMap[i]) {
            maps.push(basicMap[i][j]);
        }
    }

    for (var i in educationMap) {
        for (var j in educationMap[i]) {
            maps.push(educationMap[i][j]);
        }
    }
    return maps;
}

const SESSION_CONST = {};
const FOLDER_CONST = ['management'];

function generateConfigFileSetting(dbname_prefix, settingObject) {
    let dfd = q.defer();
    const imagesKeyArray = ['logo', 'backgroundLogin', 'background'];
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

class SetupService {
    constructor() { }

    load_setting(dbname_prefix) {
        let dfd = q.defer();
        MongoDBProvider.load_onManagement(dbname_prefix, "setting", {}).then(function (data) {
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



    loadAllMenu(dbname_prefix) {
        return MongoDBProvider.load_onManagement(dbname_prefix,"menu",{ isactive: { $eq: true } });
    }

    loadPublicMap() {
        let allMap = JSON.parse(JSON.stringify(getAllMap()));
        let publicMap = [];
        for (let i in allMap) {
            if (allMap[i].rule === null) {
                publicMap.push(allMap[i]);
            }
        }
        return {
            status: true, data: publicMap
        };
    }

}

exports.SetupService = new SetupService();