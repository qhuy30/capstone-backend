const express = require('express');
const router = express.Router();
const { SettingController } = require('./controller');
const { validation } = require('./validation');
const { PermissionProvider } = require('../../../shared/permission/permission.provider');
const { statusHTTP } = require('../../../utils/setting');
const {Router} = require('../../../shared/router/router.provider');
const {MultiTenant} = require('../../../shared/multi_tenant/provider');


router.post('/load_general',MultiTenant.match(), PermissionProvider.check(["Authorized"]),  Router.trycatchFunction("post/management/setting/load_general", function (req, res) {
    return function () {
        SettingController.loadGeneral(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res,"post/management/setting/load_general",err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/load_module',MultiTenant.match(), PermissionProvider.check(["Authorized"]), validation.load_module,  Router.trycatchFunction("post/management/setting/load_module", function (req, res) {
    return function () {
        SettingController.loadModule(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res,"post/management/setting/load_module",err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));






router.post('/update',MultiTenant.match(),PermissionProvider.check(["Management.Settings.Use"]), validation.update, Router.trycatchFunction("post/management/setting/update", function (req, res) {
    return function () {
        SettingController.update(req.body).then(function (data) {
            res.send({status:data});
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res,"post/management/setting/insert",err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/upload_image',MultiTenant.match(), PermissionProvider.check(["Management.Settings.Use"]),Router.trycatchFunction("post/management/setting/upload_image", function (req, res) {
    return function () {
        SettingController.uploadImage(req).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/management/setting/upload_image", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.get('/mobile_config', MultiTenant.match(), Router.trycatchFunction("get/management/setting/mobile_config", function (req, res) {
    return function () {
        SettingController.mobile_config(req.body).then(function(data){
            res.send(data.value);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        },function(err){
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "get/management/setting/mobile_config", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

module.exports = router;