const express = require('express');
const router = express.Router();
const { MenuController } = require('./menu.controller');
const { validation } = require('./menu.validation');
const { PermissionProvider } = require('../../../shared/permission/permission.provider');
const {statusHTTP } = require('../../../utils/setting');
const { Router } = require('../../../shared/router/router.provider');
const {MultiTenant} = require('../../../shared/multi_tenant/provider');

router.post('/load',MultiTenant.match(), PermissionProvider.check(["Management.Menu.Use"]), validation.load, Router.trycatchFunction("post/management/menu/load", function (req, res) {
    return function () {
        MenuController.load(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/management/menu/load", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/ordernumber',MultiTenant.match(), PermissionProvider.check(["Management.Menu.Use"]), validation.getOrderNumber, Router.trycatchFunction("post/management/menu/ordernumber", function (req, res) {
    return function () {
        MenuController.getOrderNumberMenu(req.body).then(function (data) {
            res.send({ ordernumber: data });
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/management/menu/ordernumber", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/insertascomponent',MultiTenant.match(), PermissionProvider.check(["Management.Menu.Use"]), validation.insertAsComponent, Router.trycatchFunction("post/management/menu/insertascomponent", function (req, res) {
    return function () {
        MenuController.insertAsComponent(req.body).then(function (data) {
            res.send({ status: data });
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/management/menu/insertascomponent", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/insertasurl',MultiTenant.match(), PermissionProvider.check(["Management.Menu.Use"]), validation.insertAsUrl, Router.trycatchFunction("post/management/menu/insertasurl", function (req, res) {
    return function () {
        MenuController.insertAsUrl(req.body).then(function (data) {
            res.send({ status: data });
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/management/menu/insertasurl", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/updateascomponent',MultiTenant.match(), PermissionProvider.check(["Management.Menu.Use"]), validation.updateAsComponent, Router.trycatchFunction("post/management/menu/updateascomponent", function (req, res) {
    return function () {
        MenuController.updateAsComponent(req.body).then(function (data) {
            res.send({ status: data });
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/management/menu/updateascomponent", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/updateasurl',MultiTenant.match(), PermissionProvider.check(["Management.Menu.Use"]), validation.updateAsUrl, Router.trycatchFunction("post/management/menu/updateasurl", function (req, res) {
    return function () {
        MenuController.updateAsUrl(req.body).then(function (data) {
            res.send({ status: data });
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/management/menu/updateasurl", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/delete',MultiTenant.match(), PermissionProvider.check(["Management.Menu.Use"]), validation.delete, Router.trycatchFunction("post/management/menu/delete", function (req, res) {
    return function () {
        MenuController.delete(req.body).then(function (data) {
            res.send({ status: data });
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/management/menu/delete", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

module.exports = router;