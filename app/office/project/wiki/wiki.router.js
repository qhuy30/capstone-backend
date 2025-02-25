const express = require('express');
const router = express.Router();
const { WikiController } = require('./wiki.controller');
const { validation } = require('./wiki.validation');
const { PermissionProvider } = require('../../../../shared/permission/permission.provider');
const { statusHTTP } = require('../../../../utils/setting');
const { Router } = require('../../../../shared/router/router.provider');
const {MultiTenant} = require('../../../../shared/multi_tenant/provider');

router.post('/loaddetails',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Authorized"]), validation.loadDetails, Router.trycatchFunction("post/office/project/wiki/loaddetails", function(req, res) {
    return function() {
        WikiController.loadDetails(req.body).then(function(data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function(err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/project/wiki/loaddetails", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/loaddetailsforupdate',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Authorized"]), validation.loadDetailsForUpdate, Router.trycatchFunction("post/office/project/wiki/loaddetailsforupdate", function(req, res) {
    return function() {
        WikiController.loadDetailsForUpdate(req.body).then(function(data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function(err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/project/wiki/loaddetailsforupdate", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/load',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.Task.Use"]), validation.load, Router.trycatchFunction("post/office/project/wiki/load", function(req, res) {
    return function() {
        WikiController.load(req.body).then(function(data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function(err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/project/wiki/load", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/count',MultiTenant.match({module_key:["office"]}), PermissionProvider.check("Office.Task.Use"), validation.count, Router.trycatchFunction("post/office/project/wiki/count", function(req, res) {
    return function() {
        WikiController.count(req.body).then(function(data) {
            res.send({ count: data });
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function(err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/notifytype/count", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/insert',MultiTenant.match({module_key:["office"]}), PermissionProvider.check("Office.Task.Use"), Router.trycatchFunction("post/office/project/wiki/insert", function(req, res) {
    return function() {
        WikiController.insert(req).then(function(data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function(err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/project/wiki/insert", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/loadfileinfo',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.Task.Use"]), validation.loadFileInfo, Router.trycatchFunction("post/office/project/wiki/loadfileinfo", function(req, res) {
    return function() {
        WikiController.loadFileInfo(req.body).then(function(data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function(err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/project/wiki/loadfileinfo", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/like',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.Task.Use"]),validation.like, Router.trycatchFunction("post/office/project/wiki/like", function(req, res) {
    return function() {
        WikiController.like(req.body).then(function(data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function(err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/project/wiki/like", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/unlike',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.Task.Use"]),validation.unlike, Router.trycatchFunction("post/office/project/wiki/unlike", function(req, res) {
    return function() {
        WikiController.unlike(req.body).then(function(data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function(err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/project/wiki/unlike", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/delete',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.Task.Use"]),validation.delete, Router.trycatchFunction("post/office/project/wiki/delete", function(req, res) {
    return function() {
        WikiController.delete(req.body).then(function(data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function(err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/project/wiki/delete", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/update',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.Task.Use"]),validation.update, Router.trycatchFunction("post/office/project/wiki/update", function(req, res) {
    return function() {
        WikiController.update(req.body).then(function(data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function(err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/project/wiki/update", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/removeattachment',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.Task.Use"]),validation.removeAttachment, Router.trycatchFunction("post/office/project/wiki/removeattachment", function(req, res) {
    return function() {
        WikiController.removeAttachment(req.body).then(function(data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function(err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/project/wiki/removeattachment", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/pushattachment/:id',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.Task.Use"]), Router.trycatchFunction("post/office/project/wiki/pushattachment", function(req, res) {
    return function() {
        req.body = req.body ||{};
        req.body.id = req.params.id;
        WikiController.pushAttachment(req).then(function(data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function(err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/project/wiki/pushattachment", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/uploadimage',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.Task.Use"]),Router.trycatchFunction("post/office/project/wiki/uploadimage", function (req, res) {
    return function () {
        WikiController.uploadImage(req).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/project/wiki/uploadimage", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post(
    '/downloadfile',
    MultiTenant.match({ module_key: ['office'] }),
    PermissionProvider.check(['Office.Task.Use']),
    Router.trycatchFunction('post/office/project/wiki/downloadfile', function (req, res) {
        return function () {
            WikiController.download(req.body).then(
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
                    Router.LogAndMessage(res, 'post/office/project/wiki/downloadfile', err);
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

module.exports = router;