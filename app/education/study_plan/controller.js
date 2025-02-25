const { StudyPlanService } = require('./service');
const { FileProvider } = require('../../../shared/file/file.provider');
const validation = require('./validation');
const { MongoDBProvider } = require('../../../shared/mongodb/db.provider');
const path = require('path');
const { FileConst } = require('../../../shared/file/file.const');

const q = require('q');
const xlsx = require('xlsx');
const folderPath = 'education';
const nameLib = 'StudyPlan';

const countFilterCondition = function (body) {
    let count = 0;
    if (body.search !== undefined && body.search !== "") {
        count++;
    }
    return count;
}

const genFilterData = function (body) {
    let count = countFilterCondition(body);
    if (count == 0) {
        return { 'value.nameLib': 'StudyPlan' };
    }
    let filter;
    if (count >= 1) {
        filter = { $and: [{ 'value.nameLib': 'StudyPlan' }] };

        if (body.search !== undefined && body.search !== '') {
            filter.$and.push({
                $or: [{ 'value.display': { $regex: body.search, $options: 'i' } }, { username: { $regex: body.search, $options: 'i' } }],
            });
        }
    }
    return filter;
};

class StudyPlanController {
    constructor() {}

    import_file(req) {
        let dfd = q.defer();
        let dfdArr = [];
        const excelData = req.file.buffer;
        const workbook = xlsx.read(excelData, { type: 'buffer' });
        const sheetLichGiang = workbook.Sheets['LICHGIANG'];
        const sheetDMHP = workbook.Sheets['DMHP'];
        StudyPlanService.convertXlsxToJson(sheetLichGiang, sheetDMHP)
            .then((data) => {
                //* Option 1:
                // StudyPlanService.insert_study_plans(req.body._service[0].dbname_prefix, req.body.username, data)
                //     .then((response) => {
                //         dfd.resolve(true);
                //     })
                //     .catch((error) => {
                //         dfd.reject(error);
                //         error = undefined;
                //         req = undefined;
                //     });
                // * Option 2:

                if (data.length > 0) {
                    for (var i in data) {
                        dfdArr.push(StudyPlanService.getAndUpdateOrInsertStudyPlan(req.body._service[0].dbname_prefix, req.body.username, data[i]));
                    }
                    MongoDBProvider.delete_onEducation(req.body._service[0].dbname_prefix, 'study_plan', req.body.username, { $and: [{ class_id: { $eq: data[0].class_id } }, { study_year: { $eq: data[0].study_year } }] })
                        .then(() => {
                            q.all(dfdArr)
                                .then(() => {
                                    dfd.resolve(true);
                                    data = undefined;
                                    req = undefined;
                                })
                                .catch((error) => {
                                    dfd.reject(error);
                                    error = undefined;
                                    data = undefined;
                                    req = undefined;
                                });
                        })
                        .catch((error) => {
                            dfd.reject(error);
                            error = undefined;
                            data = undefined;
                            req = undefined;
                        });
                }
                dfd.resolve(true);
            })
            .catch((err) => {
                dfd.reject(err);
                err = undefined;
                req = undefined;
            });

        return dfd.promise;
    }

    upload(req) {
        let dfd = q.defer();
        FileProvider.upload(req, nameLib, validation.import, undefined, folderPath, req.body.username).then(
            function (res) {
                if (!res.Fields.id) {
                    StudyPlanService.upload_file(req.body._service[0].dbname_prefix, req.body.username, {
                        username: req.body.username,
                        upload_date: parseInt(res.Fields.upload_date),
                        value: {
                            timePath: res.Files[0].timePath,
                            locate: res.Files[0].type,
                            display: res.Files[0].filename,
                            name: res.Files[0].named,
                            nameLib,
                            folderPath: res.Files[0].folderPath,
                            upload_date: parseInt(res.Fields.upload_date),
                            username: req.body.username,
                        },
                        history: [],
                    })
                        .then(() => {
                            dfd.resolve(true);
                            req = undefined;
                        })
                        .catch((error) => {
                            dfd.reject(error);
                            error = undefined;
                            req = undefined;
                        });
                } else {
                    let filter = {
                        $and: [{ _id: { $eq: new require('mongodb').ObjectID(res.Fields.id) } }, { 'value.nameLib': 'StudyPlan' }],
                    };
                    StudyPlanService.get_files_upload(req.body._service[0].dbname_prefix, req.body.username, filter)
                        .then((data) => {
                            StudyPlanService.update_file(
                                req.body._service[0].dbname_prefix,
                                req.body.username,
                                res.Fields.id,
                                {
                                    timePath: res.Files[0].timePath,
                                    locate: res.Files[0].type,
                                    display: res.Files[0].filename,
                                    name: res.Files[0].named,
                                    nameLib,
                                    folderPath: res.Files[0].folderPath,
                                    upload_date: parseInt(res.Fields.upload_date),
                                    username: req.body.username,
                                },
                                data[0].value
                            )
                                .then(() => {
                                    dfd.resolve(true);
                                    req = undefined;
                                })
                                .catch((error) => {
                                    dfd.reject(error);
                                    error = undefined;
                                    req = undefined;
                                });
                        })
                        .catch((error) => {
                            dfd.reject(error);
                            error = undefined;
                            req = undefined;
                        });
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

    getFilesUpload(req) {
        let dfd = q.defer();
        let filter = genFilterData(req.body);
        StudyPlanService.get_files_upload(req.body._service[0].dbname_prefix, req.body.username, filter, req.body.top, req.body.offset, req.body.sort)
            .then((data) => {
                dfd.resolve(data);
                req = undefined;
            })
            .catch((error) => {
                dfd.reject(error);
                error = undefined;
                req = undefined;
            });

        return dfd.promise;
    }

    countFilesUpload(req) {
        let dfd = q.defer();
        let filter = genFilterData(req.body);
        StudyPlanService.count_files_upload(req.body._service[0].dbname_prefix, filter)
            .then((data) => {
                dfd.resolve(data);
                req = undefined;
            })
            .catch((error) => {
                dfd.reject(error);
                error = undefined;
                req = undefined;
            });

        return dfd.promise;
    }

    deleteStudyPlan(req) {
        let dfd = q.defer();
        let dfdAr = [];
        StudyPlanService.get_files_upload(req.body._service[0].dbname_prefix, req.body.username, { _id: { $eq: new require('mongodb').ObjectID(req.body.id) } })
            .then((file) => {
                if (file[0]) {
                    const filePath = path.join(FileConst.pathLocal, file[0].value.folderPath, file[0].value.name);
                    const workbook = xlsx.readFile(filePath);
                    const sheetLichGiang = workbook.Sheets['LICHGIANG'];
                    const sheetDMHP = workbook.Sheets['DMHP'];
                    StudyPlanService.convertXlsxToJson(sheetLichGiang, sheetDMHP)
                        .then((data) => {
                            if (data.length > 0) {
                                dfdAr.push(MongoDBProvider.delete_onEducation(req.body._service[0].dbname_prefix, 'study_plan', req.body.username, { $and: [{ class_id: { $eq: data[0].class_id } }, { study_year: { $eq: data[0].study_year } }] }));
                                dfdAr.push(MongoDBProvider.delete_onEducation(req.body._service[0].dbname_prefix, 'file_upload', req.body.username, { _id: { $eq: new require('mongodb').ObjectID(req.body.id) } }));

                                q.all(dfdAr)
                                    .then((a) => {
                                        dfd.resolve(true);
                                        data = undefined;
                                        req = undefined;
                                        file = undefined;
                                    })
                                    .catch((e) => {
                                        dfd.reject(e);
                                        e = undefined;
                                        data = undefined;
                                        req = undefined;
                                        file = undefined;
                                    });
                            } else {
                                dfd.reject(false);
                                data = undefined;
                                req = undefined;
                                file = undefined;
                            }
                        })
                        .catch((err) => {
                            dfd.reject(err);
                            err = undefined;
                            req = undefined;
                            file = undefined;
                        });
                } else {
                    dfd.reject(false);
                    req = undefined;
                    file = undefined;
                }
            })
            .catch((error) => {
                dfd.reject(error);
                error = undefined;
                req = undefined;
            });
        return dfd.promise;
    }
}

exports.StudyPlanController = new StudyPlanController();
