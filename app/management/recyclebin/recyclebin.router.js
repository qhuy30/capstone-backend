const express = require('express');
const router = express.Router();
const { RecycleBinController } = require('./recyclebin.controller');
const { validation } = require('./recyclebin.validation');
const { PermissionProvider } = require('../../../shared/permission/permission.provider');
const { statusHTTP } = require('../../../utils/setting');
const { Router } = require('../../../shared/router/router.provider');
const {MultiTenant} = require('../../../shared/multi_tenant/provider');
router.post('/load',MultiTenant.match(), PermissionProvider.check(["Management.RecycleBin.Use"]), validation.load, Router.trycatchFunction("post/management/recyclebin/load", function (req, res) {
    return function () {
        RecycleBinController.load(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res,"post/management/recyclebin/load",err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/loaddetails',MultiTenant.match(), PermissionProvider.check(["Management.RecycleBin.Use"]), validation.loadDetails, Router.trycatchFunction("post/management/recyclebin/loaddetails", function (req, res) {
    return function () {
        RecycleBinController.loadDeatails(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res,"post/management/recyclebin/loaddetails",err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/count',MultiTenant.match(), PermissionProvider.check(["Management.RecycleBin.Use"]), validation.count, Router.trycatchFunction("post/management/recyclebin/count", function (req, res) {
    return function () {
        RecycleBinController.count(req.body).then(function (data) {
            res.send({ count: data });
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res,"post/management/recyclebin/count",err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/delete',MultiTenant.match(), PermissionProvider.check(["Management.RecycleBin.Use"]), validation.delete, Router.trycatchFunction("post/management/recyclebin/delete", function (req, res) {
    return function () {
        RecycleBinController.delete(req.body).then(function (data) {
            res.send({ status: data });
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/management/recyclebin/delete", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/restore',MultiTenant.match(), PermissionProvider.check(["Management.RecycleBin.Use"]), validation.restore, Router.trycatchFunction("post/management/recyclebin/restore", function (req, res) {
    return function () {
        RecycleBinController.restore(req.body).then(function (data) {
            res.send({ status: data });
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/management/recyclebin/restore", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));
module.exports = router;