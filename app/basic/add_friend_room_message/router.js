const express = require('express');
const router = express.Router();
const { AddFriendRoomMessageController } = require('./controller');
const { validation } = require('./validation');
const { PermissionProvider } = require('../../../shared/permission/permission.provider');
const { statusHTTP } = require('../../../utils/setting');
const {Router} = require('../../../shared/router/router.provider');
const {MultiTenant} = require('../../../shared/multi_tenant/provider');

router.post('/count_not_seen',MultiTenant.match(), PermissionProvider.check("Basic.Use"),validation.count_not_seen,  Router.trycatchFunction("post/basic/add_friend_room_message/count_not_seen", function (req, res) {
    return function () {
        AddFriendRoomMessageController.countNotSeen(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res,"post/basic/add_friend_room_message/count_not_seen",err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/insert',MultiTenant.match(), PermissionProvider.check("Basic.Use"), validation.insert, Router.trycatchFunction("post/basic/add_friend_room_message/insert", function (req, res) {
    return function () {
        AddFriendRoomMessageController.insert(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res,"post/basic/add_friend_room_message/insert",err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));


router.post('/load',MultiTenant.match(), PermissionProvider.check("Basic.Use"), validation.load, Router.trycatchFunction("post/basic/add_friend_room_message/load", function (req, res) {
    return function () {
        AddFriendRoomMessageController.load(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res,"post/basic/add_friend_room_message/load",err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));


router.post('/delete',MultiTenant.match(), PermissionProvider.check("Basic.Use"), validation.delete, Router.trycatchFunction("post/basic/add_friend_room_message/delete", function (req, res) {
    return function () {
        AddFriendRoomMessageController.delete(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res,"post/basic/add_friend_room_message/delete",err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

module.exports = router;