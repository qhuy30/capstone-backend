const express = require('express');
const router = express.Router();
const { RingBellItemController } = require('./controller');
const { validation } = require('./validation');
const { PermissionProvider } = require('../../../shared/permission/permission.provider');
const { statusHTTP } = require('../../../utils/setting');
const { Router } = require('../../../shared/router/router.provider');
const { MultiTenant } = require('../../../shared/multi_tenant/provider');

router.post('/load', MultiTenant.match(), PermissionProvider.check(["Authorized"]), validation.load, Router.trycatchFunction("post/management/ringbell_item/load", function (req, res) {
    return function () {
        RingBellItemController.load(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/management/ringbell_item/load", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.get('/count', MultiTenant.match(), PermissionProvider.check(["Authorized"]), Router.trycatchFunction("get/management/ringbell_item/count", function (req, res) {
    return function () {
        RingBellItemController.count(req.body).then(function (data) {
            res.send({ count: data });
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "get/management/ringbell_item/count", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/countall', MultiTenant.match(), PermissionProvider.check(["Authorized"]),validation.countAll, Router.trycatchFunction("get/management/ringbell_item/countall", function (req, res) {
    return function () {
        RingBellItemController.countAll(req.body).then(function (data) {
            res.send({ count: data });
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "get/management/ringbell_item/countall", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));


router.post('/seen', MultiTenant.match(), PermissionProvider.check(["Authorized"]), validation.seen, Router.trycatchFunction("post/management/ringbell_item/seen", function (req, res) {
    return function () {
        RingBellItemController.seen(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/management/ringbell_item/seen", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/seenall', MultiTenant.match(), PermissionProvider.check(["Authorized"]),  Router.trycatchFunction("post/management/ringbell_item/seenall", function (req, res) {
    return function () {
        RingBellItemController.seenAll(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/management/ringbell_item/seenall", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

module.exports = router;