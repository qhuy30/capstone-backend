const express = require('express');
const router = express.Router();
const { AddFriendRoomController } = require('./controller');
const {validation} = require('./validation');
const { PermissionProvider } = require('../../../shared/permission/permission.provider');
const { statusHTTP } = require('../../../utils/setting');
const {Router} = require('../../../shared/router/router.provider');
const {MultiTenant} = require('../../../shared/multi_tenant/provider');
router.post('/get_typing',MultiTenant.match(), PermissionProvider.check("Basic.Use"),validation.get_typing,  Router.trycatchFunction("post/basic/add_friend_room/get_typing", function (req, res) {
    return function () {
        AddFriendRoomController.get_typing(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res,"post/basic/add_friend_room/get_typing",err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/get_room',MultiTenant.match(), PermissionProvider.check("Basic.Use"),validation.get_room,  Router.trycatchFunction("post/basic/add_friend_room/get_room", function (req, res) {
    return function () {
        AddFriendRoomController.get_room(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res,"post/basic/add_friend_room/get_room",err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));


router.get('/load_show',MultiTenant.match(), PermissionProvider.check("Basic.Use"),  Router.trycatchFunction("get/basic/add_friend_room/load_show", function (req, res) {
    return function () {
        AddFriendRoomController.load_show(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res,"get/basic/add_friend_room/load_show",err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/push_show',MultiTenant.match(), PermissionProvider.check("Basic.Use"), validation.push_show, Router.trycatchFunction("post/basic/add_friend_room/push_show", function (req, res) {
    return function () {
        AddFriendRoomController.push_show(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res,"post/basic/add_friend_room/push_show",err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/pull_show',MultiTenant.match(), PermissionProvider.check("Basic.Use"), validation.pull_show, Router.trycatchFunction("post/basic/add_friend_room/pull_show", function (req, res) {
    return function () {
        AddFriendRoomController.pull_show(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res,"post/basic/add_friend_room/pull_show",err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));
module.exports = router;