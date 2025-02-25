const express = require('express');
const router = express.Router();
const { TrainingPointController } = require('./controller');
const { validation } = require('./validation');
const { PermissionProvider } = require('../../../shared/permission/permission.provider');
const { statusHTTP } = require('../../../utils/setting');
const { Router } = require('../../../shared/router/router.provider');
const { MultiTenant } = require('../../../shared/multi_tenant/provider');


router.post('/load', MultiTenant.match({ module_key: ["education"] }), PermissionProvider.check(["Education.TrainingPoint.Use"]), validation.loadList, Router.trycatchFunction("post/education/training_point/load", function (req, res) {
    return function () {
        TrainingPointController.loadList(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/education/training_point/load", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/count', MultiTenant.match({ module_key: ["education"] }), PermissionProvider.check(["Education.TrainingPoint.Use"]), validation.countList, Router.trycatchFunction("post/education/training_point/count", function (req, res) {
    return function () {
        TrainingPointController.countList(req.body).then(function (data) {
            res.send({ count: data });
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/education/training_point/count", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/insert', MultiTenant.match({ module_key: ["education"] }), PermissionProvider.check(["Education.TrainingPoint.Use"]), validation.insert, Router.trycatchFunction("post/education/training_point/insert", function (req, res) {
    return function () {
        TrainingPointController.insert(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/education/training_point/insert", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/update', MultiTenant.match({ module_key: ["education"] }), PermissionProvider.check(["Education.TrainingPoint.Use"]), validation.update, Router.trycatchFunction("post/education/training_point/update", function (req, res) {
    return function () {
        TrainingPointController.update(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/education/training_point/update", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/delete', MultiTenant.match({ module_key: ["education"] }), PermissionProvider.check(["Education.TrainingPoint.Use"]), validation.delete, Router.trycatchFunction("post/education/training_point/delete", function (req, res) {
    return function () {
        TrainingPointController.delete(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/education/training_point/delete", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/register', MultiTenant.match({ module_key: ["education"] }), PermissionProvider.check(["Education.TrainingPoint.Use"]), validation.register, Router.trycatchFunction("post/education/training_point/register", function (req, res) {
    return function () {
        TrainingPointController.register(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/education/training_point/register", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/unregister', MultiTenant.match({ module_key: ["education"] }), PermissionProvider.check(["Education.TrainingPoint.Use"]), validation.unregister, Router.trycatchFunction("post/education/training_point/unregister", function (req, res) {
    return function () {
        TrainingPointController.unregister(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/education/training_point/unregister", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/loadListStudent', MultiTenant.match({ module_key: ["education"] }), PermissionProvider.check(["Education.TrainingPoint.Use"]), validation.loadListStudent, Router.trycatchFunction("post/education/training_point/loadListStudent", function (req, res) {
    return function () {
        TrainingPointController.loadListStudent(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/education/training_point/loadListStudent", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/loadRegisteredEventByStudentId', MultiTenant.match({ module_key: ["education"] }), PermissionProvider.check(["Education.TrainingPoint.Use"]), validation.loadRegisteredEventByStudentId, Router.trycatchFunction("post/education/training_point/loadRegisteredEventByStudentId", function (req, res) {
    return function () {
        TrainingPointController.loadRegisteredEventByStudentId(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/education/training_point/loadRegisteredEventByStudentId", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post(
    "/loadDetails",
    MultiTenant.match({ module_key: ["education"] }),
    PermissionProvider.check(["Education.TrainingPoint.Use"]),
    validation.loadDetails,
    Router.trycatchFunction(
        "post/education/training_point/loadDetails",
        function (req, res) {
            return function () {
                TrainingPointController.loadDetails(req.body).then(
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
                        Router.LogAndMessage(
                            res,
                            "post/education/training_point/loadDetails",
                            err
                        );
                        res.end();
                        err = undefined;
                        res = undefined;
                        req = undefined;
                        return;
                    }
                );
            };
        }
    )
);

router.post(
    "/getQRCode",
    MultiTenant.match({ module_key: ["education"] }),
    PermissionProvider.check(["Education.TrainingPoint.Use"]),
    validation.getQRCode,
    Router.trycatchFunction(
        "post/education/training_point/getQRCode",
        function (req, res) {
            return function () {
                TrainingPointController.getQRCodeUrl(req.body).then(
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
                        Router.LogAndMessage(
                            res,
                            "post/education/training_point/getQRCode",
                            err
                        );
                        res.end();
                        err = undefined;
                        res = undefined;
                        req = undefined;
                        return;
                    }
                );
            };
        }
    )
);

router.post(
    "/ackTrainingEvent",
    MultiTenant.match({ module_key: ["education"] }),
    PermissionProvider.check(["Education.TrainingPoint.Use"]),
    validation.ackTrainingEvent,
    Router.trycatchFunction(
        "post/education/training_point/ackTrainingEvent",
        function (req, res) {
            return function () {
                TrainingPointController.ackTrainingEvent(req.body).then(
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
                        Router.LogAndMessage(
                            res,
                            "post/education/training_point/ackTrainingEvent",
                            err
                        );
                        res.end();
                        err = undefined;
                        res = undefined;
                        req = undefined;
                        return;
                    }
                );
            };
        }
    )
);

router.post(
    "/exportCheckoutList",
    MultiTenant.match({ module_key: ["education"] }),
    PermissionProvider.check(["Education.TrainingPoint.Use"]),
    validation.exportCheckoutList,
    Router.trycatchFunction(
        "post/education/training_point/exportCheckoutList",
        function (req, res) {
            return function () {
                TrainingPointController.exportCheckoutList(req.body).then(
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
                        Router.LogAndMessage(
                            res,
                            "post/education/training_point/exportCheckoutList",
                            err
                        );
                        res.end();
                        err = undefined;
                        res = undefined;
                        req = undefined;
                        return;
                    }
                );
            };
        }
    )
);

module.exports = router;