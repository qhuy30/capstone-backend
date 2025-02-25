const express = require('express');
const router = express.Router();
const { TaskWorkflowController } = require('./controller');
const { validation } = require('./validation');
const { PermissionProvider } = require('../../../shared/permission/permission.provider');
const { statusHTTP } = require('../../../utils/setting');
const { Router } = require('../../../shared/router/router.provider');
const {MultiTenant} = require('../../../shared/multi_tenant/provider');


router.post('/load',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.TaskWorkflow.Use"]) ,validation.load,Router.trycatchFunction("post/office/task_workflow/load", function (req, res) {
    return function () {
        TaskWorkflowController.load(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/task_workflow/load", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/loaddetails',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.TaskWorkflow.Use"]) ,validation.loadDetails,Router.trycatchFunction("post/office/task_workflow/loaddetails", function (req, res) {
    return function () {
        TaskWorkflowController.loadDetails(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/task_workflow/loaddetails", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/count',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.TaskWorkflow.Use"]) ,validation.count,Router.trycatchFunction("post/office/task_workflow/count", function (req, res) {
    return function () {
        TaskWorkflowController.count(req.body).then(function (data) {
            res.send({ count: data });
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/task_workflow/count", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/insert',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.TaskWorkflow.Use"]),validation.insert,Router.trycatchFunction("post/office/task_workflow/insert", function (req, res) {
    return function () {
        TaskWorkflowController.insert(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/task_workflow/insert", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/update',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.TaskWorkflow.Use"]),validation.update,Router.trycatchFunction("post/office/task_workflow/update", function (req, res) {
    return function () {
        TaskWorkflowController.update(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/task_workflow/update", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/delete',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.TaskWorkflow.Use"]),validation.delete,Router.trycatchFunction("post/office/task_workflow/delete", function (req, res) {
    return function () {
        TaskWorkflowController.delete(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/task_workflow/delete", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

module.exports = router;