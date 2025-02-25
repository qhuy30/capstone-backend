const q = require('q');

const { ProjectService } = require('./project.service');
const { RingBellItemService } = require('../../../management/ringbell_item/service');

const { generateParent } = require('../../../../utils/util');

const genFilterData = function (body) {
    let rule = body.session.rule.filter(e => e.rule === "Office.Task.Follow_Project")[0];
    let filter = {};
    if (rule) {
        switch (rule.details.type) {
            case "All":
                if (body.search && body.search !== "") {
                    filter = { $text: { $search: body.search } };
                } else {
                    filter = {};
                }
                break;
            case "Specific":
                let idAr = [];
                for (var i in rule.details.project) {
                    idAr.push(new require('mongodb').ObjectID(rule.details.project[i]));
                }
                if (idAr.length > 0) {
                    if (body.search && body.search !== "") {
                        filter = {
                            $and: [
                                {
                                    $or: [
                                        { _id: { $in: idAr } },
                                        { participant: { $eq: body.username } },
                                        { username: { $eq: body.username } }
                                    ]
                                }
                                ,
                                { $text: { $search: body.search } },

                            ]
                        };
                    } else {
                        filter = {
                            $or: [
                                { _id: { $in: idAr } },
                                { participant: { $eq: body.username } },
                                { username: { $eq: body.username } }
                            ]
                        };
                    }
                } else {
                    filter = {};
                }
                break;
            default:
                if (body.search && body.search !== "") {
                    filter = {
                        $and: [
                            {
                                $or: [
                                    { participant: { $eq: body.username } },
                                    { username: { $eq: body.username } }
                                ]
                            },
                            { $text: { $search: body.search } }
                        ]
                    };
                } else {

                    filter = {
                        $or: [
                            { participant: { $eq: body.username } },
                            { username: { $eq: body.username } }
                        ]
                    };
                }
                break;
        }
    } else {
        if (body.search && body.search !== "") {
            filter = {
                $and: [
                    {
                        $or: [
                            { participant: { $eq: body.username } },
                            { username: { $eq: body.username } }
                        ]
                    },
                    ,
                    { $text: { $search: body.search } }
                ]
            };
        } else {

            filter = {
                $or: [
                    { participant: { $eq: body.username } },
                    { username: { $eq: body.username } }
                ]
            };
        }
    }

    return filter;

}

function genFilter_all_project_count(body) {

    let template = {
        $and: [
            {
                $or: [
                    {
                        $and: [
                            { from_date: { $lte: body.from_date } },
                            { to_date: { $gte: body.from_date } }
                        ]
                    },
                    {
                        $and: [
                            { from_date: { $lte: body.to_date } },
                            { to_date: { $gte: body.to_date } }
                        ]
                    },
                    {
                        $and: [
                            { from_date: { $gte: body.from_date } },
                            { to_date: { $lte: body.to_date } }
                        ]
                    },
                    {
                        $and: [
                            { from_date: { $lte: body.from_date } },
                            { to_date: { $gte: body.to_date } }
                        ]
                    }
                ]
            }
        ]
    }
    let filter = {
        completed: JSON.parse(JSON.stringify(template)),
        process: JSON.parse(JSON.stringify(template)),
        notstart: JSON.parse(JSON.stringify(template)),
        all: JSON.parse(JSON.stringify(template))
    };
    filter.completed.$and.push({ status: { $eq: 'Completed' } });
    filter.process.$and.push({ status: { $eq: 'Processing' } });
    filter.notstart.$and.push({ status: { $eq: 'NotStartedYet' } });

    return filter;
}

function genFilter_all_project_growth(body) {
    let template = {
        $and: [
            {
                $or: [
                    {
                        $and: [
                            { from_date: { $lte: body.from_date } },
                            { to_date: { $gte: body.from_date } }
                        ]
                    },
                    {
                        $and: [
                            { from_date: { $lte: body.to_date } },
                            { to_date: { $gte: body.to_date } }
                        ]
                    },
                    {
                        $and: [
                            { from_date: { $gte: body.from_date } },
                            { to_date: { $lte: body.to_date } }
                        ]
                    },
                    {
                        $and: [
                            { from_date: { $lte: body.from_date } },
                            { to_date: { $gte: body.to_date } }
                        ]
                    }
                ]
            }
        ]
    }
    let filter = {
        created: JSON.parse(JSON.stringify(template)),
        completed: JSON.parse(JSON.stringify(template))
    }
    filter.completed.$and.push({ status: { $eq: 'Completed' } });

    return filter;
}

class ProjectController {
    constructor() { }

    load(body, skipReference) {
        let filter = genFilterData(body);
        return ProjectService.load(body._service[0].dbname_prefix, filter, body.top, body.offset, body.sort, skipReference);
    }

    loadByDepartment(body) {
        return ProjectService.loadByDepartment(body._service[0].dbname_prefix, body);
    }

    loadJoinedProjects(body) {
        return ProjectService.loadJoinedProjects(body._service[0].dbname_prefix, body);
    }

    loadDetails_multi(body) {
        return ProjectService.loadDetails_multi(body._service[0].dbname_prefix, body._ids);
    }

    count(body) {
        let filter = genFilterData(body);
        return ProjectService.count(body._service[0].dbname_prefix, filter);
    }

    checkExist(body) {
        return ProjectService.checkExist(body._service[0].dbname_prefix, body.key);
    }

    getOrderNumber(body) {
        return ProjectService.getOrderNumber(body._service[0].dbname_prefix);
    }

    insert(body) {
        let dfd = q.defer();
        ProjectService.insert(
            body._service[0].dbname_prefix,
            body.username,
            body.title,
            body.from_date,
            body.to_date,
            body.participant || [],
            body.task_id,
            body.workflowPlay_id,
            generateParent(body.parents || [], body.parent || {})
        ).then((res) => {
            dfd.resolve(res);
            RingBellItemService.insert(body._service[0].dbname_prefix,
                body.username,
                "project_create",
                {
                    projectId: res._id.toString(), title: body.title, username_create: body.username,
                    code:res.code,
                    mes: 'just created project'
                },
                body.participant,
                [],
                "updateProject",
                new Date().getTime());
        }).catch(err => {
            dfd.reject(err);
        });

        return dfd.promise;
    }

    updateParticipant(body) {
        let dfd = q.defer();
        ProjectService.updateParticipant(body._service[0].dbname_prefix, body.username, body.id, body.participant)
            .then((res) => {
                dfd.resolve(true);
                RingBellItemService.insert(body._service[0].dbname_prefix,
                    body.username,
                    "project_update_info",
                    {
                        projectId: body.id, title: res.title, username_update: body.username,
                        action: "updateParticipants",
                        mes: 'just updated participants by',
                        code:res.code
                    },
                    body.participant,
                    [body.username],
                    "updateProject",
                    new Date().getTime());
            }).catch(err => {
                dfd.reject(err);
            });

        return dfd.promise;
    }

    delete(body) {
        return ProjectService.delete(body._service[0].dbname_prefix, body.username, body.id, body.title);
    }

    update(body) {
        let dfd = q.defer();
        ProjectService.update(
            body._service[0].dbname_prefix,
            body.username,
            body.id,
            body.title,
            body.from_date,
            body.to_date,
            body.workflowPlay_id,
        ).then((res) => {
            dfd.resolve(true);
            let date = new Date();

            for (var i in res.updateTypes) {
                let params = {
                    projectId: body.id, title: res.title, username_update: body.username,
                    action: res.updateTypes[i],
                    mes: `just updated ${res.updateTypes[i]} by`,
                    code: res.code
                }
                if(body.title !== res.title){
                    params.from_title = res.title;
                    params.to_title = body.title;
                }
                RingBellItemService.insert(body._service[0].dbname_prefix,
                    body.username,
                    "project_update_info",
                    params
                    ,
                    res.participant,
                    [body.username],
                    "updateProject",
                    date.getTime());
            }
        }).catch(err => {
            dfd.reject(err);
        });
        return dfd.promise;
    }

    start(body) {
        let dfd = q.defer();
        ProjectService.start(body._service[0].dbname_prefix, body.username, body.id)
            .then((res) => {
                dfd.resolve(true);
                RingBellItemService.insert(body._service[0].dbname_prefix,
                    body.username,
                    "project_update_status",
                    {
                        projectId: body.id, title: res.title, username_update: body.username,
                        code : res.code,
                        action: "startProject",
                        mes: 'just updated status to project'
                    },
                    res.participant,
                    [body.username],
                    "updateProject",
                    new Date().getTime());
            }).catch(err => {
                dfd.reject(err);
            });

        return dfd.promise;
    }

    close(body) {
        let dfd = q.defer();
        ProjectService.close(body._service[0].dbname_prefix, body.username, body.id)
            .then((res) => {
                dfd.resolve(true);
                RingBellItemService.insert(body._service[0].dbname_prefix,
                    body.username,
                    "project_update_status",
                    {
                        code : res.code,
                        projectId: body.id, title: res.title, username_update: body.username,
                        action: "closeProject",
                        mes: 'just updated status to project'
                    },
                    res.participant,
                    [body.username],
                    "updateProject",
                    new Date().getTime());
            }).catch(err => {
                dfd.reject(err);
            });

        return dfd.promise;
    }

    statistic_count(body) {
        return ProjectService.statistic_count(body._service[0].dbname_prefix, genFilter_all_project_count(body));
    }

    statistic_growth(body) {
        return ProjectService.statistic_growth(body._service[0].dbname_prefix, genFilter_all_project_growth(body));
    }
}

exports.ProjectController = new ProjectController();
