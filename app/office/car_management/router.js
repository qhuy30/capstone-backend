const express = require("express");
const router = express.Router();

const CommonUtil = require("@utils/util");
const { statusHTTP } = require("../../../utils/setting");

const FormDataMiddleware = require("@shared/middleware/form-data");
const { PermissionProvider } = require("../../../shared/permission/permission.provider");
const { Router } = require("../../../shared/router/router.provider");
const { MultiTenant } = require("../../../shared/multi_tenant/provider");
const { NAME_LIB, PARENT_FOLDER, RULE_CAR } = require("./const");

const { CarManagementController} = require("./controller");
const { validation } = require("./validation");

router.post(
    '/load',
    MultiTenant.match({ module_key: ['office'] }),
    PermissionProvider.check(["Authorized"]),
    validation.load,
    Router.trycatchFunction('post/car_management/load', function (req, res) {
        return function () {
            CarManagementController.load(req.body).then(
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
                    Router.LogAndMessage(res, 'post/car_management/load', err);
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
    '/export-excel',
    MultiTenant.match({ module_key: ['office'] }),
    PermissionProvider.check([
        RULE_CAR.USE,
    ]),
    validation.export_excel,
    Router.trycatchFunction('post/car_management/export_excel', function (req, res) {
        return function () {
            CarManagementController.export_excel(req.body).then(
                function (data) {
                    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                    res.setHeader('Content-Disposition', 'attachment; filename="CarManagement.xlsx"');
                    res.send(data);
                    res.end();
                    data = undefined;
                    res = undefined;
                    req = undefined;
                    return;
                },
                function (err) {
                    res.status(statusHTTP.internalServer);
                    Router.LogAndMessage(res, 'post/car_management/export_excel', err);
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
    '/loadDetail',
    MultiTenant.match({ module_key: ['office'] }),
    PermissionProvider.check([
        'Office.CarManagement.Use'
    ]),
    validation.loadDetail,
    Router.trycatchFunction('post/car_management/loadDetail', function (req, res) {
        return function () {
            CarManagementController.loadDetail(req.body).then(
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
                    Router.LogAndMessage(res, 'post/car_management/loadDetail', err);
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

router.post('/count',
    MultiTenant.match({ module_key: ['office'] }),
    PermissionProvider.check(["Authorized"]) ,
    validation.count,
    Router.trycatchFunction("post/car_management/count", function (req, res) {
    return function () {
        CarManagementController.count(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/car_management/count", err);
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
    PermissionProvider.check([RULE_CAR.USE]),
    Router.trycatchFunction("post/car_management/insert", function (req, res) {
        return function () {
            CarManagementController.insert(req).then(
                function (data) {
                    res.send(data);
                    res.end();
                    data = undefined;
                    res = undefined;
                    req = undefined;
                    return;
                },
                function (err) {
                    console.log(err);
                    res.status(statusHTTP.internalServer);
                    Router.LogAndMessage(res, "post/car_management/insert", err);
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

router.post('/delete',
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check([RULE_CAR.USE]),
    validation.delete,
    Router.trycatchFunction("post/car_management/delete", function (req, res) {
    return function () {
        CarManagementController.delete(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/car_management/delete", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post( "/update",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Authorized"]),
    Router.trycatchFunction("office/car_management/update", function  (req, res) {
        return function () {
            CarManagementController.update(req).then(
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
                    Router.LogAndMessage(res, "post/car_management/update", err);
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

router.post( "/approve_department",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check([RULE_CAR.APPROVE_DEPARTMENT]),
    Router.trycatchFunction("office/car_management/approve_department", function  (req, res) {
        return function () {
            CarManagementController.approve_department(req).then(
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
                    Router.LogAndMessage(res, "post/car_management/approve_department", err);
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

router.post( "/reject_department",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check([RULE_CAR.APPROVE_DEPARTMENT]),
    validation.reject_department, 
    Router.trycatchFunction("office/car_management/reject_department", function  (req, res) {
        return function () {
            CarManagementController.reject_department(req).then(
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
                    Router.LogAndMessage(res, "post/car_management/reject_department", err);
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

router.post( "/approve_car_management",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check([RULE_CAR.CONFIRM]),
    validation.approve_car_management, 
    Router.trycatchFunction("office/car_management/approve_car_management", function  (req, res) {
        return function () {
            CarManagementController.approve_car_management(req).then(
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
                    Router.LogAndMessage(res, "post/car_management/approve_car_management", err);
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

router.post( "/reject_car_management",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check([RULE_CAR.CONFIRM]),
    validation.reject_car_management, 
    Router.trycatchFunction("office/car_management/reject_car_management", function  (req, res) {
        return function () {
            CarManagementController.reject_car_management(req).then(
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
                    Router.LogAndMessage(res, "post/car_management/reject_car_management", err);
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

router.post( "/approve_lead",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check([RULE_CAR.APPROVE_LEAD]),
    validation.approve_lead, 
    Router.trycatchFunction("office/car_management/approve_lead", function  (req, res) {
        return function () {
            CarManagementController.approve_lead(req).then(
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
                    Router.LogAndMessage(res, "post/car_management/approve_lead", err);
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

router.post( "/reject_lead",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check([RULE_CAR.APPROVE_LEAD]),
    validation.reject_lead, 
    Router.trycatchFunction("office/car_management/reject_lead", function  (req, res) {
        return function () {
            CarManagementController.reject_lead(req).then(
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
                    Router.LogAndMessage(res, "post/car_management/reject_lead", err);
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

router.post( "/approve_lead_external",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check([RULE_CAR.APPROVE_LEAD_EXTERNAL]),
    validation.approve_lead_external, 
    Router.trycatchFunction("office/car_management/approve_lead_external", function  (req, res) {
        return function () {
            CarManagementController.approve_lead_external(req).then(
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
                    Router.LogAndMessage(res, "post/car_management/approve_lead_external", err);
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

router.post( "/reject_lead_external",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check([RULE_CAR.APPROVE_LEAD_EXTERNAL]),
    validation.reject_lead_external, 
    Router.trycatchFunction("office/car_management/reject_lead_external", function  (req, res) {
        return function () {
            CarManagementController.reject_lead_external(req).then(
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
                    Router.LogAndMessage(res, "post/car_management/reject_lead_external", err);
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

router.post( "/edit_card_management",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check([RULE_CAR.ASSIGN_CARD]),
    validation.edit_card_management, 
    Router.trycatchFunction("office/car_management/edit_card_management", function  (req, res) {
        return function () {
            CarManagementController.edit_card_management(req.body).then(
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
                    Router.LogAndMessage(res, "post/car_management/edit_card_management", err);
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

router.post( "/creator_receive_card",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Authorized"]),
    validation.creator_receive_card, 
    Router.trycatchFunction("office/car_management/creator_receive_card", function  (req, res) {
        return function () {
            CarManagementController.creator_receive_card(req).then(
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
                    Router.LogAndMessage(res, "post/car_management/creator_receive_card", err);
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

router.post( "/creator_return_card",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Authorized"]),
    Router.trycatchFunction("office/car_management/creator_return_card", function  (req, res) {
        return function () {
            CarManagementController.creator_return_card(req).then(
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
                    Router.LogAndMessage(res, "post/car_management/creator_return_card", err);
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

router.post( "/manager_receive_card",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check([RULE_CAR.CONFIRM]),
    validation.manager_receive_card, 
    Router.trycatchFunction("office/car_management/manager_receive_card", function  (req, res) {
        return function () {
            CarManagementController.manager_receive_card(req).then(
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
                    Router.LogAndMessage(res, "post/car_management/manager_receive_card", err);
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

router.post( "/creator_cancel",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Authorized"]),
    validation.creator_cancel,
    Router.trycatchFunction("office/car_management/creator_cancel", function  (req, res) {
        return function () {
            CarManagementController.creator_cancel(req.body).then(
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
                    Router.LogAndMessage(res, "post/car_management/creator_cancel", err);
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

router.post('/load_file_info',MultiTenant.match({module_key:["office"]}), PermissionProvider.check("Authorized"), validation.load_file_info, Router.trycatchFunction("post/car_management/load_file_info", function(req, res) {
    return function() {
        CarManagementController.load_file_info(req.body).then(function(data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function(err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/car_management/load_file_info", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/load_file_invoice',MultiTenant.match({module_key:["office"]}), PermissionProvider.check("Authorized"), validation.load_file_info, Router.trycatchFunction("post/car_management/load_file_invoice", function(req, res) {
    return function() {
        CarManagementController.load_file_invoice(req.body).then(function(data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function(err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/car_management/load_file_invoice", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/downloadfile',MultiTenant.match({module_key:["office"]}), PermissionProvider.check("Authorized"), validation.downloadfile, Router.trycatchFunction("post/car_management/downloadfile", function(req, res) {
    return function() {
       
        CarManagementController.downloadfile(req.body).then(function(data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function(err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/car_management/downloadfile", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

// RECALL
router.post( "/request_cancel",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Authorized"]),
    validation.recall_flow, 
    Router.trycatchFunction("office/car_management/request_cancel", function  (req, res) {
        return function () {
            CarManagementController.request_cancel(req).then(
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
                    Router.LogAndMessage(res, "post/car_management/request_cancel", err);
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

router.post( "/approve_recall_department",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Authorized"]),
    validation.recall_flow, 
    Router.trycatchFunction("office/car_management/approve_recall_department", function  (req, res) {
        return function () {
            CarManagementController.approve_recall_department(req).then(
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
                    Router.LogAndMessage(res, "post/car_management/approve_recall_department", err);
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

router.post( "/approve_recall_management",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Authorized"]),
    validation.recall_flow, 
    Router.trycatchFunction("office/car_management/approve_recall_management", function  (req, res) {
        return function () {
            CarManagementController.approve_recall_management(req).then(
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
                    Router.LogAndMessage(res, "post/car_management/approve_recall_management", err);
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

router.post( "/approve_recall_lead",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Authorized"]),
    validation.recall_flow, 
    Router.trycatchFunction("office/car_management/approve_recall_lead", function  (req, res) {
        return function () {
            CarManagementController.approve_recall_lead(req).then(
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
                    Router.LogAndMessage(res, "post/car_management/approve_recall_lead", err);
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

router.post( "/reject_recall",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Authorized"]),
    validation.recall_flow, 
    Router.trycatchFunction("office/car_management/reject_recall", function  (req, res) {
        return function () {
            CarManagementController.reject_recall(req).then(
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
                    Router.LogAndMessage(res, "post/car_management/reject_recall", err);
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

module.exports = router;
