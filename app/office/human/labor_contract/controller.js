
const trycatch = require('trycatch');
const q = require('q');
const { LaborContractService } = require('./service');
const validation = require('./validation');
const { FileProvider } = require('../../../../shared/file/file.provider');
const { getCurrentDate } = require('../../../../utils/util');
const { StoreConst } = require('../../../../shared/store/gcp/store.const');

const fieldSearchAr = ["search", "specialized", "it", "degree_english", "department", "status", "type"];
const nameLib = "labor_contract";
const parentFolder = "/office";
const folderArray = ['office', 'human'];
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
    if (count == 0) { return {}; }
    if (count == 1) {
        let filter = {};
        for (var i in fieldSearchAr) {
            if (body[fieldSearchAr[i]] !== undefined && body[fieldSearchAr[i]] !== "") {
                switch (fieldSearchAr[i]) {
                    case "search":
                        filter = {
                            $text: { $search: body[fieldSearchAr[i]] }
                        };
                        break;
                    default:
                        filter[fieldSearchAr[i]] = { $eq: body[fieldSearchAr[i]] };
                }
            }
        }
        return filter;
    }

    let filter = { $and: [] };
    for (var i in fieldSearchAr) {
        if (body[fieldSearchAr[i]] !== undefined && body[fieldSearchAr[i]] !== "") {
            switch (fieldSearchAr[i]) {
                case "search":
                    filter.$and.push({
                        $text: { $search: body[fieldSearchAr[i]] }
                    });
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



const genData = function (username, fields) {

    let result = {};

    let d = new Date();
    result.his = { username, action: "created", time: d.getTime() };
    result.username = username;

    result.basic_salary = parseInt(fields.basic_salary);
    result.type = fields.type;
    result.lastname = fields.lastname;
    result.midname = fields.midname;
    result.firstname = fields.firstname;

    result.living = JSON.parse(fields.living);
    result.permanent_address = JSON.parse(fields.permanent_address);
    result.type_residence = fields.type_residence;
    result.birth_date = parseInt(fields.birth_date);
    result.phonenumber = fields.phonenumber;
    result.email = fields.email;

    result.idcard = fields.idcard;
    result.nationality = fields.nationality;
    result.religion = fields.religion;

    result.training_school = fields.training_school;
    result.graduation_year = fields.graduation_year;
    result.education = fields.education;
    result.degree = fields.degree;
    result.specialized = fields.specialized;
    result.state_management = fields.state_management;
    result.political_theory = fields.political_theory;
    result.it = fields.it;
    result.degree_english = fields.degree_english;

    result.department = fields.department;
    result.competence = fields.competence;

    result.from_date = parseInt(fields.from_date);
    result.to_date = parseInt(fields.to_date);
    return result;
}

const genData_attachLabor = function (username, fields) {

    let result = {};

    let d = new Date();

        result.his = { username, action: "created", time: d.getTime() };
        result.username = username;
        result.id = fields.id;
    
        result.basic_salary = parseInt(fields.basic_salary);
        result.type = fields.type;
        result.lastname = fields.lastname;
        result.midname = fields.midname;
        result.firstname = fields.firstname;
    
        result.living = JSON.parse(fields.living);
        result.permanent_address = JSON.parse(fields.permanent_address);
        result.type_residence = fields.type_residence;
        result.birth_date = parseInt(fields.birth_date);
        result.phonenumber = fields.phonenumber;
        result.email = fields.email;
    
        result.idcard = fields.idcard;
        result.nationality = fields.nationality;
        result.religion = fields.religion;
    
        result.training_school = fields.training_school;
        result.graduation_year = fields.graduation_year;
        result.education = fields.education;
        result.degree = fields.degree;
        result.specialized = fields.specialized;
        result.state_management = fields.state_management;
        result.political_theory = fields.political_theory;
        result.it = fields.it;
        result.degree_english = fields.degree_english;
    
        result.department = fields.department;
        result.competence = fields.competence;
    
        result.from_date = parseInt(fields.from_date);
        result.to_date = parseInt(fields.to_date);
 
    return result;
}

class LaborContractController {
    constructor() { }

    loadDetails(body) {
        return LaborContractService.loadDetails(body._service[0].dbname_prefix, body.username, body.id);
    }

    load(body) {
        let count = countFilter(body);
        let filter = genFilter(body, count);
        return LaborContractService.loadList(body._service[0].dbname_prefix, filter, body.top, body.offset, body.sort);
    }

    count(body) {
        let count = countFilter(body);
        let filter = genFilter(body, count);
        return LaborContractService.countList(body._service[0].dbname_prefix, filter);
    }

    countPending(body) {
        return LaborContractService.countPending(body._service[0].dbname_prefix);
    }

    insert(req) {
        let dfd = q.defer();
        FileProvider.upload(req, nameLib, validation.insert, "/human", parentFolder, req.params.name).then(function (res) {
            let data = genData(req.body.username, res.Fields);
            let attachment = [];
            for (let i in res.Files) {
                if (!res.Files[i].huge) {
                    attachment.push({
                        timePath: res.Files[i].timePath,
                        locate: res.Files[i].type,
                        display: res.Files[i].filename,
                        name: res.Files[i].named,
                        nameLib
                    });
                }
            }

            LaborContractService.insert(req.body._service[0].dbname_prefix,
                data.username, req.body.session.employee,
                data.basic_salary, data.type, data.lastname, data.midname, data.firstname,
                data.living, data.permanent_address, data.type_residence,
                data.birth_date, data.phonenumber, data.email, data.idcard, data.nationality, data.religion,
                data.training_school, data.graduation_year, data.education, data.degree, data.specialized, data.state_management, data.political_theory, data.it, data.degree_english,
                data.department, data.competence,
                data.from_date, data.to_date,
                attachment
            ).then(function () {
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
        LaborContractService.loadDetails(body._service[0].dbname_prefix,body.username, body.id).then(function (data) {
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
                    FileProvider.loadFile(body._service[0].dbname_prefix, body.session, fileInfo.nameLib, fileInfo.name, fileInfo.timePath, fileInfo.locate, folderArray), body.username.then(function (fileinfo) {
                        fileinfo.display = fileInfo.display;
                        dfd.resolve(fileinfo);
                        fileinfo = undefined;
                    }, function (err) {
                        dfd.reject(err);
                        fileInfo = undefined;
                        err = undefined;
                    });
                } else {
                    dfd.reject({ path: "LaborContractController.loadFileInfo.FileIsNotExists", mes: "FileIsNotExists" });
                }
                body = undefined;
                checkPermission = undefined;
                checkFile = undefined;
            } else {
                dfd.reject({ path: "LaborContractController.loadFileInfo.NotPermission", mes: "NotPermission" });
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

    update(body) {
        return LaborContractService.update(
            body._service[0].dbname_prefix,
            body.username, body.session.employee, body.id, body.basic_salary, body.type,
            body.lastname, body.midname, body.firstname,
            body.living, body.permanent_address, body.type_residence,
            body.birth_date, body.phonenumber, body.email, body.idcard,
            body.nationality, body.religion,
            body.training_school, body.graduation_year, body.education, body.degree, body.specialized, body.state_management, body.political_theory, body.it, body.degree_english,
            body.department, body.competence,
            body.from_date, body.to_date
        );
    }

    approval(body) {
        return LaborContractService.approval(
            body._service[0].dbname_prefix,
            body.username, body.session.employee, body.id, body.basic_salary, body.type,
            body.lastname, body.midname, body.firstname,
            body.living, body.permanent_address, body.type_residence, body.birth_date, body.phonenumber, body.email,
            body.idcard, body.nationality, body.religion,
            body.training_school, body.graduation_year, body.education, body.degree, body.specialized, body.state_management, body.political_theory, body.it, body.degree_english,
            body.department, body.competence,
            body.from_date, body.to_date
        );
    }

    pushFile(req) {
        let dfd = q.defer();
            FileProvider.upload(req, nameLib, validation.pushFile, "/human", parentFolder, req.body.username).then(function (res) {
                if (res.Files[0]) {
                    LaborContractService.pushFile(req.body._service[0].dbname_prefix,req.body.username, res.Fields.id,
                        {
                            timePath: res.Files[0].timePath,
                            locate: res.Files[0].type,
                            display: res.Files[0].filename,
                            name: res.Files[0].named,
                            nameLib
                        }).then(function () {
                            dfd.resolve({
                                timePath: res.Files[0].timePath,
                                locate: res.Files[0].type,
                                display: res.Files[0].filename,
                                name: res.Files[0].named,
                                nameLib
                            });
                        }, function (err) {
                            dfd.reject(err);
                        });
                } else {
                    dfd.resolve(true);
                }
            }, function (err) {
                dfd.reject(err);
                err = undefined;
                req = undefined;
            });

        return dfd.promise;
    }

    removeFile(body) {
        let dfd = q.defer();
        LaborContractService.loadDetails(body._service[0].dbname_prefix,body.username, body.id).then(function (data) {
            let fileInfo = {};
            for (var i in data.attachment) {
                if (data.attachment[i].name === body.filename) {
                    fileInfo = data.attachment[i];
                }
            }
            if (fileInfo.name) {
                const fullPath = body._service[0].dbname_prefix + "/" + folderArray.join('/') + '/' + nameLib + '/' + body.username + '/' + body.filename;
                LaborContractService.removeFile(body._service[0].dbname_prefix,body.username, body.id, body.filename,{
                    timePath: getCurrentDate(),
                    fullPath: fullPath,
                }).then(function () {
                    dfd.resolve(true);
                }, function (err) {
                    dfd.reject(err);
                    err = undefined;
                });
            } else {
                dfd.reject({ path: "LaborContractController.removeFile.FileIsNull", mes: "FileIsNull" });
            }
        }, function (err) {
            dfd.reject(err);
            err = undefined;
        });

        return dfd.promise;
    }

    delete(body) {
        return LaborContractService.delete(body._service[0].dbname_prefix,body.username, body.id);
    }
    delete_multi(body) {
        return LaborContractService.delete_multi(body._service[0].dbname_prefix,body.username, body.idar);
    }

    attachLabor(req) {
        let dfd = q.defer();
     
        FileProvider.upload(req, nameLib, validation.attachLabor, "/human", parentFolder, req.params.name).then(function (res) {
         
            let data = genData_attachLabor(req.body.username, res.Fields);
          
            let attachment = [];
            for (let i in res.Files) {
                if (!res.Files[i].huge) {
                    attachment.push({
                        timePath: res.Files[i].timePath,
                        locate: res.Files[i].type,
                        display: res.Files[i].filename,
                        name: res.Files[i].named,
                        nameLib
                    });
                }
            }
            
            try {
                LaborContractService.attachLabor(
                    req.body._service[0].dbname_prefix,
                    data.username, req.body.session.employee, data.id,
                    data.basic_salary, data.type, data.lastname, data.midname, data.firstname,
                    data.living, data.permanent_address, data.type_residence,
                    data.birth_date, data.phonenumber, data.email, data.idcard, data.nationality, data.religion,
                    data.training_school, data.graduation_year, data.education, data.degree, data.specialized, data.state_management, data.political_theory, data.it, data.degree_english,
                    data.department, data.competence,
                    data.from_date, data.to_date,
                    attachment
                ).then(function () {
                    dfd.resolve(true);
                }, function (err) {
                    dfd.reject(err);
                });
            } catch (error) {
                console.log(error);
                dfd.reject(error);
            }

        }, function (err) {
            dfd.reject(err);
            err = undefined;
            req = undefined;
        });
        return dfd.promise;
    }

    loadListOfEmployee(body) {
        return LaborContractService.loadListOfEmployee(body._service[0].dbname_prefix,body.idar);
    }
}

exports.LaborContractController = new LaborContractController();