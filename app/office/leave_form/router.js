const express = require('express');
const router = express.Router();
const { LeaveFormController } = require('./controller');
const { validation } = require('./validation');
const { PermissionProvider } = require('../../../shared/permission/permission.provider');
const { statusHTTP } = require('../../../utils/setting');
const { Router } = require('../../../shared/router/router.provider');
const {MultiTenant} = require('../../../shared/multi_tenant/provider');

router.post('/loaddetails',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Authorized"]) ,validation.loadDetails,Router.trycatchFunction("post/office/leave_form/loaddetails", function (req, res) {
    return function () {
        LeaveFormController.loadDetails(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/leave_form/loaddetails", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

// router.post('/load_wft', PermissionProvider.check(["Tenant.LeaveForm.Manager","Office.LeaveForm.Use"]) ,Router.trycatchFunction("post/office/leave_form/load_wft", function (req, res) {
//     return function () {
//         LeaveFormController.loadWFT().then(function (data) {
//             res.send(data);
//             res.end();
//             data = undefined;
//             res = undefined;
//             req = undefined;
//             return;
//         }, function (err) {
//             res.status(statusHTTP.internalServer);
//             Router.LogAndMessage(res, "post/office/leave_form/load_wft", err);
//             res.end();
//             err = undefined;
//             res = undefined;
//             req = undefined;
//             return;
//         });
//     }
// }));

router.post('/load',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.LeaveForm.Use"]) ,validation.load,Router.trycatchFunction("post/office/leave_form/load", function (req, res) {
    return function () {
       
        LeaveFormController.load(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/leave_form/load", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/count',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.LeaveForm.Use"]) ,validation.count,Router.trycatchFunction("post/office/leave_form/count", function (req, res) {
    return function () {
        LeaveFormController.count(req.body).then(function (data) {
            res.send({ count: data });
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/leave_form/count", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.get('/count_jtf',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Authorized"]) ,Router.trycatchFunction("post/office/leave_form/count_jtf", function (req, res) {
    return function () {
        LeaveFormController.count_jtf(req.body).then(function (data) {
            res.send({ count: data });
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/leave_form/count_jtf", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/init',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.LeaveForm.Use"]) ,Router.trycatchFunction("post/office/leave_form/init", function (req, res) {
    return function () {
        LeaveFormController.init(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/leave_form/init", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/insert',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.LeaveForm.Use"]),Router.trycatchFunction("post/office/leave_form/insert", function (req, res) {
    return function () {
        LeaveFormController.insert(req).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/leave_form/insert", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));



router.get('/countpending',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Authorized"]) ,Router.trycatchFunction("get/leave_form/countpending", function (req, res) {
    return function () {
        LeaveFormController.countPending(req.body).then(function (data) {
            res.send({ count: data });
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "get/leave_form/countpending", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/loadfileinfo',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Authorized"]), validation.loadFileInfo, Router.trycatchFunction("post/office/leave_form/loadfileinfo", function(req, res) {
    return function() {
        LeaveFormController.loadFileInfo(req.body).then(function(data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function(err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/leave_form/loadfileinfo", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/approval',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Authorized"]),validation.approval,Router.trycatchFunction("post/office/leave_form/approval", function (req, res) {
    return function () {
        LeaveFormController.approval(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/leave_form/approval", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));
router.post('/reject',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Authorized"]),validation.reject,Router.trycatchFunction("post/office/leave_form/reject", function (req, res) {
    return function () {
        LeaveFormController.reject(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/leave_form/reject", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/delete',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.LeaveForm.Use"]),validation.delete,Router.trycatchFunction("post/office/leave_form/delete", function (req, res) {
    return function () {
        LeaveFormController.delete(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/leave_form/delete", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));
module.exports = router;