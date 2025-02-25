const express = require('express');
const router = express.Router();
const { LaborContractController } = require('./controller');
const { validation } = require('./validation');
const { PermissionProvider } = require('../../../../shared/permission/permission.provider');
const { statusHTTP } = require('../../../../utils/setting');
const { Router } = require('../../../../shared/router/router.provider');
const {MultiTenant} = require('../../../../shared/multi_tenant/provider');

router.post('/load_list_of_employee',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Authorized"]) ,validation.loadListOfEmployee,Router.trycatchFunction("post/office/human/labor_contract/load_list_of_employee", function (req, res) {
    return function () {
        LaborContractController.loadListOfEmployee(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/human/labor_contract/load_list_of_employee", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));
router.post('/load_details',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Authorized"]) ,validation.loadDetails,Router.trycatchFunction("post/office/human/labor_contract/load_details", function (req, res) {
    return function () {
        LaborContractController.loadDetails(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/human/labor_contract/load_details", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/load',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.LaborContract.Use"]) ,validation.load,Router.trycatchFunction("post/office/human/labor_contract/load", function (req, res) {
    return function () {
        LaborContractController.load(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/human/labor_contract/load", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/count',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.LaborContract.Use"]) ,validation.count,Router.trycatchFunction("post/office/human/labor_contract/count", function (req, res) {
    return function () {
        LaborContractController.count(req.body).then(function (data) {
            res.send({ count: data });
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/human/labor_contract/count", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.get('/countpending',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.LaborContract.Approval"]) ,Router.trycatchFunction("get/office/human/labor_contract/countpending", function (req, res) {
    return function () {
        LaborContractController.countPending(req.body).then(function (data) {
            res.send({ count: data });
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "get/office/human/labor_contract/countpending", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/insert/:name',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.LaborContract.Use"]),Router.trycatchFunction("post/office/human/labor_contract/insert", function (req, res) {
    return function () {
        LaborContractController.insert(req).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/human/labor_contract/insert", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/attach_labor/:name',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.LaborContract.Use"]),Router.trycatchFunction("post/office/human/labor_contract/attach_labor", function (req, res) {
    return function () {
        LaborContractController.attachLabor(req).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/human/labor_contract/attach_labor", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/update',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.LaborContract.Use"]) ,validation.update,Router.trycatchFunction("post/office/human/labor_contract/update", function (req, res) {
    return function () {
        LaborContractController.update(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/human/labor_contract/update", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/approval',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.LaborContract.Approval"]) ,validation.approval,Router.trycatchFunction("post/office/human/labor_contract/approval", function (req, res) {
    return function () {
        LaborContractController.approval(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/human/labor_contract/approval", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/loadfileinfo',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Authorized"]), validation.loadFileInfo, Router.trycatchFunction("post/office/human/labor_contract/loadfileinfo", function(req, res) {
    return function() {
        LaborContractController.loadFileInfo(req.body).then(function(data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function(err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/human/labor_contract/loadfileinfo", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/pushfile/:name',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.LaborContract.Use"]),Router.trycatchFunction("post/office/human/labor_contract/pushfile", function (req, res) {
    return function () {
        LaborContractController.pushFile(req).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/human/labor_contract/pushfile", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));


router.post('/removefile',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.LaborContract.Use"]) ,validation.removeFile,Router.trycatchFunction("post/office/human/labor_contract/removefile", function (req, res) {
    return function () {
        LaborContractController.removeFile(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/human/labor_contract/removefile", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/delete',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.LaborContract.Use"]) ,validation.delete,Router.trycatchFunction("post/office/human/labor_contract/delete", function (req, res) {
    return function () {
        LaborContractController.delete(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/human/labor_contract/delete", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/delete_multi',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.LaborContract.Use"]) ,validation.deleteMulti,Router.trycatchFunction("post/office/human/labor_contract/delete_multi", function (req, res) {
    return function () {
        LaborContractController.delete_multi(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/human/labor_contract/delete_multi", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));
module.exports = router;