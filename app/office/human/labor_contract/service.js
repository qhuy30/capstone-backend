const { MongoDBProvider } = require('../../../../shared/mongodb/db.provider');
const q = require('q');
const { StoreConst } = require('../../../../shared/store/gcp/store.const');

function attachLabor_transaction(insertLaborFunc, updateEmployeeFunc) {
    return async function (session) {
        let dfd = q.defer();
        try {
            let itemId = await insertLaborFunc(session);
            await updateEmployeeFunc(session, itemId.toString());
            dfd.resolve(true);
        } catch (error) {
            dfd.reject({ path: "LaborContractService.attachLabor.transaction", err: JSON.stringify(error) });
        }
        return dfd.promise;
    }
}

class LaborContractService {
    constructor() { }

    loadDetails(dbname_prefix, username, id) {
        let dfd = q.defer();
        MongoDBProvider.load_onOffice(dbname_prefix, "labor_contract", { "_id": { $eq: new require('mongodb').ObjectID(id) } }).then(function (data) {
            if (data[0]) {
                dfd.resolve(data[0]);
            } else {
                dfd.reject({ path: "LaborContractService.loadDetails.DataIsNull", mes: "DataIsNull" });
            }
            data = undefined;
        }, function (err) {
            dfd.reject(err);
            err = undefined;
        });
        return dfd.promise;
    }

    loadList(dbname_prefix, filter, top, offset, sort) {
        return MongoDBProvider.load_onOffice(dbname_prefix, "labor_contract",
            filter, top, offset, sort, { entity: false });
    }

    countPending(dbname_prefix) {
        return MongoDBProvider.count_onOffice(dbname_prefix, "labor_contract", { status: { $eq: "Pending" } });
    }

    countList(dbname_prefix, filter) {
        return MongoDBProvider.count_onOffice(dbname_prefix, "labor_contract", filter);
    }

    insert(
        dbname_prefix,
        username, employee, basic_salary, type, lastname, midname, firstname, living, permanent_address, type_residence,
        birth_date, phonenumber, email, idcard, nationality, religion,
        training_school, graduation_year, education, degree, specialized, state_management, political_theory, it, degree_english,
        department, competence,
        from_date, to_date,
        attachment
    ) {
        let d = new Date();
        return MongoDBProvider.insert_onOffice(dbname_prefix, "labor_contract", username,
            {
                username, employee,
                basic_salary, type, lastname, midname, firstname, fullname: lastname + " " + (midname ? midname + " " : "") + firstname, living, permanent_address, type_residence,
                birth_date, phonenumber, email, idcard, nationality, religion,
                training_school, graduation_year, education, degree, specialized, state_management, political_theory, it, degree_english,
                department, competence,
                from_date, to_date,
                attachment,
                status: "Pending", event: [{ username, employee, time: d.getTime(), action: "Created" }]
            })
    }

    update(
        dbname_prefix,
        username, employee, id, basic_salary, type, lastname, midname, firstname, living, permanent_address, type_residence,
        birth_date, phonenumber, email, idcard, nationality, religion,
        training_school, graduation_year, education, degree, specialized, state_management, political_theory, it, degree_english,
        department, competence,
        from_date, to_date
    ) {
        let d = new Date();
        let event = { username, employee, time: d.getTime(), action: "UpdateInformation" };
        return MongoDBProvider.update_onOffice(dbname_prefix, "labor_contract", username,
            { _id: { $eq: new require('mongodb').ObjectID(id) } }, {
            $set: {
                basic_salary, type, lastname, midname, firstname, fullname: lastname + " " + (midname ? midname + " " : "") + firstname, living, permanent_address, type_residence,
                birth_date, phonenumber, email, idcard, nationality, religion,
                training_school, graduation_year, education, degree, specialized, state_management, political_theory, it, degree_english,
                department, competence,
                from_date, to_date
            },
            $push: { event }
        });
    }

    approval(dbname_prefix,
        username, employee, id, basic_salary, type, lastname, midname, firstname, living, permanent_address, type_residence,
        birth_date, phonenumber, email, idcard, nationality, religion,
        training_school, graduation_year, education, degree, specialized, state_management, political_theory, it, degree_english,
        department, competence,
        from_date, to_date) {
        let dfd = q.defer();
        MongoDBProvider.load_onOffice(dbname_prefix, "labor_contract",
            { _id: { $eq: new require('mongodb').ObjectID(id) } }).then(function (data) {
                if (data[0]) {
                    data = data[0];
                    if (data.status !== "Pending") {
                        dfd.reject({ path: "LaborContractService.approval.InvalidAction", mes: "InvalidAction" });
                    } else {
                        let d = new Date();
                        let event = { username, employee, time: d.getTime(), action: "Approved" };
                        MongoDBProvider.update_onOffice(dbname_prefix, "labor_contract", username,
                            { _id: { $eq: new require('mongodb').ObjectID(id) } },
                            {
                                $set: {
                                    status: "Approved", basic_salary, type, lastname, midname, firstname, fullname: lastname + " " + (midname ? midname + " " : "") + firstname, living, permanent_address, type_residence,
                                    birth_date, phonenumber, email, idcard, nationality, religion,
                                    training_school, graduation_year, education, degree, specialized, state_management, political_theory, it, degree_english,
                                    department, competence,
                                    from_date, to_date, attachLabor: true
                                },
                                $push: { event }
                            }).then(function () {
                                if (data.attachLabor) {
                                    dfd.resolve(true);
                                } else {
                                    try {
                                        MongoDBProvider.insert_onOffice(dbname_prefix, "employee", username,
                                            {
                                                basic_salary, type, lastname, midname, firstname, fullname: lastname + " " + (midname ? midname + " " : "") + firstname, living, permanent_address, type_residence,
                                                birth_date, phonenumber, email, idcard, nationality, religion,
                                                training_school, graduation_year, education, degree, specialized, state_management, political_theory, it, degree_english,
                                                department, competence,
                                                labor_contract: [id]
                                            }
                                        ).then(function () {
                                            dfd.resolve(true);
                                        }, function (err) {
                                            dfd.reject(err);
                                            err = undefined;
                                        });
                                    } catch (error) {
                                        console.log(error);
                                    }
                                }


                            }, function (err) {
                                dfd.reject(err);
                                err = undefined;
                            });
                    }
                } else {
                    dfd.reject({ path: "LaborContractService.approval.DataIsNull", mes: "DataIsNull" });
                    data = undefined;
                }
            }, function (err) {
                dfd.reject(err);
                err = undefined;
            });
        return dfd.promise;
    }

    pushFile(dbname_prefix, username, id, file) {
        return MongoDBProvider.update_onOffice(dbname_prefix, "labor_contract", username
            , { _id: { $eq: new require('mongodb').ObjectID(id) } },
            { $addToSet: { attachment: file } });
    }

    removeFile(dbname_prefix, username, id, filename, recoverRecord) {
        return MongoDBProvider.update_onOffice(dbname_prefix, "labor_contract", username,
            { _id: { $eq: new require('mongodb').ObjectID(id) } },
            {
                $pull: { attachment: { name: filename } },
                $push: { [StoreConst.recoverFound]: recoverRecord }
            });
    }


    delete(dbname_prefix, username, id,) {
        return MongoDBProvider.delete_onOffice(dbname_prefix, "labor_contract", username,
            {
                $and: [{ status: { $eq: "Pending" } },
                { _id: { $eq: new require('mongodb').ObjectID(id) } }]
            });
    }

    delete_multi(dbname_prefix,username, idAr) {
        let dfd = q.defer();
        if (idAr.length == 0) {
            dfd.resolve(true);
        } else {
            let filter;
            if (idAr.length === 1) {
                filter = {
                    $and: [{ status: { $eq: "Pending" } },
                    { _id: { $eq: new require('mongodb').ObjectID(idAr[0]) } }
                    ]
                };
            } else {
                filter = {
                    $and: [
                        { status: { $eq: "Pending" } },
                        { $or: [] }
                    ]
                };
                for (var i in idAr) {
                    filter.$and[1].$or.push({ _id: { $eq: new require('mongodb').ObjectID(idAr[i]) } });
                }
            }
            MongoDBProvider.delete_onOffice(dbname_prefix,"labor_contract", username , filter).then(function () {
                dfd.resolve(true);
            }, function (err) {
                dfd.reject(err);
                err = undefined;
            })
        }
        return dfd.promise;
    }

    attachLabor(
        dbname_prefix,
        username, employee, id, basic_salary, type, lastname, midname, firstname, living, permanent_address, type_residence,
        birth_date, phonenumber, email, idcard, nationality, religion,
        training_school, graduation_year, education, degree, specialized, state_management, political_theory, it, degree_english,
        department, competence,
        from_date, to_date,
        attachment) {
            
        let insertFunc = function (session) {
            let dfd = q.defer();
            let d = new Date();
            
                MongoDBProvider.insert_onOffice(dbname_prefix,"labor_contract", username ,
                {
                    username, employee,
                    basic_salary, type, lastname, midname, firstname, fullname: lastname + " " + (midname ? midname + " " : "") + firstname, living, permanent_address, type_residence,
                    birth_date, phonenumber, email, idcard, nationality, religion,
                    training_school, graduation_year, education, degree, specialized, state_management, political_theory, it, degree_english,
                    department, competence,
                    from_date, to_date,
                    attachment,
                    status: "Pending", attachLabor: true, event: [{ username, employee, time: d.getTime(), action: "Created" }]
                }, { session }).then(function (e) {
                    dfd.resolve(e.ops[0]._id.toString());
                }, function (err) {
                    dfd.reject(err);
                });
         
            return dfd.promise;
        }
     
        let updateFunc = function (session, itemId) {
            return MongoDBProvider.update_onOffice(dbname_prefix, "employee", username , { _id: { $eq: new require('mongodb').ObjectID(id) } }, { $push: { labor_contract: itemId } }, { session });
        }

        return MongoDBProvider.executeTransaction(attachLabor_transaction(insertFunc, updateFunc));
    }

    loadListOfEmployee(dbname_prefix,idAr) {
        let filter = { _id: { $in: [] } };
        for (var i in idAr) {
            filter._id.$in.push(new require('mongodb').ObjectID(idAr[i]));
        }
        return MongoDBProvider.load_onOffice(dbname_prefix, "labor_contract", filter,undefined,undefined, { _id: -1 } );
    }
}


exports.LaborContractService = new LaborContractService();