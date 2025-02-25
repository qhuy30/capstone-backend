const express = require("express");

const CommonUtil = require("@utils/util");
const { statusHTTP } = require("../../../utils/setting");

const FormDataMiddleware = require("@shared/middleware/form-data");
const { PermissionProvider } = require("../../../shared/permission/permission.provider");
const { Router } = require("../../../shared/router/router.provider");
const { MultiTenant } = require("../../../shared/multi_tenant/provider");

const { NAME_LIB, PARENT_FOLDER, RULE_DISPATCH } = require("./const");

const { validation } = require("./validation");

const { DAController, DepartmentController, EmployeeController } = require("./controller");

const router = express.Router();

router.post(
    '/loaddetails',
    MultiTenant.match({ module_key: ['office'] }),
    PermissionProvider.check(['Authorized']),
    Router.trycatchFunction('post/dispatch_arrived/loaddetails', function (req, res) {
        return function () {
            DAController.loadDetails(req.body).then(
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
                    Router.LogAndMessage(res, 'post/dispatch_arrived/loaddetails', err);
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

router.post('/load_department',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Authorized"]) ,Router.trycatchFunction("post/dispatch_arrived/load_department", function (req, res) {
    return function () {
        DepartmentController.load(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/dispatch_arrived/load_department", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/load_employee',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Authorized"]),validation.load_employee ,Router.trycatchFunction("post/dispatch_arrived/load_employee", function (req, res) {
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
            Router.LogAndMessage(res, "post/dispatch_arrived/load_employee", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post(
    '/load',
    MultiTenant.match({ module_key: ['office'] }),
    PermissionProvider.check(['Authorized']),
    validation.load,
    Router.trycatchFunction('post/dispatch_arrived/load', function (req, res) {
        return function () {
            DAController.load(req.body).then(
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
                    Router.LogAndMessage(res, 'post/dispatch_arrived/load', err);
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
    '/load_quick_handle',
    MultiTenant.match({ module_key: ['office'] }),
    PermissionProvider.check(['Authorized']),
    validation.load_quick_handle,
    Router.trycatchFunction('post/dispatch_arrived/load_quick_handle', function (req, res) {
        return function () {
            DAController.load_quick_handle(req.body).then(
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
                    Router.LogAndMessage(res, 'post/dispatch_arrived/load_quick_handle', err);
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

router.post('/count',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Authorized"]) ,validation.count,Router.trycatchFunction("post/dispatch_arrived/count", function (req, res) {
    return function () {
        DAController.count(req.body).then(function (data) {
            res.send({ count: data[0].count });
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/dispatch_arrived/count", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));


router.post('/count_quick_handle',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Authorized"]) ,validation.count_quick_handle,Router.trycatchFunction("post/dispatch_arrived/count_quick_handle", function (req, res) {
    return function () {
        DAController.count_quick_handle(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/dispatch_arrived/count_quick_handle", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/get_number',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.DispatchArrived.Use"]) ,validation.get_number,Router.trycatchFunction("post/dispatch_arrived/get_number", function (req, res) {
    return function () {
        DAController.getNumber(req.body).then(function (data) {
            res.send({ number: data });
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/dispatch_arrived/get_number", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post(
    "/insert",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Office.DispatchArrived.Use"]),
    // FormDataMiddleware(NAME_LIB, undefined, undefined, PARENT_FOLDER),
    Router.trycatchFunction("post/dispatch_arrived/insert", function (req, res) {
        return function () {
            // const dbPrefix = CommonUtil.getDbNamePrefix(req);
            // const currentUser = req.body.session;
            DAController.insert(req).then(
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
                    Router.LogAndMessage(res, "post/dispatch_arrived/insert", err);
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
    "/update",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Office.DispatchArrived.Use"]),
    // FormDataMiddleware(NAME_LIB, undefined, undefined, PARENT_FOLDER),
    Router.trycatchFunction("post/dispatch_arrived/insert", function (req, res) {
        return function () {
            // const dbPrefix = CommonUtil.getDbNamePrefix(req);
            // const currentUser = req.body.session;
            DAController.update(req).then(
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
                    Router.LogAndMessage(res, "post/dispatch_arrived/insert", err);
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
    "/send_lead_department",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check([RULE_DISPATCH.CREATE]),
    Router.trycatchFunction("post/dispatch_arrived/send_lead_department", function (req, res) {
        return function () {
            DAController.send_lead_department(req).then(
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
                    Router.LogAndMessage(res, "post/dispatch_arrived/send_lead_department", err);
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
    "/send_lead_external",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check([RULE_DISPATCH.LEAD_DEPARTMENT]),
    Router.trycatchFunction("post/dispatch_arrived/send_lead_external", function (req, res) {
        return function () {
            DAController.send_lead_external(req).then(
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
                    Router.LogAndMessage(res, "post/dispatch_arrived/send_lead_external", err);
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
    "/reject_department",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Authorized"]),
    validation.reject_department,
    Router.trycatchFunction("post/dispatch_arrived/reject_department", function (req, res) {
        return function () {
            DAController.reject_department(req).then(
                function (data) {
                    res.send(data);
                    res.end();
                    data = undefined;
                    res = undefined;
                    req = undefined;
                },
                function (err) {
                    res.status(statusHTTP.internalServer);
                    Router.LogAndMessage(res, "post/dispatch_arrived/reject_department", err);
                    res.end();
                    err = undefined;
                    res = undefined;
                    req = undefined;
                },
            );
        };
    }),
);

router.post(
    "/return_lead_department",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check([RULE_DISPATCH.LEAD_EXTERNAL]),
    Router.trycatchFunction("post/dispatch_arrived/return_lead_department", function (req, res) {
        return function () {
            DAController.return_lead_department(req).then(
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
                    Router.LogAndMessage(res, "post/dispatch_arrived/return_lead_department", err);
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
    "/transfer_department",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check([RULE_DISPATCH.LEAD_EXTERNAL, RULE_DISPATCH.LEAD_DEPARTMENT]),
    Router.trycatchFunction("post/dispatch_arrived/transfer_department", function (req, res) {
        return function () {
            DAController.transfer_department(req).then(
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
                    Router.LogAndMessage(res, "post/dispatch_arrived/transfer_department", err);
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
    "/transfer_department_approve",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Authorized"]),
    validation.transfer_department_approve,
    Router.trycatchFunction("post/dispatch_arrived/transfer_department_approve", function (req, res) {
        return function () {
            DAController.transfer_department_approve(req).then(
                function (data) {
                    res.send(data);
                    res.end();
                    data = undefined;
                    res = undefined;
                    req = undefined;
                },
                function (err) {
                    res.status(statusHTTP.internalServer);
                    Router.LogAndMessage(res, "post/dispatch_arrived/transfer_department_approve", err);
                    res.end();
                    err = undefined;
                    res = undefined;
                    req = undefined;
                },
            );
        };
    }),
);

router.post(
    "/seen_work",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check([RULE_DISPATCH.FOLLOW]),
    validation.seen_work,
    Router.trycatchFunction("post/dispatch_arrived/seen_work", function (req, res) {
        return function () {
            DAController.seen_work(req).then(
                function (data) {
                    res.send(data);
                    res.end();
                    data = undefined;
                    res = undefined;
                    req = undefined;
                },
                function (err) {
                    res.status(statusHTTP.internalServer);
                    Router.LogAndMessage(res, "post/dispatch_arrived/seen_work", err);
                    res.end();
                    err = undefined;
                    res = undefined;
                    req = undefined;
                },
            );
        };
    }),
);


router.post(
    "/forward",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Authorized"]),
    validation.forward,
    Router.trycatchFunction("post/dispatch_arrived/forward", function (req, res) {
        return function () {
            const dbPrefix = CommonUtil.getDbNamePrefix(req);
            DAController.forward(dbPrefix, req.body).then(
                function (data) {
                    res.send(data);
                    res.end();
                    data = undefined;
                    res = undefined;
                    req = undefined;
                },
                function (err) {
                    res.status(statusHTTP.internalServer);
                    Router.LogAndMessage(res, "post/dispatch_arrived/forward", err);
                    res.end();
                    err = undefined;
                    res = undefined;
                    req = undefined;
                },
            );
        };
    }),
);

router.post(
    "/receive",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Authorized"]),
    validation.receive,
    Router.trycatchFunction("post/dispatch_arrived/receive", function (req, res) {
        return function () {
            const dbPrefix = CommonUtil.getDbNamePrefix(req);
            DAController.receive(dbPrefix, req.body).then(
                function (data) {
                    res.send(data);
                    res.end();
                    data = undefined;
                    res = undefined;
                    req = undefined;
                },
                function (err) {
                    res.status(statusHTTP.internalServer);
                    Router.LogAndMessage(res, "post/dispatch_arrived/receive", err);
                    res.end();
                    err = undefined;
                    res = undefined;
                    req = undefined;
                },
            );
        };
    }),
);

router.get('/countpending',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Authorized"]) ,Router.trycatchFunction("get/dispatch_arrived/countpending", function (req, res) {
    return function () {
        DAController.countPending(req.body).then(function (data) {
            res.send({ count: data[0].count });
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "get/dispatch_arrived/countpending", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/loadfileinfo',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Authorized"]), validation.loadFileInfo, Router.trycatchFunction("post/dispatch_arrived/loadfileinfo", function(req, res) {
    return function() {
        DAController.loadFileInfo(req.body).then(function(data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function(err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/dispatch_arrived/loadfileinfo", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/downloadfile',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Authorized"]), validation.downloadfile, Router.trycatchFunction("post/dispatch_arrived/downloadfile", function(req, res) {
    return function() {
        DAController.downloadfile(req.body).then(function(data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function(err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/dispatch_arrived/downloadfile", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/delete',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.DispatchArrived.Use"]),validation.delete,Router.trycatchFunction("post/dispatch_arrived/delete", function (req, res) {
    return function () {
        DAController.delete(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/dispatch_arrived/delete", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/handling',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Authorized"]),validation.handling,Router.trycatchFunction("post/dispatch_arrived/handling", function (req, res) {
    return function () {
        DAController.handling(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/dispatch_arrived/handling", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/insert_task',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Authorized"]),validation.insert_task,Router.trycatchFunction("post/dispatch_arrived/insert_task", function (req, res) {
    return function () {
        DAController.insertTask(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/dispatch_arrived/insert_task", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

// router.post(
//     "/update",
//     MultiTenant.match({ module_key: ["office"] }),
//     PermissionProvider.check(["Authorized"]),
//     FormDataMiddleware(NAME_LIB, undefined, undefined, PARENT_FOLDER),
//     Router.trycatchFunction("post/dispatch_arrived/update", function (req, res) {
//         return function () {
//             const dbPrefix = CommonUtil.getDbNamePrefix(req);
//             const currentUser = req.body.session;

//             DAController.update(dbPrefix, currentUser, req.formData).then(
//                 function (data) {
//                     res.send(data);
//                     res.end();
//                     data = undefined;
//                     res = undefined;
//                     req = undefined;
//                     return;
//                 },
//                 function (err) {
//                     res.status(statusHTTP.internalServer);
//                     Router.LogAndMessage(res, "post/dispatch_arrived/update", err);
//                     res.end();
//                     err = undefined;
//                     res = undefined;
//                     req = undefined;
//                     return;
//                 },
//             );
//         };
//     }),
// );

router.post('/sign_acknowledge',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Authorized"]),validation.signAcknowledge,Router.trycatchFunction("post/dispatch_arrived/sign_acknowledge", function (req, res) {
    return function () {
        DAController.signAcknowledge(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/dispatch_arrived/sign_acknowledge", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post(
    "/response",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Authorized"]),
    validation.response,
    Router.trycatchFunction("post/dispatch_arrived/response", function (req, res) {
        return function () {
            const dbPrefix = CommonUtil.getDbNamePrefix(req);
            const currentUser = req.body.session;
            DAController.response(dbPrefix, currentUser, req.body).then(
                function (data) {
                    res.send(data);
                    res.end();
                    data = undefined;
                    res = undefined;
                    req = undefined;
                },
                function (err) {
                    res.status(statusHTTP.internalServer);
                    Router.LogAndMessage(res, "post/dispatch_arrived/response", err);
                    res.end();
                    err = undefined;
                    res = undefined;
                    req = undefined;
                },
            );
        };
    }),
);

module.exports = router;
