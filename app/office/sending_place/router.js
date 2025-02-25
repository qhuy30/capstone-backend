const express = require("express");
const router = express.Router();
const { SendingPlaceController } = require("./controller");
const { validation } = require("./validation");
const {
  PermissionProvider,
} = require("../../../shared/permission/permission.provider");
const { statusHTTP } = require("../../../utils/setting");
const { Router } = require("../../../shared/router/router.provider");
const { MultiTenant } = require("../../../shared/multi_tenant/provider");

router.post(
  "/load",
  MultiTenant.match({ module_key: ["office"] }),
  PermissionProvider.check(["Authorized"]),
  validation.load,
  Router.trycatchFunction(
    "post/office/sending-place/load",
    function (req, res) {
      return function () {
        SendingPlaceController.load(req.body).then(
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
            Router.LogAndMessage(res, "post/office/sending-place/load", err);
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
  "/count",
  MultiTenant.match({ module_key: ["office"] }),
  PermissionProvider.check(["Authorized"]),
  validation.count,
  Router.trycatchFunction("post/sending-place/count", function (req, res) {
    return function () {
      SendingPlaceController.count(req.body).then(
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
          Router.LogAndMessage(res, "post/sending-place/count", err);
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
  "/insert",
  MultiTenant.match({ module_key: ["office"] }),
  PermissionProvider.check(["Authorized"]),
  validation.insert,
  Router.trycatchFunction(
    "post/office/sending-place/insert",
    function (req, res) {
      return function () {
        SendingPlaceController.insert(req.body).then(
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
            Router.LogAndMessage(res, "post/office/sending-place/insert", err);
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
  "/update",
  MultiTenant.match({ module_key: ["office"] }),
  PermissionProvider.check(["Authorized"]),
  validation.update,
  Router.trycatchFunction(
    "post/office/sending-place/update",
    function (req, res) {
      return function () {
        SendingPlaceController.update(req.body).then(
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
            Router.LogAndMessage(res, "post/office/sending-place/update", err);
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
  "/delete",
  MultiTenant.match({ module_key: ["office"] }),
  PermissionProvider.check(["Authorized"]),
  validation.delete,
  Router.trycatchFunction(
    "post/office/sending-place/delete",
    function (req, res) {
      return function () {
        SendingPlaceController.delete(req.body).then(
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
            Router.LogAndMessage(res, "post/office/sending-place/delete", err);
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
