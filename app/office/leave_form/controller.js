
const { LeaveFormService } = require('./service');
const { FileProvider } = require('../../../shared/file/file.provider');
const q = require('q');
const trycatch = require('trycatch');
const validation = require('./validation');
const nameLib = "leave_form";
const fieldSearchAr = ["search", "type", "status", "from_date", "to_date", "tab"];
const parentFolder = "/office";
const folderArray = ['office']
const countFilter = function (body) {
    let count = 0;
    for (var i in fieldSearchAr) {
        if (body[fieldSearchAr[i]] !== undefined && body[fieldSearchAr[i]] !== "") {
            count++;
        }
    }
    return count;
}

const genFilter = function (body, count) {
    if (count == 1) {
        let filter = {};
        switch (body.tab) {
            case "created":
                filter = { username: { $eq: body.username } };
                break;
            case "approved":
                filter = { event: { $elemMatch: { username: body.username,  action: "Approved" } } };
                break;
            case "rejected":
                filter = { event: { $elemMatch: { username: body.username,  action: "Rejected" } } };
                break;
            case "need_to_handle":
                filter = { play_now: { $elemMatch: { username: body.username} } };
                break;
            case "journey_time_handle":
                filter = {
                    $and: [
                        { status: { $eq: "Approved" } },
                        { use_jtf: { $eq: true } },
                        { has_jtf: { $ne: true } },
                        { cancel_jtf: { $ne: true } }
                    ]
                };
                break;
        }
        return filter;
    }

    let filter = { $and: [] };
    for (var i in fieldSearchAr) {
        if (body[fieldSearchAr[i]] !== undefined && body[fieldSearchAr[i]] !== "") {
            switch (fieldSearchAr[i]) {
                case "tab":
                    switch (body.tab) {
                        case "created":
                            filter.$and.push({ username: { $eq: body.username } });
                            break;
                        case "approved":
                            filter.$and.push({ event: { $elemMatch: { username: body.username,  action: "Approved" } } });
                            break;
                        case "rejected":
                            filter.$and.push({ event: { $elemMatch: { username: body.username,  action: "Rejected" } } });
                            break;
                        case "need_to_handle":
                            filter.$and.push({ play_now: { $elemMatch: { username: body.username} } });
                            break;
                        case "journey_time_handle":
                            filter.$and.push({
                                $and: [
                                    { status: { $eq: "Approved" } },
                                    { use_jtf: { $eq: true } },
                                    { has_jtf: { $ne: true } },
                                    { cancel_jtf: { $ne: true } }
                                ]
                            });
                            break;
                    }
                    break;
                case "search":
                    filter.$and.push({ $text:{$search: body[fieldSearchAr[i]]}});
                    break;

                case "from_date":
                    filter.$and.push({ from_date: { $gte: body.from_date } });
                    break;
                case "to_date":
                    filter.$and.push({ to_date: { $lte: body.to_date } });
                    break;
                default:
                    let item = {};
                    item[fieldSearchAr[i]] = { $eq: body[fieldSearchAr[i]] };
                    filter.$and.push(item);
            }
        }
    }

    return filter;
}

const genData = function (username,  fields) {
    let result = {};
    let d = new Date();
    result.event = [{ username, action: "Created", time: d.getTime() }];

    result.flow = JSON.parse(fields.flow);
    result.from_date = parseInt(fields.from_date);
    result.to_date = parseInt(fields.to_date);
    result.type = fields.type;
    result.number_day = fields.number_day;
    result.content = fields.content;
    result.use_jtf = fields.use_jtf === 'true' ? true : false;
    return result;
}


class LeaveFormController {
    constructor() { }
    loadDetails(body) {
        return LeaveFormService.loadDetails(body._service[0].dbname_prefix,body.username,  body.id);
    }



    load(body) {
        let count = countFilter(body);
        let filter = genFilter(body, count);
        return LeaveFormService.loadList(body._service[0].dbname_prefix,filter, body.top, body.offset, body.sort);
    }
    countPending(body) {
        return LeaveFormService.countPending(body._service[0].dbname_prefix,body.username, );
    }

    count(body) {
        let count = countFilter(body);
        let filter = genFilter(body, count);
        return LeaveFormService.countList(body._service[0].dbname_prefix,filter);
    }

    count_jtf(body) {
        return LeaveFormService.countJTF(body._service[0].dbname_prefix);
    }

    init(body) {
        let dfd = q.defer();
        if(body.session.employee_details){
            LeaveFormService.init(body._service[0].dbname_prefix,body.session.employee_details.department,body.session.employee_details.competence,body.session.employee_details.job, body.session.role).then(function(result){
                dfd.resolve(result);
             },function(err){
                dfd.reject(err);
             });
        }else{
            dfd.resolve({
                wf:[],
                wft:[]
            });
        }

         return dfd.promise;
    }

    insert(req) {
        let dfd = q.defer();
            FileProvider.upload(req, nameLib, validation.insert, undefined, parentFolder, req.body.username).then(function (res) {
                let data = genData(req.body.username,  res.Fields);
                let attachment = [];
                if (res.fileInfo.file) {
                    for (let i in res.fileInfo.file) {
                        if (!res.fileInfo.file[i].huge) {
                            attachment.push({
                                timePath: res.fileInfo.file[i].timePath,
                                locate: res.fileInfo.file[i].type,
                                display: res.fileInfo.file[i].filename,
                                name: res.fileInfo.file[i].named,
                                nameLib
                            });
                        }
                    }
                }

                LeaveFormService.insert(req.body._service[0].dbname_prefix,req.body.username,req.body.session.title,
                     req.body.session.employee_details.department,  data.from_date, data.to_date, data.type, data.number_day, data.content, data.flow, data.event, data.use_jtf, attachment).then(function () {
                    dfd.resolve(true);
                }, function (err) {
                    dfd.reject(err);
                });
            }, function (err) {
                dfd.reject(err);
                err = undefined;
                req = undefined;
            });

        return dfd.promise;
    }

    loadFileInfo(body) {
        let dfd = q.defer();
            LeaveFormService.loadDetails(body._service[0].dbname_prefix.body.username,  body.id).then(function (data) {
                let checkPermission = true;
                let checkFile = false;
                let fileInfo = {};

                for (let i in data.attachment) {
                    if (data.attachment[i].name === body.filename) {
                        fileInfo = data.attachment[i];
                        checkFile = true;
                        break;
                    }
                }


                if (checkPermission) {
                    if (checkFile) {
                        FileProvider.loadFile(body._service[0].dbname_prefix, body.session, fileInfo.nameLib, fileInfo.name, fileInfo.timePath, fileInfo.locate, folderArray, body.username).then(function (fileinfo) {
                            fileinfo.display = fileInfo.display;
                            dfd.resolve(fileinfo);
                            fileinfo = undefined;
                        }, function (err) {
                            dfd.reject(err);
                            fileInfo = undefined;
                            err = undefined;
                        });
                    } else {
                        dfd.reject({ path: "LeaveFormController.loadFileInfo.FileIsNotExists", mes: "FileIsNotExists" });
                    }
                    body = undefined;
                    checkPermission = undefined;
                    checkFile = undefined;
                } else {
                    dfd.reject({ path: "LeaveFormController.loadFileInfo.NotPermission", mes: "NotPermission" });
                    body = undefined;
                    checkPermission = undefined;
                    checkFile = undefined;
                    fileInfo = undefined;
                }
            }, function (err) {
                dfd.reject(err);
                body = undefined;
            });

        return dfd.promise;
    }

    approval(body) {
        return LeaveFormService.approval(body._service[0].dbname_prefix,body.username,  body.id, body.comment);
    }

    reject(body) {
        return LeaveFormService.reject(body._service[0].dbname_prefix,body.username,  body.id, body.comment);
    }

    delete(body){
        return LeaveFormService.delete(body._service[0].dbname_prefix,body.username,body.id);
    }
}

exports.LeaveFormController = new LeaveFormController();
