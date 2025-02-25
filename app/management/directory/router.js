const express = require('express');
const router = express.Router();
const { DirectoryController } = require('./controller');
const { validation } = require('./validation');
const { PermissionProvider } = require('../../../shared/permission/permission.provider');
const { statusHTTP } = require('../../../utils/setting');
const { Router } = require('../../../shared/router/router.provider');
const {MultiTenant} = require('../../../shared/multi_tenant/provider');
router.post('/get_ordernumber',MultiTenant.match(), PermissionProvider.check(["Management.Directory.Use"]) ,validation.getOrderNumber,Router.trycatchFunction("post/management/directory/get_ordernumber", function (req, res) {
    return function () {
        DirectoryController.getOrderNumber(req.body).then(function (data) {
            res.send({ordernumber:data});
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/management/directory/get_ordernumber", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));
router.post('/loaddetails',MultiTenant.match(), PermissionProvider.check(["Authorized"]) ,validation.loadDetails,Router.trycatchFunction("post/management/directory/loaddetails", function (req, res) {
    return function () {
        DirectoryController.loadDetails(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/management/directory/loaddetails", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/load_for_directive',MultiTenant.match(), PermissionProvider.check(["Authorized"]) ,validation.load_for_directive,Router.trycatchFunction("post/management/directory/load_for_directive", function (req, res) {
    return function () {
        DirectoryController.load_for_directive(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/management/directory/load_for_directive", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/count_for_directive',MultiTenant.match(), PermissionProvider.check(["Authorized"]) ,validation.count_for_directive,Router.trycatchFunction("post/management/directory/count_for_directive", function (req, res) {
    return function () {
        DirectoryController.count_for_directive(req.body).then(function (data) {
            res.send({ count: data });
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/management/directory/count_for_directive", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/load',MultiTenant.match(), PermissionProvider.check(["Authorized"]) ,validation.load,Router.trycatchFunction("post/management/directory/load", function (req, res) {
    return function () {
        DirectoryController.load(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/management/directory/load", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/count',MultiTenant.match(), PermissionProvider.check(["Authorized"]) ,validation.count,Router.trycatchFunction("post/management/directory/count", function (req, res) {
    return function () {
        DirectoryController.count(req.body).then(function (data) {
            res.send({ count: data });
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/management/directory/count", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/insert',MultiTenant.match(), PermissionProvider.check(["Authorized"]),validation.insert, Router.trycatchFunction("post/management/directory/insert", function (req, res) {
    return function () {
        DirectoryController.insert(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/management/directory/insert", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/update',MultiTenant.match(), PermissionProvider.check(["Authorized"]),validation.update, Router.trycatchFunction("post/management/directory/update", function (req, res) {
    return function () {
        DirectoryController.update(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/management/directory/update", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/delete',MultiTenant.match(), PermissionProvider.check(["Management.Directory.Use"]),validation.delete, Router.trycatchFunction("post/management/directory/delete", function (req, res) {
    return function () {
        DirectoryController.delete(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/management/directory/delete", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/loaddetails_many',MultiTenant.match(), PermissionProvider.check(["Authorized"]) ,validation.loadDetailsMany,Router.trycatchFunction("post/management/directory/loaddetails_many", function (req, res) {
    return function () {
        DirectoryController.loadDetailsMany(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/management/directory/loaddetails_many", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));
module.exports = router;