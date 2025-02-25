const express = require('express');
const router = express.Router();
const { MasterDirectoryController } = require('./controller');
const { validation } = require('./validation');
const { PermissionProvider } = require('../../../shared/permission/permission.provider');
const { statusHTTP } = require('../../../utils/setting');
const { Router } = require('../../../shared/router/router.provider');
const {MultiTenant} = require('../../../shared/multi_tenant/provider');
router.get('/get_ordernumber',MultiTenant.match(), PermissionProvider.check(["Management.MasterDirectory.Use"]) ,Router.trycatchFunction("get/management/master_directory/get_ordernumber", function (req, res) {
    return function () {
        MasterDirectoryController.getOrderNumber(req.body).then(function (data) {
            res.send({ordernumber:data});
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "get/management/master_directory/get_ordernumber", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));
router.post('/loaddetails',MultiTenant.match(), PermissionProvider.check(["Authorized"]) ,validation.loadDetails,Router.trycatchFunction("post/management/master_directory/loaddetails", function (req, res) {
    return function () {
        MasterDirectoryController.loadDetails(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/management/master_directory/loaddetails", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/load',MultiTenant.match(), PermissionProvider.check(["Authorized"]) ,validation.load,Router.trycatchFunction("post/management/master_directory/load", function (req, res) {
    return function () {
        MasterDirectoryController.load(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/management/master_directory/load", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/count',MultiTenant.match(), PermissionProvider.check(["Authorized"]) ,validation.count,Router.trycatchFunction("post/management/master_directory/count", function (req, res) {
    return function () {
        MasterDirectoryController.count(req.body).then(function (data) {
            res.send({ count: data });
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/management/master_directory/count", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/insert',MultiTenant.match(), PermissionProvider.check(["Management.MasterDirectory.Use"]),validation.insert, Router.trycatchFunction("post/management/master_directory/insert", function (req, res) {
    return function () {
        MasterDirectoryController.insert(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/management/master_directory/insert", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/update',MultiTenant.match(), PermissionProvider.check(["Management.MasterDirectory.Use"]),validation.update, Router.trycatchFunction("post/management/master_directory/update", function (req, res) {
    return function () {
        MasterDirectoryController.update(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/management/master_directory/update", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/delete',MultiTenant.match(), PermissionProvider.check(["Management.MasterDirectory.Use"]),validation.delete, Router.trycatchFunction("post/management/master_directory/delete", function (req, res) {
    return function () {
        MasterDirectoryController.delete(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/management/master_directory/delete", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));
module.exports = router;