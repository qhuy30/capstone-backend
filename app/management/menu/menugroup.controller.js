

const q = require('q');
const { MenuGroupService } = require('./menugroup.service');

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

class MenuGroupController {
    constructor() { }

    loadRouter(rules) {
        let dfd = q.defer();
        let privateMap = [];
        let allMap = JSON.parse(JSON.stringify(getAllMap()));
        for (let i in allMap) {
            if (allMap[i].rule != null) {
                for (var j in allMap[i].rule) {
                    if (rules.filter(e => e.rule === allMap[i].rule[j] || e.rule === "*").length >0) {
                        privateMap.push(allMap[i]);
                        break;
                    }
                }
            }
        }

        dfd.resolve(privateMap);
        privateMap = undefined;
        rules = undefined;


        return dfd.promise;
    }

    all(body) {
        return MenuGroupService.load(body._service[0].dbname_prefix);
    }

    private(body) {
        let dfd = q.defer();
        let obj = new MenuGroupController();
        let dfdAr = [];
        dfdAr.push(MenuGroupService.loadAllMenu(body._service[0].dbname_prefix));
        dfdAr.push(obj.loadRouter(body.session.rule));
        q.all(dfdAr).then(function (data) {
            let result = [];
            let allMenu = data[0];
            let privateRouter = data[1];

            for (var i in allMenu) {
                result.push(JSON.parse(JSON.stringify(allMenu[i])));
                result[i].items = [];
                for (var j in allMenu[i].items) {
                    if (allMenu[i].items[j].type != "url") {
                        for (var z in privateRouter) {
                            if (privateRouter[z].key == allMenu[i].items[j].key) {
                                result[i].items.push(JSON.parse(JSON.stringify(allMenu[i].items[j])));
                                result[i].items[result[i].items.length - 1].path = privateRouter[z].path;
                                result[i].items[result[i].items.length - 1].icon = privateRouter[z].icon;
                                break;
                            }
                        }
                    }
                }
            }

            dfd.resolve(result);
            result = undefined;
            allMenu = undefined;
            privateRouter = undefined;
            dfdAr = undefined;
            data = undefined;
            obj = undefined;
            body = undefined;
        }, function (err) {
            dfd.reject(err);
            dfdAr = undefined;
            err = undefined;
            obj = undefined;
            body = undefined;
        });
        return dfd.promise;
    }

    insert(body) {
        return MenuGroupService.insert(body._service[0].dbname_prefix,body.type, body.ordernumber, body.title, body.username, body.isactive, body.icon);
    }

    getOrderNumberMenuGroup(body) {
        return MenuGroupService.getOrderNumberMenuGroup(body._service[0].dbname_prefix);
    }

    update(body) {
        return MenuGroupService.update(body._service[0].dbname_prefix,body.id, body.ordernumber, body.title, body.username, body.isactive, body.icon);
    }

    delete(body) {
        return MenuGroupService.delete(body._service[0].dbname_prefix,body.id, body.username);
    }

}

exports.MenuGroupController = new MenuGroupController();
