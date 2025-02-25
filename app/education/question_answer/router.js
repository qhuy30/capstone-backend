const express = require('express');
const { SessionProvider } = require('../../../shared/redis/session.provider');
const { PermissionProvider } = require('../../../shared/permission/permission.provider');
const { Router } = require('../../../shared/router/router.provider');
const { QuestionAnswerController } = require('./controller');
const { MultiTenant } = require('../../../shared/multi_tenant/provider');
const { statusHTTP } = require('../../../utils/setting');
const { validation } = require('./validation');

const router = express.Router();

router.post(
    '/createFrequentlyQuestions',
    MultiTenant.match({ module_key: ['education'] }),
    SessionProvider.match,
    PermissionProvider.check(['Education.QnA.Use']),
    validation.createFrequentlyQuestions,
    Router.trycatchFunction('post/education/question_answer/createFrequentlyQuestions', function (req, res) {
        return function () {
            QuestionAnswerController.createFrequentlyQuestions(req).then(
                function (data) {
                    res.send(data);
                    res.end();
                    data = undefined;
                    res = undefined;
                    req = undefined;
                    return;
                },
                function (err) {
                    res.status(statusHTTP.badRequest);
                    Router.LogAndMessage(res, 'post/education/question_answer/createFrequentlyQuestions', err);
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
    '/createListQuestions',
    MultiTenant.match({ module_key: ['education'] }),
    SessionProvider.match,
    PermissionProvider.check(['Education.QnA.Use']),
    validation.createListQuestions,
    Router.trycatchFunction('post/education/question_answer/createListQuestions', function (req, res) {
        return function () {
            QuestionAnswerController.createListQuestions(req).then(
                function (data) {
                    res.send(data);
                    res.end();
                    data = undefined;
                    res = undefined;
                    req = undefined;
                    return;
                },
                function (err) {
                    res.status(statusHTTP.badRequest);
                    Router.LogAndMessage(res, 'post/education/question_answer/createListQuestions', err);
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
    '/updateFrequentlyQuestions',
    MultiTenant.match({ module_key: ['education'] }),
    SessionProvider.match,
    PermissionProvider.check(['Education.QnA.Use']),
    validation.updateFrequentlyQuestions,
    Router.trycatchFunction('post/education/question_answer/updateFrequentlyQuestions', function (req, res) {
        return function () {
            QuestionAnswerController.updateFrequentlyQuestions(req).then(
                function (data) {
                    res.send(data);
                    res.end();
                    data = undefined;
                    res = undefined;
                    req = undefined;
                    return;
                },
                function (err) {
                    res.status(statusHTTP.badRequest);
                    Router.LogAndMessage(res, 'post/education/question_answer/updateFrequentlyQuestions', err);
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
    '/updateListTypeOfQuestions',
    MultiTenant.match({ module_key: ['education'] }),
    SessionProvider.match,
    PermissionProvider.check(['Education.QnA.Use']),
    validation.updateListTypeOfQuestions,
    Router.trycatchFunction('post/education/question_answer/updateListTypeOfQuestions', function (req, res) {
        return function () {
            QuestionAnswerController.updateListTypeOfQuestions(req).then(
                function (data) {
                    res.send(data);
                    res.end();
                    data = undefined;
                    res = undefined;
                    req = undefined;
                    return;
                },
                function (err) {
                    res.status(statusHTTP.badRequest);
                    Router.LogAndMessage(res, 'post/education/question_answer/updateListTypeOfQuestions', err);
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
    '/loadListFrequentlyQuestions',
    MultiTenant.match({ module_key: ['education'] }),
    SessionProvider.match,
    PermissionProvider.check(['Education.QnA.Use']),
    Router.trycatchFunction('post/education/question_answer/loadListFrequentlyQuestions', function (req, res) {
        return function () {
            QuestionAnswerController.loadListFrequentlyQuestions(req.body).then(
                function (data) {
                    res.send(data);
                    res.end();
                    data = undefined;
                    res = undefined;
                    req = undefined;
                    return;
                },
                function (err) {
                    res.status(statusHTTP.badRequest);
                    Router.LogAndMessage(res, 'post/education/question_answer/loadListFrequentlyQuestions', err);
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
    '/loadListTypeOfQuestions',
    MultiTenant.match({ module_key: ['education'] }),
    SessionProvider.match,
    PermissionProvider.check(['Education.QnA.Use']),
    Router.trycatchFunction('post/education/question_answer/loadListTypeOfQuestions', function (req, res) {
        return function () {
            QuestionAnswerController.loadListTypeOfQuestions(req.body).then(
                function (data) {
                    res.send(data);
                    res.end();
                    data = undefined;
                    res = undefined;
                    req = undefined;
                    return;
                },
                function (err) {
                    res.status(statusHTTP.badRequest);
                    Router.LogAndMessage(res, 'post/education/question_answer/loadListTypeOfQuestions', err);
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
    '/loadDetailsFrequentlyQuestion',
    MultiTenant.match({ module_key: ['education'] }),
    SessionProvider.match,
    PermissionProvider.check(['Education.QnA.Use']),
    Router.trycatchFunction('post/education/question_answer/loadDetailsFrequentlyQuestion', function (req, res) {
        return function () {
            QuestionAnswerController.loadDetailsFrequentlyQuestionById(req.body).then(
                function (data) {
                    res.send(data);
                    res.end();
                    data = undefined;
                    res = undefined;
                    req = undefined;
                    return;
                },
                function (err) {
                    res.status(statusHTTP.badRequest);
                    Router.LogAndMessage(res, 'post/education/question_answer/loadDetailsFrequentlyQuestion', err);
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
    '/deleteFrequentlyQuestions',
    MultiTenant.match({ module_key: ['education'] }),
    SessionProvider.match,
    PermissionProvider.check(['Education.QnA.Use']),
    validation.delete,
    Router.trycatchFunction('post/education/question_answer/deleteFrequentlyQuestions', function (req, res) {
        return function () {
            QuestionAnswerController.deleteFrequentlyQuestions(req).then(
                function (data) {
                    res.send(data);
                    res.end();
                    data = undefined;
                    res = undefined;
                    req = undefined;
                    return;
                },
                function (err) {
                    res.status(statusHTTP.badRequest);
                    Router.LogAndMessage(res, 'post/education/question_answer/deleteFrequentlyQuestions', err);
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
    '/deleteListTypeOfQuestions',
    MultiTenant.match({ module_key: ['education'] }),
    SessionProvider.match,
    PermissionProvider.check(['Education.QnA.Use']),
    validation.delete,
    Router.trycatchFunction('post/education/question_answer/deleteListTypeOfQuestions', function (req, res) {
        return function () {
            QuestionAnswerController.deleteListTypeOfQuestions(req).then(
                function (data) {
                    res.send(data);
                    res.end();
                    data = undefined;
                    res = undefined;
                    req = undefined;
                    return;
                },
                function (err) {
                    console.log('🚀🚀 ~ file: router.js:62 ~ err:', err);
                    res.status(statusHTTP.badRequest);
                    Router.LogAndMessage(res, 'post/education/question_answer/deleteListTypeOfQuestions', err);
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
    '/countFrequentlyQuestions',
    MultiTenant.match({ module_key: ['education'] }),
    PermissionProvider.check(['Education.QnA.Use']),
    Router.trycatchFunction('post/education/question_answer/countFrequentlyQuestions', function (req, res) {
        return function () {
            QuestionAnswerController.countFrequentlyQuestions(req.body).then(
                function (data) {
                    res.send({ count: data });
                    res.end();
                    data = undefined;
                    res = undefined;
                    req = undefined;
                    return;
                },
                function (err) {
                    res.status(statusHTTP.internalServer);
                    Router.LogAndMessage(res, 'post/education/question_answer/countFrequentlyQuestions', err);
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
    '/countTypeQuestions',
    MultiTenant.match({ module_key: ['education'] }),
    PermissionProvider.check(['Education.QnA.Use']),
    Router.trycatchFunction('post/education/question_answer/countTypeQuestions', function (req, res) {
        return function () {
            QuestionAnswerController.countTypeQuestions(req.body).then(
                function (data) {
                    res.send({ count: data });
                    res.end();
                    data = undefined;
                    res = undefined;
                    req = undefined;
                    return;
                },
                function (err) {
                    res.status(statusHTTP.internalServer);
                    Router.LogAndMessage(res, 'post/education/question_answer/countTypeQuestions', err);
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
    '/answerQuestions',
    MultiTenant.match({ module_key: ['education'] }),
    PermissionProvider.check(['Education.QnA.Use']),
    Router.trycatchFunction('post/education/question_answer/answerQuestions', function (req, res) {
        return function () {
            QuestionAnswerController.answerQuestion(req.body).then(
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
                    Router.LogAndMessage(res, 'post/education/question_answer/answerQuestions', err);
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
    '/loadStudentQuestions',
    MultiTenant.match({ module_key: ['education'] }),
    SessionProvider.match,
    PermissionProvider.check(['Education.QnA.Use']),
    Router.trycatchFunction('post/education/question_answer/loadStudentQuestions', function (req, res) {
        return function () {
            QuestionAnswerController.loadStudentQuestions(req.body).then(
                function (data) {
                    res.send(data);
                    res.end();
                    data = undefined;
                    res = undefined;
                    req = undefined;
                    return;
                },
                function (err) {
                    res.status(statusHTTP.badRequest);
                    Router.LogAndMessage(res, 'post/education/question_answer/loadStudentQuestions', err);
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
    '/countStudentQuestions',
    MultiTenant.match({ module_key: ['education'] }),
    PermissionProvider.check(['Education.QnA.Use']),
    Router.trycatchFunction('post/education/question_answer/countStudentQuestions', function (req, res) {
        return function () {
            QuestionAnswerController.countStudentQuestions(req.body).then(
                function (data) {
                    res.send({ count: data });
                    res.end();
                    data = undefined;
                    res = undefined;
                    req = undefined;
                    return;
                },
                function (err) {
                    res.status(statusHTTP.internalServer);
                    Router.LogAndMessage(res, 'post/education/question_answer/countTypeQuestions', err);
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
    '/loadStudentQuestionsDetails',
    MultiTenant.match({ module_key: ['education'] }),
    SessionProvider.match,
    PermissionProvider.check(['Education.QnA.Use']),
    Router.trycatchFunction('post/education/question_answer/loadStudentQuestionsDetails', function (req, res) {
        return function () {
            QuestionAnswerController.loadStudentQuestionsDetails(req.body).then(
                function (data) {
                    res.send(data);
                    res.end();
                    data = undefined;
                    res = undefined;
                    req = undefined;
                    return;
                },
                function (err) {
                    res.status(statusHTTP.badRequest);
                    Router.LogAndMessage(res, 'post/education/question_answer/loadStudentQuestionsDetails', err);
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
    '/forwardQuestion',
    MultiTenant.match({ module_key: ['education'] }),
    SessionProvider.match,
    PermissionProvider.check(['Education.QnA.Use']),
    Router.trycatchFunction('post/education/question_answer/forwardQuestion', function (req, res) {        
        return function () {
            QuestionAnswerController.forwardQuestion(req.body).then(
                function (data) {
                    res.send(data);
                    res.end();
                    data = undefined;
                    res = undefined;
                    req = undefined;
                    return;
                },
                function (err) {
                    res.status(statusHTTP.badRequest);
                    Router.LogAndMessage(res, 'post/education/question_answer/forwardQuestion', err);
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
