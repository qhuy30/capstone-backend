const express = require('express');
const router = express.Router();
const { EventCalendarController } = require('./controller');
const { validation } = require('./validation');
const { PermissionProvider } = require('../../../shared/permission/permission.provider');
const { statusHTTP } = require('../../../utils/setting');
const { Router } = require('../../../shared/router/router.provider');
const {MultiTenant} = require('../../../shared/multi_tenant/provider');
const { RULE_EVENT_CALENDAR } = require('./const');


router.post('/load',
    MultiTenant.match(),  
    PermissionProvider.check([RULE_EVENT_CALENDAR.USE]), 
    validation.load, 
    Router.trycatchFunction("post/event_calendar/load", function (req, res) {
        return function () {
            EventCalendarController.load(req).then(function (data) {
                res.send(data);
                res.end();
                data = undefined;
                res = undefined;
                req = undefined;
                return;
            }, function (err) {
                res.status(statusHTTP.internalServer);
                Router.LogAndMessage(res, "post/event_calendar/load", err);
                res.end();
                err = undefined;
                res = undefined;
                req = undefined;
                return;
            });
        }
    }),
);

router.post('/load-calendar',
    MultiTenant.match(),  
    PermissionProvider.check([RULE_EVENT_CALENDAR.USE]), 
    validation.load_calendar, 
    Router.trycatchFunction("post/event_calendar/load-calendar", function (req, res) {
        return function () {
            EventCalendarController.load_calendar(req).then(function (data) {
                res.send(data);
                res.end();
                data = undefined;
                res = undefined;
                req = undefined;
                return;
            }, function (err) {
                res.status(statusHTTP.internalServer);
                Router.LogAndMessage(res, "post/event_calendar/load-calendar", err);
                res.end();
                err = undefined;
                res = undefined;
                req = undefined;
                return;
            });
        }
    }),
);

router.post('/export-excel',
    MultiTenant.match(),  
    PermissionProvider.check([RULE_EVENT_CALENDAR.USE]), 
    validation.export_excel, 
    Router.trycatchFunction("post/event_calendar/export-excel", function (req, res) {
        return function () {
            EventCalendarController.export_excel(req).then(function (data) {
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.setHeader('Content-Disposition', 'attachment; filename="EventCalendar.xlsx"');
                res.send(data);
                res.end();
                data = undefined;
                res = undefined;
                req = undefined;
                return;
            }, function (err) {
                res.status(statusHTTP.internalServer);
                Router.LogAndMessage(res, "post/event_calendar/export-excel", err);
                res.end();
                err = undefined;
                res = undefined;
                req = undefined;
                return;
            });
        }
    }),
);

router.post('/count', 
    MultiTenant.match(), 
    PermissionProvider.check([RULE_EVENT_CALENDAR.USE]), 
    validation.count, 
    Router.trycatchFunction("post/event_calendar/count", function (req, res) {
        return function () {
            EventCalendarController.count(req).then(function (data) {
                res.send(data);
                res.end();
                req = undefined;
                res = undefined;
                data = undefined;
                return;
            }, function (err) {
                res.status(statusHTTP.internalServer);
                Router.LogAndMessage(res, "post/event_calendar/count", err);
                res.end();
                req = undefined;
                res = undefined;
                err = undefined;
                return;
            });
        }
    }),
);

router.post('/loaddetails', 
    MultiTenant.match(),  
    PermissionProvider.check([RULE_EVENT_CALENDAR.USE]), 
    validation.loaddetails,
    Router.trycatchFunction("post/event_calendar/loaddetails", function (req, res) {
        return function () {
            EventCalendarController.loaddetails(req).then(function (data) {
                res.send(data);
                res.end();
                req = undefined;
                res = undefined;
                data = undefined;
                return;
            }, function (err) {
                res.status(statusHTTP.internalServer);
                Router.LogAndMessage(res, "post/event_calendar/loaddetails", err);
                res.end();
                req = undefined;
                res = undefined;
                err = undefined;
                return;
            });
        }
    })
);

router.post('/insert',
    MultiTenant.match(),  
    PermissionProvider.check([RULE_EVENT_CALENDAR.CREATE]), 
    Router.trycatchFunction("post/event_calendar/insert", function (req, res) {
        return function () {
            EventCalendarController.insert(req).then(function (data) {
                res.send(data);
                res.end();
                data = undefined;
                res = undefined;
                req = undefined;
                return;
            }, function (err) {
                res.status(statusHTTP.internalServer);
                Router.LogAndMessage(res, "get/event_calendar/insert", err);
                res.end();
                err = undefined;
                res = undefined;
                req = undefined;
                return;
            });
        }
    }),
);

router.post('/creator_update', 
    MultiTenant.match(),  
    PermissionProvider.check([RULE_EVENT_CALENDAR.CREATE]), 
    Router.trycatchFunction("post/event_calendar/creator_update", function (req, res) {
        return function () {
            EventCalendarController.creator_update(req).then(function (data) {
                res.send(data);
                res.end();
            }, function (err) {
                res.status(statusHTTP.internalServer);
                Router.LogAndMessage(res, "put/event_calendar/creator_update", err);
                res.end();
            });
        }
    })
);

router.post('/creator_delete', 
    MultiTenant.match(),  
    PermissionProvider.check([
        RULE_EVENT_CALENDAR.CREATE,
    ]), 
    validation.creator_delete,
    Router.trycatchFunction("delete/event_calendar/creator_delete", function (req, res) {
        return function () {
            EventCalendarController.creator_delete(req.body).then(function (data) {
                res.send(data);
                res.end();
            }, function (err) {
                res.status(statusHTTP.internalServer);
                Router.LogAndMessage(res, "delete/event_calendar/creator_delete", err);
                res.end();
            });
        }
    })
);


/** Phê duyệt lịch công tác TP*/
router.post('/approve_department', 
    MultiTenant.match(),  
    PermissionProvider.check([
        RULE_EVENT_CALENDAR.APPROVE_DEPARTMENT
    ]), 
    validation.approve_department,
    Router.trycatchFunction("post/event_calendar/approve_department", function (req, res) {
        return function () {
            EventCalendarController.approve_department(req).then(function (data) {
                res.send(data);
                res.end();
            }, function (err) {
                res.status(statusHTTP.internalServer);
                Router.LogAndMessage(res, "post/event_calendar/approve_department", err);
                res.end();
            });
        }
    })
);

/** Từ chối duyệt lịch công tác TP*/
router.post('/reject_department', 
    MultiTenant.match(),  
    PermissionProvider.check([
        RULE_EVENT_CALENDAR.USE
    ]), 
    validation.reject_department,
    Router.trycatchFunction("post/event_calendar/reject_department", function (req, res) {
        return function () {
            EventCalendarController.reject_department(req).then(function (data) {
                res.send(data);
                res.end();
            }, function (err) {
                res.status(statusHTTP.internalServer);
                Router.LogAndMessage(res, "post/event_calendar/reject_department", err);
                res.end();
            });
        }
    })
);

/** Phê duyệt lịch công tác Host*/
router.post('/approve_host', 
    MultiTenant.match(),  
    PermissionProvider.check([
        RULE_EVENT_CALENDAR.USE
    ]), 
    validation.approve_host,
    Router.trycatchFunction("post/event_calendar/approve_host", function (req, res) {
        return function () {
            EventCalendarController.approve_host(req).then(function (data) {
                res.send(data);
                res.end();
            }, function (err) {
                res.status(statusHTTP.internalServer);
                Router.LogAndMessage(res, "post/event_calendar/approve_host", err);
                res.end();
            });
        }
    })
);

router.post('/reject_host', 
    MultiTenant.match(),  
    PermissionProvider.check([
        RULE_EVENT_CALENDAR.USE
    ]), 
    validation.reject_host,
    Router.trycatchFunction("post/event_calendar/reject_host", function (req, res) {
        return function () {
            EventCalendarController.reject_host(req).then(function (data) {
                res.send(data);
                res.end();
            }, function (err) {
                res.status(statusHTTP.internalServer);
                Router.LogAndMessage(res, "post/event_calendar/reject_host", err);
                res.end();
            });
        }
    })
);

router.post('/request_cancel', 
    MultiTenant.match(),  
    PermissionProvider.check([RULE_EVENT_CALENDAR.USE]), 
    validation.request_cancel,  
    Router.trycatchFunction("post/event_calendar/request_cancel", function (req, res) {
        return function () {
            EventCalendarController.request_cancel(req).then(function (data) {
                res.send(data);
                res.end();
            }, function (err) {
                res.status(statusHTTP.internalServer);
                Router.LogAndMessage(res, "post/event_calendar/request_cancel", err);
                res.end();
            });
        }
    })
);

router.post('/approve_recall_department', 
    MultiTenant.match(),  
    PermissionProvider.check([
        RULE_EVENT_CALENDAR.USE
    ]), 
    validation.approve_recall_department,
    Router.trycatchFunction("post/event_calendar/approve_recall_department", function (req, res) {
        return function () {
            EventCalendarController.approve_recall_department(req).then(function (data) {
                res.send(data);
                res.end();
            }, function (err) {
                res.status(statusHTTP.internalServer);
                Router.LogAndMessage(res, "post/event_calendar/approve_recall_department", err);
                res.end();
            });
        }
    })
);

router.post('/reject_recall_department', 
    MultiTenant.match(),  
    PermissionProvider.check([
        RULE_EVENT_CALENDAR.USE
    ]), 
    validation.reject_recall_department,
    Router.trycatchFunction("post/event_calendar/reject_recall_department", function (req, res) {
        return function () {
            EventCalendarController.reject_recall_department(req).then(function (data) {
                res.send(data);
                res.end();
            }, function (err) {
                res.status(statusHTTP.internalServer);
                Router.LogAndMessage(res, "post/event_calendar/reject_recall_department", err);
                res.end();
            });
        }
    })
);

router.post('/approve_recall_host', 
    MultiTenant.match(),  
    PermissionProvider.check([
        RULE_EVENT_CALENDAR.USE
    ]), 
    validation.approve_recall_host,
    Router.trycatchFunction("post/event_calendar/approve_recall_host", function (req, res) {
        return function () {
            EventCalendarController.approve_recall_host(req).then(function (data) {
                res.send(data);
                res.end();
            }, function (err) {
                res.status(statusHTTP.internalServer);
                Router.LogAndMessage(res, "post/event_calendar/approve_recall_host", err);
                res.end();
            });
        }
    })
);

router.post('/reject_recall_host', 
    MultiTenant.match(),  
    PermissionProvider.check([
        RULE_EVENT_CALENDAR.USE
    ]), 
    validation.reject_recall_host,
    Router.trycatchFunction("post/event_calendar/reject_recall_host", function (req, res) {
        return function () {
            EventCalendarController.reject_recall_host(req).then(function (data) {
                res.send(data);
                res.end();
            }, function (err) {
                res.status(statusHTTP.internalServer);
                Router.LogAndMessage(res, "post/event_calendar/reject_recall_host", err);
                res.end();
            });
        }
    })
);

router.post(
    '/pushfile',
    MultiTenant.match({ module_key: ['office'] }),
    PermissionProvider.check([RULE_EVENT_CALENDAR.USE]),
    validation.pushFile,
    Router.trycatchFunction("post/event_calendar/pushfile", function (req, res) {
        return function () {
            EventCalendarController.pushFile(req).then(function (data) {
                res.send(data);
                res.end();
                data = undefined;
                res = undefined;
                req = undefined;
                return;
            }, function (err) {
                res.status(statusHTTP.internalServer);
                Router.LogAndMessage(res, "post/event_calendar/pushfile", err);
                res.end();
                err = undefined;
                res = undefined;
                req = undefined;
                return;
            });
        };
    }),
);

router.post(
    '/removefile',
    MultiTenant.match({ module_key: ['office'] }),
    PermissionProvider.check([RULE_EVENT_CALENDAR.USE]),
    validation.removeFile,
    Router.trycatchFunction("post/event_calendar/removefile", function (req, res) {
        return function () {
            EventCalendarController.removeFile(req).then(function (data) {
                res.send(data);
                res.end();
                data = undefined;
                res = undefined;
                req = undefined;
                return;
            }, function (err) {
                res.status(statusHTTP.internalServer);
                Router.LogAndMessage(res, "post/event_calendar/removefile", err);
                res.end();
                err = undefined;
                res = undefined;
                req = undefined;
                return;
            });
        };
    }),
);

router.post('/load_file_info',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Authorized"]), validation.load_file_info, Router.trycatchFunction("post/meeting_room/load_file_info", function(req, res) {
    return function() {
        EventCalendarController.load_file_info(req.body).then(function(data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function(err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/event_calendar/load_file_info", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

module.exports = router;
