
const trycatch = require('trycatch');
const q = require('q');
const { MenuService } = require('./menu.service');
const {MapController} = require('../frontendmap/map.controller');
/**user */

const filterData = function (data, isactive, search) {
    let results = [];
    try {
        for (var i in data) {
            let check = true;
            if (isactive !== undefined) {
                if (isactive && !data[i].isactive) { check = false; }
                if (!isactive && data[i].isactive) { check = false; }
            }
            if (search !== "" && search !== undefined) {
                if (data[i].key.toLowerCase().indexOf(search.toLowerCase()) == -1) { check = false; }
            }
            if (check) { results.push(data[i]) }
        }
        
    } catch (error) {
        console.log(error);
    }
    return results;
}


class MenuController {
    constructor() { }

    load(body) {
        let dfd = q.defer();
        MenuService.load(body._service[0].dbname_prefix,body.id).then(function (data) {
           
            let result = filterData(data, body.active, body.search);
            dfd.resolve(result);
            result = undefined;
            data = undefined;
            filter = undefined;
            count = undefined;
            body = undefined;
        }, function (err) {
            dfd.reject(err);
            err = undefined;
            body = undefined;
            count = undefined;
            filter = undefined;
        });
        return dfd.promise;
    }

    getOrderNumberMenu(body) {
        return MenuService.getOrderNumberMenu(body._service[0].dbname_prefix,body.id);
    }

    insertAsComponent(body) {
        let dfd = q.defer();
        let check = true;
        if (!MapController.checkExistKey(body.keyofmenu) ) {
            check = false;
            dfd.reject({ path: "MenuController.insertAsComponent.KeyOfComponenHosttIsNotExist", err: "KeyOfComponenHosttIsNotExist" });
        }
        if (check) {
            MenuService.insertAsComponent(body._service[0].dbname_prefix,body.username, body.id,body.title, body.keyofmenu, body.ordernumber, body.isactive).then(function () {
                dfd.resolve(true);
                dfd = undefined;
                body = undefined;
                check = undefined;
            }, function (err) {
                dfd.reject(err);
                err = undefined;
                body = undefined;
                check = undefined;
            });
        }
        return dfd.promise;
    }

    insertAsUrl(body) {
        return MenuService.insertAsUrl(body._service[0].dbname_prefix,body.username, body.id, body.url, body.ordernumber, body.isactive, body.title);
    }

    updateAsComponent(body) {
        let dfd = q.defer();
        let check = true;
        if (!MapController.checkExistKey(body.keyofmenu) ) {
            check = false;
            dfd.reject({ path: "MenuController.updateAsComponent.KeyOfComponenHosttIsNotExist", err: "KeyOfComponenHosttIsNotExist" });
        }
        if (check) {
            MenuService.updateAsComponent(body._service[0].dbname_prefix,body.username, body.id,body.title, body.keyofmenu, body.ordernumber, body.isactive, body.idofmenu).then(function () {
                dfd.resolve(true);
                dfd = undefined;
                body = undefined;
                check = undefined;
            }, function (err) {
                dfd.reject(err);
                err = undefined;
                body = undefined;
                check = undefined;
            });
        }
        return dfd.promise;
    }

    updateAsUrl(body) {
        return MenuService.updateAsUrl(body._service[0].dbname_prefix,body.username, body.id, body.url, body.ordernumber, body.isactive, body.idofmenu, body.title);
    }

    delete(body) {
        return MenuService.delete(body._service[0].dbname_prefix,body.username, body.id, body.idofmenu)
    }
}

exports.MenuController = new MenuController(); 