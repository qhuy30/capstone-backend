const express = require('express');
const router = express.Router();
const { AddFriendController } = require('./controller');
const { validation } = require('./validation');
const { PermissionProvider } = require('../../../shared/permission/permission.provider');
const { statusHTTP } = require('../../../utils/setting');
const {Router} = require('../../../shared/router/router.provider');
const {MultiTenant} = require('../../../shared/multi_tenant/provider');

router.post('/get_friend',MultiTenant.match(), PermissionProvider.check("Basic.Use"), validation.getFriend, Router.trycatchFunction("post/basic/add_friend/load", function (req, res) {
    return function () {
        AddFriendController.getFriend(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res,"post/basic/add_friend/get_friend",err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

module.exports = router;