const { LogProvider } = require('../log_nohierarchy/log.provider');
const { MongoDBProvider } = require('../mongodb/db.provider');
const mongoDBSettings = require('../mongodb/mongodb.const');
const { messageHTTP, statusHTTP } = require('../../utils/setting');
const q = require('q');
const setting = require('../../utils/setting');

const PNT_TENANT = require('./pnt-tenant');
class MultiTenant {
    constructor() { }
    handleDomain(domain) {
        if (domain.indexOf("https://") !== -1) {
            if (domain.indexOf("https://www.") !== -1) {
                return domain.split("https://www.")[1];

            } else {
                return domain.split("https://")[1];

            }
        }
        if (domain.indexOf("http://www.") !== -1) {
            return domain.split("http://www.")[1];

        } else {
            return domain.split("http://")[1];

        }
    }

    handleSubdomain(domain) {
        if (domain.indexOf(setting.hostDomain) !== -1) {
            return domain.split(setting.hostDomain)[0];
        }
        return domain;
    }


    loadService(domain, subdomain, conditions) {

        let dfd = q.defer();
        let filter = {
            $and: [
                {
                    $or: [
                        { domain: { $eq: domain } },
                        { subdomain: { $eq: subdomain } }
                    ]
                },
                { status: { $in: ["Running", "Maintain"] } }
            ]
        };
        if (conditions) {
            if (conditions.module_key) {
                filter.$and.push(
                    { module_key: { $in: conditions.module_key } }
                );
            }

            if (conditions.package_key) {
                filter.$and.push(
                    { package_key: { $in: conditions.package_key } }
                );
            }

            if (conditions.quantity_package) {
                filter.$and.push(
                    { quantity_package: { $in: conditions.quantity_package } }
                );
            }
        }


        MongoDBProvider.load(undefined, mongoDBSettings.connectName.host.business, "service", filter
        ).then(function (data) {
            if (data[0]) {
                dfd.resolve(data);
            } else {
                dfd.resolve(false);
            }

        }, function (err) {
            dfd.reject(err);
            err = undefined;
        });
        return dfd.promise;
    }

    match(conditions) {
        return function (req, res, next) {

            // We are setting for only PNT tenant, so we don't need to loadService from DB
            /**if (req.path === '/') return next();
            let obj = new MultiTenant();
            let origin = setting.modeProduction === 'production' ? req.get('origin') : 'http://localhost:3001';
            let domain = obj.handleDomain(origin);
            let subdomain = obj.handleSubdomain(domain);
            obj.loadService(domain, subdomain, conditions).then(function (service) {

                if (service === false) {
                    res.status(statusHTTP.unregistered);
                    res.send({ mes: messageHTTP.unregistered });
                    res.end();
                    return;
                }
                let validServices = [];
                let maintainServices = [];
                let d = new Date();
                for (var i in service) {
                    if (service[i].register_date <= d.getTime()
                        && service[i].expire_date >= d.getTime()
                        && service[i].status === 'Running') {
                        validServices.push(service[i]);
                    }
                    if (service[i].register_date <= d.getTime()
                        && service[i].expire_date >= d.getTime()
                        && service[i].status === 'Maintain') {
                        maintainServices.push(service[i]);
                    }
                }

                if (!validServices[0]) {
                    if (!maintainServices[0]) {
                        res.status(statusHTTP.outOfDate);
                        res.send({ mes: messageHTTP.outOfDate });
                        res.end();
                        return;
                    } else {
                        res.status(statusHTTP.maintenance);
                        res.send({ mes: messageHTTP.maintenance });
                        res.end();
                        return;
                    }
                }


                req.body = req.body || {};
                req.body._service = validServices;
                next();
                return;

            }, function (err) {
                LogProvider.error(err.toString(), "MultiTenant.match.loadService", "api", "checkMutiTenant");
                res.status(statusHTTP.authorized);
                res.send({ mes: messageHTTP.authorized });
                res.end();
                err = undefined;
                return;
            });*/

            req.body = req.body || {};
            req.body._service = [PNT_TENANT];
            next();
            return;
        }
    }

    isHost() {
        return function (req, res, next) {
            next();
            return;
        }
    }

    getActiveTenants() {
        let dfd = q.defer();
        let filter = {
            $and: [
                { status: { $in: ["Running"] } },
                { $expr: { $gt: ["expire_date", { $toLong: "$$NOW" }] } }
            ]
        };

        MongoDBProvider.load(undefined, mongoDBSettings.connectName.host.business, "service", filter)
            .then(function (data) {
                dfd.resolve(data);
            }, function (err) {
                dfd.reject(err);
                err = undefined;
            });
        return dfd.promise;
    }
}

exports.MultiTenant = new MultiTenant();