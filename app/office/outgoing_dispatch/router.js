const express = require('express');
const router = express.Router();
const { ODBController } = require('./controller');
const { validation } = require('./validation');
const { PermissionProvider } = require('../../../shared/permission/permission.provider');
const { statusHTTP } = require('../../../utils/setting');
const { Router } = require('../../../shared/router/router.provider');
const {MultiTenant} = require('../../../shared/multi_tenant/provider');
const CommonUtils = require("../../../utils/util");
const FromDataMiddleware = require("@shared/middleware/form-data");

const OUTGOING_DISPATCH = require('./const');


router.post(
    "/insert",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Authorized"]),
    // FormDataMiddleware(NAME_LIB, undefined, undefined, PARENT_FOLDER),
    Router.trycatchFunction("post/outgoing_dispatch/insert", function (req, res) {
        return function () {
            // const dbPrefix = CommonUtil.getDbNamePrefix(req);
            // const currentUser = req.body.session;
            ODBController.insert(req).then(
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
                    Router.LogAndMessage(res, "post/outgoing_dispatch/insert", err);
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
    "/insert_waiting_archive",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Authorized"]),
    // FormDataMiddleware(NAME_LIB, undefined, undefined, PARENT_FOLDER),
    Router.trycatchFunction("post/outgoing_dispatch/insert_waiting_archive", function (req, res) {
        return function () {
            // const dbPrefix = CommonUtil.getDbNamePrefix(req);
            // const currentUser = req.body.session;
            ODBController.insert_waiting_archive(req).then(
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
                    Router.LogAndMessage(res, "post/outgoing_dispatch/insert_waiting_archive", err);
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
    "/archive",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Authorized"]),
    // FormDataMiddleware(NAME_LIB, undefined, undefined, PARENT_FOLDER),
    Router.trycatchFunction("post/outgoing_dispatch/archive", function (req, res) {
        return function () {
            // const dbPrefix = CommonUtil.getDbNamePrefix(req);
            // const currentUser = req.body.session;
            ODBController.archive(req).then(
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
                    Router.LogAndMessage(res, "post/outgoing_dispatch/insert", err);
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

router.post('/get_number',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Authorized"]) ,validation.get_number,Router.trycatchFunction("post/outgoing_dispatch/get_number", function (req, res) {
    return function () {
        ODBController.getNumber(req.body).then(function (data) {
            res.send({ number: data });
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/outgoing_dispatch/get_number", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post(
    "/loadDetail",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Office.DispatchArrived.Use"]),
    validation.load_detail,
    Router.trycatchFunction("post/outgoing_dispatch/loadDetail", function (req, res) {
        return function () {
            ODBController.loadDetail(CommonUtils.getDbNamePrefix(req), req.body).then(
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
                    Router.LogAndMessage(res, "post/outgoing_dispatch/loadDetail", err);
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

router.post('/load',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Authorized"]) ,validation.load,Router.trycatchFunction("post/outgoing_dispatch/load", function (req, res) {
    return function () {
        ODBController.load(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/outgoing_dispatch/load", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/loadforarchive',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Authorized"]) ,validation.loadforarchive,Router.trycatchFunction("post/outgoing_dispatch/load", function (req, res) {
    return function () {
        ODBController.loadforarchive(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/outgoing_dispatch/load", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/countforarchive',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Authorized"]) ,validation.countforarchive,Router.trycatchFunction("post/outgoing_dispatch/count", function (req, res) {
    return function () {
        ODBController.countforarchive(req.body).then(function (data) {
            res.send({ count: data });
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/outgoing_dispatch/count", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/count',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Authorized"]) ,validation.count,Router.trycatchFunction("post/outgoing_dispatch/count", function (req, res) {
    return function () {
        ODBController.count(req.body).then(function (data) {
            res.send({ count: data });
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/outgoing_dispatch/count", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post(
    "/loadfileinfo",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Authorized"]),
    validation.loadFileInfo,
    Router.trycatchFunction("post/outgoing_dispatch/loadfileinfo", function (req, res) {
        return function () {
            const dbPrefix = CommonUtils.getDbNamePrefix(req);

            ODBController.loadFileInfo(dbPrefix, req.body.session, req.body.id, req.body.filename).then(
                function (data) {
                    res.send(data);
                    res.end();
                },
                function (err) {
                    res.status(statusHTTP.internalServer);
                    Router.LogAndMessage(res, "post/outgoing_dispatch/loadfileinfo", err);
                    res.end();
                },
            );
        };
    }),
);

router.post(
    '/update',
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Authorized"]),
    Router.trycatchFunction("post/outgoing_dispatch/update", function (req, res) {
        return function () {
            ODBController.update(req).then(
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
                    Router.LogAndMessage(res, "post/outgoing_dispatch/update", err);
                    res.end();
                    err = undefined;
                    res = undefined;
                    req = undefined;
                    return;
                },
            );
        };
    })
);

router.post('/update-references',
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Authorized"]),
    validation.updateReferences,
    Router.trycatchFunction("post/outgoing_dispatch/update-references", function (req, res) {
        return function () {
            ODBController.updateReferences(CommonUtils.getDbNamePrefix(req), req.body).then(function (data) {
                res.send(data);
                res.end();
                data = undefined;
                res = undefined;
                req = undefined;
                return;
            }).catch(err => {
                res.status(statusHTTP.internalServer);
                Router.LogAndMessage(res, "post/outgoing_dispatch/update-references", err);
                res.end();
                err = undefined;
                res = undefined;
                req = undefined;
                return;
            });
        }
    })
);


router.post('/release',
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Authorized"]),
    validation.release,
    Router.trycatchFunction("post/outgoing_dispatch/release", function (req, res) {
        return function () {
            ODBController.release(CommonUtils.getDbNamePrefix(req), req.body).then(function (data) {
                res.send(data);
                res.end();
                data = undefined;
                res = undefined;
                req = undefined;
                return;
            }).catch(err => {
                res.status(statusHTTP.internalServer);
                Router.LogAndMessage(res, "post/outgoing_dispatch/release", err);
                res.end();
                err = undefined;
                res = undefined;
                req = undefined;
                return;
            });
        }
    })
);

router.post('/loadArchivedDocument',
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Authorized"]),
    validation.load_by_code,
    Router.trycatchFunction("post/outgoing_dispatch/loadArchivedDocument", function (req, res) {
        return function () {
            ODBController.loadArchivedDocument(CommonUtils.getDbNamePrefix(req), req.body).then(function (data) {
                res.send(data);
                res.end();
                data = undefined;
                res = undefined;
                req = undefined;
                return;
            }).catch(err => {
                res.status(statusHTTP.internalServer);
                Router.LogAndMessage(res, "post/outgoing_dispatch/loadArchivedDocument", err);
                res.end();
                err = undefined;
                res = undefined;
                req = undefined;
                return;
            });
        }
    })
);

router.post('/insertSepatate',
    MultiTenant.match({ module_key: ['office'] }),
    PermissionProvider.check(['Authorized']),
    // FromDataMiddleware(OUTGOING_DISPATCH.NAME_LIB, undefined, undefined, OUTGOING_DISPATCH.PARENT_FOLDER),
    Router.trycatchFunction("post/outgoing_dispatch/insertSepatate", function (req, res) {
        return function () {
            ODBController.insertSeparatelyOutgoingDispatch(req).then(
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
                    Router.LogAndMessage(res, "post/outgoing_dispatch/insertSepatate", err);
                    res.end();
                    err = undefined;
                    res = undefined;
                    req = undefined;
                    return;
                }
            );
        }
    })
);

router.post('/delete',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.DispatchOutgoing.Use"]),validation.delete,Router.trycatchFunction("post/outgoing_dispatch/delete", function (req, res) {
    return function () {
        ODBController.delete(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/outgoing_dispatch/delete", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

module.exports = router;
