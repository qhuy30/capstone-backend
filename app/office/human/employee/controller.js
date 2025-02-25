
const trycatch = require('trycatch');
const path = require('path');
const q = require('q');
const { EmployeeService } = require('./service');
const validation = require('./validation');
const { FileConst } = require('../../../../shared/file/file.const');
const { FileProvider } = require('../../../../shared/file/file.provider');
const { bool } = require('joi');
const fieldSearchAr = ["search", "specialized", "it", "degree_english", "department", "type"];
const nameLib ="signature";
const { StoreConst } = require('../../../../shared/store/gcp/store.const');
const { getCurrentDate } = require('../../../../utils/util');
const { gcpProvider } = require('../../../../shared/store/gcp/gcp.provider');

const parentFolder = "/office/human";
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
                            $text:{$search: body[fieldSearchAr[i]]}
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
                        $text:{$search: body[fieldSearchAr[i]]}
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


class EmployeeController {
    constructor() { }

    load(body) {
        let count = countFilter(body);
        let filter = genFilter(body, count);
        return EmployeeService.loadList(body._service[0].dbname_prefix,filter, body.top, body.offset, body.sort);
    }

    count(body) {
        let count = countFilter(body);
        let filter = genFilter(body, count);
        return EmployeeService.countList(body._service[0].dbname_prefix,filter);
    }

    loadDetails(body){
        return EmployeeService.loadDetails(body._service[0].dbname_prefix,body.id);
    }
    
    loadDetails_d(body){
        return EmployeeService.loadDetails_d(body._service[0].dbname_prefix,body.id);
    }

    loadDetails_dm(body){
        return EmployeeService.loadDetails_dm(body._service[0].dbname_prefix,body.id);
    }

    update_background_general(body){
        return EmployeeService.update_background_general(body._service[0].dbname_prefix,
            body.username,body.id,body.lastname,body.midname,body.firstname,body.birth_date,
            body.living,body.permanent_address,body.domicile,body.place_birth,body.type_residence,
            body.phonenumber,body.email,body.idcard,body.nationality,body.religion,body.folk
            );
    }

    push_background_family(body){
        return EmployeeService.push_background_family(body._service[0].dbname_prefix,body.username,body.id,body.childid,body.fullname,body.job, body.born_in,body.relationship,body.t8_1945,body.tdPhap,body.n1955);
    }

    remove_background_family(body){
        return EmployeeService.remove_background_family(body._service[0].dbname_prefix,body.username,body.id,body.childid);
    }

    update_background_family(body){
        return EmployeeService.update_background_family(body._service[0].dbname_prefix,body.username,body.id,body.childid,body.fullname,body.job,body.born_in,body.relationship,body.t8_1945,body.tdPhap,body.n1955);
    }

    update_signature(req) {
        let dfd = q.defer();
        FileProvider.upload(req, nameLib, validation.update_signature, "/employee", parentFolder, req.params.name).then(function (res) {
            if (res.Files[0]) {

                EmployeeService.loadDetails(req.body._service[0].dbname_prefix, res.Fields.id).then(function (emp) {
                    if (emp.signature.name) {
                        EmployeeService.update_signature_recover(
                            req.body._service[0].dbname_prefix,
                            req.body.username,
                            res.Fields.id,
                            {
                                timePath: res.Files[0].timePath,
                                locate: res.Files[0].type,
                                display: res.Files[0].filename,
                                name: res.Files[0].named,
                                nameLib: 'signature',
                            },
                            {
                                timePath: getCurrentDate(),
                                fullPath: res.Files[0].folderPath + '/' + emp.signature.name,
                            }
                        ).then(
                            function () {
                                if (FileConst.modeProduction === 'development') {
                                    let imgUrl = FileConst.tenantDomain + '/files/' + res.Files[0].folderPath + '/' + res.Files[0].named;
                                    dfd.resolve(imgUrl);
                                } else {
                                    gcpProvider.getSignedUrl(res.Files[0].folderPath + '/' + res.Files[0].named).then(
                                        (imgUrl) => {
                                            dfd.resolve(imgUrl);
                                        },
                                        (error) => {
                                            dfd.reject(error);
                                        }
                                    );
                                }
                            },
                            function (err) {
                                dfd.reject(err);
                            }
                        );
                    } else {
                        EmployeeService.update_signature(req.body._service[0].dbname_prefix, req.body.username, res.Fields.id,
                            {
                                timePath: res.Files[0].timePath,
                                locate: res.Files[0].type,
                                display: res.Files[0].filename,
                                name: res.Files[0].named,
                                nameLib: "signature"
                            }).then(function () {
                                if (FileConst.modeProduction === 'development') {
                                    let imgUrl = FileConst.tenantDomain + '/files/' + res.Files[0].folderPath + '/' + res.Files[0].named;
                                    dfd.resolve(imgUrl);
                                } else {
                                    gcpProvider.getSignedUrl(res.Files[0].folderPath + '/' + res.Files[0].named).then(
                                        (imgUrl) => {
                                            dfd.resolve(imgUrl);
                                            imgUrl = undefined;
                                            req = undefined;
                                            res = undefined;
                                        },
                                        (err) => {
                                            dfd.reject(err);
                                            req = undefined;
                                            res = undefined;
                                        }
                                    );
                                }
                            }, function (err) {
                                dfd.reject(err);
                                req = undefined;
                                res = undefined;
                            });
                    }
                })
            } else {
                dfd.reject({ path: "EmployeeController.update_signature.FileIsNull", mes: "FileIsNull" });
            }
        }, function (err) {
            dfd.reject(err);
            err = undefined;
            req = undefined;
        });
        return dfd.promise;
    }

    update_quotation_mark(req) {
        const dfd = q.defer();
        FileProvider.upload(
            req,
            'quotation_mark',
            undefined,
            '/employee',
            parentFolder,
            req.params.name,
        ).then(function (formData) {
            if (formData.Files[0]) {
                const quotationFile = formData.Files[0];
                EmployeeService.loadDetails(
                    req.body._service[0].dbname_prefix,
                    formData.Fields.id,
                )
                    .then(function (emp) {
                        let promise;
                        const quotationMark = {
                            timePath: quotationFile.timePath,
                            locate: quotationFile.type,
                            display: quotationFile.filename,
                            name: quotationFile.named,
                            nameLib: 'quotation_mark',
                        };
                        if (emp.quotationMark && emp.quotationMark.name) {
                            promise =
                                EmployeeService.update_quotation_mark_recover(
                                    req.body._service[0].dbname_prefix,
                                    req.body.username,
                                    formData.Fields.id,
                                    quotationMark,
                                    {
                                        timePath: getCurrentDate(),
                                        fullPath: path.join(
                                            quotationFile.folderPath,
                                            emp.quotationMark.name,
                                        ),
                                    },
                                );
                        } else {
                            promise = EmployeeService.update_quotation_mark(
                                req.body._service[0].dbname_prefix,
                                req.body.username,
                                formData.Fields.id,
                                quotationMark,
                            );
                        }
                        return promise;
                    })
                    .then(function () {
                        const filePath = `${quotationFile.folderPath}/${quotationFile.named}`;
                        if (FileConst.modeProduction === 'development') {
                            return q.resolve(FileConst.tenantDomain + '/files/' + filePath);
                        } else {
                            return gcpProvider.getSignedUrl(filePath);
                        }
                    })
                    .then(function (imgUrl) {
                        dfd.resolve(imgUrl);
                    })
                    .catch(function (err) {
                        dfd.reject(err);
                        req = undefined;
                    });
            } else {
                dfd.reject({
                    path: 'EmployeeController.update_quotation_mark.FileIsNull',
                    mes: 'FileIsNull',
                });
            }
        });
        return dfd.promise;
    }

    update_education_general(body){
        return EmployeeService.update_education_general(body._service[0].dbname_prefix,body.username,body.id
            ,body.training_school,body.graduation_year, body.education, body.degree, body.specialized, body.state_management, body.political_theory, body.it, body.degree_english);
    }

    update_mission_general(body){
        return EmployeeService.update_mission_general(body._service[0].dbname_prefix,body.username,body.id,body.department,body.competence);
    }

    update_salary_general(body){
        return EmployeeService.update_salary_general(body._service[0].dbname_prefix,body.username,body.id,body.basic_salary);
    }

    load_user(body){
        return EmployeeService.load_user(body._service[0].dbname_prefix,body.id);
   }

    register_account(body){
        return EmployeeService.register_account(body._service[0].dbname_prefix,body.username,body.id,body.user);
    }

    insert(body){
        return EmployeeService.insert(body._service[0].dbname_prefix,body.username,body.session.employee,body.lastname,body.midname,body.firstname,body.birth_date,body.phonenumber,body.email,body.idcard,
            body.department,body.competence);
    }

    insert_Many(body){
        return EmployeeService.insert_Many(body._service[0].dbname_prefix,body.username,body.session.employee,body.data);
    }

    checkDeclaration(body){
        return EmployeeService.checkDeclaration(body._service[0].dbname_prefix,body.id);
    }

    delete(body){
        return EmployeeService.delete(body._service[0].dbname_prefix,body.id,body.username);
    }
}


exports.EmployeeController = new EmployeeController(); 
