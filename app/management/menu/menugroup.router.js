const express = require('express');
const router = express.Router();
const { MenuGroupController } = require('./menugroup.controller');
const { validation } = require('./menugroup.validation');
const { PermissionProvider } = require('../../../shared/permission/permission.provider');
const {statusHTTP } = require('../../../utils/setting');
const { SessionProvider } = require('../../../shared/redis/session.provider');
const { Router } = require('../../../shared/router/router.provider');
const {MultiTenant} = require('../../../shared/multi_tenant/provider');
router.get('/private',MultiTenant.match(), SessionProvider.match,Router.trycatchFunction("get/management/menugroup/private", function (req, res) {
    return function () {
        MenuGroupController.private(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "get/management/menugroup/private", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/all',MultiTenant.match(), PermissionProvider.check("Management.Menu.Use") ,Router.trycatchFunction("post/management/menugroup/all", function (req, res) {
    return function () {
        MenuGroupController.all(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/management/menugroup/all", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/insert',MultiTenant.match(), PermissionProvider.check("Management.Menu.Use") ,validation.insert,Router.trycatchFunction("post/management/menugroup/insert", function (req, res) {
    return function () {
        MenuGroupController.insert(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/management/menugroup/insert", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/ordernumber',MultiTenant.match(), PermissionProvider.check("Management.Menu.Use") ,Router.trycatchFunction("post/management/menugroup/ordernumber", function (req, res) {
    return function () {
        MenuGroupController.getOrderNumberMenuGroup(req.body).then(function (data) {
            res.send({ordernumber:data});
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/management/menugroup/ordernumber", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/update',MultiTenant.match(), PermissionProvider.check("Management.Menu.Use") ,validation.update,Router.trycatchFunction("post/management/menugroup/update", function (req, res) {
    return function () {
        MenuGroupController.update(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/management/menugroup/update", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/delete',MultiTenant.match(), PermissionProvider.check("Management.Menu.Use") ,validation.delete,Router.trycatchFunction("post/management/menugroup/delete", function (req, res) {
    return function () {
        MenuGroupController.delete(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/management/menugroup/delete", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

module.exports = router;