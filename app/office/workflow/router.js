const express = require('express');

const {validation} = require('./validation');
const { WorkflowController } = require('./controller');
const { PermissionProvider } = require('../../../shared/permission/permission.provider');
const { statusHTTP } = require('../../../utils/setting');
const { Router } = require('../../../shared/router/router.provider');
const {MultiTenant} = require('../../../shared/multi_tenant/provider');
const { FileProvider } = require('../../../shared/file/file.provider');

const router = express.Router();

router.post('/loaddetails',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Authorized"]),validation.load_details, Router.trycatchFunction("post/workflow/loaddetails", function (req, res) {
    return function () {
        WorkflowController.load_details(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/workflow/loaddetails", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/load',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Authorized"]),validation.load, Router.trycatchFunction("post/workflow/load", function (req, res) {
    return function () {
        WorkflowController.load(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/workflow/load", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post(
    "/load_follow_department",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Authorized"]),
    validation.load_follow_department,
    Router.trycatchFunction("post/workflow/load_follow_department", function (req, res) {
        return function () {
            WorkflowController.load_follow_department(req.body).then(
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
                    Router.LogAndMessage(res, "post/workflow/load_follow_department", err);
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
    '/insert',
    MultiTenant.match({ module_key: ['office'] }),
    PermissionProvider.check(['Management.DesignWorkflow.Use']),
    Router.trycatchFunction('post/workflow/insert', function (req, res) {
        return function () {
            WorkflowController.insert(req).then(
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
                    if (err.errorCode && err.errorCode === 'VALIDATION_ERROR') {
                        res.status(422);
                    }
                    Router.LogAndMessage(res, 'post/workflow/insert', err);
                    res.end();
                    err = undefined;
                    res = undefined;
                    req = undefined;
                    return;
                }
            );
        };
    })
);

router.post('/loadfiletemplateinfo',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Authorized"]), validation.loadFileTemplateInfo, Router.trycatchFunction("post/workflow/loadfiletemplateinfo", function(req, res) {
    return function() {
        WorkflowController.loadfiletemplateinfo(req.body).then(function(data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function(err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/workflow_play/loadfiletemplateinfo", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/downloadfile',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Authorized"]), validation.downloadfile, Router.trycatchFunction("post/workflow/downloadfile", function(req, res) {
    return function() {
        WorkflowController.downloadfile(req.body).then(function(data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function(err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/workflow_play/downloadfile", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post(
    '/update',
    MultiTenant.match({ module_key: ['office'] }),
    PermissionProvider.check(['Management.DesignWorkflow.Use']),
    Router.trycatchFunction('post/workflow/update', function(req, res) {
        return function() {
            WorkflowController.update(req).then(
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
                    if (err.errorCode && err.errorCode === 'VALIDATION_ERROR') {
                        res.status(422);
                    }
                    Router.LogAndMessage(res, 'post/workflow/update', err);
                    res.end();
                    err = undefined;
                    res = undefined;
                    req = undefined;
                    return;
                }
            );
        };
    })
);

router.post('/delete',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Management.DesignWorkflow.Use"]),validation.delete, Router.trycatchFunction("post/workflow/delete", function (req, res) {
    return function () {
        WorkflowController.delete(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/workflow/delete", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post(
    '/template-parser',
    MultiTenant.match({ module_key: ['office'] }),
    PermissionProvider.check(['Management.DesignWorkflow.Use', 'Office.Signing.Use']),
    Router.trycatchFunction(
        'post/workflow/template-parser',
        function (req, res) {
            return function () {
                WorkflowController.templateParser(req)
                    .then(function (data) {
                        res.send(data);
                        data = undefined;
                        req = undefined;
                        res = undefined;
                    })
                    .catch(function (error) {
                        res.status(statusHTTP.internalServer);
                        Router.LogAndMessage(
                            res,
                            'post/workflow/template-parser',
                            error
                        );
                        error = undefined;
                    })
                    .finally(function () {
                        req = undefined;
                        res = undefined;
                    });
            };
        }
    )
);

router.post(
    '/custom-template-preview',
    MultiTenant.match({ module_key: ['office'] }),
    PermissionProvider.check(['Office.Signing.Use']),
    validation.customTemplatePreview,
    Router.trycatchFunction(
        'post/office/workflow_play/custom-template-preview',
        function (request, response) {
            return function () {
                WorkflowController.processPreviewTemplate(request.body)
                    .then(function (data) {
                        response.send(data);
                        data = undefined;
                        request = undefined;
                        response = undefined;
                    })
                    .catch(function (error) {
                        response.status(statusHTTP.internalServer);
                        Router.LogAndMessage(
                            response,
                            'post/office/workflow_play/custom-template-preview',
                            error,
                        );
                        error = undefined;
                    })
                    .finally(function () {
                        request = undefined;
                        response = undefined;
                    });
            };
        },
    ),
);

module.exports = router;
