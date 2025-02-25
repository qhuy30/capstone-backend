const express = require('express');
const router = express.Router();
const { SystemController } = require('./system.controller');
const { messageHTTP,statusHTTP } = require('../../../utils/setting');
const { validation } = require('./system.validation');
const { Router } = require('../../../shared/router/router.provider');
const {MultiTenant} = require('../../../shared/multi_tenant/provider');

router.post('/checkrouter',MultiTenant.match(), validation.checkRouter, Router.trycatchFunction("post/management/system/checkrouter", function (req, res) {
    return function () {
        SystemController.checkRouter(req).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            let ErrorNeedToLogin = ["TokenIsNull", messageHTTP.authorized];
            let ErrorNotFound = ["PathIsNotFound"];
            let ErrorNotPermission = ["NotPermission"];
            if (ErrorNeedToLogin.indexOf(err.err) !== -1
                || ErrorNotFound.indexOf(err.err) !== -1
                || ErrorNotPermission.indexOf(err.err) !== -1) {

                    if (ErrorNeedToLogin.indexOf(err.err) !== -1){
                        res.status(statusHTTP.authorized);
                    }

                    if (ErrorNotFound.indexOf(err.err) !== -1){
                        res.status(statusHTTP.notFound);
                    }

                    if (ErrorNotPermission.indexOf(err.err) !== -1){
                        res.status(statusHTTP.notPermission);
                    }
                    res.send({mes:err.err});
            } else {
                res.status(statusHTTP.internalServer);
                Router.LogAndMessage(res, "get/management/system/checkrouter", err);
                res.send({mes: messageHTTP.internalServer });
            }

            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));



module.exports = router;