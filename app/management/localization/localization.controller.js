const trycatch = require('trycatch');
const q = require('q');
const { LanguageProvider } = require('../../../shared/localization/language.provider');
class LocalizationController {
    constructor() { }

    init(body) {
        let dfd = q.defer();
        let dfdAr = [];
        dfdAr.push(LanguageProvider.getCurrentLanguage(body._service[0].dbname_prefix, body.session.language.current));
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
                language = undefined;
                data = undefined;
            });
            dfdAr = undefined;
        }, function (err) {
            dfd.reject(err);
            err = undefined;
            language = undefined;
        });
        return dfd.promise;
    }

    getDetailsByKey(body) {
        return LanguageProvider.getLanguageDetails(body._service[0].dbname_prefix, body.key);
    }
}

exports.LocalizationController = new LocalizationController();