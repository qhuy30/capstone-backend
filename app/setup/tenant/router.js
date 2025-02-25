const express = require('express');
const router = express.Router();
const { TenantController } = require('./controller');
const { validation } = require('./validation');
const { PermissionProvider } = require('../../../shared/permission/permission.provider');
const { statusHTTP } = require('../../../utils/setting');
const { Router } = require('../../../shared/router/router.provider');
const {MultiTenant} = require('../../../shared/multi_tenant/provider');

router.post('/load_index',MultiTenant.isHost() ,validation.loadIndex,Router.trycatchFunction("post/setup/tenant/load_index", function (req, res) {
    return function () {
        TenantController.loadIndex(req.body).then(function (data) {
            res.send({data});
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/setup/tenant/load_index", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));


router.post('/load_collection',MultiTenant.isHost() ,validation.loadCollection,Router.trycatchFunction("post/setup/tenant/load_collection", function (req, res) {
    return function () {
        TenantController.loadCollection(req.body).then(function (data) {
            res.send({data});
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/setup/tenant/load_collection", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/load_item',MultiTenant.isHost() ,validation.loadItem,Router.trycatchFunction("post/setup/tenant/load_item", function (req, res) {
    return function () {
        TenantController.loadItem(req.body).then(function (data) {
            res.send({data});
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/setup/tenant/load_item", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/load_item_by_collection',MultiTenant.isHost() ,validation.loadItemByCollection,Router.trycatchFunction("post/setup/tenant/load_item_by_collection", function (req, res) {
    return function () {
        TenantController.loadItemByCollection(req.body).then(function (data) {
            res.send({data});
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/setup/tenant/load_item_by_collection", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

module.exports = router;