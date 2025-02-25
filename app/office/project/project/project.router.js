const express = require('express');
const router = express.Router();
const { ProjectController } = require('./project.controller');
const { validation } = require('./project.validation');
const { PermissionProvider } = require('../../../../shared/permission/permission.provider');
const { statusHTTP } = require('../../../../utils/setting');
const { Router } = require('../../../../shared/router/router.provider');
const {MultiTenant} = require('../../../../shared/multi_tenant/provider');

router.post('/load',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.Task.Use"]), validation.load, Router.trycatchFunction("post/office/project/project/load", function(req, res) {
    return function() {
        const skipReference = req.query.skipReference === 'true';
        ProjectController.load(req.body, skipReference).then(
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
                Router.LogAndMessage(res, 'post/office/project/project/load', err);
                res.end();
                err = undefined;
                res = undefined;
                req = undefined;
                return;
            },
        );
    }
}));

router.post(
    '/load_by_department',
    MultiTenant.match({ module_key: ['office'] }),
    PermissionProvider.check(['Office.Task.Use']),
    validation.load_by_department,
    Router.trycatchFunction(
        'post/office/project/project/load_by_department',
        function(req, res) {
            return function() {
                ProjectController.loadByDepartment(req.body)
                    .then(
                        function(data) {
                            res.send(data);
                            res.end();
                            data = undefined;
                        },
                        function(err) {
                            res.status(statusHTTP.internalServer);
                            Router.LogAndMessage(res, 'post/office/project/project/load_by_department', err);
                            res.end();
                            err = undefined;
                        },
                    )
                    .finally(function() {
                        res = undefined;
                        req = undefined;
                    });
            };
        },
    ),
);

router.post(
    '/load_joined',
    MultiTenant.match({ module_key: ['office'] }),
    PermissionProvider.check(['Office.Task.Use']),
    validation.load_joined_projects,
    Router.trycatchFunction(
        'post/office/project/project/load_joined',
        function(req, res) {
            return function() {
                ProjectController.loadJoinedProjects(req.body)
                    .then(
                        function(data) {
                            res.send(data);
                            res.end();
                            data = undefined;
                        },
                        function(err) {
                            res.status(statusHTTP.internalServer);
                            Router.LogAndMessage(res, 'post/office/project/project/load_joined', err);
                            res.end();
                            err = undefined;
                        },
                    )
                    .finally(function() {
                        res = undefined;
                        req = undefined;
                    });
            };
        },
    ),
)

router.post('/load_details_m',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.Task.Use"]), validation.load_details_m, Router.trycatchFunction("post/office/project/project/load_details_m", function(req, res) {
    return function() {
        ProjectController.loadDetails_multi(req.body).then(function(data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function(err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/project/project/load_details_m", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/count',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.Task.Use"]), validation.count, Router.trycatchFunction("post/office/project/project/count", function(req, res) {
    return function() {
        ProjectController.count(req.body).then(function(data) {
            res.send({ count: data });
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function(err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/project/project/count", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/checkexist',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.Task.Use"]), validation.checkexist, Router.trycatchFunction("post/office/project/project/checkexist", function(req, res) {
    return function() {
        ProjectController.checkExist(req.body).then(function(data) {
            res.send({ status: data });
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function(err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/project/project/checkexist", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post(
    '/insert',
    MultiTenant.match({ module_key: ['office'] }),
    PermissionProvider.check(['Office.Task.Use']),
    validation.insert,
    Router.trycatchFunction('post/office/project/project/insert', function (req, res) {
        return function () {
            ProjectController.insert(req.body).then(
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
                    Router.LogAndMessage(res, 'post/office/project/project/insert', err);
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

router.post('/update_participant',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.Task.Use"]), validation.updateParticipant, Router.trycatchFunction("post/office/project/project/push_participant", function(req, res) {
    return function() {
        ProjectController.updateParticipant(req.body).then(function(data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function(err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/project/project/push_participant", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/delete',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.Task.Use"]), validation.delete, Router.trycatchFunction("post/office/project/project/delete", function(req, res) {
    return function() {
        ProjectController.delete(req.body).then(function(data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function(err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/project/project/delete", err);
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
    PermissionProvider.check(['Office.Task.Use']),
    validation.update,
    Router.trycatchFunction('post/office/project/project/update', function (req, res) {
        return function () {
            ProjectController.update(req.body).then(
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
                    Router.LogAndMessage(res, 'post/office/project/project/update', err);
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

router.post('/start',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.Task.Use"]), validation.start, Router.trycatchFunction("post/office/project/project/start", function(req, res) {
    return function() {
        ProjectController.start(req.body).then(function(data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function(err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/project/project/start", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/close',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.Task.Use"]), validation.close, Router.trycatchFunction("post/office/project/project/close", function(req, res) {
    return function() {
        ProjectController.close(req.body).then(function(data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function(err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/project/project/close", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/statistic_count',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.Task.Use"]) ,validation.statistic_count,Router.trycatchFunction("post/office/task/statistic_count", function (req, res) {
    return function () {
        ProjectController.statistic_count(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/task/statistic_count", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/statistic_growth',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.Task.Use"]) ,validation.statistic_growth,Router.trycatchFunction("post/office/task/statistic_growth", function (req, res) {
    return function () {
        ProjectController.statistic_growth(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/task/statistic_growth", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

module.exports = router;
