const express = require('express');
const router = express.Router();
const { OrganizationController, GroupOrganizationController } = require('./organization.controller');
const { validation } = require('./organization.validation');
const { PermissionProvider } = require('../../../shared/permission/permission.provider');
const { statusHTTP } = require('../../../utils/setting');
const { Router } = require('../../../shared/router/router.provider');
const { MultiTenant } = require('../../../shared/multi_tenant/provider');
const CommonUtils = require("../../../utils/util");

router.post('/load', MultiTenant.match({ module_key: ["office"] }), PermissionProvider.check(["Authorized"]), validation.load, Router.trycatchFunction("post/office/organization/load", function (req, res) {
    return function () {
        OrganizationController.load(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/organization/load", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/load_for_workflow', MultiTenant.match({ module_key: ["office"] }), PermissionProvider.check(["Authorized"]), validation.load_for_workflow, Router.trycatchFunction("post/office/organization/load_for_workflow", function (req, res) {
    return function () {
        OrganizationController.load_for_workflow(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/organization/load_for_workflow", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));


router.post('/load_for_pick_user_directive', MultiTenant.match({ module_key: ["office"] }), PermissionProvider.check(["Authorized"]), validation.load_for_pick_user_directive, Router.trycatchFunction("post/office/organization/load_for_pick_user_directive", function (req, res) {
    return function () {
        OrganizationController.load_for_pick_user_directive(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/organization/load_for_pick_user_directive", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));


router.post('/load_nursing_report', MultiTenant.match({ module_key: ["office"] }), PermissionProvider.check(["Management.Department.Use"]), Router.trycatchFunction("post/office/organization/load_nursing_report", function (req, res) {
    return function () {
        OrganizationController.load_nursing_report().then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/organization/load_nursing_report", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/loaddetails', MultiTenant.match({ module_key: ["office"] }), PermissionProvider.check(["Authorized"]), validation.loadDetails, Router.trycatchFunction("post/office/organization/loaddetails", function (req, res) {
    return function () {
        OrganizationController.loadDetails(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/organization/loaddetails", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/loaddetail_with_tasks', MultiTenant.match({ module_key: ["office"] }), PermissionProvider.check(["Authorized"]), validation.loadDetailWithTasks, Router.trycatchFunction("post/office/organization/loadDetailWithTasks", function (req, res) {
    return function () {
        OrganizationController.loadDetailWithTasks(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/organization/loadDetailWithTasks", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/loaddetails_m', MultiTenant.match({ module_key: ["office"] }), PermissionProvider.check(["Authorized"]), validation.loadDetails_m, Router.trycatchFunction("post/office/organization/loaddetails_m", function (req, res) {
    return function () {
        OrganizationController.loadDetails_multi(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/organization/loaddetails_m", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/load_department_branch', MultiTenant.match({ module_key: ["office"] }), PermissionProvider.check(["Authorized"]), validation.load, Router.trycatchFunction("post/office/organization/load_department_branch", function (req, res) {
    return function () {
        OrganizationController.load_department_branch(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/organization/load_department_branch", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/load_department', MultiTenant.match({ module_key: ["office"] }), PermissionProvider.check(["Authorized"]), Router.trycatchFunction("post/office/organization/load_department", function (req, res) {
    return function () {
        OrganizationController.load_all_department().then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/organization/load_department", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post(
    '/insert',
    MultiTenant.match({ module_key: ['office'] }),
    PermissionProvider.check(['Management.Department.Use']),
    validation.insert,
    Router.trycatchFunction('post/office/organization/insert', function(req, res) {
        return function() {
            OrganizationController.insert(req.body).then(
                function(data) {
                    res.send(data);
                    res.end();
                    data = undefined;
                    res = undefined;
                    req = undefined;
                    return;
                },
                function(err) {
                    res.status(statusHTTP.internalServer);
                    Router.LogAndMessage(res, 'post/office/organization/insert', err);
                    res.end();
                    err = undefined;
                    res = undefined;
                    req = undefined;
                    return;
                },
            );
        };
    }),
);

router.post(
    '/update',
    MultiTenant.match({ module_key: ['office'] }),
    PermissionProvider.check(['Management.Department.Use']),
    validation.update,
    Router.trycatchFunction('post/office/organization/update', function(req, res) {
        return function() {
            OrganizationController.update(req.body).then(
                function(data) {
                    res.send(data);
                    res.end();
                    data = undefined;
                    res = undefined;
                    req = undefined;
                    return;
                },
                function(err) {
                    res.status(statusHTTP.internalServer);
                    Router.LogAndMessage(res, 'post/office/organization/update', err);
                    res.end();
                    err = undefined;
                    res = undefined;
                    req = undefined;
                    return;
                },
            );
        };
    }),
);

router.post('/update_nursing_report', MultiTenant.match({ module_key: ["office"] }), PermissionProvider.check(["Management.Department.Use"]), validation.update_nursing_report, Router.trycatchFunction("post/office/organization/update_nursing_report", function (req, res) {
    return function () {
        OrganizationController.update_nursing_report(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/organization/update_nursing_report", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/delete', MultiTenant.match({ module_key: ["office"] }), PermissionProvider.check(["Management.Department.Use"]), validation.delete, Router.trycatchFunction("post/office/organization/delete", function (req, res) {
    return function () {
        OrganizationController.delete(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/organization/delete", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.get(
    '/:organizationId/employee',
    MultiTenant.match({ module_key: ['office'] }),
    Router.trycatchFunction(
        'get/office/organization/:organizationId/employee',
        function (req, res) {
            return function () {
                OrganizationController.loadAllEmployee(req.body, req.params.organizationId).then(
                    function (data) {
                        res.send(data);
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
                            'get/office/organization/:organizationId/employee',
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

router.post(
    '/load_multiple_employee',
    MultiTenant.match({ module_key: ['office'] }),
    validation.load_multiple_employee,
    Router.trycatchFunction(
        'post/office/organization/load_multiple_employee',
        function(req, res) {
            return function() {
                OrganizationController.loadMultipleEmployee(req.body)
                    .then(
                        function(data) {
                            res.send(data);
                            res.end();
                            data = undefined;
                        },
                        function(err) {
                            res.status(statusHTTP.internalServer);
                            Router.LogAndMessage(
                                res,
                                'post/office/organization/load_multiple_employee',
                                err,
                            );
                            res.end();
                            err = undefined;
                        },
                    )
                    .finally(function() {
                        res = undefined;
                        req = undefined;
                    });
            };
        },
    ),
);

router.post(
    "/group/load",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Authorized"]),
    validation.loadGroupOrganization,
    Router.trycatchFunction("post/office/organization/group/load", function(request, response) {
        return function() {
            const dbPrefix = CommonUtils.getDbNamePrefix(request);
            const currentSession = request.body.session;
            GroupOrganizationController.loadAll(dbPrefix, currentSession, request.body)
                .then((result) => {
                    response.send(result);
                    response.end();
                })
                .catch((error) => {
                    Router.LogAndMessage(response, "post/office/organization/group/load", error);
                    response.end();
                })
                .finally(() => {
                    request = undefined;
                    response = undefined;
                });
        };
    }),
);

router.post(
    "/group/insert",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Authorized"]),
    validation.insertGroupOrganization,
    Router.trycatchFunction("post/office/organization/group/insert", function(request, response) {
        return function() {
            const dbPrefix = CommonUtils.getDbNamePrefix(request);
            const currentUser = request.body.session;
            GroupOrganizationController.insertGroup(dbPrefix, currentUser, request.body)
                .then((result) => {
                    response.send(result);
                    response.end();
                })
                .catch((error) => {
                    Router.LogAndMessage(response, "post/office/organization/group/insert", error);
                    response.end();
                })
                .finally(() => {
                    request = undefined;
                    response = undefined;
                });
        };
    }),
);

router.post(
    "/group/update",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Authorized"]),
    validation.updateGroupOrganization,
    Router.trycatchFunction("post/office/organization/group/update", function(request, response) {
        return function() {
            const dbPrefix = CommonUtils.getDbNamePrefix(request);
            const currentUser = request.body.session;
            GroupOrganizationController.updateGroup(dbPrefix, currentUser, request.body)
                .then((result) => {
                    response.send(result);
                    response.end();
                })
                .catch((error) => {
                    Router.LogAndMessage(response, "post/office/organization/group/update", error);
                    response.end();
                })
                .finally(() => {
                    request = undefined;
                    response = undefined;
                });
        };
    }),
);

router.post('/load_all_department', 
    MultiTenant.match({ module_key: ["office"] }), 
    Router.trycatchFunction("post/office/organization/load_all_department", 
    function (req, res) {
        return function () {
            OrganizationController.loadAllDepartment(req.body).then(function (data) {
                res.send(data);
                res.end();
                data = undefined;
                res = undefined;
                req = undefined;
                return;
            }, function (err) {
                res.status(statusHTTP.internalServer);
                Router.LogAndMessage(res, "post/office/organization/load_all_department", err);
                res.end();
                err = undefined;
                res = undefined;
                req = undefined;
                return;
            });
        }
    }
));

module.exports = router;
