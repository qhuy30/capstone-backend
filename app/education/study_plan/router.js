const express = require('express');
const router = express.Router();
const { StudyPlanController } = require('./controller');
const { validation } = require('./validation');
const { PermissionProvider } = require('../../../shared/permission/permission.provider');
const { statusHTTP } = require('../../../utils/setting');
const { Router } = require('../../../shared/router/router.provider');
const { MultiTenant } = require('../../../shared/multi_tenant/provider');
const multer = require('multer');
const xlsx = require('xlsx');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
router.post(
    '/import',
    upload.single('file'),
    MultiTenant.match({ module_key: ['education'] }),
    PermissionProvider.check(['Education.StudyPlan.Use']),
    validation.fileValidation,
    Router.trycatchFunction('post/education/study_plan/import', function (req, res) {
        return function () {
            StudyPlanController.import_file(req).then(
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
                    Router.LogAndMessage(res, 'post/education/study_plan/import', err);
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
    PermissionProvider.check(['Education.StudyPlan.Use']),
    Router.trycatchFunction('post/education/study_plan/upload', function (req, res) {
        return function () {
            StudyPlanController.upload(req).then(
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
                    Router.LogAndMessage(res, 'post/education/study_plan/upload', err);
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
    PermissionProvider.check(['Education.StudyPlan.Use']),
    Router.trycatchFunction('post/education/study_plan/getFilesUpload', function (req, res) {
        return function () {
            StudyPlanController.getFilesUpload(req).then(
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
                    Router.LogAndMessage(res, 'post/education/study_plan/getFilesUpload', err);
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
    PermissionProvider.check(['Education.StudyPlan.Use']),
    Router.trycatchFunction('post/education/study_plan/countFilesUpload', function (req, res) {
        return function () {
            StudyPlanController.countFilesUpload(req).then(
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
                    Router.LogAndMessage(res, 'post/education/study_plan/countFilesUpload', err);
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
    '/deleteStudyPlan',
    MultiTenant.match({ module_key: ['education'] }),
    PermissionProvider.check(['Education.StudyPlan.Use']),
    validation.deleteStudyPlan,
    Router.trycatchFunction('post/education/study_plan/deleteStudyPlan', function (req, res) {
        return function () {
            StudyPlanController.deleteStudyPlan(req).then(
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
                    Router.LogAndMessage(res, 'post/education/study_plan/deleteStudyPlan', err);
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
