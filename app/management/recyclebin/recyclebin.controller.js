

const q = require('q');
const { RecycleBinService } = require('./recyclebin.service');

const countFilterCondition = function (body) {
    let count = 0;
    if (body.search !== undefined && body.search !== "") {
        count++;
    }
    return count;
}

const genFilterData = function (body) {
    let count = countFilterCondition(body);
    if (count == 0) { return {}; }
    let filter;
    if (count > 1) {
        filter = { $and: [] };
        if (body.isactive !== undefined) {
            filter.$and.push({ isactive: { $eq: body.isactive } });
        }
        if (body.search !== undefined && body.search !== "") {
            filter.$and.push({
                $or: [
                    { username: { $regex: body.search, $options: "i" } },
                    { collection: { $regex: body.search, $options: "i" } }
                ]
            });

        }
    } else {
        if (body.isactive !== undefined) {
            filter = { isactive: { $eq: body.isactive } };
        }
        if (body.search !== undefined) {
            filter = {
                $or: [
                    { username: { $regex: body.search, $options: "i" } },
                    { collection: { $regex: body.search, $options: "i" } }
                ]
            };
        }
    }
    return filter;
}


class RecycleBinController {
    constructor() { }

    load(body) {
        let dfd = q.defer();
        let filter = genFilterData(body);
        RecycleBinService.load(body._service[0].dbname_prefix, filter, body.top, body.offset, body.sort).then(function (res) {
            dfd.resolve(res);
            res = undefined;
            dfd = undefined;
        }, function (err) {
            dfd.reject(err);
            err = undefined;
        });
        return dfd.promise;
    }

    loadDeatails(body) {
        return RecycleBinService.loadDetails(body._service[0].dbname_prefix, body.id);
    }

    count(body) {
        
        let filter = genFilterData(body);
        return RecycleBinService.count(body._service[0].dbname_prefix,filter);
    }

    delete(body) {
        return  RecycleBinService.delete(body._service[0].dbname_prefix,body.idar, body.username)
    }

    restore(body) {
        let dfd = q.defer();
        let dfdAr = [];
        for (let i in body.data) {
            dfdAr.push(RecycleBinService.restore(body._service[0].dbname_prefix,body.username, body.data[i].dbname, body.data[i].collection, body.data[i].idar));
        }
        q.all(dfdAr).then(function (res) {
            dfd.resolve(res);
            res = undefined;
            dfd = undefined;
            body = undefined;
        }, function (err) {
            dfd.reject({ path: "RecycleBinController.restore.execute", err });
            err = undefined;
            body = undefined;
        });
        dfdAr = undefined;

        return dfd.promise;
    }
}

exports.RecycleBinController = new RecycleBinController();