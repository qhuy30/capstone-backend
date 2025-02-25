const express = require('express');
const router = express.Router();
const { LocalizationController } = require('./localization.controller');
const { SessionProvider } = require('../../../shared/redis/session.provider');
const { statusHTTP } = require('../../../utils/setting');
const {validation} = require('./localization.validation');
const {Router} = require('../../../shared/router/router.provider');
const {MultiTenant} = require('../../../shared/multi_tenant/provider');

router.get('/init',MultiTenant.match(),  SessionProvider.match, Router.trycatchFunction("get/management/localization/init", function (req, res) {
    return function () {
        LocalizationController.init(req.body).then(function (data) {
            res.send({ data });
            res.end();
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res,"get/management/localization/init",err);
            res.end();
            res = undefined;
            req = undefined;
        });
    }
}));

router.post('/getdetailsbykey',MultiTenant.match(),  validation.getDetailsBykey, Router.trycatchFunction("post/management/localization/getdetailsbykey", function (req, res) {
    return function () {
        LocalizationController.getDetailsByKey(req.body).then(function (data) {
            res.send({ data });
            res.end();
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res,"post/management/localization/getdetailsbykey",err);
            res.end();
            res = undefined;
            req = undefined;
        });
    }
}));

module.exports = router;