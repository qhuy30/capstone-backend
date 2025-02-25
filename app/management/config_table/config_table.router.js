const express = require('express');
const router = express.Router();
const { ConfigTableController } = require('./config_table.controller');
const { validation } = require('./config_table.validation');
const { PermissionProvider } = require('../../../shared/permission/permission.provider');
const { statusHTTP } = require('../../../utils/setting');
const { Router } = require('../../../shared/router/router.provider');
const {MultiTenant} = require('../../../shared/multi_tenant/provider');
router.post('/load',MultiTenant.match(), validation.load, Router.trycatchFunction("post/management/config_table/load", function (req, res) {
    return function () {
        ConfigTableController.load(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res,"post/management/config_table/load",err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));


router.post('/update',MultiTenant.match(), PermissionProvider.check(["Management.Settings.Use"]), validation.update, Router.trycatchFunction("post/management/config_table/update", function (req, res) {
    return function () {
        ConfigTableController.update(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res,"post/management/config_table/update",err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));
module.exports = router;