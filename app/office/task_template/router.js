const express = require("express");
const router = express.Router();

const { Router } = require("../../../shared/router/router.provider");
const { MultiTenant } = require("../../../shared/multi_tenant/provider");
const {
    PermissionProvider,
} = require("../../../shared/permission/permission.provider");

const CommonUtils = require("../../../utils/util");

const { validation } = require("./validation");
const { TaskTemplateController } = require("./controller");

router.post(
    "/load",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Office.TaskTemplate.Use"]),
    validation.load,
    Router.trycatchFunction("get/office/task_template/load", function (request, response) {
        return function () {
            TaskTemplateController.load(CommonUtils.getDbNamePrefix(request), request.body.session, request.body)
                .then(function (data) {
                    response.send(data);
                    response.end();
                    data = undefined;
                    response = undefined;
                    request = undefined;
                    return;
                })
                .catch(function (err) {
                    response.status(statusHTTP.internalServer);
                    Router.LogAndMessage(response, "get/office/task_template/load", err);
                    response.end();
                    err = undefined;
                    response = undefined;
                    request = undefined;
                    return;
                });
        };
    })
);

router.post(
    "/count",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Office.TaskTemplate.Use"]),
    validation.count,
    Router.trycatchFunction("get/office/task_template/count", function (request, response) {
        return function () {
            TaskTemplateController.count(CommonUtils.getDbNamePrefix(request), request.body.session, request.body)
                .then(function (data) {
                    response.send(data);
                    response.end();
                    data = undefined;
                    response = undefined;
                    request = undefined;
                    return;
                })
                .catch(function (err) {
                    response.status(statusHTTP.internalServer);
                    Router.LogAndMessage(response, "get/office/task_template/count", err);
                    response.end();
                    err = undefined;
                    response = undefined;
                    request = undefined;
                    return;
                });
        };
    })
);

router.post(
    "/load-detail",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Office.TaskTemplate.Use"]),
    validation.loadDetail,
    Router.trycatchFunction("post/office/task_template/load-detail", function (request, response) {
        return function () {
            TaskTemplateController.loadDetail(CommonUtils.getDbNamePrefix(request), request.body.session, request.body)
                .then(function (data) {
                    response.send(data);
                    response.end();
                    data = undefined;
                    response = undefined;
                    request = undefined;
                    return;
                })
                .catch(function (err) {
                    response.status(statusHTTP.internalServer);
                    Router.LogAndMessage(response, "post/office/task_template/load-detail", err);
                    response.end();
                    err = undefined;
                    response = undefined;
                    request = undefined;
                    return;
                });
        };
    })
);

router.post(
    "/insert",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Office.TaskTemplate.Use"]),
    validation.insert,
    Router.trycatchFunction(
        "post/office/task_template/insert",
        function (request, response) {
            return function () {
                TaskTemplateController.insert(
                    CommonUtils.getDbNamePrefix(request),
                    request.body.session,
                    request.body
                ).then(
                    function (data) {
                        response.send(true);
                        response.end();
                        data = undefined;
                        response = undefined;
                        request = undefined;
                        return;
                    }
                ).catch(err=> {
                    response.status(statusHTTP.internalServer);
                    Router.LogAndMessage(
                        response,
                        "post/office/task_template/insert",
                        err
                    );
                    response.end();
                    err = undefined;
                    response = undefined;
                    request = undefined;
                    return;
                });
            };
        }
    )
);

router.post(
    "/update",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Office.TaskTemplate.Use"]),
    validation.update,
    Router.trycatchFunction(
        "post/office/task_template/update",
        function (request, response) {
            return function () {
                TaskTemplateController.update(
                    CommonUtils.getDbNamePrefix(request),
                    request.body.session,
                    request.body
                ).then(
                    function (data) {
                        response.send(data);
                        response.end();
                        data = undefined;
                        response = undefined;
                        request = undefined;
                        return;
                    }
                ).catch(err=> {
                    response.status(statusHTTP.internalServer);
                    Router.LogAndMessage(
                        response,
                        "post/office/task_template/update",
                        err
                    );
                    response.end();
                    err = undefined;
                    response = undefined;
                    request = undefined;
                    return;
                });
            };
        }
    )
);

router.post(
    '/update-job-status',
    MultiTenant.match({ module_key: ['office'] }),
    PermissionProvider.check(['Office.TaskTemplate.Use']),
    validation.updateJobStatus,
    Router.trycatchFunction('post/office/task_template/update-job-status', function (request, response) {
        return function () {
            TaskTemplateController.updateJobStatus(
                CommonUtils.getDbNamePrefix(request),
                request.body.session,
                request.body
            )
                .then(function (data) {
                    response.send(data);
                    response.end();
                    data = undefined;
                    response = undefined;
                    request = undefined;
                    return;
                })
                .catch(function (err) {
                    response.status(statusHTTP.internalServer);
                    Router.LogAndMessage(response, "post/office/task_template/update-job-status", err);
                    response.end();
                    err = undefined;
                    response = undefined;
                    request = undefined;
                    return;
                });
        };
    })
)

module.exports = router;
