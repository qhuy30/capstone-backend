

const q = require('q');
const { SetupService } = require('./setup.service');
const { LanguageProvider } = require('../../../shared/localization/language.provider');


class SetupController {
    constructor() { }

    loadRouter() {
        let dfd = q.defer();
        let mapValue = SetupService.loadPublicMap();
        if (mapValue.status) {
            dfd.resolve(mapValue.data);
        } else {
            dfd.reject({ path: "SetupController.loadRouter.loadpublishmap", err: mapValue.err.err });
        }
        return dfd.promise;
    }

    loadLanguage(body) {
        let dfd = q.defer();
            let dfdAr = [];
            dfdAr.push(LanguageProvider.getCurrentLanguage(body._service[0].dbname_prefix));
            dfdAr.push(LanguageProvider.getLanguageList(body._service[0].dbname_prefix));
            q.all(dfdAr).then(function (data) {
                LanguageProvider.getLanguageDetails(body._service[0].dbname_prefix,data[0]).then(function (details) {
                    dfd.resolve({
                        current: data[0],
                        list: data[1],
                        details
                    });
                    data = undefined;
                    details = undefined;

                }, function (err) {
                    dfd.reject(err);
                    err = undefined;
                    data = undefined;
                });
                dfdAr = undefined;
            }, function (err) {
                dfd.reject(err);
                err = undefined;
            });
        return dfd.promise;
    }

    loadMenu(body) {
        let dfd = q.defer();
        let obj = new SetupController();

        let dfdAr = [];
        dfdAr.push(SetupService.loadAllMenu(body._service[0].dbname_prefix));
        dfdAr.push(obj.loadRouter());
        q.all(dfdAr).then(function (data) {
            let result = [];
            let allMenu = data[0];
            let publicRouter = data[1];

            for (var i in allMenu) {
                result.push(JSON.parse(JSON.stringify(allMenu[i])));
                result[i].items = [];
                for (var j in allMenu[i].items) {
                    if (allMenu[i].items[j].type == "url") {
                        result[i].items.push(JSON.parse(JSON.stringify(allMenu[i].items[j])));
                    }
                    else {
                        for (var z in publicRouter) {
                            if (publicRouter[z].key == allMenu[i].items[j].key) {
                                result[i].items.push(JSON.parse(JSON.stringify(allMenu[i].items[j])));
                                result[i].items[result[i].items.length - 1].path = publicRouter[z].path;
                                result[i].items[result[i].items.length - 1].icon = publicRouter[z].icon;
                                break;
                            }
                        }
                    }
                }
            }
            dfd.resolve(result);
            result = undefined;
            allMenu = undefined;
            publicRouter = undefined;
            dfdAr = undefined;
            data = undefined;
            obj = undefined;
        }, function (err) {
            dfd.reject(err);
            err = undefined;
            dfdAr = undefined;
            obj = undefined;
        });
        return dfd.promise;
    }



    init(body) {
        let dfd = q.defer();
            let dfdAr = [];
            let obj = new SetupController();
            dfdAr.push(obj.loadLanguage(body));
            dfdAr.push(obj.loadMenu(body));
            dfdAr.push(obj.loadRouter());
            dfdAr.push(SetupService.load_setting(body._service[0].dbname_prefix));
            q.all(dfdAr).then(function (data) {
                let result = {
                    language: data[0],
                    menu: data[1],
                    router: data[2],
                    setting: data[3]
                };
                dfd.resolve(result);
                result = undefined;
                dfdAr = undefined;
                obj = undefined;
                data = undefined;
            }, function (err) {
                dfd.reject(err);
                result = undefined;
                dfdAr = undefined;
                obj = undefined;
                data = undefined;
            });

        return dfd.promise;
    }
}

exports.SetupController = new SetupController();