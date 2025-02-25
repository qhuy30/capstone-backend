const express = require('express');
const router = express.Router();
const { StrategicController } = require('./controller');
const { validation } = require('./validation');
const { PermissionProvider } = require('../../../shared/permission/permission.provider');
const { statusHTTP } = require('../../../utils/setting');
const { Router } = require('../../../shared/router/router.provider');
const {MultiTenant} = require('../../../shared/multi_tenant/provider');


router.post('/load_base_department',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.Task.Use"]) ,validation.load_base_department,Router.trycatchFunction("post/office/strategic/load_base_department", function (req, res) {
    return function () {
        StrategicController.load_base_department(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/strategic/load_base_department", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/load_base_project',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.Task.Use"]) ,validation.load_base_project,Router.trycatchFunction("post/office/strategic/load_base_project", function (req, res) {
    return function () {
        StrategicController.load_base_project(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/strategic/load_base_project", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));


router.post('/count_base_department',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.Task.Use"]) ,validation.count_base_department,Router.trycatchFunction("post/office/strategic/count_base_department", function (req, res) {
    return function () {
        StrategicController.count_base_department(req.body).then(function (data) {
            res.send({ count: data });
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/strategic/count_base_department", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/count_base_project',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.Task.Use"]) ,validation.count_base_project,Router.trycatchFunction("post/office/strategic/count_base_project", function (req, res) {
    return function () {
        StrategicController.count_base_project(req.body).then(function (data) {
            res.send({ count: data });
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/strategic/count_base_project", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/insert',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.Task.Use"]) ,validation.insert,Router.trycatchFunction("post/office/strategic/insert", function (req, res) {
    return function () {
        StrategicController.insert(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/strategic/insert", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/update',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.Task.Use"]) ,validation.update,Router.trycatchFunction("post/office/strategic/update", function (req, res) {
    return function () {
        StrategicController.update(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/strategic/update", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/delete',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.Task.Use"]) ,validation.delete,Router.trycatchFunction("post/office/strategic/delete", function (req, res) {
    return function () {
        StrategicController.delete(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/strategic/delete", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/obtained',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.Task.Use"]) ,validation.obtained,Router.trycatchFunction("post/office/strategic/obtained", function (req, res) {
    return function () {
        StrategicController.obtained(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/strategic/obtained", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));


router.post('/insert_object',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.Task.Use"]) ,validation.insert_object,Router.trycatchFunction("post/office/strategic/insert_object", function (req, res) {
    return function () {
        StrategicController.insert_object(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/strategic/insert_object", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/update_object',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.Task.Use"]) ,validation.update_object,Router.trycatchFunction("post/office/strategic/update_object", function (req, res) {
    return function () {
        StrategicController.update_object(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/strategic/update_object", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/delete_object',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.Task.Use"]) ,validation.delete_object,Router.trycatchFunction("post/office/strategic/delete_object", function (req, res) {
    return function () {
        StrategicController.delete_object(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/strategic/delete_object", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/obtained_object',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.Task.Use"]) ,validation.obtained_object,Router.trycatchFunction("post/office/strategic/obtained_object", function (req, res) {
    return function () {
        StrategicController.obtained_object(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/strategic/obtained_object", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));
module.exports = router;