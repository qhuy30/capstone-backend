const { SettingService } = require('./service');
const q = require('q');
const { FileProvider } = require('../../../shared/file/file.provider');
const { FileConst } = require('../../../shared/file/file.const');
const { validation } = require('./validation');
const { getCurrentDate } = require('../../../utils/util');

const parentFolder = '/management';
const { StoreConst } = require('../../../shared/store/gcp/store.const');
const { gcpProvider } = require('../../../shared/store/gcp/gcp.provider');
const nameLib = "setting";
class SettingController {
    constructor() {}
    loadGeneral(body) {
        return SettingService.loadGeneral(body._service[0].dbname_prefix);
    }

    loadModule(body) {
        return SettingService.loadModule(body._service[0].dbname_prefix, body.module);
    }

    update(body) {
        return SettingService.update(body._service[0].dbname_prefix, body.username, body.itemAr);
    }

    uploadImage(req) {
        let dfd = q.defer();
        FileProvider.upload(req, nameLib, validation.uploadImage, undefined, parentFolder, undefined).then(
            function (res) {
                if (res.Files[0]) {
                    SettingService.getcurrentValueSetting(req.body._service[0].dbname_prefix, res.Fields.id)
                        .then(function (data) {
                            let namefile = res.Files[0].named;
                            if (data[0].value.name) {
                                namefile = data[0].value.name;
                                SettingService.updateImageAndRecoverRecords(
                                    req.body._service[0].dbname_prefix,
                                    req.body.username,
                                    res.Fields.id,
                                    {
                                        timePath: res.Files[0].timePath,
                                        locate: res.Files[0].type,
                                        display: res.Files[0].filename,
                                        name: res.Files[0].named,
                                        nameLib,
                                    },
                                    {
                                        timePath: getCurrentDate(),
                                        fullPath: res.Files[0].folderPath + '/' + data[0].value.name,
                                    }
                                ).then(
                                    (img) => {
                                        img = undefined;
                                    },
                                    (error) => {
                                        console.log(`username : ${req.body.username} , controller.js:56 ~ SettingController ~ error: ${error}`);
                                        error = undefined;
                                    }
                                );
                            } else {
                                SettingService.updateImage(
                                    req.body._service[0].dbname_prefix,
                                    req.body.username,
                                    res.Fields.id,
                                    {
                                        timePath: res.Files[0].timePath,
                                        locate: res.Files[0].type,
                                        display: res.Files[0].filename,
                                        name: res.Files[0].named,
                                        nameLib,
                                    }
                                );
                            }
                            if (FileConst.modeProduction === 'development') {
                                dfd.resolve(FileConst.pathLocal + '/' + res.Files[0].folderPath + '/' + namefile);
                            } else {
                                gcpProvider.getSignedUrl(res.Files[0].folderPath + '/' + namefile).then(
                                    (imgUrl) => {
                                        dfd.resolve(imgUrl);
                                        imgUrl = undefined;
                                    },
                                    (error) => {
                                        console.log(`username : ${req.body.username} , file: controller.js:80 ~ SettingController ~ error: ${error}`);
                                        dfd.reject(error);
                                        error = undefined;
                                        res = undefined;
                                        req = undefined;
                                        data = undefined;
                                    }
                                );
                            }
                            res = undefined;
                            req = undefined;
                            data = undefined;
                        })
                        .catch((err) => {
                            console.log(`username : ${req.body.username} , controller.js:93 ~ SettingController ~ uploadImage ~ err: ${err}`);
                            dfd.reject(err);
                            err = undefined;
                            res = undefined;
                            req = undefined;
                        });
                } else {
                    dfd.reject({ path: 'SettingController.uploadImage.FileIsNull', mes: 'FileIsNull' });
                    res = undefined;
                    req = undefined;
                }
            },
            function (err) {
                dfd.reject(err);
                err = undefined;
                req = undefined;
            }
        );
        return dfd.promise;
    }

    mobile_config(body) {
        return SettingService.getCurrentValueByKey(body._service[0].dbname_prefix, 'mobile_config');
    }
}

exports.SettingController = new SettingController();