const express = require('express');
const router = express.Router();
const { TaskController } = require('./controller');
const { validation } = require('./validation');
const { PermissionProvider } = require('../../../shared/permission/permission.provider');
const { statusHTTP } = require('../../../utils/setting');
const { Router } = require('../../../shared/router/router.provider');
const { MultiTenant } = require('../../../shared/multi_tenant/provider');

router.post('/load_employee', MultiTenant.match({ module_key: ["office"] }), PermissionProvider.check(["Office.Task.Use"]), validation.loadEmployee, Router.trycatchFunction("post/office/task/load_employee", function (req, res) {
    return function () {
        TaskController.loadEmployee(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/task/load_employee", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post(
    '/load_department',
    MultiTenant.match({ module_key: ['office'] }),
    PermissionProvider.check(['Office.Task.Use']),
    validation.load_department,
    Router.trycatchFunction('post/office/task/load_department', function (req, res) {
        return function () {
            TaskController.load_department(req.body)
                .then(
                    function (data) {
                        res.send(data);
                        res.end();
                        data = undefined;
                    },
                    function (err) {
                        res.status(statusHTTP.internalServer);
                        Router.LogAndMessage(res, 'post/office/task/load_department', err);
                        res.end();
                        err = undefined;
                    },
                )
                .finally(function () {
                    res = undefined;
                    req = undefined;
                });
        };
    }),
);

router.post(
    "/loaddetails",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Office.Task.Use"]),
    validation.loadDetails,
    Router.trycatchFunction("post/office/task/loaddetails", function (req, res) {
        return function () {
            const skipReference = req.query.skipReference === "true";
            TaskController.loadDetails(req.body, skipReference).then(
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
                    Router.LogAndMessage(res, "post/office/task/loaddetails", err);
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

router.post('/statistic_all_project_count', MultiTenant.match({ module_key: ["office"] }), PermissionProvider.check(["Office.Task.Use"]), validation.statistic_all_project_count, Router.trycatchFunction("post/office/task/statistic_all_project_count", function (req, res) {
    return function () {
        TaskController.statistic_all_project_count(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/task/statistic_all_project_count", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/statistic_all_project_growth', MultiTenant.match({ module_key: ["office"] }), PermissionProvider.check(["Office.Task.Use"]), validation.statistic_all_project_growth, Router.trycatchFunction("post/office/task/statistic_all_project_growth", function (req, res) {
    return function () {
        TaskController.statistic_all_project_growth(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/task/statistic_all_project_growth", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post(
    "/statistic_all_department_count",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Office.Task.Use"]),
    validation.statistic_personal_count,
    Router.trycatchFunction("post/office/task/statistic_all_department_count", function (req, res) {
        return function () {
            TaskController.statistic_all_department_count(req.body).then(function (data) {
                res.send(data);
                res.end();
                data = undefined;
                res = undefined;
                req = undefined;
            }, function (err) {
                res.status(statusHTTP.internalServer);
                Router.LogAndMessage(res, "post/office/task/statistic_all_department_count", err);
                res.end();
                err = undefined;
                res = undefined;
                req = undefined;
            });
        };
    }),
);

router.post(
    "/statistic_all_department_growth",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Office.Task.Use"]),
    validation.statistic_all_project_growth,
    Router.trycatchFunction("post/office/task/statistic_all_department_growth", function (req, res) {
        return function () {
            TaskController.statistic_all_department_growth(req.body).then(function (data) {
                res.send(data);
                res.end();
                data = undefined;
                res = undefined;
                req = undefined;
            }, function (err) {
                res.status(statusHTTP.internalServer);
                Router.LogAndMessage(res, "post/office/task/statistic_all_department_growth", err);
                res.end();
                err = undefined;
                res = undefined;
                req = undefined;
            });
        };
    }),
);

router.post('/load_child', MultiTenant.match({ module_key: ["office"] }), PermissionProvider.check(["Office.Task.Use"]), validation.load_child, Router.trycatchFunction("post/office/task/load_child", function (req, res) {
    return function () {
        TaskController.loadChild(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/task/load_child", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/export_personal', MultiTenant.match({ module_key: ["office"] }), PermissionProvider.check(["Office.Task.Use"]), validation.export_personal, Router.trycatchFunction("post/office/task/export_personal", function (req, res) {
    return function () {
        TaskController.export_personal(req.body).then(function (data) {
            res.send(data);
            res.end();
            res = undefined;
            req = undefined;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/task/export_personal", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/export_project', MultiTenant.match({ module_key: ["office"] }), PermissionProvider.check(["Office.Task.Use"]), validation.export_project, Router.trycatchFunction("post/office/task/export_project", function (req, res) {
    return function () {
        TaskController.export_project(req.body).then(function (data) {
            res.send(data);
            res.end();
            res = undefined;
            req = undefined;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/task/export_project", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/export_department', MultiTenant.match({ module_key: ["office"] }), PermissionProvider.check(["Office.Task.Use"]), validation.export_department, Router.trycatchFunction("post/office/task/export_department", function (req, res) {
    return function () {
        TaskController.export_department(req.body).then(function (data) {
            res.send(data);
            res.end();
            res = undefined;
            req = undefined;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/task/export_department", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post(
    "/load",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Office.Task.Use"]),
    validation.load,
    Router.trycatchFunction("post/office/task/load", function (req, res) {
        return function () {
            TaskController.load(req.body).then(
                function (data) {
                    res.send(data);
                    res.end();
                    data = undefined;
                    res = undefined;
                    req = undefined;
                },
                function (err) {
                    res.status(statusHTTP.internalServer);
                    Router.LogAndMessage(res, "post/office/task/load", err);
                    res.end();
                    err = undefined;
                    res = undefined;
                    req = undefined;
                },
            );
        };
    }),
);

router.post(
    "/count",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Office.Task.Use"]),
    validation.count,
    Router.trycatchFunction("post/office/task/count", function (req, res) {
        return function () {
            TaskController.count(req.body).then(function (data) {
                res.send(data);
                res.end();
                data = undefined;
                res = undefined;
                req = undefined;
            }, function (err) {
                res.status(statusHTTP.internalServer);
                Router.LogAndMessage(res, "post/office/task/count", err);
                res.end();
                err = undefined;
                res = undefined;
                req = undefined;
            });
        };
    }),
);

router.post(
    "/load_quickhandle",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Authorized"]),
    validation.load_quickhandle,
    Router.trycatchFunction("post/office/task/load_quickhandle", function (req, res) {
        return function () {
            TaskController.load_quickhandle(req.body).then(
                function (data) {
                    res.send(data);
                    res.end();
                    data = undefined;
                    res = undefined;
                    req = undefined;
                },
                function (err) {
                    res.status(statusHTTP.internalServer);
                    Router.LogAndMessage(res, "post/office/task/load_quickhandle", err);
                    res.end();
                    err = undefined;
                    res = undefined;
                    req = undefined;
                },
            );
        };
    }),
);

router.post(
    "/count_quickhandle",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Authorized"]),
    validation.count_quickhandle,
    Router.trycatchFunction("post/office/task/count_quickhandle", function (req, res) {
        return function () {
            TaskController.count_quickhandle(req.body).then(function (data) {
                res.send(data);
                res.end();
                data = undefined;
                res = undefined;
                req = undefined;
            }, function (err) {
                res.status(statusHTTP.internalServer);
                Router.LogAndMessage(res, "post/office/task/count_quickhandle", err);
                res.end();
                err = undefined;
                res = undefined;
                req = undefined;
            });
        };
    }),
);

router.post(
    "/statistic_personal_count",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Office.Task.Use"]),
    validation.statistic_personal_count,
    Router.trycatchFunction("post/office/task/statistic_personal_count", function (req, res) {
        return function () {
            TaskController.statistic_personal_count(req.body).then(
                function (data) {
                    res.send(data);
                    res.end();
                    data = undefined;
                    res = undefined;
                    req = undefined;
                },
                function (err) {
                    res.status(statusHTTP.internalServer);
                    Router.LogAndMessage(res, "post/office/task/statistic_personal_count", err);
                    res.end();
                    err = undefined;
                    res = undefined;
                    req = undefined;
                },
            );
        };
    }),
);

router.post(
    '/statistic_personal_growth',
    MultiTenant.match({ module_key: ['office'] }),
    PermissionProvider.check(['Office.Task.Use']),
    validation.statistic_personal_growth,
    Router.trycatchFunction('post/office/task/statistic_personal_growth', function (req, res) {
        return function () {
            TaskController.statistic_personal_growth(req.body).then(function (data) {
                res.send(data);
                res.end();
                data = undefined;
                res = undefined;
                req = undefined;
                return;
            }, function (err) {
                res.status(statusHTTP.internalServer);
                Router.LogAndMessage(res, 'post/office/task/statistic_personal_growth', err);
                res.end();
                err = undefined;
                res = undefined;
                req = undefined;
                return;
            });
        };
    }),
);

router.post(
    "/load_base_department",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Office.Task.Use"]),
    validation.load_base_department,
    Router.trycatchFunction("post/office/task/load_base_department", function (req, res) {
        return function () {
            TaskController.load_base_department(req.body).then(
                function (data) {
                    res.send(data);
                    res.end();
                    data = undefined;
                    res = undefined;
                    req = undefined;
                },
                function (err) {
                    res.status(statusHTTP.internalServer);
                    Router.LogAndMessage(res, "post/office/task/load_base_department", err);
                    res.end();
                    err = undefined;
                    res = undefined;
                    req = undefined;
                },
            );
        };
    }),
);

router.post(
    "/count_base_department",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Office.Task.Use"]),
    validation.count_base_department,
    Router.trycatchFunction("post/office/task/count_base_department", function (req, res) {
        return function () {
            TaskController.count_base_department(req.body)
                .then(
                    function (data) {
                        res.send(data);
                        res.end();
                        data = undefined;
                        res = undefined;
                        req = undefined;
                    },
                    function (err) {
                        res.status(statusHTTP.internalServer);
                        Router.LogAndMessage(res, "post/office/task/count_base_department", err);
                        res.end();
                        err = undefined;
                        res = undefined;
                        req = undefined;
                    },
                );
        };
    }),
);

router.post(
    "/ganttChart_base_department",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Office.Task.Use"]),
    validation.ganttChart_base_department,
    Router.trycatchFunction("post/office/task/ganttChart_base_department", function (req, res) {
        return function () {
            TaskController.ganttChart_base_department(req.body).then(
                function (data) {
                    res.send(data);
                    res.end();
                    data = undefined;
                    res = undefined;
                    req = undefined;
                },
                function (err) {
                    res.status(statusHTTP.internalServer);
                    Router.LogAndMessage(res, "post/office/task/ganttChart_base_department", err);
                    res.end();
                    err = undefined;
                    res = undefined;
                    req = undefined;
                },
            );
        };
    }),
);

router.post(
    "/statistic_department_count",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Office.Task.Use"]),
    validation.statistic_department_count,
    Router.trycatchFunction("post/office/task/statistic_department_count", function (req, res) {
        return function () {
            TaskController.statistic_department_count(req.body).then(
                function (data) {
                    res.send(data);
                    res.end();
                    data = undefined;
                    res = undefined;
                    req = undefined;
                },
                function (err) {
                    res.status(statusHTTP.internalServer);
                    Router.LogAndMessage(res, "post/office/task/statistic_department_count", err);
                    res.end();
                    err = undefined;
                    res = undefined;
                    req = undefined;
                },
            );
        };
    }),
);

router.post(
    "/statistic_department_growth",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Office.Task.Use"]),
    validation.statistic_department_growth,
    Router.trycatchFunction("post/office/task/statistic_department_growth", function (req, res) {
        return function () {
            TaskController.statistic_department_growth(req.body).then(
                function (data) {
                    res.send(data);
                    res.end();
                    data = undefined;
                    res = undefined;
                    req = undefined;
                },
                function (err) {
                    res.status(statusHTTP.internalServer);
                    Router.LogAndMessage(res, "post/office/task/statistic_department_growth", err);
                    res.end();
                    err = undefined;
                    res = undefined;
                    req = undefined;
                },
            );
        };
    }),
);

router.post(
    "/load_base_project",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Office.Task.Use"]),
    validation.load_base_project,
    Router.trycatchFunction("post/office/task/load_base_project", function (req, res) {
        return function () {
            TaskController.load_base_project(req.body).then(
                function (data) {
                    res.send(data);
                    res.end();
                    data = undefined;
                    res = undefined;
                    req = undefined;
                },
                function (err) {
                    res.status(statusHTTP.internalServer);
                    Router.LogAndMessage(res, "post/office/task/load_base_project", err);
                    res.end();
                    err = undefined;
                    res = undefined;
                    req = undefined;
                },
            );
        };
    }),
);



router.post(
    "/count_base_project",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Office.Task.Use"]),
    validation.count_base_project,
    Router.trycatchFunction("post/office/task/count_base_project", function (req, res) {
        return function () {
            TaskController.count_base_project(req.body).then(
                function (data) {
                    res.send(data);
                    res.end();
                    data = undefined;
                    res = undefined;
                    req = undefined;
                },
                function (err) {
                    res.status(statusHTTP.internalServer);
                    Router.LogAndMessage(res, "post/office/task/count_base_project", err);
                    res.end();
                    err = undefined;
                    res = undefined;
                    req = undefined;
                },
            );
        };
    }),
);

router.post(
    "/ganttChart_base_project",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Office.Task.Use"]),
    validation.ganttChart_base_project,
    Router.trycatchFunction("post/office/task/ganttChart_base_project", function (req, res) {
        return function () {
            TaskController.ganttChart_base_project(req.body).then(
                function (data) {
                    res.send(data);
                    res.end();
                    data = undefined;
                    res = undefined;
                    req = undefined;
                },
                function (err) {
                    res.status(statusHTTP.internalServer);
                    Router.LogAndMessage(res, "post/office/task/ganttChart_base_project", err);
                    res.end();
                    err = undefined;
                    res = undefined;
                    req = undefined;
                },
            );
        };
    }),
);

router.post(
    "/statistic_project_count",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Office.Task.Use"]),
    validation.statistic_project_count,
    Router.trycatchFunction("post/office/task/statistic_project_count", function (req, res) {
        return function () {
            TaskController.statistic_project_count(req.body).then(
                function (data) {
                    res.send(data);
                    res.end();
                    data = undefined;
                    res = undefined;
                    req = undefined;
                },
                function (err) {
                    res.status(statusHTTP.internalServer);
                    Router.LogAndMessage(res, "post/office/task/statistic_project_count", err);
                    res.end();
                    err = undefined;
                    res = undefined;
                    req = undefined;
                },
            );
        };
    }),
);

router.post(
    "/statistic_project_growth",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Office.Task.Use"]),
    validation.statistic_project_growth,
    Router.trycatchFunction("post/office/task/statistic_project_growth", function (req, res) {
        return function () {
            TaskController.statistic_project_growth(req.body).then(
                function (data) {
                    res.send(data);
                    res.end();
                    data = undefined;
                    res = undefined;
                    req = undefined;
                },
                function (err) {
                    res.status(statusHTTP.internalServer);
                    Router.LogAndMessage(res, "post/office/task/statistic_project_growth", err);
                    res.end();
                    err = undefined;
                    res = undefined;
                    req = undefined;
                },
            );
        };
    }),
);

router.get('/load_template', MultiTenant.match({ module_key: ['office'] }), PermissionProvider.check(['Office.Task.Use']), Router.trycatchFunction('get/office/task/load_template', function (req, res) {
    return function () {
        TaskController.load_template(req).then(function (data) {
            res.type('application/octet-stream').send(data);
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res,"get/office/task/load_template",err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.get('/load_template_for_departments', MultiTenant.match({ module_key: ['office'] }), PermissionProvider.check(['Office.Task.Use']), Router.trycatchFunction('get/office/task/load_template_for_departments', function (req, res) {
    return function () {
        TaskController.load_template_for_departments(req).then(function (data) {
            res.type('application/octet-stream').send(data);
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res,"get/office/task/load_template_for_departments",err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.get(
    '/load_template_for_projects',
    MultiTenant.match({ module_key: ['office'] }),
    PermissionProvider.check(['Office.Task.Use']),
    Router.trycatchFunction('get/office/task/load_template_for_projects', function (req, res) {
        return function () {
            const dbPrefix = req.body._service[0].dbname_prefix;
            TaskController.load_template_for_projects(dbPrefix).then(
                function (data) {
                    res.type('application/octet-stream').send(data);
                    data = undefined;
                    res = undefined;
                    req = undefined;
                    return;
                },
                function (err) {
                    res.status(statusHTTP.internalServer);
                    Router.LogAndMessage(res, 'get/office/task/load_template_for_projects', err);
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

router.post('/count_created', MultiTenant.match({ module_key: ["office"] }), PermissionProvider.check(["Office.Task.Use"]), Router.trycatchFunction("post/office/task/count_created", function (req, res) {
    return function () {
        TaskController.count_created(req.body).then(function (data) {
            res.send({ count: data });
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/task/count_created", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/count_assigned', MultiTenant.match({ module_key: ["office"] }), PermissionProvider.check(["Office.Task.Use"]), Router.trycatchFunction("post/office/task/count_assigned", function (req, res) {
    return function () {
        TaskController.count_assigned(req.body).then(function (data) {
            res.send({ count: data });
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/task/count_assigned", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post(
    "/insert",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Office.Task.Use"]),
    Router.trycatchFunction("post/office/task/insert", function (req, res) {
        return function () {
            TaskController.insert(req).then(
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
                    Router.LogAndMessage(res, "post/office/task/insert", err);
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
    '/insert_task_from_template',
    MultiTenant.match({ module_key: ['office'] }),
    PermissionProvider.check(['Office.Task.Use']),
    validation.insert_task_from_template,
    Router.trycatchFunction('post/office/task/insert_task_from_template', function (req, res) {
        return function () {
            TaskController.insert_task_from_template(req).then(
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
                    Router.LogAndMessage(res, 'post/office/task/insert_task_from_template', err);
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


router.post('/loadfileinfo', MultiTenant.match({ module_key: ["office"] }), PermissionProvider.check("Authorized"), validation.loadFileInfo, Router.trycatchFunction("post/office/task/loadfileinfo", function (req, res) {
    return function () {
        TaskController.loadFileInfo(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/task/loadfileinfo", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/insert_transfer_ticket',
    MultiTenant.match({ module_key: ['office'] }),
    PermissionProvider.check(['Office.Task.Use']),
    Router.trycatchFunction('post/office/task/insert_transfer_ticket', function (req, res) {
        return function () {
            TaskController.insert_transfer_ticket(req).then(
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
                    Router.LogAndMessage(res, 'post/office/task/insert_transfer_ticket', err);
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
    '/transfer_ticket_preview',
    MultiTenant.match({ module_key: ['office'] }),
    PermissionProvider.check(['Office.Task.Use']),
    validation.transferTicketPreview,
    Router.trycatchFunction(
        'post/office/task/transfer_ticket_preview',
        function(request, response) {
            return function() {
                TaskController.transfer_ticket_preview(request)
                    .then(function(data) {
                        response.send(data);
                        data = undefined;
                        request = undefined;
                        response = undefined;
                    })
                    .catch(function(error) {
                        response.status(statusHTTP.internalServer);
                        Router.LogAndMessage(
                            response,
                            'post/office/task/transfer_ticket_preview',
                            error,
                        );
                        error = undefined;
                    })
                    .finally(function() {
                        request = undefined;
                        response = undefined;
                    });
            };
        },
    ),
);

router.post(
    '/:transferTicketId/sign',
    MultiTenant.match({ module_key: ['office'] }),
    PermissionProvider.check(['Office.Task.Use']),
    Router.trycatchFunction(
        'post/office/task/:transferTicketId/sign',
        function(req, res) {
            return function() {
                TaskController.signTransferTicket(req)
                    .then(function(data) {
                        res.send(data);
                        data = undefined;
                        req = undefined;
                        res = undefined;
                    })
                    .catch(function(error) {
                        res.status(statusHTTP.internalServer);
                        Router.LogAndMessage(
                            res,
                            'post/office/task/:transferTicketId/sign',
                            error,
                        );
                        error = undefined;
                    })
                    .finally(function() {
                        req = undefined;
                        res = undefined;
                    });
            };
        },
    ),
);

router.post('/start', MultiTenant.match({ module_key: ["office"] }), PermissionProvider.check(["Office.Task.Use"]), validation.start, Router.trycatchFunction("post/office/task/start", function (req, res) {
    return function () {
        TaskController.start(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/task/start", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/done', MultiTenant.match({ module_key: ["office"] }), PermissionProvider.check(["Office.Task.Use"]), Router.trycatchFunction("post/office/task/done", function (req, res) {
    return function () {
        TaskController.done(req).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/task/done", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post(
    '/complete',
    MultiTenant.match({ module_key: ['office'] }),
    PermissionProvider.check(['Office.Task.Use']),
    Router.trycatchFunction('post/office/task/complete', function(req, res) {
        return function() {
            TaskController.complete(req).then(
                function(data) {
                    res.send(data);
                    res.end();
                    data = undefined;
                    res = undefined;
                    req = undefined;
                },
                function(err) {
                    res.status(statusHTTP.internalServer);
                    Router.LogAndMessage(res, 'post/office/task/complete', err);
                    res.end();
                    err = undefined;
                    res = undefined;
                    req = undefined;
                },
            );
        };
    }),
);

router.post(
    "/refune",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Office.Task.Use"]),
    Router.trycatchFunction("post/office/task/refune", function (req, res) {
        return function () {
            TaskController.refune(req).then(
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
                    Router.LogAndMessage(res, "post/office/task/refune", err);
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
    PermissionProvider.check(["Office.Task.Use"]),
    validation.cancel,
    Router.trycatchFunction("post/office/task/cancel", function (req, res) {
        return function () {
            TaskController.cancel(req.body)
                .then((data) => {
                    res.send(data);
                })
                .catch((err) => {
                    res.status(statusHTTP.internalServer);
                    Router.LogAndMessage(res, "post/office/task/cancel", err);
                })
                .finally(() => {
                    res.end();
                });
        };
    })
);

router.post(
    "/update",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Office.Task.Use"]),
    validation.update,
    Router.trycatchFunction("post/office/task/update", function (req, res) {
        return function () {
            TaskController.update(req.body).then(
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
                    Router.LogAndMessage(res, "post/office/task/update", err);
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

router.post('/update_progress', MultiTenant.match({ module_key: ["office"] }), PermissionProvider.check(["Office.Task.Use"]), validation.updateProgress, Router.trycatchFunction("post/office/task/update_progress", function (req, res) {
    return function () {
        TaskController.update_progress(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/task/update_progress", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/update_task_list_status', MultiTenant.match({ module_key: ["office"] }), PermissionProvider.check(["Office.Task.Use"]), validation.update_task_list_status, Router.trycatchFunction("post/office/task/update_task_list_status", function (req, res) {
    return function () {
        TaskController.update_task_list_status(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/task/update_task_list_status", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/update_task_list', MultiTenant.match({ module_key: ["office"] }), PermissionProvider.check(["Office.Task.Use"]), validation.update_task_list, Router.trycatchFunction("post/office/task/update_task_list", function (req, res) {
    return function () {
        TaskController.update_task_list(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/task/update_task_list", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/comment', MultiTenant.match({ module_key: ["office"] }), PermissionProvider.check(["Office.Task.Use"]), Router.trycatchFunction("post/office/task/comment", function (req, res) {
    return function () {
        TaskController.comment(req).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/task/comment", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/update_comment', MultiTenant.match({ module_key: ["office"] }), PermissionProvider.check(["Office.Task.Use"]), Router.trycatchFunction("post/office/task/update_comment", function (req, res) {
    return function () {
        TaskController.updateComment(req).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/task/update_comment", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/delete', MultiTenant.match({ module_key: ["office"] }), PermissionProvider.check(["Office.Task.Use"]), validation.delete, Router.trycatchFunction("post/office/task/delete", function (req, res) {
    return function () {
        TaskController.delete(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/task/delete", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/uploadimage', MultiTenant.match({ module_key: ["office"] }), PermissionProvider.check(["Office.Task.Use"]), Router.trycatchFunction("post/office/task/uploadimage", function (req, res) {
    return function () {
        TaskController.uploadImage(req).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/task/uploadimage", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/pushfile', MultiTenant.match({ module_key: ["office"] }), PermissionProvider.check(["Office.Task.Use"]), Router.trycatchFunction("post/office/task/pushfile", function (req, res) {
    return function () {
        TaskController.pushFile(req).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/task/pushfile", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));


router.post('/removefile', MultiTenant.match({ module_key: ["office"] }), PermissionProvider.check(["Office.Task.Use"]), validation.removeFile, Router.trycatchFunction("post/office/task/removefile", function (req, res) {
    return function () {
        TaskController.removeFile(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/task/removefile", err);
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
    Router.trycatchFunction('post/office/task/downloadfile', function (req, res) {
        return function () {
            TaskController.download(req.body).then(
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
                    Router.LogAndMessage(res, 'post/office/task/downloadfile', err);
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
    '/insert_for_multiple_departments',
    MultiTenant.match({ module_key: ['office'] }),
    PermissionProvider.check(['Office.Task.Import_Multiple_Departments']),
    validation.insertTasksForMultipleDepartments,
    Router.trycatchFunction('post/office/task/insert_for_multiple_departments', function (req, res) {
        return function () {
            TaskController.insert_for_multiple_departments(req).then(
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
                    Router.LogAndMessage(res, 'post/office/task/insert_for_multiple_departments', err);
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
    '/insert_task_external',
    MultiTenant.match({ module_key: ['office'] }),
    PermissionProvider.check(["Office.Task.Use"]),
    validation.insert_task_external,
    Router.trycatchFunction('post/office/task/insert_task_external', function (req, res) {
        return function () {
            TaskController.insert_task_external(req).then(
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
                    Router.LogAndMessage(res, 'post/office/task/insert_task_external', err);
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
    '/insert_for_multiple_projects',
    MultiTenant.match({ module_key: ['office'] }),
    PermissionProvider.check(['Office.Task.Import_Multiple_Departments']),
    validation.insertTasksForMultipleProjects,
    Router.trycatchFunction('post/office/task/insert_for_multiple_projects', function (req, res) {
        return function () {
            const dbPrefix = req.body._service[0].dbname_prefix;
            const session = req.body.session;
            const tasks = req.body.data;
            const sync = req.query.sync === 'true';
            TaskController.insert_for_multiple_projects(dbPrefix, session, tasks, sync).then(
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
                    Router.LogAndMessage(res, 'post/office/task/insert_for_multiple_projects', err);
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

router.post('/link_workflow_play', MultiTenant.match({ module_key: ["office"] }), PermissionProvider.check(["Office.Task.Use"]), validation.link_workflow_play, Router.trycatchFunction("post/office/task/link_workflow_play", function (req, res) {
    return function () {
        TaskController.link_workflow_play(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/task/link_workflow_play", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/addproof',
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Office.Task.Use"]),
    Router.trycatchFunction("post/office/task/addproof",
        function (req, res) {
            return function () {
                TaskController.addProof(req).then(function (data) {
                    res.send(data);
                    res.end();
                    data = undefined;
                    res = undefined;
                    req = undefined;
                    return;
                }, function (err) {
                    res.status(statusHTTP.internalServer);
                    Router.LogAndMessage(res, "post/office/task/addproof", err);
                    res.end();
                    err = undefined;
                    res = undefined;
                    req = undefined;
                    return;
                });
            }
        }));


router.post('/removeproof',
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Office.Task.Use"]),
    validation.removeProof,
    Router.trycatchFunction("post/office/task/removeproof",
        function (req, res) {
            return function () {
                TaskController.removeProof(req.body).then(function (data) {
                    res.send(data);
                    res.end();
                    data = undefined;
                    res = undefined;
                    req = undefined;
                    return;
                }, function (err) {
                    res.status(statusHTTP.internalServer);
                    Router.LogAndMessage(res, "post/office/task/removeproof", err);
                    res.end();
                    err = undefined;
                    res = undefined;
                    req = undefined;
                    return;
                });
            }
}));

router.post(
    "/insert_transferTicketTask",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Office.Task.Use"]),
    Router.trycatchFunction("post/office/task/insert_transferTicketTask", function (req, res) {
        return function () {
            TaskController.insert_transferTicketTask(req).then(
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
                    Router.LogAndMessage(res, "post/office/task/insert_transferTicketTask", err);
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

router.post('/receive_task',
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Office.Task.Use"]),
    validation.receive_task,
    Router.trycatchFunction("post/office/task/receive_task",
        function (req, res) {
            return function () {
                TaskController.receive_task(req.body).then(function (data) {
                    res.send(data);
                    res.end();
                    data = undefined;
                    res = undefined;
                    req = undefined;
                    return;
                }, function (err) {
                    res.status(statusHTTP.internalServer);
                    Router.LogAndMessage(res, "post/office/task/receive_task", err);
                    res.end();
                    err = undefined;
                    res = undefined;
                    req = undefined;
                    return;
                });
            }
}));

router.post('/reject_receive_task',
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Office.Task.Use"]),
    validation.reject_receive_task,
    Router.trycatchFunction("post/office/task/reject_receive_task",
        function (req, res) {
            return function () {
                TaskController.reject_receive_task(req.body).then(function (data) {
                    res.send(data);
                    res.end();
                    data = undefined;
                    res = undefined;
                    req = undefined;
                    return;
                }, function (err) {
                    res.status(statusHTTP.internalServer);
                    Router.LogAndMessage(res, "post/office/task/reject_receive_task", err);
                    res.end();
                    err = undefined;
                    res = undefined;
                    req = undefined;
                    return;
                });
            }
}));

router.post('/approval_receive_task',
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Office.Task.Use"]),
    validation.approval_receive_task,
    Router.trycatchFunction("post/office/task/receive_task",
        function (req, res) {
            return function () {
                TaskController.approval_receive_task(req).then(function (data) {
                    res.send(data);
                    res.end();
                    data = undefined;
                    res = undefined;
                    req = undefined;
                    return;
                }, function (err) {
                    res.status(statusHTTP.internalServer);
                    Router.LogAndMessage(res, "post/office/task/receive_task", err);
                    res.end();
                    err = undefined;
                    res = undefined;
                    req = undefined;
                    return;
                });
            }
}));

router.post('/reject_receive_task',
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Office.Task.Use"]),
    validation.reject_receive_task,
    Router.trycatchFunction("post/office/task/reject_receive_task",
        function (req, res) {
            return function () {
                TaskController.reject_receive_task(req.body).then(function (data) {
                    res.send(data);
                    res.end();
                    data = undefined;
                    res = undefined;
                    req = undefined;
                    return;
                }, function (err) {
                    res.status(statusHTTP.internalServer);
                    Router.LogAndMessage(res, "post/office/task/reject_receive_task", err);
                    res.end();
                    err = undefined;
                    res = undefined;
                    req = undefined;
                    return;
                });
            }
}));

router.post('/reject_approval_receive_task',
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Office.Task.Use"]),
    validation.reject_approval_receive_task,
    Router.trycatchFunction("post/office/task/reject_approval_receive_task",
        function (req, res) {
            return function () {
                TaskController.reject_approval_receive_task(req.body).then(function (data) {
                    res.send(data);
                    res.end();
                    data = undefined;
                    res = undefined;
                    req = undefined;
                    return;
                }, function (err) {
                    res.status(statusHTTP.internalServer);
                    Router.LogAndMessage(res, "post/office/task/reject_approval_receive_task", err);
                    res.end();
                    err = undefined;
                    res = undefined;
                    req = undefined;
                    return;
                });
            }
}));

router.post('/load_receive_task',
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Office.Task.Use"]),
    validation.load_receive_task,
    Router.trycatchFunction("post/office/task/load_receive_task",
        function (req, res) {
            return function () {
                TaskController.load_receive_task(req.body).then(function (data) {
                    res.send(data);
                    res.end();
                    data = undefined;
                    res = undefined;
                    req = undefined;
                    return;
                }, function (err) {
                    res.status(statusHTTP.internalServer);
                    Router.LogAndMessage(res, "post/office/task/load_receive_task", err);
                    res.end();
                    err = undefined;
                    res = undefined;
                    req = undefined;
                    return;
                });
            }
}));

router.post(
    "/insert_head_task",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Office.Task.Use"]),
    Router.trycatchFunction("post/office/task/insert_head_task", function (req, res) {
        return function () {
            TaskController.insert_head_task(req).then(
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
                    Router.LogAndMessage(res, "post/office/task/insert_head_task", err);
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
    "/load_task_external",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Office.Task.Use"]),
    validation.load_task_external,
    Router.trycatchFunction("post/office/task/load_task_external", function (req, res) {
        return function () {
            TaskController.load_task_external(req.body).then(
                function (data) {
                    res.send(data);
                    res.end();
                    data = undefined;
                    res = undefined;
                    req = undefined;
                },
                function (err) {
                    res.status(statusHTTP.internalServer);
                    Router.LogAndMessage(res, "post/office/task/load_task_external", err);
                    res.end();
                    err = undefined;
                    res = undefined;
                    req = undefined;
                },
            );
        };
    }),
);

router.post(
    "/count_task_external",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Office.Task.Use"]),
    validation.count_task_external,
    Router.trycatchFunction("post/office/task/count_task_external", function (req, res) {
        return function () {
            TaskController.count_task_external(req.body).then(
                function (data) {
                    res.send(data);
                    res.end();
                    data = undefined;
                    res = undefined;
                    req = undefined;
                },
                function (err) {
                    res.status(statusHTTP.internalServer);
                    Router.LogAndMessage(res, "post/office/task/count_task_external", err);
                    res.end();
                    err = undefined;
                    res = undefined;
                    req = undefined;
                },
            );
        };
    }),
);

router.post(
    "/update_head_task",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Office.Task.Use"]),
    Router.trycatchFunction("post/office/task/update_head_task", function (req, res) {
        return function () {
            TaskController.update_head_task(req).then(
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
                    Router.LogAndMessage(res, "post/office/task/update_head_task", err);
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

module.exports = router;
