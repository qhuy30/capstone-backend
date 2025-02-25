
const q = require('q');
const { OrganizationService, GroupOrganizationService } = require('./organization.service');


const genFilter = function (body) {
    if (body.level === 1) {
        return { level: { $eq: 1 } };
    } else {
        return {
            $and: [
                { level: { $eq: body.level } },
                { parent: { $eq: body.id } }
            ]
        }
    }
}

const genFilter_workflow = function (body) {
    if (body.level === 1) {
        return { level: { $eq: 1 } };
    } else {
        return {
            $and: [
                { level: { $eq: body.level } },
                { parent: { $eq: body.id } }
            ]
        }
    }
}

const genFilter_pick_user_directive = function (body) {
    if (body.level === 1) {
        return { level: { $eq: 1 } };
    } else {
        return {
            $and: [
                { level: { $eq: body.level } },
                { parent: { $eq: body.id } }
            ]
        }
    }
}

const genFilter_department_branch = function (body) {
    if (body.level === 1) {
        return {
            $and: [
                {
                    $or: [
                        { type: { $eq: "department" } },
                        { type: { $eq: "branch" } }
                    ]
                },
                { level: { $eq: 1 } }
            ]
        };
    } else {
        return {
            $and: [
                {
                    $or: [
                        { type: { $eq: "department" } },
                        { type: { $eq: "branch" } }
                    ]
                },
                { level: { $eq: body.level } },
                { parent: { $eq: body.id } }
            ]
        }
    }
}

const generateLoadedData = function (data) {
    for (var i in data) {
        for (var j in data) {
            if (data[j].parent.indexOf(data[i].key) !== -1) {
                data[i].child = true;
                break;
            }
        }
    }
    return data;
}

const generateFilterWithTaskDetails = function (data) {
    let filter = { $and: [] };

    // First, by default is query with id
    filter.$and.push({ department: { $eq: data.id } });

    // Second, if has any filters in bodyRequest, add them to the filter of DB
    if (data.fromDate && data.toDate) {
        filter.$and.push({
            $or: [
                {
                    $and: [
                        { from_date: { $lte: data.fromDate } },
                        { to_date: { $gte: data.fromDate } }
                    ]
                },
                {
                    $and: [
                        { from_date: { $lte: data.toDate } },
                        { to_date: { $gte: data.toDate } }
                    ]
                },
                {
                    $and: [
                        { from_date: { $gte: data.fromDate } },
                        { to_date: { $lte: data.toDate } }
                    ]
                },
                {
                    $and: [
                        { from_date: { $lte: data.fromDate } },
                        { to_date: { $gte: data.toDate } }
                    ]
                }
            ]
        });
    }

    if (data.status) {
        for (const i in data.status) {
            filter.$and.push({ status: { $eq: data.status[i] } });
        }
    }

    if (data.priority) {
        for (const i in data.priority) {
            filter.$and.push({ priority: { $eq: data.priority[i] } });
        }
    }

    if (data.filterPerson) {
        for (const i in data.filterPerson) {
            const personType = data.filterPerson[i];
            if (personType.main_person) {
                for (const j in personType.main_person) {
                    const _idPerson = personType.main_person[j];
                    filter.$and.pust({ main_person: { $eq: new require('mongodb').ObjectID(_idPerson) } });
                }
            }
        }
    }

    return filter;
}

class OrganizationController {
    constructor() { }

    loadAllDepartment(body) {
        const keys = { 
            title: 1,
            id: 1,
            abbreviation: 1
        };
        return OrganizationService.loadAllDepartment(body._service[0].dbname_prefix, keys);
    }

    load(body) {
        return OrganizationService.load(body._service[0].dbname_prefix, genFilter(body));
    }

    load_for_workflow(body) {
        const userRules = body.session.rule;
        const isSpecific = userRules.some(rule => rule.rule === 'Management.DesignWorkflow.Create' && rule.details && rule.details.type === 'Working');
        return OrganizationService.load_for_workflow(body._service[0].dbname_prefix, isSpecific ? body.session.employee_details.department : null, genFilter_workflow(body));
    }


    load_for_pick_user_directive(body){
        return OrganizationService.load_for_pick_user_directive(body._service[0].dbname_prefix, genFilter_pick_user_directive(body));
    }

    load_department_branch(body) {
        let dfd = q.defer();
        OrganizationService.load_department_branch(body._service[0].dbname_prefix, genFilter_department_branch(body)).then(function (res) {
            dfd.resolve(generateLoadedData(res));
            res = undefined;
            dfd = undefined;
        }, function (err) {
            dfd.reject(err);
            err = undefined;
        });
        return dfd.promise;
    }

    loadDetails(body) {
        return OrganizationService.loadDetails(body._service[0].dbname_prefix, body.id);
    }

    loadDetailWithTasks(body) {
        return OrganizationService.loadDetailWithTasks(body._service[0].dbname_prefix, body.id, generateFilterWithTaskDetails(body));
    }

    loadDetails_multi(body) {
        return OrganizationService.loadDetails_multi(body._service[0].dbname_prefix, body.id);
    }
    insert(body) {
        return OrganizationService.insert(
            body._service[0].dbname_prefix,
            body.username,
            body.ordernumber,
            body.title,
            body.icon,
            body.parent,
            body.level,
            body.isactive,
            body.abbreviation,
            body.leader,
            body.departmentLeader,
            body.type
        );
    }

    update(body) {
        return OrganizationService.update(
            body._service[0].dbname_prefix,
            body.username,
            body.id,
            body.ordernumber,
            body.title,
            body.icon,
            body.parent,
            body.level,
            body.isactive,
            body.abbreviation,
            body.leader,
            body.departmentLeader,
            body.type
        );
    }
    delete(body) {
        return OrganizationService.delete(body._service[0].dbname_prefix, body.id, body.username);
    }

    loadAllEmployee(body, organizationId) {
        return OrganizationService.loadAllEmployee(body._service[0].dbname_prefix, organizationId);
    }

    loadMultipleEmployee (body) {
        return OrganizationService.loadMultipleEmployee(body._service[0].dbname_prefix, body);
    }

}

class GroupOrganizationController {

    constructor() {}

    loadAll(dbNamePrefix, currentUser, filter) {
        return GroupOrganizationService.loadAll(dbNamePrefix, currentUser.username, filter);
    }

    insertGroup(dbNamePrefix, currentUser, body) {
        return GroupOrganizationService.insertGroup(dbNamePrefix, currentUser.username, body);
    }

    updateGroup(dbNamePrefix, currentUser, body) {
        return GroupOrganizationService.updateOrganizationsGroup(dbNamePrefix, currentUser.username, body.id, body);
    }

}

exports.OrganizationController = new OrganizationController();
exports.GroupOrganizationController = new GroupOrganizationController();
