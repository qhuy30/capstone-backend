const express = require("express");
const router = express.Router();

const { statusHTTP } = require("../../../utils/setting");
const { Router: RouterProvider } = require("../../../shared/router/router.provider");
const { MultiTenant } = require("../../../shared/multi_tenant/provider");
const { PermissionProvider } = require("../../../shared/permission/permission.provider");


// const ValidationProvider = require("./validation");
const { validation } = require("./validation");
const { AdvancedSearchController } = require("./controller");



router.post(
    "/load",
    MultiTenant.match({ module_key: ["office"] }),
    PermissionProvider.check(["Authorized"]),
    validation.load,
    RouterProvider.trycatchFunction("post/advanced_search/load", function (req, res) {
        return function () {
            AdvancedSearchController.load(req)
                .then((data) => {
                    res.send(data);
                })
                .catch((error) => {
                    RouterProvider.LogAndMessage(res, "post/advanced_search/load", error);
                })
                .finally(() => {
                    res.end();
                });
        };
    }),
);



module.exports = router;
