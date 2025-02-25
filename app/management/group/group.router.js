const express = require('express');
const router = express.Router();
const { GroupController } = require('./group.controller');
const { validation } = require('./group.validation');
const { PermissionProvider } = require('../../../shared/permission/permission.provider');
const { statusHTTP } = require('../../../utils/setting');
const { Router } = require('../../../shared/router/router.provider');
const {MultiTenant} = require('../../../shared/multi_tenant/provider');

router.post('/load',MultiTenant.match(),  PermissionProvider.check(["Management.Group.Use"]), validation.load, Router.trycatchFunction("post/management/group/load", function (req, res) {
    return function () {
        GroupController.load(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/management/group/load", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/count',MultiTenant.match(),  PermissionProvider.check(["Management.Group.Use"]), validation.count, Router.trycatchFunction("post/management/group/count", function (req, res) {
    return function () {
        GroupController.count(req.body).then(function (data) {
            res.send({ count: data });
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/management/group/count", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/insert',MultiTenant.match(),  PermissionProvider.check(["Management.Group.Use"]), validation.insert, Router.trycatchFunction("post/management/group/insert", function (req, res) {
    return function () {
        GroupController.insert(req.body).then(function (data) {
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
    PermissionProvider.check(['Management.Group.Use']),
    validation.update,
    Router.trycatchFunction('post/management/group/update', function (req, res) {
        return function () {
            GroupController.update(req.body).then(
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
                    Router.LogAndMessage(res, 'post/management/group/update', err);
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

router.post('/delete',MultiTenant.match(),  PermissionProvider.check(["Management.Group.DeleteGroup"]), validation.delete, Router.trycatchFunction("post/management/group/delete", function (req, res) {
    return function () {
        GroupController.delete(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/management/group/delete", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));



router.post('/pushrule',MultiTenant.match(),  PermissionProvider.check(["Management.Group.AssignPermission"]), validation.pushRule, Router.trycatchFunction("post/management/group/pushrule", function (req, res) {
    return function () {
        GroupController.pushRule(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/management/group/pushrule", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/removerule',MultiTenant.match(),  PermissionProvider.check(["Management.Group.AssignPermission"]), validation.removeRule, Router.trycatchFunction("post/management/group/removerule", function (req, res) {
    return function () {
        GroupController.removeRule(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/management/group/removerule", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

module.exports = router;
