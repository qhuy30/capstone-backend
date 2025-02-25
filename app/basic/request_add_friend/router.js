const express = require('express');
const router = express.Router();
const { RequestAddFriendController } = require('./controller');
const { validation } = require('./validation');
const { PermissionProvider } = require('../../../shared/permission/permission.provider');
const { statusHTTP } = require('../../../utils/setting');
const {Router} = require('../../../shared/router/router.provider');
const {MultiTenant} = require('../../../shared/multi_tenant/provider');

router.get('/load_receive',MultiTenant.match(), PermissionProvider.check("Basic.Use"),  Router.trycatchFunction("get/basic/request_add_friend/load_receive", function (req, res) {
    return function () {
        RequestAddFriendController.load_receive(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res,"get/basic/request_add_friend/load_receive",err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.get('/load_pending',MultiTenant.match(), PermissionProvider.check("Basic.Use"),  Router.trycatchFunction("get/basic/request_add_friend/load_pending", function (req, res) {
    return function () {
        RequestAddFriendController.loadPending(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res,"get/basic/request_add_friend/load_pending",err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/load',MultiTenant.match(), PermissionProvider.check("BaBasic.Use"), validation.load, Router.trycatchFunction("post/basic/request_add_friend/load", function (req, res) {
    return function () {
        RequestAddFriendController.load(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res,"post/basic/request_add_friend/load",err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/count',MultiTenant.match(), PermissionProvider.check("Basic.Use"), validation.count, Router.trycatchFunction("post/basic/request_add_friend/count", function (req, res) {
    return function () {
        RequestAddFriendController.count(req.body).then(function (data) {
            res.send({ count: data });
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res,"post/basic/request_add_friend/count",err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));
router.get('/count_pending',MultiTenant.match(), PermissionProvider.check("Basic.Use"),  Router.trycatchFunction("get/basic/request_add_friend/count_pending", function (req, res) {
    return function () {
        RequestAddFriendController.countPending(req.body).then(function (data) {
            res.send({ count: data });
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res,"get/basic/request_add_friend/count_pending",err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/insert',MultiTenant.match(), PermissionProvider.check("Basic.Use"), validation.insert, Router.trycatchFunction("post/basic/request_add_friend/insert", function (req, res) {
    return function () {
        RequestAddFriendController.insert(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res,"post/basic/request_add_friend/insert",err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/delete',MultiTenant.match(), PermissionProvider.check("Basic.Use"), validation.delete, Router.trycatchFunction("post/basic/request_add_friend/delete", function (req, res) {
    return function () {
        RequestAddFriendController.delete(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res,"post/basic/request_add_friend/delete",err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/accept',MultiTenant.match(), PermissionProvider.check("Basic.Use"), validation.accept, Router.trycatchFunction("post/basic/request_add_friend/accept", function (req, res) {
    return function () {
        RequestAddFriendController.accept(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res,"post/basic/request_add_friend/accept",err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/decline',MultiTenant.match(), PermissionProvider.check("Basic.Use"), validation.decline, Router.trycatchFunction("post/basic/request_add_friend/decline", function (req, res) {
    return function () {
        RequestAddFriendController.decline(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res,"post/basic/request_add_friend/decline",err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));
module.exports = router;