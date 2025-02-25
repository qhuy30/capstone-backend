const express = require('express');
const router = express.Router();
const { FileController } = require('./controller');
const { validation } = require('./validation');
const { PermissionProvider } = require('../../../shared/permission/permission.provider');
const { statusHTTP } = require('../../../utils/setting');
const { Router } = require('../../../shared/router/router.provider');
const { MultiTenant } = require('../../../shared/multi_tenant/provider');

router.post(
    '/load',
    MultiTenant.match({ module_key: ['office'] }),
    PermissionProvider.check(['Office.File.Use']),
    validation.load,
    Router.trycatchFunction('post/office/file/load', function (req, res) {
        return function () {
            FileController.load(req.body).then(
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
                    Router.LogAndMessage(res, 'post/office/file/load', err);
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

router.post(
    '/countSize',
    MultiTenant.match({ module_key: ['office'] }),
    PermissionProvider.check(['Office.File.Use']),
    Router.trycatchFunction('post/office/file/countSize', function (req, res) {
        return function () {
            FileController.countSize(req.body).then(
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
                    Router.LogAndMessage(res, 'post/office/file/countSize', err);
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

router.post(
    '/download',
    MultiTenant.match({ module_key: ['office'] }),
    PermissionProvider.check(['Office.File.Use']),
    Router.trycatchFunction('post/office/file/load', function (req, res) {
        return function () {
            FileController.download(req.body).then(
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
                    Router.LogAndMessage(res, 'post/office/file/load', err);
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

router.post(
    '/insert',
    MultiTenant.match({ module_key: ['office'] }),
    PermissionProvider.check(['Office.File.Use']),
    Router.trycatchFunction('post/office/file/insert', function (req, res) {
        return function () {
            FileController.insert(req.body).then(
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
                    Router.LogAndMessage(res, 'post/office/file/insert', err);
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

router.post(
    '/insert_file',
    MultiTenant.match({ module_key: ['office'] }),
    PermissionProvider.check(['Office.File.Use']),
    Router.trycatchFunction('post/office/file/insert_file', function (req, res) {
        return function () {
            FileController.insert_file(req).then(
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
                    Router.LogAndMessage(res, 'post/office/file/insert_file', err);
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

router.post(
    '/update',
    MultiTenant.match({ module_key: ['office'] }),
    PermissionProvider.check(['Office.File.Use']),
    Router.trycatchFunction('post/office/file/update', function (req, res) {
        return function () {
            FileController.update(req.body).then(
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
                    Router.LogAndMessage(res, 'post/office/file/update', err);
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

router.post(
    '/delete',
    MultiTenant.match({ module_key: ['office'] }),
    PermissionProvider.check(['Office.File.Use']),
    validation.delete,
    Router.trycatchFunction('post/office/file/delete', function (req, res) {
        return function () {
            FileController.delete(req.body).then(
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
                    Router.LogAndMessage(res, 'post/office/file/delete', err);
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

router.post('/load_department', MultiTenant.match({ module_key: ["office"] }), PermissionProvider.check(["Office.File.Use"]), validation.load_department, Router.trycatchFunction("post/office/file/load_department", function (req, res) {
    return function () {
        FileController.load_department(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/file/load_department", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

module.exports = router;
