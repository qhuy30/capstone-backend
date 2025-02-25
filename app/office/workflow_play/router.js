const express = require("express");

const { PermissionProvider } = require("@shared/permission/permission.provider");
const { statusHTTP } = require("@utils/setting");
const { Router } = require("@shared/router/router.provider");
const { MultiTenant } = require("@shared/multi_tenant/provider");
const FromDataMiddleware = require("@shared/middleware/form-data");
const CommonUtils = require('@utils/util');

const { validation } = require("./validation");
const { WorkflowPlayController } = require("./controller");

const WORKFLOW_PLAY_CONST = require("./const");

const router = express.Router();

router.post(
    "/loaddetails",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Office.Signing.Use"]),
    validation.loadDetails,
    Router.trycatchFunction("post/workflow_play/loaddetails", function (req, res) {
        return function () {
            WorkflowPlayController.loadDetails(req.body).then(
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
                    Router.LogAndMessage(res, "post/workflow_play/loaddetails", err);
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
    "/load",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Office.Signing.Use"]),
    validation.load,
    Router.trycatchFunction("post/workflow_play/load", function (req, res) {
        return function () {
            WorkflowPlayController.load(req.body).then(
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
                    Router.LogAndMessage(res, "post/workflow_play/load", err);
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

router.post('/count',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.Signing.Use"]) ,validation.count,Router.trycatchFunction("post/workflow_play/count", function (req, res) {
    return function () {
        WorkflowPlayController.count(req.body).then(function (data) {
            res.send({ count: data[0].count });
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/workflow_play/count", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post(
    "/init",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Office.Signing.Use"]),
    Router.trycatchFunction("post/workflow_play/init", function(req, res) {
        return function() {
            WorkflowPlayController.init(req.body).then(
                function(data) {
                    res.send(data);
                    res.end();
                    data = undefined;
                    res = undefined;
                    req = undefined;
                    return;
                }, function(err) {
                    res.status(statusHTTP.internalServer);
                    Router.LogAndMessage(res, "post/workflow_play/init", err);
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
  "/insert",
  MultiTenant.match({ module_key: ["office"] }),
  PermissionProvider.check(["Office.Signing.Use"]),
  Router.trycatchFunction("post/workflow_play/insert", function (req, res) {
    return function () {
      WorkflowPlayController.insert(req).then(
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
          Router.LogAndMessage(res, "post/workflow_play/insert", err);
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
    "/insert_transfer_ticket",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Office.Signing.Use"]),
    Router.trycatchFunction("post/workflow_play/insert_transfer_ticket", function (req, res) {
      return function () {
        WorkflowPlayController.insert_transfer_ticket(req).then(
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
            Router.LogAndMessage(res, "post/workflow_play/insert_transfer_ticket", err);
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
    "/update",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Office.Signing.Use"]),
    Router.trycatchFunction("post/workflow_play/update", function (req, res) {
      return function () {
        WorkflowPlayController.update(req).then(
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
            Router.LogAndMessage(res, "post/workflow_play/update", err);
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

router.get('/countpending',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Authorized"]) ,Router.trycatchFunction("get/workflow_play/countpending", function (req, res) {
    return function () {
        WorkflowPlayController.countPending(req.body).then(function (data) {
            res.send({ count: data[0].count });
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "get/workflow_play/countpending", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post(
    '/loadfileinfo',
    MultiTenant.match({ module_key: ['office'] }),
    PermissionProvider.check(['Authorized']),
    validation.loadFileInfo,
    Router.trycatchFunction(
        'post/workflow_play/loadfileinfo',
        function (req, res) {
            return function () {
                WorkflowPlayController.loadFileInfo(req.body).then(
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
                            'post/workflow_play/loadfileinfo',
                            err,
                        );
                        res.end();
                        err = undefined;
                        res = undefined;
                        req = undefined;
                        return;
                    },
                );
            };
        },
    ),
);

router.post(
    '/approval',
    MultiTenant.match({ module_key: ['office'] }),
    PermissionProvider.check(['Authorized']),
    Router.trycatchFunction('post/workflow_play/approval', function (req, res) {
        return function () {
            WorkflowPlayController.approval(req).then(
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
                    Router.LogAndMessage(res, 'post/workflow_play/approval', err);
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
    "/process",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Authorized"]),
    FromDataMiddleware(WORKFLOW_PLAY_CONST.NAME_LIB, undefined, undefined, WORKFLOW_PLAY_CONST.PARENT_FOLDER),
    Router.trycatchFunction("post/workflow_play/process", function (req, res) {
        return function () {
            const dbPrefix = CommonUtils.getDbNamePrefix(req);
            const currentUser = req.body.session;

            WorkflowPlayController.process(dbPrefix, currentUser, req.formData).then(
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
                    Router.LogAndMessage(res, "post/workflow_play/process", err);
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
    "/update-references",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Authorized"]),
    FromDataMiddleware(WORKFLOW_PLAY_CONST.NAME_LIB, undefined, undefined, WORKFLOW_PLAY_CONST.PARENT_FOLDER),
    Router.trycatchFunction("post/workflow_play/update-references", function (req, res) {
        return function () {
            const dbPrefix = CommonUtils.getDbNamePrefix(req);
            const currentUser = req.body.session;

            WorkflowPlayController.updareReferences(dbPrefix, currentUser, req.formData).then(
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
                    Router.LogAndMessage(res, "POST /workflow-play/update-references", err);
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

router.post('/transformSignOther',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Authorized"]),validation.transform_signOther,Router.trycatchFunction("post/workflow_play/transformSignOther", function (req, res) {
    return function () {
        WorkflowPlayController.transformSignOther(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/workflow_play/transformSignOther", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/signOther',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Authorized"]),validation.sign_other,Router.trycatchFunction("post/workflow_play/signOther", function (req, res) {
    return function () {
        WorkflowPlayController.signOther(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/workflow_play/signOther", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post(
    '/reject',
    MultiTenant.match({ module_key: ['office'] }),
    PermissionProvider.check(['Authorized']),
    Router.trycatchFunction('post/workflow_play/reject', function (req, res) {
        return function () {
            WorkflowPlayController.reject(req).then(
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
                    Router.LogAndMessage(res, 'post/workflow_play/reject', err);
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
    '/return',
    MultiTenant.match({ module_key: ['office'] }),
    PermissionProvider.check(['Authorized']),
    Router.trycatchFunction('post/workflow_play/return', function (req, res) {
        return function () {
            WorkflowPlayController.return(req).then(
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
                    Router.LogAndMessage(res, 'post/workflow_play/return', err);
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

router.post('/delete',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.Signing.Use"]),validation.delete,Router.trycatchFunction("post/office/workflow_play/delete", function (req, res) {
    return function () {
        WorkflowPlayController.delete(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/workflow_play/delete", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/return_creator_additional_document',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.Signing.Use"]),validation.return_creator_additional_document,Router.trycatchFunction("post/office/workflow_play/delete", function (req, res) {
    return function () {
        WorkflowPlayController.return_creator_additional_document(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/workflow_play/return_creator_additional_document", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/creator_additional_document',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.Signing.Use"]),Router.trycatchFunction("post/office/workflow_play/delete", function (req, res) {
    return function () {
        WorkflowPlayController.creator_additional_document(req).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/workflow_play/creator_additional_document", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/removeattachment', MultiTenant.match({ module_key: ["office"] }), PermissionProvider.check(["Office.Signing.Use"]), validation.removeAttachment, Router.trycatchFunction("post/office/workflow_play/removeattachment", function (req, res) {
    return function () {
        WorkflowPlayController.removeAttachment(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/workflow_play/removeattachment", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/removerelatedfile', MultiTenant.match({ module_key: ["office"] }), PermissionProvider.check(["Office.Signing.Use"]), validation.removeRelatedFile, Router.trycatchFunction("post/office/workflow_play/removerelatedfile", function (req, res) {
    return function () {
        WorkflowPlayController.removeRelatedFile(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/workflow_play/removerelatedfile", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/pushattachment', MultiTenant.match({ module_key: ["office"] }), PermissionProvider.check(["Office.Signing.Use"]), Router.trycatchFunction("post/office/workflow_play/pushattachment", function (req, res) {
    return function () {
        WorkflowPlayController.pushAttachment(req).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/workflow_play/pushattachment", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/pushrelatedfile', MultiTenant.match({ module_key: ["office"] }), PermissionProvider.check(["Office.Signing.Use"]), Router.trycatchFunction("post/office/workflow_play/pushrelatedfile", function (req, res) {
    return function () {
        WorkflowPlayController.pushRelatedFile(req).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/office/workflow_play/pushrelatedfile", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post(
    '/resubmit',
    MultiTenant.match({ module_key: ['office'] }),
    PermissionProvider.check(['Office.Signing.Use']),
    Router.trycatchFunction('post/workflow_play/resubmit', function (req, res) {
        return function () {
            WorkflowPlayController.resubmit(req).then(
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
                    Router.LogAndMessage(res, 'post/workflow_play/resubmit', err);
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

router.post('/getuserinflow',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.Signing.Use"]),validation.getUserInFlow,Router.trycatchFunction("post/workflow_play/getuserinflow", function (req, res) {
    return function () {
        WorkflowPlayController.getUserInFlow(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/workflow_play/getuserinflow", err);
            res.end();
            err = undefined;
            res = undefined;
            req = undefined;
            return;
        });
    }
}));

router.post('/singafile',MultiTenant.match({module_key:["office"]}), PermissionProvider.check(["Office.Signing.Use"]),validation.signAFile,Router.trycatchFunction("post/workflow_play/singafile", function (req, res) {
    return function () {
        WorkflowPlayController.signAfile(req.body).then(function (data) {
            res.send(data);
            res.end();
            data = undefined;
            res = undefined;
            req = undefined;
            return;
        }, function (err) {
            res.status(statusHTTP.internalServer);
            Router.LogAndMessage(res, "post/workflow_play/singafile", err);
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
    PermissionProvider.check(['Office.Signing.Use']),
    Router.trycatchFunction('post/office/workflow_play/downloadfile', function (req, res) {
        return function () {
            WorkflowPlayController.download(req.body).then(
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
                    Router.LogAndMessage(res, 'post/office/workflow_play/downloadfile', err);
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
    '/:workflowPlayId/sign',
    MultiTenant.match({ module_key: ['office'] }),
    PermissionProvider.check(['Office.Signing.Use']),
    validation.signWorkflowPlay,
    Router.trycatchFunction(
        'post/office/workflow_play/:workflowPlayId/sign',
        function (req, res) {
            return function () {
                const dbPrefix = req.body._service[0].dbname_prefix;
                const currentUser = req.body.session;
                const workflowPlayId = req.params.workflowPlayId;
                const fileName = req.body.fileName;

                WorkflowPlayController.signWorkflow(
                    dbPrefix,
                    currentUser,
                    workflowPlayId,
                    fileName,
                )
                    .then((result) => {
                        res.send(result);
                        res.end();
                        result = undefined;
                    })
                    .catch((err) => {
                        res.status(statusHTTP.internalServer);
                        Router.LogAndMessage(
                            res,
                            'post/office/workflow_play/:workflowPlayId/sign',
                            err,
                        );
                        res.end();
                        err = undefined;
                    })
                    .finally(() => {
                        res = undefined;
                        req = undefined;
                    });
            };
        },
    ),
);

router.post(
    '/complete',
    MultiTenant.match({ module_key: ['office'] }),
    PermissionProvider.check(['Authorized']),
    Router.trycatchFunction('post/workflow_play/complete', function (req, res) {
        return function () {
            const dbPrefix = CommonUtils.getDbNamePrefix(req);
            const currentUser = req.body.session;

            WorkflowPlayController.complete(dbPrefix, currentUser, req).then(
                function (data) {
                    res.send(data);
                    res.end();
                    data = undefined;
                    return;
                })
                .then((result) => {
                    res.send(result);
                    res.end();
                    result = undefined;
                })
                .catch((err) => {
                    res.status(statusHTTP.internalServer);
                    Router.LogAndMessage(
                        res,
                        'post/office/workflow_play/:workflowPlayId/complete',
                        err,
                    );
                    res.end();
                    err = undefined;
                })
                .finally(() => {
                    res = undefined;
                    req = undefined;
                });
        };
    })
);

router.post(
    '/receiver',
    MultiTenant.match({ module_key: ['office'] }),
    PermissionProvider.check(['Authorized']),
    Router.trycatchFunction('post/workflow_play/receiver', function (req, res) {
        return function () {
            WorkflowPlayController.receiver(req).then(
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
                    Router.LogAndMessage(res, 'post/workflow_play/receiver', err);
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
