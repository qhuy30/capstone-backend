const express = require("express");

const validation = require("./validation");
const { LabelController } = require("./controller");

const { Router } = require("../../../shared/router/router.provider");
const { MultiTenant } = require("../../../shared/multi_tenant/provider");
const { PermissionProvider } = require("../../../shared/permission/permission.provider");
const { statusHTTP } = require("../../../utils/setting");

const router = express.Router();

router.post(
    "/load",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Office.Task.Use"]),
    validation.load,
    Router.trycatchFunction("post/office/label/load", function (request, response) {
        return function () {
            const dbPrefix = request.body._service[0].dbname_prefix;
            const currentUser = request.body.session;

            LabelController.load(dbPrefix, currentUser, request.body)
                .then(function (data) {
                    response.send(data);
                })
                .catch(function (error) {
                    response.status(statusHTTP.internalServer);
                    Router.LogAndMessage(response, "post/office/label/load", error);
                })
                .finally(function () {
                    response.end();
                    response = undefined;
                    request = undefined;
                });
        };
    })
);

router.post(
    "/load-multiple",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Office.Task.Use"]),
    validation.loadMultiple,
    Router.trycatchFunction("post/office/label/load-multiple", function (request, response) {
        return function () {
            const dbPrefix = request.body._service[0].dbname_prefix;
            const currentUser = request.session;
            if(request.body.ids && request.body.ids.length>0){
                LabelController.loadMultiple(dbPrefix, currentUser, request.body)
                .then(function (data) {
                    response.send(data);
                })
                .catch(function (error) {
                    response.status(statusHTTP.internalServer);
                    Router.LogAndMessage(response, "post/office/label/load-multiple", error);
                })
                .finally(function () {
                    response.end();
                    response = undefined;
                    request = undefined;
                });
            }else{
                response.send([]);
                response.end();
            }

        };
    })
);

router.post(
    "/load-detail",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Office.Task.Use"]),
    validation.loadDetail,
    Router.trycatchFunction("post/office/label/load-detail", function (request, response) {
        return function () {
            const dbPrefix = request.body._service[0].dbname_prefix;
            const currentUser = request.session;

            LabelController.loadDetail(dbPrefix, currentUser, request.body)
                .then(function (data) {
                    response.send(data);
                })
                .catch(function (error) {
                    response.status(statusHTTP.internalServer);
                    Router.LogAndMessage(response, "post/office/label/load-detail", error);
                })
                .finally(function () {
                    response.end();
                    response = undefined;
                    request = undefined;
                });
        };
    })
);

router.post(
    "/insert",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Office.Task.Use"]),
    validation.insert,
    Router.trycatchFunction("post/office/label/insert", function (request, response) {
        return function () {
            const dbPrefix = request.body._service[0].dbname_prefix;
            const currentUser = request.body.session;
            LabelController.insert(dbPrefix, currentUser, request.body)
                .then(function (data) {
                    response.send(data);
                    data = undefined;
                })
                .catch(function (error) {
                    response.status(statusHTTP.internalServer);
                    Router.LogAndMessage(response, "post/office/label/insert", error);
                })
                .finally(function () {
                    response.end();
                    response = undefined;
                    request = undefined;
                });
        };
    })
);

router.post(
    "/update",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Office.Task.Use"]),
    validation.update,
    Router.trycatchFunction("post/office/label/update", function (request, response) {
        return function () {
            const dbPrefix = request.body._service[0].dbname_prefix;
            const currentUser = request.body.session;
            LabelController.update(dbPrefix, currentUser, request.body)
                .then(function (data) {
                    response.send(data);
                    data = undefined;
                })
                .catch(function (error) {
                    response.status(statusHTTP.internalServer);
                    Router.LogAndMessage(response, "post/office/label/update", error);
                })
                .finally(function () {
                    response.end();
                    response = undefined;
                    request = undefined;
                });
        };
    })
);

module.exports = router;
