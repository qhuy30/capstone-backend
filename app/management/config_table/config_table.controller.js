const q = require('q');
const { ConfigTableService } = require('./config_table.service');

const countFilterCondition = function (body) {
    let count = 0;
    if (body.search !== undefined && body.search !== '') {
        count++;
    }
    return count;
};

const genFilterData = function (body) {
    let filter = { $and: [] };

    if (body.project) {
        filter.$and.push({ project: { $eq: body.project } });
    }

    if (body.department) {
        filter.$and.push({ department: { $eq: body.department } });
    }

    return filter;
};

class ConfigTableController {
    constructor() {}

    load(body) {
        let dfd = q.defer();
        let filter = genFilterData(body);
        ConfigTableService.load(body._service[0].dbname_prefix, filter).then(
            function (res) {
                dfd.resolve(res);
                res = undefined;
                dfd = undefined;
            },
            function (err) {
                dfd.reject(err);
                err = undefined;
            }
        );
        return dfd.promise;
    }

    update(body) {
        let dfd = q.defer();
        let filter = genFilterData(body);
        ConfigTableService.load(body._service[0].dbname_prefix, filter).then(
            function (res) {
                if (res[0]) {
                    ConfigTableService.update(body._service[0].dbname_prefix, body.username, res[0]._id, body.config).then(
                        function (data) {
                            dfd.resolve(data);
                            res = undefined;
                            dfd = undefined;
                        },
                        function (err) {
                            dfd.reject(err);
                            err = undefined;
                        }
                    );
                } else {
                    ConfigTableService.insert(body._service[0].dbname_prefix, body.username, body.project, body.department, body.config).then(
                        function (data) {
                            dfd.resolve(data);
                            res = undefined;
                            dfd = undefined;
                        },
                        function (err) {
                            dfd.reject(err);
                            err = undefined;
                        }
                    );
                }
            },
            function (err) {
                dfd.reject(err);
                err = undefined;
            }
        );
        return dfd.promise;
    }
}

exports.ConfigTableController = new ConfigTableController();
