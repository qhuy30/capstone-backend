

const q = require('q');
const { GroupService } = require('./group.service');
const { ItemSetup } = require('../../../shared/setup/items.const');
const countFilterCondition = function (body) {
    let count = 0;
    if (body.isactive !== undefined) {
        count++;
    }
    if (body.search !== undefined && body.search !== "") {
        count++;
    }
    return count;
}

const genFilterData = function (body, count) {
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
                    { title: { $regex: body.search, $options: "i" } },
                    { key: { $regex: body.search, $options: "i" } }
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
                    { title: { $regex: body.search, $options: "i" } },
                    { key: { $regex: body.search, $options: "i" } }
                ]
            };
        }
    }
    return filter;
}

const checkExistRule = function (key) {
    let dfd = q.defer();
    let check = false;
    let ItemRule = ItemSetup.getItems("management", "rule");
    for (var i in ItemRule) {
        if (ItemRule[i].key === key) {
            check = true;
            break;
        }
    }
    if (check) {
        dfd.resolve(true);
    } else {
        dfd.reject({ path: "GroupController.checkExistRule.RuleIsNotExists", err: "RuleIsNotExists" });
    }
    return dfd.promise;
}

const checkExistRole = function (key) {
    let dfd = q.defer();
    let check = false;
    let ItemRole = ItemSetup.getItems("management", "role");
    for (var i in ItemRole) {
        if (ItemRole[i].key === key) {
            check = true;
            break;
        }
    }
    if (check) {
        dfd.resolve(true);
    } else {
        dfd.reject({ path: "GroupController.checkExistRole.RoleIsNotExists", err: "RoleIsNotExists" });
    }
    return dfd.promise;
}



class GroupController {
    constructor() { }
    load(body) {
        let count = countFilterCondition(body);
        let filter = genFilterData(body, count);
        return GroupService.load(body._service[0].dbname_prefix, filter, body.top, body.offset, body.sort);
    }

    count(body) {
        let count = countFilterCondition(body);
        let filter = genFilterData(body, count);
        return GroupService.count(body._service[0].dbname_prefix, filter);
    }


    insert(body) {
        return GroupService.insert(body._service[0].dbname_prefix, body.username, body.title, body.isactive);
    }

    update(body) {
        return GroupService.update(
            body._service[0].dbname_prefix,
            body.username,
            body.id,
            body.title,
            body.isactive,
            body.user,
            body.role,
            body.competence,
        );
    }

    delete(body) {
        return GroupService.delete(body._service[0].dbname_prefix, body.id, body.username);
    }

    pushRule(body) {
        return GroupService.pushRule(body._service[0].dbname_prefix, body.username, body.id, body.rule);
    }

    removeRule(body) {
        return GroupService.removeRule(body._service[0].dbname_prefix, body.username, body.id, body.rule);
    }

}

exports.GroupController = new GroupController();
