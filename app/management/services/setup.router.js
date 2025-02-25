const express = require('express');
const router = express.Router();
const {SetupController} = require('./setup.controller');
const {statusHTTP } = require('../../../utils/setting');
const { Router } = require('../../../shared/router/router.provider');
const {MultiTenant} = require('../../../shared/multi_tenant/provider');
router.get('/init',MultiTenant.match(), Router.trycatchFunction("get/management/setup/init", function (req, res) {
    return function () {
        SetupController.init(req.body).then(function(data){
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        },function(err){
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "get/management/setup/init", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));


module.exports = router;