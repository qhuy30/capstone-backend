const express = require('express');
const router = express.Router();
const { JTFController } = require('./controller');
const { validation } = require('./validation');
const { PermissionProvider } = require('../../../shared/permission/permission.provider');
const { statusHTTP } = require('../../../utils/setting');
const { Router } = require('../../../shared/router/router.provider');
const {MultiTenant} = require('../../../shared/multi_tenant/provider');

router.post('/loaddetails',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.JourneyTimeForm.Use"]) ,validation.loadDetails,Router.trycatchFunction("post/journey_time_form/loaddetails", function (req, res) {
    return function () {
        JTFController.loadDetails(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/journey_time_form/loaddetails", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/load',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.JourneyTimeForm.Use"]) ,validation.load,Router.trycatchFunction("post/journey_time_form/load", function (req, res) {
    return function () {
        
        JTFController.load(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/journey_time_form/load", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/count',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.JourneyTimeForm.Use"]) ,validation.count,Router.trycatchFunction("post/journey_time_form/count", function (req, res) {
    return function () {
        JTFController.count(req.body).then(function (data) {
            res.send({ count: data });
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/journey_time_form/count", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/insert',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.JourneyTimeForm.Approval"]),validation.insert,Router.trycatchFunction("post/journey_time_form/insert", function (req, res) {
    return function () {
        JTFController.insert(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/journey_time_form/insert", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/cancel',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.JourneyTimeForm.Approval"]),validation.cancel,Router.trycatchFunction("post/journey_time_form/cancel", function (req, res) {
    return function () {
        JTFController.cancel(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/journey_time_form/cancel", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

module.exports = router;