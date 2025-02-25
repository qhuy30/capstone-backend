const express = require('express');
const router = express.Router();
const { UserController } = require('./user.controller');
const { validation } = require('./user.validation');
const { SessionProvider } = require('../../../shared/redis/session.provider');
const { PermissionProvider } = require('../../../shared/permission/permission.provider');
const { statusHTTP } = require('../../../utils/setting');
const {Router} = require('../../../shared/router/router.provider');
const {MultiTenant} = require('../../../shared/multi_tenant/provider');

router.post('/login',MultiTenant.match(), validation.login, Router.trycatchFunction("post/management/user/login", function (req, res) {
    return function () {
        UserController.login(req.body).then(function (data) {
            res.send(data);
            res.header({ 'access_token': data.jwtToken });
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.authorized);
            Router.LogAndMessage(res,"post/management/user/login",err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/auth',MultiTenant.match(), SessionProvider.match, Router.trycatchFunction("post/management/user/auth", function (req, res) {
    return function () {
       
        res.send({ username: req.body.username, data: req.body.session });
        res.end();
        res = undefined;
        req = undefined;
    }
}));

router.post('/refreshToken', MultiTenant.match(), validation.refreshToken, Router.trycatchFunction("post/management/user/refreshToken", function (req, res) {
    return function () {
        UserController.refreshToken(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.authorized);
            Router.LogAndMessage(res,"post/management/user/refreshToken",err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/changepassword',MultiTenant.match(), SessionProvider.match, validation.changePassword, Router.trycatchFunction("post/management/user/changepassword", function (req, res) {
    return function () {
        UserController.changePassword(req.body).then(function (data) {
            res.send({ status: data });
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res,"post/management/user/changepassword",err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/changelanguage',MultiTenant.match(), SessionProvider.match, validation.changeLanguage, Router.trycatchFunction("post/management/user/changelanguage", function (req, res) {
    return function () {
        UserController.changeLanguage(req.body).then(function (data) {
            res.send({ status: data });
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res,"post/management/user/changelanguage",err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));
router.post('/loaddetails',MultiTenant.match(), PermissionProvider.check(["Management.User.Use"]), validation.loadDetails, Router.trycatchFunction("post/management/user/loaddetails", function (req, res) {
    return function () {
        UserController.loadDetails(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res,"post/management/user/loaddetails",err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/loadfordirective',MultiTenant.match(), PermissionProvider.check(["Authorized"]),validation.loadForDirective, Router.trycatchFunction("post/management/user/loadfordirective", function (req, res) {
    return function () {
        UserController.loadForDirective(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res,"post/management/user/loadfordirective",err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/loadmanyfordirective',MultiTenant.match(), PermissionProvider.check(["Authorized"]),validation.loadManyForDirective, Router.trycatchFunction("post/management/user/loadfordirective", function (req, res) {
    return function () {
        UserController.loadmanyfordirective(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res,"post/management/user/loadmanyfordirective",err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/load_for_add_friend',MultiTenant.match(), PermissionProvider.check(["Basic.Use"]), validation.load_for_add_friend, Router.trycatchFunction("post/management/user/load_for_add_friend", function (req, res) {
    return function () {
        UserController.loadUserForAddFriend(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res,"post/management/user/load_for_add_friend",err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/load',MultiTenant.match(), PermissionProvider.check(["Management.User.Use"]), validation.load, Router.trycatchFunction("post/management/user/load", function (req, res) {
    return function () {
        UserController.load(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res,"post/management/user/load",err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/load_host_meeting_room',MultiTenant.match(), validation.load, Router.trycatchFunction("post/management/user/load_host_meeting_room", function (req, res) {
    return function () {
        UserController.load_host_meeting_room(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res,"post/management/user/load_host_meeting_room",err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/count',MultiTenant.match(), PermissionProvider.check(["Management.User.Use"]), validation.count, Router.trycatchFunction("post/management/user/count", function (req, res) {
    return function () {
        UserController.count(req.body).then(function (data) {
            res.send({ count: data });
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res,"post/management/user/count",err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/load_for_pick_user_directive',MultiTenant.match(), PermissionProvider.check(["Authorized"]), validation.load_for_pick_user_directive, Router.trycatchFunction("post/management/user/load_for_pick_user_directive", function (req, res) {
    return function () {
        UserController.load_for_pick_user_directive(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res,"post/management/user/load_for_pick_user_directive",err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/load_by_rule', MultiTenant.match(), PermissionProvider.check(["Authorized"]), validation.load_by_rule, Router.trycatchFunction("post/management/user/load_by_rule", function (req, res) {
    return function () {
        UserController.load_by_rule(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res,"post/management/user/load_by_rule",err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/count_by_rule', MultiTenant.match(), PermissionProvider.check(["Authorized"]), validation.count_by_rule, Router.trycatchFunction("post/management/user/count_by_rule", function (req, res) {
    return function () {
        UserController.count_by_rule(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res,"post/management/user/count_by_rule",err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/count_for_pick_user_directive',MultiTenant.match(), PermissionProvider.check(["Authorized"]), validation.count_for_pick_user_directive, Router.trycatchFunction("post/management/user/count_for_pick_user_directive", function (req, res) {
    return function () {
        UserController.count_for_pick_user_directive(req.body).then(function (data) {
            res.send({ count: data });
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res,"post/management/user/count_for_pick_user_directive",err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/register',MultiTenant.match(), PermissionProvider.check(["Management.User.Use"]), validation.register, Router.trycatchFunction("post/management/user/register", function (req, res) {
    return function () {
        UserController.insert(req.body).then(function (data) {
            res.send({ status: data });
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res,"post/management/user/register",err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/checkexist',MultiTenant.match(), PermissionProvider.check(["Management.User.Use"]), validation.checkexist, Router.trycatchFunction("post/management/user/checkexist", function (req, res) {
    return function () {
        UserController.checkExist(req.body).then(function (data) {
            res.send({ status: data });
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res,"post/management/user/checkexist",err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/update',MultiTenant.match(), PermissionProvider.check(["Management.User.Use"]), validation.update, Router.trycatchFunction("post/management/user/update", function (req, res) {
    return function () {
        UserController.update(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res,"post/management/user/update",err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/pushrule',MultiTenant.match(), PermissionProvider.check(["Management.User.AssignPermission"]), validation.pushRule, Router.trycatchFunction("post/management/user/pushrule", function (req, res) {
    return function () {
        UserController.pushRule(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res,"post/management/user/pushrule",err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/removerule',MultiTenant.match(), PermissionProvider.check(["Management.User.AssignPermission"]), validation.removeRule, Router.trycatchFunction("post/management/user/removerule", function (req, res) {
    return function () {
        UserController.removeRule(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res,"post/management/user/removerule",err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));


router.post('/delete',MultiTenant.match(), PermissionProvider.check(["Management.User.DeleteUser"]), validation.delete, Router.trycatchFunction("post/management/user/delete", function (req, res) {
    return function () {
        UserController.delete(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res,"post/management/user/delete",err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/updateavatar',MultiTenant.match(), PermissionProvider.check(["Authorized"]) ,Router.trycatchFunction("post/management/user/updateavatar", function (req, res) {
    return function () {
        UserController.updateAvatar(req).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/management/user/updateavatar", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/reset_password',MultiTenant.match(), PermissionProvider.check(["Management.User.Use"]), validation.reset_password, Router.trycatchFunction("post/management/user/reset_password", function (req, res) {
    return function () {
        UserController.resetPassword(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res,"post/management/user/reset_password",err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/reset_permission',MultiTenant.match(), PermissionProvider.check(["Management.User.Use"]), validation.reset_permission, Router.trycatchFunction("post/management/user/reset_permission", function (req, res) {
    return function () {
        UserController.resetPermission(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res,"post/management/user/reset_permission",err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/load_by_role',MultiTenant.match(), PermissionProvider.check(["Authorized"]), validation.loadByRole, Router.trycatchFunction("post/management/user/load_by_role", function (req, res) {
    return function () {
        UserController.loadUserByRole(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res,"post/management/user/load_by_role",err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/load_by_department',MultiTenant.match(), PermissionProvider.check(["Authorized"]), validation.loadByDepartment, Router.trycatchFunction("post/management/user/load_by_department", function (req, res) {
    return function () {
        UserController.loadByDepartment(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res,"post/management/user/load_by_department",err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.get(
    "/load_import_user_template",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Management.User.Use"]),
    Router.trycatchFunction("get/management/user/load_import_user_template", function (req, res) {
        return function () {
            UserController.load_import_user_template(req).then(
                function (data) {
                    res.type("application/octet-stream").send(data);
                    data = undefined;
                    res = undefined;
                    req = undefined;
                    return;
                },
                function (err) {
                    res.status(statusHTTP.internalServer);
                    Router.LogAndMessage(res, "get/management/user/load_template", err);
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

router.post('/update_FCM_token',MultiTenant.match(), PermissionProvider.check(["Authorized"]), validation.update_FCM_token, Router.trycatchFunction("post/management/user/load_by_department", function (req, res) {
    return function () {
        UserController.update_FCM_token(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res,"post/management/user/test",err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

module.exports = router;