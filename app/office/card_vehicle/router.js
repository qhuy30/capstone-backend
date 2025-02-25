const express = require('express');
const router = express.Router();
const { CardVehicalController } = require('./controller');
const { validation } = require('./validation');
const { PermissionProvider } = require('../../../shared/permission/permission.provider');
const { statusHTTP } = require('../../../utils/setting');
const { Router } = require('../../../shared/router/router.provider');
const {MultiTenant} = require('../../../shared/multi_tenant/provider');

router.post('/load',MultiTenant.match(),  PermissionProvider.check(["Office.CardVehical.Use"]), validation.load, Router.trycatchFunction("post/office/card_vehical/load", function (req, res) {
    return function () {
        CardVehicalController.load(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/card_vehical/load", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/count',MultiTenant.match(),  PermissionProvider.check(["Office.CardVehical.Use"]), validation.count, Router.trycatchFunction("post/office/card_vehical/count", function (req, res) {
    return function () {
        CardVehicalController.count(req.body).then(function (data) {
            res.send({ count: data });
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/card_vehical/count", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/checkexist',MultiTenant.match(), PermissionProvider.check(["Office.CardVehical.Use"]), validation.checkexist, Router.trycatchFunction("post/office/card_vehical/checkexist", function (req, res) {
    return function () {
        CardVehicalController.checkExist(req.body).then(function (data) {
            res.send({ status: data });
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res,"post/office/card_vehical/checkexist",err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/insert',MultiTenant.match(),  PermissionProvider.check(["Office.CardVehical.Use"]), validation.insert, Router.trycatchFunction("post/office/card_vehical/insert", function (req, res) {
    return function () {
        CardVehicalController.insert(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "get/management/group/insert", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));



router.post(
    '/update',
    MultiTenant.match(),
    PermissionProvider.check(['Office.CardVehical.Use']),
    validation.update,
    Router.trycatchFunction('post/office/card_vehical/update', function (req, res) {
        return function () {
            CardVehicalController.update(req.body).then(
                function (data) {
                    res.send(data);
                    res.end();
                    data = undefined;
                    res = undefined;
                    req = undefined;
                    return;
                },
                function (err) {
                    res.status(statusHTTP.internalServer);
                    Router.LogAndMessage(res, 'post/office/card_vehical/update', err);
                    res.end();
                    err = undefined;
                    res = undefined;
                    req = undefined;
                    return;
                },
            );
        };
    }),
);

router.post('/delete',MultiTenant.match(),  PermissionProvider.check(["Office.CardVehical.Use"]), validation.delete, Router.trycatchFunction("post/office/card_vehical/delete", function (req, res) {
    return function () {
        CardVehicalController.delete(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/card_vehical/delete", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

module.exports = router;
