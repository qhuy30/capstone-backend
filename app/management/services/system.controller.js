

const q = require('q');
const { SessionProvider } = require('../../../shared/redis/session.provider');
const managementMap = require('./../mapConcern');
const officeMap = require('./../../office/mapConcern');
const basicMap = require('./../../basic/mapConcern');
const educationMap = require('./../../education/mapConcern');
const utilitiesToolsMap = require('./../../utilities_tools/mapConcern');

function getAllMap() {
    let maps = [];
    for (var i in managementMap) {
        for (var j in managementMap[i]) {
            maps.push(managementMap[i][j]);
        }
    }
    for (var i in officeMap) {
        for (var j in officeMap[i]) {
            maps.push(officeMap[i][j]);
        }
    }
    for (var i in basicMap) {
        for (var j in basicMap[i]) {
            maps.push(basicMap[i][j]);
        }
    }
    for (var i in educationMap) {
        for (var j in educationMap[i]) {
            maps.push(educationMap[i][j]);
        }
    }
    for (var i in utilitiesToolsMap) {
        for (var j in utilitiesToolsMap[i]) {
            maps.push(utilitiesToolsMap[i][j]);
        }
    }
    return maps;
}

class SystemController {
    constructor() { }
    checkRouter(req) {
        let dfd = q.defer();
        let check = false;
        let data = {};
        let allMap = JSON.parse(JSON.stringify(getAllMap()));

        for (var i in allMap) {
            if (req.body.path === allMap[i].path) {
                check = true;
                data = allMap[i];
            } else if (new RegExp(`^${allMap[i].path.split('/:')[0]}\/[^\/]*$`, "g").test(req.body.path)) {
                check = true;
                data = allMap[i];
            }
        }
        if (check) {
            if (data.rule === null || data.rule.indexOf("Authorized")) {
                dfd.resolve(data);
            } else {
                SessionProvider.generateInfomation(req).then(function (res) {
                    let checkRule = false;
                    for (var i in data.rule) {
                        if (res.body.session.rule.filter(e=>e.rule === data.rule[i] || e.rule ==="*").length>0) {
                            checkRule = true;
                            break;
                        }
                    }
                    if (checkRule) {
                        dfd.resolve(data);
                    } else {
                        dfd.reject({ path: "SystemController.checkRouter.NotPermission", err: "NotPermission" });
                    }
                    req = undefined;
                    data = undefined;
                    check = undefined;
                    res = undefined;
                    checkRule = undefined;
                }, function (err) {
                    dfd.reject(err);
                    req = undefined;
                    data = undefined;
                    check = undefined;
                    err = undefined;
                });
            }
        } else {
            dfd.reject({ path: "SystemController.checkRouter.PathIsNotFound", err: "PathIsNotFound" });
            req = undefined;
            data = undefined;
            check = undefined;
        }
        allMap = undefined;

        return dfd.promise;
    }
}

exports.SystemController = new SystemController();
