const { SessionProvider } = require('../redis/session.provider');
const { messageHTTP, statusHTTP } = require('../../utils/setting');

class PermissionProvider {
    constructor() { }
 

    check(rule) {
        return function (req, res, next) {
           
            SessionProvider.verify(req, res).then(function (data) {
                req = data;
                if (typeof rule === "string") {
                    if ( req.body.session.rule.filter(e => e.rule === "*" || e.rule === rule).length == 0) {
                        res.status(statusHTTP.forbidden);
                        res.send({ mes: messageHTTP.forbidden });
                        res.end();
                    } else {
                        next();
                    }
                }

                if (typeof rule === "object") {
                    let check = false;
                    for (var i in rule) {
                        if (req.body.session.rule.filter(e => e.rule === "*" || e.rule === rule[i]).length > 0) {
                            check = true;
                            next();
                            break;
                        }
                    }
                    if (!check) {
                        res.status(statusHTTP.forbidden);
                        res.send({ mes: messageHTTP.forbidden });
                        res.end();
                    }
                    check = undefined;
                }
                data = undefined;

            }, function (err) {
                res.status(statusHTTP.authorized);
                res.send({ mes: messageHTTP.authorized });
                res.end();
                err = undefined;
                req = undefined;
                res = undefined;
                next = undefined;
                return;
            });
        }
    }
}

exports.PermissionProvider = new PermissionProvider();