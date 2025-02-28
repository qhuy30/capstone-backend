const express = require('express');
const router = express.Router();
const { SupportController } = require('./controller');
const { PermissionProvider } = require('@shared/permission/permission.provider');
const { statusHTTP } = require('@utils/setting');
const { Router } = require('@shared/router/router.provider');
const { MultiTenant } = require('@shared/multi_tenant/provider');

router.post('/faqs',
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Authorized"]),
    Router.trycatchFunction("post/office/support/faqs",
        function (req, res) {
            return function () {
                SupportController.load_FAQs().then(function (data) {
                    res.send(data);
                    res.end();
                    data = undefined;
                    res = undefined;
                    req = undefined;
                    return;
                }, function (err) {
                    res.status(statusHTTP.internalServer);
                    Router.LogAndMessage(res, "post/office/support/faqs", err);
                    res.end();
                    err = undefined;
                    res = undefined;
                    req = undefined;
                    return;
                });
            }
        }
    )
);

router.post('/user_manuals',
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Authorized"]),
    Router.trycatchFunction("post/office/support/user_manuals",
        function (req, res) {
            return function () {
                SupportController.load_user_manuals().then(function (data) {
                    res.send(data);
                    res.end();
                    data = undefined;
                    res = undefined;
                    req = undefined;
                    return;
                }, function (err) {
                    res.status(statusHTTP.internalServer);
                    Router.LogAndMessage(res, "post/office/support/user_manuals", err);
                    res.end();
                    err = undefined;
                    res = undefined;
                    req = undefined;
                    return;
                });
            }
        }
    )
);

router.post('/load_file_info',
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Authorized"]),
    Router.trycatchFunction("post/support/load_file_info",
        function (req, res) {
            return function () {
                SupportController.load_file_info(req.body).then(function (data) {
                    res.send(data);
                    res.end();
                    data = undefined;
                    res = undefined;
                    req = undefined;
                    return;
                }, function (err) {
                    res.status(statusHTTP.internalServer);
                    Router.LogAndMessage(res, "post/support/load_file_info", err);
                    res.end();
                    err = undefined;
                    res = undefined;
                    req = undefined;
                    return;
                });
            }
        }
    )
);

router.post('/downloadfile',
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Authorized"]),
    Router.trycatchFunction("post/support/downloadfile",
        function (req, res) {
            return function () {
                SupportController.downloadfile(req.body).then(function (data) {
                    res.type('application/octet-stream').send(data);
                    data = undefined;
                    res = undefined;
                    req = undefined;
                    return;
                }, function (err) {
                    res.status(statusHTTP.internalServer);
                    Router.LogAndMessage(res, "post/support/downloadfile", err);
                    res.end();
                    err = undefined;
                    res = undefined;
                    req = undefined;
                    return;
                });
            }
        }
    )
);

module.exports = router;