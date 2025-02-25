const express = require('express');
const router = express.Router();
const { ExamScheduleController } = require('./controller');
const { validation } = require('./validation');
const { PermissionProvider } = require('../../../shared/permission/permission.provider');
const { statusHTTP } = require('../../../utils/setting');
const { Router } = require('../../../shared/router/router.provider');
const { MultiTenant } = require('../../../shared/multi_tenant/provider');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
router.post(
    '/import',
    upload.single('file'),
    MultiTenant.match({ module_key: ['education'] }),
    PermissionProvider.check(['Education.ExamSchedule.Use']),
    // validation.fileValidation,
    Router.trycatchFunction('post/education/exam_schedule/import', function (req, res) {
        return function () {
            ExamScheduleController.import_file(req).then(
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
                    Router.LogAndMessage(res, 'post/education/exam_schedule/import', err);
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
    '/upload',
    MultiTenant.match({ module_key: ['education'] }),
    PermissionProvider.check(['Education.ExamSchedule.Use']),
    Router.trycatchFunction('post/education/exam_schedule/upload', function (req, res) {
        return function () {
            ExamScheduleController.upload(req).then(
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
                    Router.LogAndMessage(res, 'post/education/exam_schedule/upload', err);
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
    '/countFilesUpload',
    MultiTenant.match({ module_key: ['education'] }),
    PermissionProvider.check(['Education.ExamSchedule.Use']),
    Router.trycatchFunction('post/education/exam_schedule/countFilesUpload', function (req, res) {
        return function () {
            ExamScheduleController.countFilesUpload(req).then(
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
                    Router.LogAndMessage(res, 'post/education/exam_schedule/countFilesUpload', err);
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
    '/getFilesUpload',
    MultiTenant.match({ module_key: ['education'] }),
    PermissionProvider.check(['Education.ExamSchedule.Use']),
    Router.trycatchFunction('post/education/exam_schedule/getFilesUpload', function (req, res) {
        return function () {
            ExamScheduleController.getFilesUpload(req).then(
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
                    Router.LogAndMessage(res, 'post/education/exam_schedule/getFilesUpload', err);
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
    '/deleteExamSchedule',
    MultiTenant.match({ module_key: ['education'] }),
    PermissionProvider.check(['Education.StudyPlan.Use']),
    validation.deleteExamSchedule,
    Router.trycatchFunction('post/education/study_plan/deleteExamSchedule', function (req, res) {
        return function () {
            ExamScheduleController.deleteExamSchedule(req).then(
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
                    Router.LogAndMessage(res, 'post/education/study_plan/deleteExamSchedule', err);
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
