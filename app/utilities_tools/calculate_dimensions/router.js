const express = require('express');
const router = express.Router();
const { CalculateDimensionsController } = require('./controller');
// const { validation } = require('./validation');
const { PermissionProvider } = require('../../../shared/permission/permission.provider');
const { statusHTTP } = require('../../../utils/setting');
const { Router } = require('../../../shared/router/router.provider');
const { MultiTenant } = require('../../../shared/multi_tenant/provider');
const multer = require('multer');
const path = require('path');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
router.post(
    '/calculate',
    upload.array('files'),
    // PermissionProvider.check(['UtilitiesTool.PDFToExcel.Use']),
    Router.trycatchFunction('post/utilities_tools/calculate_dimensions/calculate', function (req, res) {
        return function () {

            CalculateDimensionsController.calculate(req).then(
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
                    Router.LogAndMessage(res, 'post/utilities_tools/calculate_dimensions/calculate', err);
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
