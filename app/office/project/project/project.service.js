const q = require('q');
const moment = require('moment');

const { removeUnicode, NumberToStringForDate, isValidValue, generateSearchText } = require('../../../../utils/util');
const CodeUtil = require('../../../../utils/codeUtil');

const { MongoDBProvider } = require('../../../../shared/mongodb/db.provider');
const { SocketProvider } = require('./../../../../shared/socket/provider');
const { LogProvider } = require('../../../../shared/log_nohierarchy/log.provider');
const { TASK_LEVEL, WORKFLOW_PLAY_STATUS, HEAD_TASK_ORIGIN } = require('../../../../utils/constant');

const PROJECT_CODE_PATTERN = `{year}-${HEAD_TASK_ORIGIN.PROJECT}-{projectNumber}`;
const PROJECT_SEQUENCE_NUMBER_KEY = () => `${new Date().getFullYear()}_project_${HEAD_TASK_ORIGIN.PROJECT}`;
function generateProjectCode(dbNamePrefix) {
    const dfd = q.defer();
    MongoDBProvider.getAutoIncrementNumber_onManagement(dbNamePrefix, PROJECT_SEQUENCE_NUMBER_KEY())
        .then(function (projectNumber) {
            dfd.resolve(CodeUtil.resolvePattern(PROJECT_CODE_PATTERN, {year: new Date().getFullYear(), projectNumber :String(projectNumber).padStart(2, '0') }));
        })
        .catch(function (error) {
            dfd.reject(error);
        });
    return dfd.promise;
}

function loadProjectReference(dbPrefix, project, reference) {
    const dfd = q.defer();
    let key;
    let isHaveReference = true;
    q.fcall(function () {
        let promise;
        switch (reference.object) {
            case 'WorkflowPlay':
                key = 'workflow_play';
                promise = exports.WorkflowPlayService.loadDetailById({ dbNamePrefix: dbPrefix, id: reference.id });
                break;

            case 'Task':
                key = 'task';
                promise = exports.TaskService.getTaskById({ dbNamePrefix: dbPrefix, id: reference.id });
                break;

            default:
                isHaveReference = false;
                promise = q.resolve(null);
        }
        return promise;
    })
        .then(function (referenceDetails) {
            if (referenceDetails && isHaveReference) {
                Object.assign(project, { [key]: referenceDetails });
            }
            dfd.resolve(project);
        })
        .catch(function (error) {
            dfd.reject(error);
        });
    return dfd.promise;
}

function loadProjectReferences(dbPrefix, project) {
    const dfd = q.defer();

    q.fcall(function () {
        if (!project.reference || project.reference.length === 0) {
            return dfd.resolve(project);
        }
        const references = project.reference;
        const promises = references.map((reference) => {
            return loadProjectReference(dbPrefix, project, reference);
        });
        return q.all(promises);
    })
        .then(function () {
            dfd.resolve(project);
        })
        .catch(function (error) {
            dfd.reject(error);
        });
    return dfd.promise;
}

function setReferenceForProject(currentReferences = [], reference) {
    let isChanged = false;
    const currentReference = currentReferences.find((ref) => {
        return ref.object === reference.object;
    });

    if (currentReference) {
        isChanged = currentReference.id !== reference.id;
        currentReference.id = reference.id;
    } else {
        isChanged = true;
        currentReferences.push(reference);
    }

    return { newReference: currentReferences, isChanged };
}

class ProjectService {
    constructor() {}

    load(dbname_prefix, filter, top, offset, sort, skipReference = false) {
        const dfd = q.defer();

        let projectDetails;

        MongoDBProvider.load_onOffice(dbname_prefix, 'project', filter, top, offset, sort)
            .then(function (result) {
                if (!Array.isArray(result) || result.length === 0) {
                    return dfd.resolve([]);
                }

                if (skipReference) {
                    return dfd.resolve(result);
                }
                projectDetails = result;
                const promises = projectDetails.map((project) => {
                    return loadProjectReferences(dbname_prefix, project);
                });
                return q.all(promises);
            })
            .then(function () {
                dfd.resolve(projectDetails);
            })
            .catch(function (error) {
                dfd.reject({
                    path: 'ProjectService.load',
                    mes: 'CanNotLoadProject',
                });
            });
        return dfd.promise;
    }

    loadByDepartment (dbPrefix, filter) {
        const dfd = q.defer();
        exports.UserService.loadByDepartment(dbPrefix, filter.department)
            .then((users) => {
                if (users.length === 0) {
                    return dfd.resolve([]);
                }
                const listUser = users.map(user => user.username);
                const condition = {
                    $and: [
                        {
                            participant: {
                                $in: listUser,
                            },
                        },
                    ],
                };

                if (filter.search) {
                    condition.$and.push({
                        $text: {
                            $search: `"${filter.search}" "${generateSearchText(filter.search)}"`,
                        },
                    });
                }

                return MongoDBProvider.load_onOffice(
                    dbPrefix,
                    'project',
                    condition,
                    parseInt(filter.top),
                    parseInt(filter.offset),
                );
            })
            .then((project) => {
                dfd.resolve(project);
            })
            .catch(dfd.reject);
        return dfd.promise;
    }

    loadJoinedProjects (dbPrefix, filter) {
        const dfd = q.defer();
        const cond = {
            $and: [
                { participant: { $eq: filter.username } },
            ],
        };
        if (filter.search) {
            cond.$and.push({
                $text: {
                    $search: `"${filter.search}" "${generateSearchText(filter.search)}"`,
                },
            });
        }
        MongoDBProvider.load_onOffice(
            dbPrefix,
            'project',
            cond,
            parseInt(filter.top),
            parseInt(filter.offset),
        )
            .then(dfd.resolve)
            .catch(dfd.reject);
        return dfd.promise;
    }

    loadDetails_multi(dbname_prefix, _ids) {
        let filter = { _id: { $in: [] } };
        for (var i in _ids) {
            filter._id.$in.push(new require('mongodb').ObjectID(_ids[i]));
        }
        return MongoDBProvider.load_onOffice(dbname_prefix, 'project', filter);
    }

    count(dbname_prefix, filter) {
        return MongoDBProvider.count_onOffice(dbname_prefix, "project", filter);
    }

    checkExist(dbname_prefix, key) {
        let dfd = q.defer();
        MongoDBProvider.load_onOffice(dbname_prefix, "project",
            { key: { $eq: key } },
            undefined, undefined, undefined,
            { key: true }
        ).then(function (res) {
            if (!res[0]) {
                dfd.resolve(true);
            } else {
                dfd.reject({ path: "ProjectService.checkExist.KeyIsExists", mes: "KeyIsExists" });
            }
            res = undefined;
            dfd = undefined;
            key = undefined;
        }, function (err) {
            dfd.reject({ path: "ProjectService.checkExist.db", err });
            err = undefined;
            key = undefined;
        });
        return dfd.promise;
    }

    insert (dbname_prefix, username, title, from_date, to_date, participant, task_id, workflowPlay_id,parents) {
        const dfd = q.defer();
        const now = moment();
        const listParticipant = [...(new Set(participant).add(username))];

        let item = {
            title,
            participant: listParticipant,
            object: [],
            title_search: removeUnicode(title),
            from_date,
            to_date,
            status: 'NotStartedYet',
            date_created: now.format('YYYY/MM/DD'),
            month_created: now.format('YYYY/MM'),
            year_created: now.format('YYYY'),
            reference: [],
            parents
        };



        q.fcall(function () {
            let promises = [];
            if (isValidValue(task_id)) {
                promises.push(
                    exports.TaskService.getTaskById({ dbNamePrefix: dbname_prefix, id: task_id }),
                    exports.ProjectService.loadProjectByReference(dbname_prefix, 'Task', task_id),
                );
            } else {
                promises.push(null, null);
            }

            if (isValidValue(workflowPlay_id)) {
                promises.push(
                    exports.WorkflowPlayService.loadDetailById({ dbNamePrefix: dbname_prefix, id: workflowPlay_id }),
                );
            } else {
                promises.push(null);
            }
            return q.all(promises);
        })
            .then(function ([task, associatedProject, workflowPlayDetails]) {
                if (isValidValue(task_id)) {
                    if (!task) {
                        return dfd.reject({ path: 'ProjectService.insert', mes: 'TaskNotFound' });
                    }
                    if (![TASK_LEVEL.HEAD_TASK, TASK_LEVEL.TRANSFER_TICKET].includes(task.level)) {
                        return dfd.reject({ path: 'ProjectService.insert', mes: 'InvalidTaskLevel' });
                    }
                    if (associatedProject) {
                        return dfd.reject({ path: 'ProjectService.insert', mes: 'TaskAlreadyAssociateOtherProject' });
                    }
                    item.reference.push({
                        object: 'Task',
                        id: task_id,
                    });
                }

                if (isValidValue(workflowPlay_id)) {
                    if (!workflowPlayDetails) {
                        return dfd.reject({ path: 'ProjectService.insert', mes: 'WorkflowPlayNotFound' });
                    }

                    if (
                        ![WORKFLOW_PLAY_STATUS.APPROVED, WORKFLOW_PLAY_STATUS.SAVED_ODB].includes(
                            workflowPlayDetails.status,
                        )
                    ) {
                        return dfd.reject({ path: 'ProjectService.insert', mes: 'WorkflowPlayNotApprovedOrSavedODB' });
                    }

                    item.reference.push({
                        object: 'WorkflowPlay',
                        id: workflowPlay_id,
                    });

                }
                return q.resolve();
            })
            .then(function () {
                return generateProjectCode(dbname_prefix);
            })
            .then(function (projectCode) {
                item.code = projectCode;
                return MongoDBProvider.insert_onOffice(dbname_prefix, 'project', username, item);
            })
            .then(function (projectResponse) {
                dfd.resolve(projectResponse.ops[0]);
            })
            .catch(function (error) {
                dfd.reject(error);
            });

        return dfd.promise;
    }

    updateParticipant(dbname_prefix, username, id, participant) {
        let dfd = q.defer();
        MongoDBProvider.getOne_onOffice(dbname_prefix, "project", { _id: { $eq: new require('mongodb').ObjectID(id) } }).then(function (item) {
            MongoDBProvider.update_onOffice(dbname_prefix, "project", username,
                { _id: { $eq: new require('mongodb').ObjectID(id) } },
                { $set: { participant } }
            ).then(function () {
                dfd.resolve(item);
                let users = participant.filter(e => item.participant.indexOf(e) == -1);
                for (var i in users) {
                    SocketProvider.IOEmitToRoom(users[i], "justPushNotification", {
                        title: 'YouJustJoinedANewProject',
                        body: item.title,
                        url: "/task?tab=department"
                    });
                }
            }, function (err) {
                dfd.reject(err);
            });
        }, function (err) {
            dfd.reject(err);
        });

        return dfd.promise;
    }

    delete(dbname_prefix, username, id, title) {
        let dfd = q.defer();
        MongoDBProvider.getOne_onOffice(dbname_prefix, "project", { _id: { $eq: new require('mongodb').ObjectID(id) } }).then(function (item) {
            if (item.status === 'Completed') {
                dfd.reject({ path: "ProjectService.delete.ProjectIsCompleted", mes: "ProjectIsCompleted" });
            } else {
                if (item.title_search !== title) {
                    dfd.reject({ path: "ProjectService.delete.InvalidAction", mes: "InvalidInformation" });
                } else {
                    let dfdAr = [];
                    dfdAr.push(
                        MongoDBProvider.delete_onOffice(dbname_prefix, "project", username, { _id: { $eq: new require('mongodb').ObjectID(id) } })
                    );
                    dfdAr.push(
                        MongoDBProvider.delete_onOffice(dbname_prefix, "strategic", username, { project: { $eq: id } })
                    );
                    q.all(dfdAr).then(function () {
                        dfd.resolve(true);
                    }, function (err) { dfd.reject(err); });
                }

            }
        }, function (err) { dfd.reject(err); });
        return dfd.promise;
    }

    update(dbname_prefix, username, id, title, from_date, to_date, workflowPlayId) {
        const dfd = q.defer();
        const updatedData = {
            $set: {
                title,
                from_date,
                to_date,
                title_search: removeUnicode(title),
            },
        };

        this.loadById(dbname_prefix, id)
            .then(function (project) {
                if (!project) {
                    return dfd.reject({
                        path: 'ProjectService.update',
                        mes: 'ProjectNotFound',
                    });
                }

                if (workflowPlayId) {
                    return q.all([
                        true,
                        exports.WorkflowPlayService.loadDetailById({
                            dbNamePrefix: dbname_prefix,
                            id: workflowPlayId,
                        }),
                        project,
                    ]);
                } else {
                    return q.all([false, null, project]);
                }
            })
            .then(function ([isAssociateWorkflowPlay, workflowPlayDetails, projectDetail]) {
                let updateTypes = [];
                if (projectDetail.title !== title) {
                    updateTypes.push('title');
                }
                if (projectDetail.from_date !== from_date || projectDetail.to_date !== to_date) {
                    updateTypes.push('project implementation time');
                }

                if (isAssociateWorkflowPlay) {
                    if (!workflowPlayDetails) {
                        return dfd.reject({
                            path: 'ProjectService.update',
                            mes: 'WorkflowPlayNotFound',
                        });
                    }

                    if (
                        ![WORKFLOW_PLAY_STATUS.APPROVED, WORKFLOW_PLAY_STATUS.SAVED_ODB].includes(
                            workflowPlayDetails.status,
                        )
                    ) {
                        return dfd.reject({
                            path: 'ProjectService.update',
                            mes: 'WorkflowPlayNotApprovedOrSavedODB',
                        });
                    }

                    const { newReference, isChanged } = setReferenceForProject(projectDetail.reference, {
                        object: 'WorkflowPlay',
                        id: workflowPlayId,
                    });

                    if (isChanged) {
                        updateTypes.push('workflow play');
                    }

                    Object.assign(updatedData.$set, { reference: newReference });
                }
                return q.all([
                    MongoDBProvider.update_onOffice(
                        dbname_prefix,
                        'project',
                        username,
                        { _id: { $eq: new require('mongodb').ObjectID(id) } },
                        updatedData),
                    updateTypes,
                    projectDetail
                ]);
            })
            .then(function ([response, updateTypes, projectDetail]) {
                dfd.resolve({ ...projectDetail, updateTypes });
            })
            .catch(function (error) { });
        return dfd.promise;
    }

    start(dbname_prefix, username, id) {
        let dfd = q.defer();
        let d = new Date();
        MongoDBProvider.getOne_onOffice(dbname_prefix, "project", { _id: { $eq: new require('mongodb').ObjectID(id) } }).then(function (item) {
            MongoDBProvider.update_onOffice(dbname_prefix, "project", username,
                { _id: { $eq: new require('mongodb').ObjectID(id) } },
                {
                    $set: {
                        status: "Processing",
                        date_process: d.getFullYear() + "/" + NumberToStringForDate((d.getMonth() + 1)) + "/" + NumberToStringForDate(d.getDate()),
                        month_process: d.getFullYear() + "/" + NumberToStringForDate((d.getMonth() + 1)),
                        year_process: d.getFullYear()
                    }
                }).then(function () {
                    dfd.resolve(item);
                    for (var i in item.participant) {
                        SocketProvider.IOEmitToRoom(item.participant[i], "justPushNotification", {
                            title: 'TheProjectHasStarted',
                            body: item.title,
                            url: "/task?tab=department"
                        });
                    }
                }, function (err) {
                    dfd.reject(err);
                });
        }, function (err) { dfd.reject(err) });

        return dfd.promise;
    }

    close(dbname_prefix, username, id) {
        let d = new Date();
        let dfd = q.defer();
        MongoDBProvider.getOne_onOffice(dbname_prefix, "project", { _id: { $eq: new require('mongodb').ObjectID(id) } }).then(function (item) {
            MongoDBProvider.update_onOffice(dbname_prefix, "project", username,
            { _id: { $eq: new require('mongodb').ObjectID(id) } },
            {
                $set: {
                    status: "Completed",
                    date_completed: d.getFullYear() + "/" + NumberToStringForDate((d.getMonth() + 1)) + "/" + NumberToStringForDate(d.getDate()),
                    month_completed: d.getFullYear() + "/" + NumberToStringForDate((d.getMonth() + 1)),
                    year_completed: d.getFullYear()
                }
            }).then(function(){
                dfd.resolve(item);
                for (var i in item.participant) {
                    SocketProvider.IOEmitToRoom(item.participant[i], "justPushNotification", {
                        title: 'TheProjectHasEnded',
                        body: item.title,
                        url: "/task?tab=department"
                    });
                }
            },function(err){
                dfd.reject(err);
            });
        },function(err){
            dfd.reject(err);
        });

        return dfd.promise;
    }

    statistic_count(dbname_prefix, filter) {
        let dfd = q.defer();
        let dfdAr = [];
        dfdAr.push(MongoDBProvider.count_onOffice(dbname_prefix, "project", filter.completed));
        dfdAr.push(MongoDBProvider.count_onOffice(dbname_prefix, "project", filter.process));
        dfdAr.push(MongoDBProvider.count_onOffice(dbname_prefix, "project", filter.notstart));
        dfdAr.push(MongoDBProvider.count_onOffice(dbname_prefix, "project", filter.all));
        q.all(dfdAr).then(function (data) {
            dfd.resolve({
                completed: data[0],
                process: data[1],
                notstart: data[2],
                all: data[3]
            });
        }, function (err) {
            dfd.reject(err);
        });
        return dfd.promise;
    }

    statistic_growth(dbname_prefix, filter) {
        let dfd = q.defer();
        let dfdAr = [];
        dfdAr.push(MongoDBProvider.loadAggregate_onOffice(dbname_prefix, "project", [
            { $match: filter.created },
            { "$group": { _id: "$date_created", count: { $sum: 1 } } }
        ]));
        dfdAr.push(MongoDBProvider.loadAggregate_onOffice(dbname_prefix, "project", [
            { $match: filter.completed },
            { "$group": { _id: "$date_completed", count: { $sum: 1 } } }
        ]));
        q.all(dfdAr).then(function (res) {
            dfd.resolve({
                created: res[0],
                completed: res[1]
            });
        }, function (err) { dfd.reject(err); });
        return dfd.promise;
    }

    loadById(dbNamePrefix, id) {
        const dfd = q.defer();
        q.fcall(function () {
            return MongoDBProvider.load_onOffice(dbNamePrefix, 'project', {
                _id: new require('mongodb').ObjectID(id),
            });
        })
            .then(function (response) {
                if (!Array.isArray(response) || response.length === 0) {
                    return dfd.resolve(null);
                }
                return dfd.resolve(response[0]);
            })
            .catch(function (error) {
                LogProvider.error('Can not load project by reason: ' + error.mes || error.message || error);
                return dfd.reject({
                    path: 'ProjectService.loadById',
                    mes: 'CanNotLoadProjectDetail',
                });
            });
        return dfd.promise;
    }

    loadProjectByReference(dbNamePrefix, object, id) {
        const dfd = q.defer();
        const filter = {
            reference: {
                $elemMatch: {
                    object,
                    id,
                },
            },
        };
        MongoDBProvider.load_onOffice(dbNamePrefix, 'project', filter)
            .then(function (result) {
                if (!Array.isArray(result) || result.length === 0) {
                    return dfd.resolve(null);
                } else {
                    return dfd.resolve(result[0]);
                }
            })
            .catch(function (error) {
                LogProvider.error(
                    'Can not load project by reference with reason: ' + error.mes || error.message || error,
                );
                return dfd.reject({
                    path: 'ProjectService.loadProjectByReference',
                    mes: 'CanNotLoadProjectDetail',
                });
            });
        return dfd.promise;
    }

}

class WorkflowPlayService {
    constructor() {}

    loadDetailById({ dbNamePrefix, id }) {
        const dfd = q.defer();
        MongoDBProvider.load_onOffice(dbNamePrefix, 'workflow_play', {
            _id: new require('mongodb').ObjectID(id),
        })
            .then(function (response) {
                if (!Array.isArray(response) || response.length === 0) {
                    dfd.resolve(null);
                } else {
                    dfd.resolve(response[0]);
                }
            })
            .catch(function (error) {
                dfd.reject(error);
            });
        return dfd.promise;
    }
}

class TaskService {
    constructor() {}

    getTaskById({ dbNamePrefix, id }) {
        const dfd = q.defer();
        const filter = {
            _id: new require('mongodb').ObjectID(id),
        };
        MongoDBProvider.load_onOffice(dbNamePrefix, 'task', filter)
            .then(function (response) {
                if (Array.isArray(response) && response.length > 0) {
                    dfd.resolve(response[0]);
                } else {
                    dfd.resolve(null);
                }
            })
            .catch(function (error) {
                LogProvider.error('Can not fetch task by reason: ' + error.mes || error.message || error);
                dfd.reject(error);
            });
        return dfd.promise;
    }
}

class UserService {
    constructor () {
        this.collection = 'user';
    }

    loadByDepartment (dbPrefix, departmentId) {
        const dfd = q.defer();
        const filter = {
            department: departmentId,
        };
        MongoDBProvider.load_onManagement(dbPrefix, this.collection, filter)
            .then(dfd.resolve)
            .catch(dfd.reject);
        return dfd.promise;
    }

}

exports.ProjectService = new ProjectService();
exports.TaskService = new TaskService();
exports.WorkflowPlayService = new WorkflowPlayService();
exports.UserService = new UserService();
