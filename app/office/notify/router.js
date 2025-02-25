const express = require('express');
const router = express.Router();
const {NotifyController } = require('./controller');
const { validation } = require('./validation');
const { PermissionProvider } = require('../../../shared/permission/permission.provider');
const { statusHTTP } = require('../../../utils/setting');
const { Router } = require('../../../shared/router/router.provider');
const {MultiTenant} = require('../../../shared/multi_tenant/provider');
const { NOTIFY_RULE } = require('./const');

router.post('/load',MultiTenant.match({module_key:["office"]}), PermissionProvider.check([NOTIFY_RULE.AUTHORIZED]) ,validation.load,Router.trycatchFunction("post/notify/load", function (req, res) {
    return function () {
        NotifyController.load(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/notify/load", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/count',MultiTenant.match({module_key:["office"]}), PermissionProvider.check([NOTIFY_RULE.AUTHORIZED]) ,validation.count,Router.trycatchFunction("post/notify/count", function (req, res) {
    return function () {
        NotifyController.count(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/notify/count", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));


router.post('/count_not_seen',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(NOTIFY_RULE.AUTHORIZED) ,Router.trycatchFunction("post/notify/count_not_seen", function (req, res) {
    return function () {
        NotifyController.count_not_seen(req.body).then(function (data) {
            res.send({ count: data });
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/notify/count_not_seen", err);
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
    PermissionProvider.check(["Office.Notify.Create"]),
    Router.trycatchFunction("post/notify/insert", function (req, res) {
        return function () {
            NotifyController.insert(req).then(
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
                    Router.LogAndMessage(res, "post/notify/insert", err);
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
    "/approval",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check([NOTIFY_RULE.APPROVE_LEAD, NOTIFY_RULE.APPROVE_DEPARTMENT, NOTIFY_RULE.APPROVE_LEAD_EXTERNAL]),
    validation.approval,
    Router.trycatchFunction("post/notify/approval", function (req, res) {
        return function () {
            NotifyController.approval(req.body).then(
                function (data) {
                    res.send(data);
                    res.end();
                    data = undefined;
                    res = undefined;
                    req = undefined;
                },
                function (err) {
                    res.status(statusHTTP.internalServer);
                    Router.LogAndMessage(res, "post/notify/approval", err);
                    res.end();
                    err = undefined;
                    res = undefined;
                    req = undefined;
                });
        }
    }),
);

router.post('/reject',MultiTenant.match({module_key:["office"]}), PermissionProvider.check([NOTIFY_RULE.APPROVE_LEAD, NOTIFY_RULE.APPROVE_DEPARTMENT, NOTIFY_RULE.APPROVE_LEAD_EXTERNAL]),validation.reject,Router.trycatchFunction("post/notify/reject", function (req, res) {
    return function () {
        NotifyController.reject(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/notify/reject", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));


router.post('/delete',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.Notify.Use"]),validation.delete,Router.trycatchFunction("post/notify/delete", function (req, res) {
    return function () {
        NotifyController.delete(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/notify/delete", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/load_details',MultiTenant.match({module_key:["office"]}), PermissionProvider.check([NOTIFY_RULE.AUTHORIZED]),validation.load_details,Router.trycatchFunction("post/notify/load_details", function (req, res) {
    return function () {
        NotifyController.load_details(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/notify/load_details", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/reload_details',MultiTenant.match({module_key:["office"]}), PermissionProvider.check([NOTIFY_RULE.AUTHORIZED]),validation.load_details,Router.trycatchFunction("post/notify/reload_details", function (req, res) {
    return function () {
        NotifyController.reload_details(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/notify/reload_details", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/load_file_info',MultiTenant.match({module_key:["office"]}), PermissionProvider.check([NOTIFY_RULE.AUTHORIZED]), validation.load_file_info, Router.trycatchFunction("post/notify/load_file_info", function(req, res) {
    return function() {
        NotifyController.load_file_info(req.body).then(function(data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function(err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/notify/load_file_info", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/downloadfile',MultiTenant.match({module_key:["office"]}), PermissionProvider.check([NOTIFY_RULE.AUTHORIZED]), validation.downloadfile, Router.trycatchFunction("post/notify/downloadfile", function(req, res) {
    return function() {
        NotifyController.downloadfile(req.body).then(function(data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function(err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/notify/downloadfile", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/like',MultiTenant.match({module_key:["office"]}), PermissionProvider.check([NOTIFY_RULE.AUTHORIZED]),validation.like,Router.trycatchFunction("post/notify/like", function (req, res) {
    return function () {
        NotifyController.like(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/notify/like", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/unlike', MultiTenant.match({ module_key: ["office"] }), PermissionProvider.check([NOTIFY_RULE.AUTHORIZED]), validation.unlike, Router.trycatchFunction("post/notify/unlike", function (req, res) {
    return function () {
        NotifyController.unlike(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/notify/unlike", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/throw_to_recyclebin',MultiTenant.match({module_key:["office"]}), PermissionProvider.check([NOTIFY_RULE.AUTHORIZED]),validation.throw_to_recyclebin,Router.trycatchFunction("post/notify/throw_to_recyclebin", function (req, res) {
    return function () {
        NotifyController.throw_to_recyclebin(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/notify/throw_to_recyclebin", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/restore_from_recyclebin',MultiTenant.match({module_key:["office"]}), PermissionProvider.check([NOTIFY_RULE.AUTHORIZED]),validation.restore_from_recyclebin,Router.trycatchFunction("post/notify/restore_from_recyclebin", function (req, res) {
    return function () {
        NotifyController.restore_from_recyclebin(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/notify/restore_from_recyclebin", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post(
    "/update",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Office.Notify.Use"]),
    Router.trycatchFunction("post/notify/update", function (req, res) {
        return function () {
            NotifyController.update(req.body).then(
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
                    Router.LogAndMessage(res, "post/notify/update", err);
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
    "/approve_department",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Office.Notify.Use"]),
    Router.trycatchFunction("post/notify/approve_department", function (req, res) {
        return function () {
            NotifyController.approve_department(req.body).then(
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
                    Router.LogAndMessage(res, "post/notify/approve_department", err);
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

router.post('/recall',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.Notify.Use"]),validation.recall,Router.trycatchFunction("post/notify/recall", function (req, res) {
    return function () {
        NotifyController.recall(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/notify/recall", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/pushfile',
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check([NOTIFY_RULE.AUTHORIZED]),
    Router.trycatchFunction("post/notify/pushfile", function (req, res) {
    return function () {
        NotifyController.pushfile(req).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/notify/pushfile", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/removefile',
    MultiTenant.match({ module_key: ["office"] }),
     PermissionProvider.check([NOTIFY_RULE.AUTHORIZED]),
     validation.removefile,
     Router.trycatchFunction("post/notify/removefile", function (req, res) {
    return function () {
        NotifyController.removefile(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/notify/removefile", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post(
    '/load_quick_handle',
    MultiTenant.match({ module_key: ['office'] }),
    PermissionProvider.check(['Authorized']),
    validation.load_quick_handle,
    Router.trycatchFunction('post/notify/load_quick_handle', function (req, res) {
        return function () {
            NotifyController.load_quick_handle(req.body).then(
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
                    Router.LogAndMessage(res, 'post/notify/load_quick_handle', err);
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

router.post('/count_quick_handle',MultiTenant.match({module_key:["office"]}), PermissionProvider.check([NOTIFY_RULE.AUTHORIZED]) ,validation.count_quick_handle,Router.trycatchFunction("post/notify/count_quick_handle", function (req, res) {
    return function () {
        NotifyController.count_quick_handle(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/notify/count_quick_handle", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/save_bookmark', MultiTenant.match({ module_key: ["office"] }), PermissionProvider.check([NOTIFY_RULE.AUTHORIZED]), validation.save_bookmark, Router.trycatchFunction("post/notify/save_bookmark", function (req, res) {
    return function () {
        NotifyController.save_bookmark(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/notify/save_bookmark", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/unsave_bookmark', MultiTenant.match({ module_key: ["office"] }), PermissionProvider.check([NOTIFY_RULE.AUTHORIZED]), validation.unsave_bookmark, Router.trycatchFunction("post/notify/unsave_bookmark", function (req, res) {
    return function () {
        NotifyController.unsave_bookmark(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/notify/unsave_bookmark", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

module.exports = router;
