const express = require("express");
const router = express.Router();

const { statusHTTP } = require("../../../utils/setting");
const { Router: RouterProvider } = require("../../../shared/router/router.provider");
const { MultiTenant } = require("../../../shared/multi_tenant/provider");
const { PermissionProvider } = require("../../../shared/permission/permission.provider");

const CommonUtils = require("../../../utils/util");

const ValidationProvider = require("./validation");
const { BriefCaseController } = require("./controller");

router.post(
    "/search-reference",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Authorized"]),
    ValidationProvider.searchReference,
    RouterProvider.trycatchFunction("post/briefcase/search-reference", function (request, response) {
        return function () {
            const currentUser = request.body.session;
            const dbname_prefix = CommonUtils.getDbNamePrefix(request);
            BriefCaseController.searchReferences(dbname_prefix, currentUser, request.body)
                .then((data) => {
                    response.send(data);
                })
                .catch((error) => {
                    RouterProvider.LogAndMessage(response, "post/briefcase/search-reference", error);
                })
                .finally(() => {
                    response.end();
                });
        };
    }),
);

router.post(
    "/load",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Authorized"]),
    ValidationProvider.loadAll,
    RouterProvider.trycatchFunction("post/briefcase/load", function (request, response) {
        return function () {
            const currentUser = request.body.session;
            const dbname_prefix = CommonUtils.getDbNamePrefix(request);
            BriefCaseController.loadAll(dbname_prefix, currentUser, request.body)
                .then((data) => {
                    response.send(data);
                })
                .catch((error) => {
                    RouterProvider.LogAndMessage(response, "post/briefcase/load", error);
                })
                .finally(() => {
                    response.end();
                });
        };
    }),
);

router.post(
    "/loadforarchive",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Authorized"]),
    ValidationProvider.loadforarchive,
    RouterProvider.trycatchFunction("post/briefcase/load", function (request, response) {
        return function () {
            BriefCaseController.loadforarchive(request.body)
                .then((data) => {
                    response.send(data);
                })
                .catch((error) => {
                    RouterProvider.LogAndMessage(response, "post/briefcase/load", error);
                })
                .finally(() => {
                    response.end();
                });
        };
    }),
);

router.post(
    "/countforarchive",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Authorized"]),
    ValidationProvider.countforarchive,
    RouterProvider.trycatchFunction("post/briefcase/load", function (request, response) {
        return function () {
            BriefCaseController.countforarchive(request.body)
                .then((data) => {
                    response.send(data);
                })
                .catch((error) => {
                    RouterProvider.LogAndMessage(response, "post/briefcase/load", error);
                })
                .finally(() => {
                    response.end();
                });
        };
    }),
);

router.post(
    "/load-detail",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Authorized"]),
    ValidationProvider.loadDetail,
    RouterProvider.trycatchFunction("post/briefcase/load-detail", function (request, response) {
        return function () {
            const currentUser = request.body.session;
            const dbname_prefix = CommonUtils.getDbNamePrefix(request);
            BriefCaseController.loadDetail(dbname_prefix, currentUser, request.body)
                .then((data) => {
                    response.send(data);
                })
                .catch((error) => {
                    RouterProvider.LogAndMessage(response, "post/briefcase/load-detail", error);
                })
                .finally(() => {
                    response.end();
                });
        };
    }),
);

router.post(
    "/insert",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Authorized"]),
    ValidationProvider.insert,
    RouterProvider.trycatchFunction("post/briefcase/insert", function (req, res) {
        return function () {
            const dbname_prefix = CommonUtils.getDbNamePrefix(req);
            const currentUser = req.body.session;

            BriefCaseController.insert(dbname_prefix, currentUser, req.body).then(
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
                    RouterProvider.LogAndMessage(res, "post/briefcase/insert", err);
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

router.get(
    "/prepareData",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Authorized"]),
    RouterProvider.trycatchFunction("get/briefcase/prepareData", function (request, response) {
        return function () {
            const currentUser = request.body.session;
            const dbname_prefix = CommonUtils.getDbNamePrefix(request);
            BriefCaseController.prepareData(dbname_prefix, currentUser, request.body)
                .then((data) => {
                    response.send(data);
                })
                .catch((error) => {
                    RouterProvider.LogAndMessage(response, "get/briefcase/prepareData", error);
                })
                .finally(() => {
                    response.end();
                });
        };
    }),
);

router.post('/load_file_info_waiting_archive',MultiTenant.match({module_key:["office"]}), PermissionProvider.check("Authorized"), ValidationProvider.load_file_info_waiting_archive, RouterProvider.trycatchFunction("post/car_management/load_file_info", function(req, res) {
    return function() {
        BriefCaseController.load_file_info_waiting_archive(req.body).then(function(data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function(err) {
            res.status(statusHTTP.internalServer);
            RouterProvider.LogAndMessage(res, "post/car_management/load_file_info", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/load_file_info',MultiTenant.match({module_key:["office"]}), PermissionProvider.check("Authorized"), ValidationProvider.load_file_info, RouterProvider.trycatchFunction("post/car_management/load_file_info", function(req, res) {
    return function() {
        BriefCaseController.load_file_info(req.body).then(function(data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function(err) {
            res.status(statusHTTP.internalServer);
            RouterProvider.LogAndMessage(res, "post/car_management/load_file_info", err);
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
    PermissionProvider.check(["Authorized"]),
    ValidationProvider.update,
    RouterProvider.trycatchFunction("post/briefcase/update", function (req, res) {
        return function () {
            const dbname_prefix = CommonUtils.getDbNamePrefix(req);
            const currentUser = req.body.session;

            BriefCaseController.update(dbname_prefix, currentUser, req.body).then(
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
                    RouterProvider.LogAndMessage(res, "post/briefcase/update", err);
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
    "/update-references",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Authorized"]),
    // ValidationProvider.updateReferences,
    RouterProvider.trycatchFunction("post/briefcase/update-references", function (req, res) {
        return function () {
            const dbname_prefix = CommonUtils.getDbNamePrefix(req);
            const currentUser = req.body.session;

            BriefCaseController.updateReferences(dbname_prefix, currentUser, req.body).then(
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
                    RouterProvider.LogAndMessage(res, "post/briefcase/update-references", err);
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
    "/cancel",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Authorized"]),
    ValidationProvider.cancel,
    RouterProvider.trycatchFunction("post/briefcase/cancel", function (request, response) {
        return function () {
            const currentUser = request.body.session;
            const dbname_prefix = CommonUtils.getDbNamePrefix(request);
            BriefCaseController.cancel(dbname_prefix, currentUser, request.body)
                .then((data) => {
                    response.send(data);
                })
                .catch((error) => {
                    RouterProvider.LogAndMessage(response, "post/briefcase/cancel", error);
                })
                .finally(() => {
                    response.end();
                });
        };
    }),
);

module.exports = router;
