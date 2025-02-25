const LanguageConst = require('./language.const');
const MongoDBConst = require('../mongodb/mongodb.const');
const { MongoDBProvider } = require('../mongodb/db.provider');
const q = require('q');

class LanguageProvider {
    constructor() { }
    getLanguageListDefault() {
        return LanguageConst.list;
    }

    getLanguageDetailsDefault(key) {
        return require("./" + key + ".concern");
    }

    getCurrentLanguageDefault() {
        return LanguageConst.default;
    }

    getLanguageListConfig(dbname_prefix) {
        let dfd = q.defer();
        MongoDBProvider.load_onManagement(dbname_prefix,
            MongoDBConst.nameCollection.language,{}).then(function (data) {
            dfd.resolve(data);
            data = undefined;
        }, function (err) {
            dfd.reject(err);
            err = undefined;
        });

        return dfd.promise;
    }

    getLanguageDetailsConfig(dbname_prefix,key) {
        let dfd = q.defer();
  
        MongoDBProvider.load_onManagement(dbname_prefix,
            MongoDBConst.nameCollection.language,{ key: { $eq: key } }).then(function (data) {
            if (data[0]) {
                dfd.resolve(data[0].items);
            } else {
                dfd.reject({ path: "LanguageProvider.getLanguageListConfig.datanull", err: "datanull" });
            }
            data = undefined;
            dfd = undefined;
        }, function (err) {
            dfd.reject(err);
            err = undefined;
        });

        return dfd.promise;
    }

    getCurrentLanguageConfig(dbname_prefix) {
        let dfd = q.defer();


        MongoDBProvider.load_onManagement(dbname_prefix,
            MongoDBConst.nameCollection.language,{ },1).then(function (data) {
            if (data[0] && data[0].language && data[0].language.default) {
                dfd.resolve(data[0].language.default);
            } else {
                dfd.reject({ path: "LanguageProvider.getLanguageConfig.datanull", err: "datanull" });
            }
            data = undefined;
        }, function (err) {
            dfd.reject(err);
            err = undefined;
        });

        return dfd.promise;
    }

    getLanguageList(dbname_prefix) {
        let dfd = q.defer();
        let obj = new LanguageProvider();
        obj.getLanguageListConfig(dbname_prefix).then(function (data) {
            let result = obj.getLanguageListDefault();
            for (var i in data) {
                let check = true;
                for (var j in result) {
                    if (data[i].key == result[j].key) { result[j] = data[i]; check = false; break; }
                }
                if (check) { result.push(data[i]); }
            }
            dfd.resolve(result);
            obj = undefined;
            result = undefined;
            data = undefined;
        }, function (err) {
            dfd.reject(err);
            err = undefined;
            obj = undefined;
        });

        return dfd.promise;
    }

    getLanguageDetails(dbname_prefix,key) {
        let dfd = q.defer();
        let obj = new LanguageProvider();
        obj.getLanguageDetailsConfig(dbname_prefix,key).then(function (data) {
            let result = obj.getLanguageDetailsDefault(key);
            for (var i in data) {
                let check = true;
                for (var j in result) {
                    if (data[i].key == result[j].key) { result[j] = data[i]; break; }
                }
                if (check) { result.push(data[i]); }
            }
            dfd.resolve(result);
            obj = undefined;
            result = undefined;
            data = undefined;
        }, function (err) {
            if (err.err == "datanull") {
                dfd.resolve(obj.getLanguageDetailsDefault(key));
            } else {
                dfd.reject(err);
            }
            key = undefined;
            err = undefined;
            obj = undefined;
        });

        return dfd.promise;
    }

    getCurrentLanguage(dbname_prefix,currentKey) {
        let dfd = q.defer();
        if (currentKey) { dfd.resolve(currentKey); } else {

            let obj = new LanguageProvider();
            obj.getCurrentLanguageConfig(dbname_prefix).then(function (data) {
                dfd.resolve(data);
                obj = undefined;
                data = undefined;
            }, function (err) {
                if (err.err == "datanull") {
                    dfd.resolve(obj.getCurrentLanguageDefault());
                } else {
                    dfd.reject(err);
                }
                err = undefined;
                obj = undefined;
            });


        }
        return dfd.promise;
    }

}
exports.LanguageProvider = new LanguageProvider();