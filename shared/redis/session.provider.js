
const q = require('q');
const { SessionInterface } = require('./session.interface');
const { MongoDBProvider } = require('../mongodb/db.provider');
const { connectName } = require('../mongodb/mongodb.const');
const { AuthenticationProvider } = require('../authentication/authentication.provider');
const { messageHTTP, statusHTTP } = require('../../utils/setting');
const { FileConst } = require('../file/file.const');
const settings = require('../../utils/setting')
const { StoreConst } = require('../../shared/store/gcp/store.const');
const { gcpProvider } = require('../../shared/store/gcp/gcp.provider');
const {OrganizationService} = require('../../app/office/organization/organization.service');

const folderArray = ['management', 'user']

const generateDBname = function (dbname_prefix, dbname) {
    if (dbname_prefix) {
        return dbname_prefix;
    }
    return dbname;
}

function combineRoleForAllGroupPerUser(groups){
    let role =[];
    for(var i in groups){
        if(groups[i].role){
            for(var j in groups[i].role){
                if(role.indexOf(groups[i].role[j]) ==-1){
                    role.push(groups[i].role[j]);
                }
            }
        }
    }

    return role;
}

function combineRole(role_of_user, role_of_groups){
    let role =[];

    for(var i in role_of_user){
        if(role.indexOf(role_of_user[i]) ==-1){
            role.push(role_of_user[i]);
        }
    }

    for(var i in role_of_groups){
        if(role.indexOf(role_of_groups[i]) ==-1){
            role.push(role_of_groups[i]);
        }
    }

    return role;
}

function combineRuleForAllGroupPerUser(groups){
    let rule =[];

    for(var i in groups){
        if(groups[i].rule){
            for(var j in groups[i].rule){
                if(rule.filter(e=>e.rule === groups[i].rule[j].rule).length===0){
                    rule.push(groups[i].rule[j]);
                }
            }
        }
    }

    return rule;
}

function combineRule(rule_of_user,rule_of_groups){
    let rule =[];

    for(var i in rule_of_user){
        if(rule.filter(e=>e.rule === rule_of_user[i].rule).length ===0){
            rule.push(rule_of_user[i]);
        }
    }

    for(var i in rule_of_groups){
        if(rule.filter(e=>e.rule === rule_of_groups[i].rule).length ===0){
            rule.push(rule_of_groups[i]);
        }
    }
    return rule;
}
const generateData = async function (dbname_prefix,dataUser, dataGroup, department) {
    let result = dataUser;
    let group = [];
    for (let i in dataGroup) {
        group.push(dataGroup[i]._id);
    }

    if (dataUser.avatar) {
        if (FileConst.modeProduction === 'development') {
            const folderPath = folderArray.join('/');
            let imgURl = FileConst.tenantDomain + '/files/' + dbname_prefix + '/' + folderPath + '/' + dataUser.avatar.nameLib + "/" + dataUser.username + '/' + dataUser.avatar.name;
            result.avatar.url = imgURl;
        } else {
            const folderPath = folderArray.join('/');
            let imgURl = await gcpProvider.getSignedUrl(dbname_prefix + '/' + folderPath + '/' + dataUser.avatar.nameLib + "/" + dataUser.username + '/' + dataUser.avatar.name) || settings.adminDomain + "/datasources/images/default/avatar_default.png"
            result.avatar.url = imgURl;
        }
    } else {
        result.avatar = { url: settings.adminDomain + "/datasources/images/default/avatar_default.png" };
    }
    result.rule = combineRule(dataUser.rule,combineRuleForAllGroupPerUser(dataGroup));
    result.role = combineRole(dataUser.role,combineRoleForAllGroupPerUser(dataGroup));
    result.group = group;
    result.employee_details = dataUser.employee_details;
    result.department_details = department;
    group = undefined;
    return result;
}

const loadData = function (dbname_prefix, username) {
    let dfd = q.defer();
    MongoDBProvider.load_onManagement(dbname_prefix, 'user', { username: { $eq: username } })
        .then((response) => {
            if (!response[0]) {
                return dfd.reject({ path: 'SessionProvider.loadData.UserNameIsNotExist', mes: 'UserNameIsNotExist' });
            }
            const user = response[0];

            let employeePromise;
            if (user.employee) {
                employeePromise = MongoDBProvider.load_onOffice(dbname_prefix, 'employee', {
                    _id: { $eq: new require('mongodb').ObjectID(user.employee.toString()) },
                });
            } else {
                employeePromise = q.resolve(null);
            }


            let organizationPromise
            if (user.department)
                organizationPromise = OrganizationService.loadDetails(dbname_prefix, user.department );
            else
            organizationPromise = q.resolve(null);


            const groupFilter = {
                $or: [{ user: { $eq: username } }],
            };
            if (user.competence) {
                groupFilter.$or.push({ competence: { $eq: user.competence } });
            }
            return q.all([
                user,
                employeePromise,
                MongoDBProvider.load_onManagement(dbname_prefix, 'group', groupFilter, 5000, 0, { _id: -1 }),
                organizationPromise
            ]);
        })
        .then(([user, employee, group, department]) => {
            if (Array.isArray(employee) && employee[0]) {
                user.employee_details = employee[0];
            }
            dfd.resolve(generateData(dbname_prefix, user, group, department));
        })
        .catch((error) => {
            dfd.reject({ path: 'SessionProvider.loadData_onManagement.trycatch', err: error });
            username = undefined;
            dfdAr = undefined;
        });

    return dfd.promise;
}

class SessionProvider {
    constructor() {
    }
    get(dbname_prefix,username) {
        return SessionInterface.get(generateDBname(dbname_prefix,connectName.management), username);
    }

    set(dbname_prefix,username, data) {
        return SessionInterface.set(generateDBname(dbname_prefix,connectName.management), username, data);
    }

    del(dbname_prefix,username) {
        return SessionInterface.del(generateDBname(dbname_prefix,connectName.management), username);
    }

    clear(dbname_prefix) {
        return SessionInterface.clear(generateDBname(dbname_prefix,connectName.management));
    }

    ensure(dbname_prefix,username) {
        let dfd = q.defer();

        SessionInterface.get(generateDBname(dbname_prefix, connectName.management), username).then(function (res) {
            if (!res.department_details || typeof res.department_details !== 'object') {
                loadData(dbname_prefix,username).then(function (data) {

                    SessionInterface.set(generateDBname(dbname_prefix,connectName.management), username, data);
                    dfd.resolve(data);
                    data = undefined;
                    username = undefined;
                    dfd = undefined;
                }, function (err) {
                    dfd.reject(err);
                    err = undefined;
                    username = undefined;
                });
            }
            dfd.resolve(res);
        }, function (err) {

            loadData(dbname_prefix,username).then(function (data) {

                SessionInterface.set(generateDBname(dbname_prefix,connectName.management), username, data);
                dfd.resolve(data);
                data = undefined;
                username = undefined;
                dfd = undefined;
            }, function (err) {
                dfd.reject(err);
                err = undefined;
                username = undefined;
            });
        });
        return dfd.promise;
    }


    match(req, res, next) {
        let obj = new SessionProvider();

        req.body = req.body || {};

        let checkAuth = AuthenticationProvider.verify(req, res);

        if (checkAuth.status) {
            req = checkAuth.req;

            obj.ensure(req.body._service[0].dbname_prefix,req.body.username).then(function (data) {
                req.body.session = data;
                next();
                data = undefined;
                req = undefined;
                res = undefined;
                next = undefined;
                obj = undefined;
            }, function () {
                res.status(statusHTTP.internalServer);
                res.send({ mes: messageHTTP.internalServer });
                res.end();
                req = undefined;
                res = undefined;
                next = undefined;
                obj = undefined;
            });
        } else {
            res.status(statusHTTP.authorized);
            res.send({ mes: messageHTTP.authorized });
            res.end();
            req = undefined;
            res = undefined;
            next = undefined;
        }
        checkAuth = undefined;

    }



    verify(req, res) {
        let obj = new SessionProvider();
        let dfd = q.defer();

        req.body = req.body || {};

        let checkAuth = AuthenticationProvider.verify(req, res);

        if (checkAuth.status) {
            req = checkAuth.req;
            obj.ensure(req.body._service[0].dbname_prefix,req.body.username).then(function (data) {
                req.body.session = data;
                dfd.resolve(req);
                data = undefined;
                obj = undefined;
            }, function () {
                dfd.reject({ path: "SessionProvider.verify_onManagement.CantMatchSession_ensure", err: 'CantMatchSession_ensure!' });
                obj = undefined;
            });
            checkAuth = undefined;
        } else {
            dfd.reject(checkAuth.err);
            checkAuth = undefined;
        }

        return dfd.promise;
    }


    generateInfomation(req) {
        let dfd = q.defer();
        AuthenticationProvider.generateInformation(req).then(function (response) {
            req = response;
            let obj = new SessionProvider();
            obj.ensure(req.body._service[0].dbname_prefix,req.body.username).then(function (data) {
                req.body.session = data;
                dfd.resolve(req);
                data = undefined;
                response = undefined;

            }, function (err) {
                dfd.reject(err);
                err = undefined;
                response = undefined;

            });
        }, function (err) {
            dfd.reject(err);
            err = undefined;

        });
        return dfd.promise;
    }


}

exports.SessionProvider = new SessionProvider();
