const trycatch = require("trycatch");

const { LogProvider } = require("../log_nohierarchy/log.provider");
const { statusHTTP, messageHTTP } = require("../../utils/setting");
const BaseError = require("../error/BaseError");

class Router {
    constructor() { }

    LogAndMessage(res, api, obj) {
        res.status(statusHTTP.internalServer);
        if (obj instanceof BaseError) {
            res.status(obj.statusCode);
        }
        if (obj.err) {
            LogProvider.error(obj.err, obj.path, "api", api);
        }
        if (!obj.mes) {
            res.send({ mes: messageHTTP.internalServer });
        } else {
            res.send({ mes: obj.mes });
        }
    }


    trycatchFunction(apiName, func) {
        return function (req, res) {
            let obj = new Router();
            let myfunc = func(req,res);
            return trycatch(myfunc, function (err) {
                res.status(statusHTTP.internalServer);
                res.set("Connection", "close");
                console.log(err);
                obj.LogAndMessage(res,apiName, { path: "router.trycatch", err: JSON.stringify(err) });
                res.end();
                err = undefined;
                res = undefined;
                req = undefined;
                obj = undefined;
                myfunc = undefined;
                apiName = undefined;
                func = undefined;
                process.abort();
                return;
            });
        }
    }

}

exports.Router = new Router();
