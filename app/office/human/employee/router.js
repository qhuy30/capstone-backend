const express = require('express');
const router = express.Router();
const { EmployeeController } = require('./controller');
const { validation } = require('./validation');
const { PermissionProvider } = require('../../../../shared/permission/permission.provider');
const { statusHTTP } = require('../../../../utils/setting');
const { Router } = require('../../../../shared/router/router.provider');
const {MultiTenant} = require('../../../../shared/multi_tenant/provider');

router.post('/loaddetails_d',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Authorized"]) ,validation.loadDetails,Router.trycatchFunction("post/office/human/employee/loaddetails_d", function (req, res) {
    return function () {
        EmployeeController.loadDetails_d(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/human/employee/loaddetails_d", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));


router.post('/loaddetails_dm',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Authorized"]) ,validation.loadDetails_dm,Router.trycatchFunction("post/office/human/employee/loaddetails_d", function (req, res) {
    return function () {
        EmployeeController.loadDetails_dm(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/human/employee/loaddetails_dm", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/loaddetails',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Authorized"]) ,validation.loadDetails,Router.trycatchFunction("post/office/human/employee/loaddetails", function (req, res) {
    return function () {
        EmployeeController.loadDetails(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/human/employee/loaddetails", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/load',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Authorized"]) ,validation.load,Router.trycatchFunction("post/office/human/employee/load", function (req, res) {
    return function () {
        EmployeeController.load(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/human/employee/load", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/count',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.HumanResourceManagement.Use"]) ,validation.count,Router.trycatchFunction("post/office/human/employee/count", function (req, res) {
    return function () {
        EmployeeController.count(req.body).then(function (data) {
            res.send({ count: data });
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/human/employee/count", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/insert',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.HumanResourceManagement.Use"]) ,validation.insert,Router.trycatchFunction("post/office/human/employee/insert", function (req, res) {
    return function () {
        EmployeeController.insert(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/human/employee/insert", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/insert_many',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.HumanResourceManagement.Use"]) ,validation.insert_many,Router.trycatchFunction("post/office/human/employee/insert_many", function (req, res) {
    return function () {
        EmployeeController.insert_Many(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/human/employee/insert_many", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/update_background_general',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.HumanResourceManagement.Use"]) ,validation.update_background_general,Router.trycatchFunction("post/office/human/employee/update_background_general", function (req, res) {
    return function () {
        EmployeeController.update_background_general(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/human/employee/update_background_general", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/push_background_family',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.HumanResourceManagement.Use"]) ,validation.push_background_family,Router.trycatchFunction("post/office/human/employee/push_background_family", function (req, res) {
    return function () {
        EmployeeController.push_background_family(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/human/employee/push_background_family", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/remove_background_family',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.HumanResourceManagement.Use"]) ,validation.remove_background_family,Router.trycatchFunction("post/office/human/employee/remove_background_family", function (req, res) {
    return function () {
        EmployeeController.remove_background_family(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/human/employee/remove_background_family", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/update_background_family',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["OOffice.HumanResourceManagement.Use"]) ,validation.update_background_family,Router.trycatchFunction("post/office/human/employee/update_background_family", function (req, res) {
    return function () {
        EmployeeController.update_background_family(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/human/employee/update_background_family", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/update_signature/:name',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.HumanResourceManagement.Use", "Authorized"]),Router.trycatchFunction("post/office/human/employee/update_signature", function (req, res) {
    return function () {
        EmployeeController.update_signature(req).then(function (data) {
            res.send({name:data});
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/human/employee/update_signature", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post(
    '/update_quotation_mark/:name',
    MultiTenant.match({ module_key: ['office'] }),
    PermissionProvider.check(['Office.HumanResourceManagement.Use', 'Authorized']),
    Router.trycatchFunction(
        'post/office/human/employee/update_quotation_mark',
        function (req, res) {
            return function () {
                EmployeeController.update_quotation_mark(req).then(
                    function (data) {
                        res.send({ name: data });
                        res.end();
                        data = undefined;
                        res = undefined;
                        req = undefined;
                        return;
                    },
                    function (err) {
                        res.status(statusHTTP.internalServer);
                        Router.LogAndMessage(
                            res,
                            'post/office/human/employee/update_quotation_mark',
                            err,
                        );
                        res.end();
                        err = undefined;
                        res = undefined;
                        req = undefined;
                        return;
                    },
                );
            };
        },
    ),
);

router.post('/update_education_general',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.HumanResourceManagement.Education"]) ,validation.update_education_general,Router.trycatchFunction("post/office/human/employee/update_education_general", function (req, res) {
    return function () {
        EmployeeController.update_education_general(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/human/employee/update_education_general", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/update_mission_general',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.HumanResourceManagement.Mission"]) ,validation.update_mission_general,Router.trycatchFunction("post/office/human/employee/update_mission_general", function (req, res) {
    return function () {
        EmployeeController.update_mission_general(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/human/employee/update_mission_general", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/update_salary_general',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.HumanResourceManagement.Salary"]) ,validation.update_salary_general,Router.trycatchFunction("post/office/human/employee/update_salary_general", function (req, res) {
    return function () {
        EmployeeController.update_salary_general(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/human/employee/update_salary_general", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/load_user',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.HumanResourceManagement.Use"]) ,validation.load_user,Router.trycatchFunction("post/office/human/employee/load_user", function (req, res) {
    return function () {
        EmployeeController.load_user(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/human/employee/load_user", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/register_account',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.HumanResourceManagement.User"]) ,validation.register_account,Router.trycatchFunction("post/office/human/employee/register_account", function (req, res) {
    return function () {
        EmployeeController.register_account(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/human/employee/register_account", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/check_declaration',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Authorized"]) ,validation.check_declaration,Router.trycatchFunction("post/office/human/employee/check_declaration", function (req, res) {
    return function () {
        EmployeeController.checkDeclaration(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/human/employee/check_declaration", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/delete',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.HumanResourceManagement.Use"]) ,validation.delete,Router.trycatchFunction("post/office/human/employee/delete", function (req, res) {
    return function () {
        EmployeeController.delete(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/human/employee/delete", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));
module.exports = router;
