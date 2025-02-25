const q = require("q");

const { MongoDBProvider } = require("../../../../shared/mongodb/db.provider");
const { FileConst } = require("../../../../shared/file/file.const");
const { AuthenticationProvider } = require("../../../../shared/authentication/authentication.provider");
const settings = require("../../../../utils/setting");
let myPassword = "123456";
myPassword = AuthenticationProvider.encrypt_oneDirection_lv1(myPassword);
const { StoreConst } = require("../../../../shared/store/gcp/store.const");
const { gcpProvider } = require("../../../../shared/store/gcp/gcp.provider");
const { removeUnicode } = require("../../../../utils/util");

const BaseError = require("@shared/error/BaseError");
const { DirectoryService } = require("@app/management/directory/service");

const parentPath = 'office/human/employee/signature/'

function insert_multi(dbname_prefix, username, employee, data) {
    let dfd = q.defer();
    let d = new Date();
    let dataInsert = [];
    for (var i in data) {
        dataInsert.push(
            {
                fullname: data[i].lastname + " " + (data[i].midname ? data[i].midname + " " : "") + data[i].firstname,
                lastname: data[i].lastname,
                midname: data[i].midname,
                firstname: data[i].firstname,
                employeecode: data[i].employeecode ? data[i].employeecode.toString().trim() : "",
                department: data[i].department ? data[i].department.toString().trim() : "",
                competence: data[i].competence ? data[i].competence.toString().trim() : "",
                event: [{ username, employee, time: d.getTime(), action: "Created" }]
            }
        );
    }
    MongoDBProvider.insertMany_onOffice(dbname_prefix, "employee", username, dataInsert).then(function (e) {
        let userInsert = [];
        for (var i in data) {
            userInsert.push({
                title: data[i].lastname + " " + (data[i].midname ? data[i].midname + " " : "") + data[i].firstname,
                username: data[i].username,
                password: myPassword,
                role: ["BasicUser"],
                rule: ["Authorized"],
                isactive: true,
                admin: false,
                employee: e.ops[i]._id.toString()
            });
        }
        MongoDBProvider.insertMany_onManagement(dbname_prefix, "user", username, userInsert).then(function () {
            dfd.resolve(true);
        }, function (err) {
            dfd.reject(err);
        });
    }, function (err) {
        dfd.reject(err);
    });
    return dfd.promise;
}

function insert_single(dbname_prefix, username, employee, data) {
    let dfd = q.defer();
    let d = new Date();
    MongoDBProvider.insert_onOffice(dbname_prefix, "employee", username, {
        fullname: data[0].lastname + " " + (data[0].midname ? data[0].midname + " " : "") + data[0].firstname,
        lastname: data[0].lastname,
        midname: data[0].midname,
        firstname: data[0].firstname,
        employeecode: data[0].employeecode ? data[0].employeecode.toString().trim() : "",
        department: data[0].department ? data[0].department.toString().trim() : "",
        competence: data[0].competence ? data[0].competence.toString().trim() : "",
        event: [{ username, employee, time: d.getTime(), action: "Created" }]
    }).then(function (e) {

        MongoDBProvider.insert_onManagement(dbname_prefix, "user", username,
            {
                title: data[0].lastname + " " + (data[0].midname ? data[0].midname + " " : "") + data[0].firstname,
                username: data[0].username,
                password: myPassword,
                role: ["BasicUser"],
                rule: ["Authorized"],
                isactive: true,
                admin: false,
                employee: e.ops[0]._id.toString()
            }).then(function () {
                dfd.resolve(true);
            }, function (err) {
                dfd.reject(err);
            });
    }, function (err) {
        dfd.reject(err);
    });
    return dfd.promise;
}

function generateLeadersByDepartmentIds(dbname_prefix, departmentIds, competences = []) {
    return [
        {
            $match: {
                department: { $in: departmentIds },
            },
        },
        {
            $addFields: {
                competences: competences,
            },
        },
        {
            $addFields: {
                current_competences: {
                    $first: {
                        $filter: {
                            input: "$competences",
                            as: "competence",
                            cond: {
                                $eq: ["$competence", "$$competence.value"],
                            },
                        },
                    },
                },
            },
        },
        {
            $group: {
                _id: {
                    department: "$department",
                },
                min_level: { $min: "$current_competences.level" },
                employee: {
                    $push: "$$ROOT",
                },
            },
        },
        {
            $project: {
                department: "$_id.department",
                min_level: "$min_level",
                leader: {
                    $filter: {
                        input: "$employee",
                        as: "item",
                        cond: {
                            $eq: ["$$item.current_competences.level", "$min_level"],
                        },
                    },
                },
            },
        },
        {
            $unset: ["_id"],
        },
    ];
}

class EmployeeService {
    constructor() { }
    loadDetails_d(dbname_prefix, id) {
        let dfd = q.defer();
        let dfdAr = [];
        dfdAr.push(MongoDBProvider.load_onManagement(dbname_prefix, "user",
            { "employee": { $eq: id } }, undefined, undefined, undefined,
            { _id: true, username: true, title: true, avatar: true }
        ));
        dfdAr.push(MongoDBProvider.load_onOffice(dbname_prefix, "employee",
            { "_id": { $eq: new require('mongodb').ObjectID(id) } },
            undefined, undefined, undefined,
            { signature: true, fullname: true, lastname: true, midname: true, firstname: true, department: true, competence: true }
        ));
        let dfdArray = [];
        q.all(dfdAr).then(
            function (data) {
                if (data[1][0]) {
                    if (data[1][0].signature) {
                        if (FileConst.modeProduction === 'development') {
                            data[1][0].signature.link = FileConst.tenantDomain + '/files/' + parentPath + data[1][0].username + '/' + data[1][0].signature.name;
                        } else {
                            dfdArray.push(
                                gcpProvider
                                    .getSignedUrl(
                                        parentPath + data[1][0].username + '/' + data[1][0].signature.name
                                    )
                                    .then(
                                        (imgUrl) => {
                                            data[1][0].signature.link = imgUrl;
                                        },
                                        (err) => {
                                            data[1][0].signature.link =
                                                ettings.adminDomain + '/datasources/images/default/no_sign.png';
                                        }
                                    )
                            );
                        }
                    } else {
                        data[1][0].signature = {
                            link: settings.adminDomain + '/datasources/images/default/no_sign.png',
                        };
                    }
                    if (data[0][0]) {
                        if (data[0][0].avatar) {
                            if (FileConst.modeProduction === 'development') {
                                data[0][0].avatar.url = FileConst.tenantDomain + '/files/' + parentPath + data[1][0].username + '/' + data[1][0].signature.name;
                            } else {
                                dfdArray.push(
                                    gcpProvider.getSignedUrl('office/employee/avatar/' + data[1][0].username + '/' + data[0][0].avatar.name).then(
                                        (imgUrl) => {
                                            data[0][0].avatar.url = imgUrl;
                                        },
                                        (err) => {
                                            data[0][0].avatar.url = settings.adminDomain + '/datasources/images/default/avatar_default.png';
                                        }
                                    )
                                );
                            }
                        } else {
                            data[0][0].avatar = {
                                url: settings.adminDomain + '/datasources/images/default/avatar_default.png',
                            };
                        }
                        data[1][0].userInfo = data[0][0];
                    }
                    if (dfdArray.length > 0) {
                        q.all(dfdArray).then(
                            () => {
                                dfd.resolve(data[1][0]);
                                data = undefined;
                            },
                            () => {
                                dfd.resolve(data[1][0]);
                                data = undefined;
                            }
                        );
                    } else {
                        dfd.resolve(data[1][0]);
                        data = undefined;
                    }
                } else {
                    dfd.reject({ path: 'EmployeeService.loadDetails_d.DataIsNull', mes: 'DataIsNull' });
                    data = undefined;
                }
            },
            function (err) {
                dfd.reject(err);
                err = undefined;
            }
        );
        return dfd.promise;
    }

    loadDetails_dm(dbname_prefix, id) {
        let dfd = q.defer();
        let idAr = [];
        let dfdArray = [];
        for (var i in id) {
            idAr.push(new require('mongodb').ObjectID(id[i]));
        }
        let dfdAr = [];
        dfdAr.push(MongoDBProvider.load_onOffice(dbname_prefix, "employee", { "_id": { $in: idAr } },
            undefined, undefined, undefined,
            { signature: true, fullname: true, lastname: true, midname: true, firstname: true, department: true, competence: true }
        ));
        dfdAr.push(MongoDBProvider.load_onManagement(dbname_prefix, "user", { "employee": { $in: id } }));
        q.all(dfdAr).then(function (data) {
            let emp_items = data[0];
            let user_items = data[1];

            for (var i in emp_items) {
                if (emp_items[i].signature) {
                    if (FileConst.modeProduction === 'development') {
                        emp_items[i].signature.link = FileConst.tenantDomain + '/files/' + parentPath + data[1].username + '/' + data[i].signature.name;
                    } else {
                        dfdArray.push(gcpProvider.getSignedUrl(parentPath + data[1].username + '/' + data[i].signature.name));
                    }
                } else {
                    emp_items[i].signature = {
                        link: settings.adminDomain + "/datasources/images/default/no_sign.png"
                    };
                }
                for (var j in user_items) {
                    if (user_items[j].employee === emp_items[i]._id.toString()) {
                        emp_items[i].username = user_items[j].username;
                        emp_items[i].title = user_items[j].title;
                        if (user_items[j].avatar) {
                            if (FileConst.modeProduction === 'development') {
                                user_items[j].avatar.url = FileConst.tenantDomain + '/files/' + 'office/employee/avatar/' + data[0].username + '/' + data[0].signature.name;
                            } else {
                                dfdArray.push(gcpProvider.getSignedUrl('office/employee/avatar/' + data[0].username + '/' + data[0].signature.name));
                            }
                        } else {
                            emp_items[i].avatar = { url: settings.adminDomain + "/datasources/images/default/avatar_default.png" };
                        }
                    }
                }
            }

            if (dfdArray.length > 0) {
                q.all(dfdArray).then(
                    (item) => {
                        let signature = item[0];
                        let avatar = item[1];
                        let countOfSignature = 0, countOfAvatar = 0;
                        for (var i in emp_items) {
                            if (emp_items[i].signature) {
                                emp_items[i].signature.link = signature[countOfSignature];
                                countOfSignature++;
                            } else {
                                emp_items[i].signature = {
                                    link: settings.adminDomain + "/datasources/images/default/no_sign.png"
                                };
                            }

                            for (var j in user_items) {
                                if (user_items[j].employee === emp_items[i]._id.toString()) {
                                    emp_items[i].username = user_items[j].username;
                                    emp_items[i].title = user_items[j].title;
                                    if (user_items[j].avatar) {
                                        emp_items[i].avatar.url = avatar[countOfAvatar];
                                        countOfAvatar++;
                                    } else {
                                        emp_items[i].avatar = { url: settings.adminDomain + "/datasources/images/default/avatar_default.png" };
                                    }
                                }
                            }
                        }
                        dfd.resolve(emp_items);
                        data = undefined;
                    },
                    () => {
                        dfd.resolve(emp_items);
                        data = undefined;
                    }
                );
            } else {
                dfd.resolve(emp_items);
                data = undefined;
            }
        }, function (err) {
            dfd.reject(err);
            err = undefined;
        });
        return dfd.promise;
    }

    loadDetails(dbname_prefix, id) {
        let dfd = q.defer();
        let dfdArray = [];
        MongoDBProvider.load_onOffice(dbname_prefix, "employee",
            { "_id": { $eq: new require('mongodb').ObjectID(id) } }
        ).then(function (data) {
            if (data[0]) {
                let idCard = data[0].idcard || 'undefined';
                const folderName = removeUnicode(data[0].fullname.toLowerCase()).replace(/ /g, "_") + "_" + idCard;
                if (data[0].signature) {
                    if (FileConst.modeProduction === 'development') {
                        data[0].signature.link = FileConst.tenantDomain + '/files/' + dbname_prefix + '/office/human/employee/signature/' + folderName + '/' + data[0].signature.name;
                        data[0].signature.filePath = dbname_prefix + '/office/human/employee/signature/' + folderName + '/' + data[0].signature.name;

                    } else {
                        dfdArray.push(
                            gcpProvider.getSignedUrl(dbname_prefix + '/office/human/employee/signature/' + folderName + '/' + data[0].signature.name).then(
                                (imgUrl) => {
                                    data[0].signature.link = imgUrl;
                                    data[0].signature.filePath = dbname_prefix + '/office/human/employee/signature/' + folderName + '/' + data[0].signature.name;
                                    imgUrl = undefined;
                                },
                                (err) => {
                                    data[0].signature.link = settings.adminDomain + '/datasources/images/default/no_sign.png';
                                    err = undefined;
                                }
                            )
                        );
                    }

                } else {
                    data[0].signature = {
                        link: settings.adminDomain + "/datasources/images/default/no_sign.png"
                    };
                }

                if (data[0].quotationMark) {
                    if(FileConst.modeProduction === 'development') {
                        data[0].quotationMark.link = FileConst.tenantDomain + '/files/' + dbname_prefix + '/office/human/employee/quotation_mark/' + folderName + '/' + data[0].quotationMark.name;
                        data[0].quotationMark.filePath = dbname_prefix + '/office/human/employee/quotation_mark/' + folderName + '/' + data[0].quotationMark.name;
                    } else {
                        dfdArray.push(
                            gcpProvider
                                .getSignedUrl(
                                    dbname_prefix +
                                    '/office/human/employee/quotation_mark/' +
                                    folderName +
                                    '/' +
                                    data[0].quotationMark.name,
                                )
                                .then(
                                    (imgUrl) => {
                                        data[0].quotationMark.link = imgUrl;
                                        data[0].quotationMark.filePath = dbname_prefix +
                                            '/office/human/employee/quotation_mark/' + folderName + '/' +
                                            data[0].signature.name;
                                        imgUrl = undefined;
                                    },
                                    (err) => {
                                        data[0].quotationMark.link =
                                            settings.adminDomain + '/datasources/images/default/no_sign.png';
                                        err = undefined;
                                    },
                                ),
                        );
                    }
                } else {
                    data[0].quotationMark = {
                        link: settings.adminDomain + "/datasources/images/default/no_sign.png"
                    };
                }

                if (dfdArray.length > 0) {
                    q.all(dfdArray).then(
                        () => {
                            dfd.resolve(data[0]);
                            data = undefined;
                        },
                        (err) => {
                            dfd.resolve(data[0]);
                            data = undefined;
                        }
                    );
                } else {
                    dfd.resolve(data[0]);
                    data = undefined;
                }
            } else {
                dfd.reject({ path: "EmployeeService.loadDetails.DataIsNull", mes: "DataIsNull" });
            }
        }, function (err) {
            dfd.reject(err);
            err = undefined;
        });
        return dfd.promise;
    }

    loadList(dbname_prefix, filter, top, offset, sort) {
        return MongoDBProvider.load_onOffice(dbname_prefix, "employee", filter,
            top, offset, sort,
            { _id: true, department: true, fullname: true, competence: true });
    }

    countList(dbname_prefix, filter) {
        return MongoDBProvider.count_onOffice(dbname_prefix, "employee", filter);
    }

    update_background_general(dbname_prefix, username, id, lastname, midname, firstname, birth_date,
        living, permanent_address, domicile, place_birth, type_residence,
        phonenumber, email, idcard, nationality, religion, folk) {
        return MongoDBProvider.update_onOffice(dbname_prefix, "employee", username, { _id: { $eq: new require('mongodb').ObjectID(id) } }, {
            $set: {
                lastname, midname, firstname, fullname: lastname + " " + (midname ? midname + " " : "") + firstname, birth_date,
                living, permanent_address, domicile, place_birth, type_residence,
                phonenumber, email, idcard, nationality, religion, folk, update_background_general: true
            }
        });
    }

    push_background_family(dbname_prefix, username, id, childid, fullname, job, born_in, relationship, t8_1945, tdPhap, n1955) {
        return MongoDBProvider.update_onOffice(dbname_prefix, "employee", username,
            { _id: { $eq: new require('mongodb').ObjectID(id) } }, {
            $set: { push_background_family: true }, $addToSet: { family: { childid, fullname, job, born_in, relationship, t8_1945, tdPhap, n1955 } }
        });
    }

    remove_background_family(dbname_prefix, username, id, childid) {
        return MongoDBProvider.update_onOffice(dbname_prefix, "employee", username,
            { _id: { $eq: new require('mongodb').ObjectID(id) } }, {
            $pull: { family: { childid } }
        });
    }

    update_background_family(dbname_prefix, username, id, childid, fullname, job, born_in, relationship, t8_1945, tdPhap, n1955) {
        return MongoDBProvider.update_onOffice(dbname_prefix, "employee", username,
            { $and: [{ _id: { $eq: new require('mongodb').ObjectID(id) } }, { "family.childid": { $eq: childid } }] },
            {
                $set: { "family.$.fullname": fullname, "family.$.job": job, "family.$.born_in": born_in, "family.$.relationship": relationship, "family.$.t8_1945": t8_1945, "family.$.tdPhap": tdPhap, "family.$.n1955": n1955 }
            });
    }

    update_signature(dbname_prefix, username, id, signature) {
        return MongoDBProvider.update_onOffice(dbname_prefix, "employee", username,
            { _id: { $eq: new require('mongodb').ObjectID(id) } },
            {
                $set: { signature, update_signature: true }
            });
    }

    update_signature_recover(dbname_prefix, username, id, signature, recoverRecord) {
        return MongoDBProvider.update_onOffice(
            dbname_prefix,
            'employee',
            username,
            { _id: { $eq: new require('mongodb').ObjectID(id) } },
            {
                $set: { signature, update_signature: true },
                $push: { [StoreConst.recoverFound]: recoverRecord },
            },
        );
    }

    update_quotation_mark_recover(dbname_prefix, username, id, quotationMark, recoverRecord) {
        return MongoDBProvider.update_onOffice(
            dbname_prefix,
            'employee',
            username,
            { _id: { $eq: new require('mongodb').ObjectID(id) } },
            {
                $set: { quotationMark, update_quotation_mark: true },
                $push: { QuotationRecover: recoverRecord },
            },
        );
    }

    update_quotation_mark(dbname_prefix, username, id, quotationMark) {
        return MongoDBProvider.update_onOffice(
            dbname_prefix,
            'employee',
            username,
            { _id: { $eq: new require('mongodb').ObjectID(id) } },
            {
                $set: { quotationMark, update_quotation_mark: true },
            },
        );
    }

    update_education_general(dbname_prefix, username, id,
        training_school, graduation_year, education, degree, specialized, state_management, political_theory, it, degree_english) {
        return MongoDBProvider.update_onOffice(dbname_prefix, "employee", username,
            { _id: { $eq: new require('mongodb').ObjectID(id) } }, {
            $set: {
                training_school, graduation_year, education, degree, specialized, state_management, political_theory, it, degree_english, update_education_general: true
            }
        });
    }

    update_mission_general(dbname_prefix, username, id,
        department, competence
    ) {

        let dfdAr = [];
        dfdAr.push(MongoDBProvider.update_onOffice(dbname_prefix, "employee", username,
            { _id: { $eq: new require('mongodb').ObjectID(id) } }, {
            $set: {
                department, competence, update_mission_general: true
            }
        }));
        dfdAr.push(MongoDBProvider.update_onManagement(dbname_prefix, "user", username,
            { employee: { $eq: id } }, {
            $set: {
                department, competence
            }
        }));
        return  q.all(dfdAr);

    }

    update_salary_general(dbname_prefix, username, id,
        basic_salary
    ) {
        return MongoDBProvider.update_onOffice(dbname_prefix, "employee", username,
            { _id: { $eq: new require('mongodb').ObjectID(id) } }, {
            $set: {
                basic_salary, update_salary_general: true
            }
        });
    }

    load_user(dbname_prefix, id) {
        let dfd = q.defer();
        MongoDBProvider.load_onManagement(dbname_prefix, "user",
            { employee: { $eq: id } },
            undefined, undefined, undefined,
            { username: true }).then(function (data) {
                dfd.resolve(data[0] || {});
            }, function (err) {
                dfd.reject(err);
                err = undefined;
            });
        return dfd.promise;
    }

    register_account(dbname_prefix, username, id, user) {
        let dfd = q.defer();
        let dfdAr = [];
        dfdAr.push(MongoDBProvider.load_onOffice(dbname_prefix, "employee",
            { _id: { $eq: new require('mongodb').ObjectID(id) } }));
        dfdAr.push(MongoDBProvider.load_onManagement(dbname_prefix, "user", { username: { $eq: user } }));
        q.all(dfdAr).then(function (check) {
            //let myPassword = r_password.randomPassword();

            if (check[0][0] && !check[1][0]) {
                MongoDBProvider.insert_onManagement(dbname_prefix, "user", username, { title: check[0][0].fullname, username: user, password: myPassword, role: ["BasicUser"], rule: ["Authorized"], isactive: true, admin: false, employee: id }).then(function () {
                    dfd.resolve(true);
                }, function (err) {
                    dfd.reject(err);
                    err = undefined;
                });
            } else {
                dfd.reject({ path: "EmployeeService.register_account.InvalidInformation", mes: "InvalidInformation" });
            }
        }, function (err) {
            dfd.reject({ path: "EmployeeService.register_account.err", err: err.toString() });
            err = undefined;
        });
        return dfd.promise;
    }

    insert(dbname_prefix, username, employee, lastname, midname, firstname, birth_date, phonenumber, email, idcard, department, competence) {
        let d = new Date();
        return MongoDBProvider.insert_onOffice(dbname_prefix, "employee", username,
            { lastname, midname, firstname, fullname: lastname + " " + (midname ? midname + " " : "") + firstname, birth_date, phonenumber, email, idcard, department, competence, event: [{ username, employee, time: d.getTime(), action: "Created" }] });
    }

    insert_Many(dbname_prefix, username, employee, data) {
        let dfd = q.defer();
        let d = new Date();
        let userFilter;
        let dataInsert = [];
        if (data.length == 1) {
            userFilter = { username: { $eq: data[0].username } };
        } else {
            userFilter = { username: { $in: [] } }
            for (var i in data) {
                userFilter.username.$in.push(data[i].username);
            }
        }
        MongoDBProvider.load_onManagement(dbname_prefix, "user", userFilter).then(function (users) {
            if (data.length == 1) {
                if (users.length == 1) {
                    dfd.resolve(data);
                } else {
                    insert_single(dbname_prefix, username, employee, data).then(function () {
                        dfd.resolve([]);
                    }, function (err) {
                        dfd.reject(err);
                    });
                }
            } else {
                if (users.length == 0) {
                    insert_multi(dbname_prefix, username, employee, data).then(function () {
                        dfd.resolve([]);
                    }, function (err) {
                        dfd.reject(err);
                    });
                } else {
                    let newData = [];
                    let duplicateData = [];
                    for (var i in data) {
                        let check = true;
                        for (var j in users) {
                            if (data[i].username === users[j].username) {
                                check = false;
                                break;
                            }
                        }
                        if (check) {
                            newData.push(data[i]);
                        } else {
                            duplicateData.push(data[i]);
                        }
                    }
                    if (newData.length == 0) {
                        dfd.resolve(data);
                    } else {
                        if (newData.length == 1) {
                            insert_single(dbname_prefix, username, employee, newData).then(function () {
                                dfd.resolve(duplicateData);
                            }, function (err) {
                                dfd.reject(err);
                            });
                        } else {
                            insert_multi(dbname_prefix, username, employee, newData).then(function () {
                                dfd.resolve(duplicateData);
                            }, function (err) {
                                dfd.reject(err);
                            });
                        }
                    }
                }
            }
        }, function (err) {
            dfd.reject(err);
        });
        return dfd.promise;
    }

    checkDeclaration(dbname_prefix, id) {
        let dfd = q.defer();
        MongoDBProvider.load_onOffice(dbname_prefix, "employee",
            { _id: { $eq: new require('mongodb').ObjectID(id) } }).then(function (data) {
                if (data[0]) {
                    if (data[0].update_background_general
                        && data[0].update_education_general
                        && data[0].push_background_family) {
                        dfd.resolve({ result: true });
                    } else {
                        dfd.resolve({ result: false });
                    }
                } else {
                    dfd.reject({ path: "EmployeeService.checkDeclaration.DataIsNull", mes: "DataIsNull" });
                }
            }, function (err) {
                dfd.reject(err);
            });
        return dfd.promise;
    }

    delete(dbname_prefix, id, username) {
        let dfd = q.defer();
        // MongoDBProvider.load_onHost({collection:"user",filter:{employee : {$eq:id}}}).then(function(data){
        //     if(data[0]){
        //         dfd.reject({path:"EmployeeService.delete.InvalidHandle",mes:"InvalidHandle"});
        //     }else{
        MongoDBProvider.delete_onOffice(dbname_prefix, "employee", username,
            { _id: { $eq: new require('mongodb').ObjectID(id) } }).then(function () {
                dfd.resolve(true);
            }, function (err) {
                dfd.reject(err);
            });
        //     }
        // },function(err){
        //     dfd.reject(err);
        // });
        return dfd.promise;
    }

    loadLeadersByDepartmentIds(dbname_prefix, departmentIds) {
        const dfd = q.defer();
        q.fcall(() => {
            return DirectoryService.loadByMasterKey(dbname_prefix, "competence");
        })
            .then((competences) => {
                const listCompetences = competences.map((competence) => ({
                    value: competence.value,
                    level: competence.level,
                }));
                const aggregateSteps = generateLeadersByDepartmentIds(dbname_prefix, departmentIds, listCompetences);
                return MongoDBProvider.loadAggregate_onOffice(dbname_prefix, "employee", aggregateSteps);
            })
            .then((result) => {
                dfd.resolve(result);
            })
            .catch((error) => {
                dfd.reject(
                    error instanceof BaseError
                        ? error
                        : new BaseError(
                              "EmployeeService.loadLeadersByDepartmentIds.err",
                              "ProcessLoadLeadersByDepartmentIdsFailed",
                          ),
                );
            });
        return dfd.promise;
    }

}

exports.EmployeeService = new EmployeeService();
