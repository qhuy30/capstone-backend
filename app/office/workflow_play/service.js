const q = require("q");
const mongodb = require("mongodb");

const BaseError = require('@shared/error/BaseError');

const { MongoDBProvider } = require("../../../shared/mongodb/db.provider");
const { SocketProvider } = require("./../../../shared/socket/provider");
const { LogProvider } = require("../../../shared/log_nohierarchy/log.provider");

const { RingBellItemService } = require("../../management/ringbell_item/service");

const WorkflowPlayFilter = require("./filter");

const codeUtil = require("../../../utils/codeUtil");
const { removeUnicode, genFilterGetUsersByRuleAndDepartment } = require("../../../utils/util");
const workflowPlayUtil = require("../../../utils/workflowPlayUtil");

const {
    WORKFLOW_PLAY_STATUS,
    WORKFLOW_ORGANIZATION_SCOPE,
} = require("../../../utils/constant");
const { StoreConst } = require("../../../shared/store/gcp/store.const");
const { OBJECT_NAME } = require("@utils/referenceConstant");
const { WORKFLOW_PLAY_RULE, TASK_RULE } = require("./const");

const WORKFLOW_PLAY_CODE_PATTERN = 'VB-{directoryAbbreviation}-{year}-{workflowPlayNumber}';
const WORKFLOW_PLAY_SEQUENCE_NUMBER_KEY = () => `workflow_play_${new Date().getFullYear()}`;
const WORKFLOW_PLAY_DIRECTORY_MASTER_KEY = 'document_type';

function findUser_Employee(dbname_prefix, NodeItem) {
    let dfd = q.defer();
    let dfdAr = [];
    const filter =  { department: { $eq: NodeItem.department } }
    dfdAr.push(MongoDBProvider.load_onOffice(dbname_prefix, "employee", filter, undefined, undefined, undefined, { _id: true }));

    if (NodeItem.role && NodeItem.role !== "") {
        dfdAr.push(MongoDBProvider.load_onManagement(dbname_prefix, "user", { role: { $eq: NodeItem.role } }, undefined, undefined, undefined, { employee: true }));
    }
    q.all(dfdAr).then(function (data) {
        let temp = [];
        for (var i in data[0]) {
            let check = true;
            if (data[1]) {
                check = false;
                for (var j in data[1]) {
                    if (data[1][j].employee == data[0][i]._id) {
                        check = true;
                    }
                }
            }

            if (check) {
                temp.push(data[0][i]._id);
            }
        }


        if (temp.length === 0) {
            dfd.resolve([]);
        } else {
            let filter;
            if (temp.length === 1) {
                filter = { employee: { $eq: temp[0].toString() } };
            } else {
                filter = { $or: [] };
                for (var i in temp) {
                    filter.$or.push({ employee: { $eq: temp[i].toString() } });
                }
            }

            MongoDBProvider.load_onManagement(
                dbname_prefix,
                'user',
                filter,
                undefined,
                undefined,
                undefined,
                {
                    username: true,
                    employee: true,
                    role: true,
                    department: true,
                    competence: true,
                },
            ).then(
                function (data) {
                    dfd.resolve(data);
                },
                function (err) {
                    dfd.reject(err);
                },
            );
        }
    }, function (err) {
        dfd.reject({ path: "WorkflowPlayService.findUser_Employee.LoadErr", err });
        err = undefined;
    });
    return dfd.promise;
}

function findUser_Employee_Department(dbname_prefix, node) {
    let filter = null;
    switch(node.processType){
        case 'departmentLeader':
            filter = genFilterGetUsersByRuleAndDepartment(TASK_RULE.DEPARTMENT_LEADER_MANAGE, node.department)
            break;
        case 'leader':
            filter = null;
            break;

    }
    // let filter = { "rule.rule": { $in: node.rule } };
    return MongoDBProvider.loadAggregate_onManagement(dbname_prefix, "user", filter)
}

function findUser_Employee_OneNode(dbname_prefix, node) {
    let dfd = q.defer();
    let dfdAr = [];
    for (let item of node.items) {
        dfdAr.push(findUser_Employee(dbname_prefix, item));
    }
    q.all(dfdAr).then(
        function (temp) {
            let objects = [];
            for (var i in temp) {
                for (var j in temp[i]) {
                    objects.push(workflowPlayUtil.mapUserToItem(temp[i][j], node));
                }
            }
            dfd.resolve(objects);
        },
        function (err) {
            dfd.reject(err);
            err = undefined;
        }
    );
    return dfd.promise;
}

function createNewRingBellItem(dbNamePrefix, params, toUsers = []) {
    let dfd = q.defer();
    q.fcall(() => {
        return RingBellItemService.insert(
            dbNamePrefix,
            "system",
            "notify_late_workflow_play",
            params,
            toUsers,
            [],
            "notify_late_workflow_play",
            new Date().getTime(),
        );
    })
        .then((result) => {
            dfd.resolve(result.ops[0]);
        })
        .then((err) => {dfd.reject(err);});
    return dfd.promise;
}

class WorkflowPlayService {
    constructor() { }

    init(dbname_prefix, department, competence, job, role) {
        let dfd = q.defer();

        MongoDBProvider.load_onManagement(dbname_prefix, "directory", {
            $and: [{ master_key: { $eq: WORKFLOW_PLAY_DIRECTORY_MASTER_KEY } }, { type: "normal" }]
        }).then(function(wft) {

            let temp_wft = [];
            for (var i in wft) {
                temp_wft.push(wft[i].value);
            }
            MongoDBProvider.load_onOffice(dbname_prefix, "workflow", {
                $and: [{
                    $or: [{ department: { $eq: department } }, { department_scope: { $eq: WORKFLOW_ORGANIZATION_SCOPE.ALL } }],
                }, {
                    key: { $in: temp_wft },
                }],
            }).then(
                function(wf) {
                    var temp = [];
                    for (var i in wf) {
                        let check = true;
                        if (wf[i].competence.length > 0) {
                            check = false;
                            if (wf[i].competence.indexOf(competence) !== -1) {
                                check = true;
                            }
                        }
                        if (wf[i].job.length > 0) {
                            check = false;
                            if (wf[i].job.indexOf(job) !== -1) {
                                check = true;
                            }
                        }

                        if (wf[i].role.length > 0) {
                            check = false;
                            for (var j in role) {
                                if (wf[i].role.indexOf(role[j]) !== -1) {
                                    check = true;
                                    break;
                                }
                            }
                        }
                        if (check) {
                            temp.push(wf[i]);
                        }
                    }
                    dfd.resolve({
                        wf: temp,
                        wft,
                    });
                },
                function(err) {
                    dfd.reject(err);
                    err = undefined;
                },
            );
        }, function(err) {
            dfd.reject(err);
        });
        return dfd.promise;
    }

    loadDetails(dbname_prefix, username, id, code) {
        let filterId = {
            $or: []
        }

        if (!id && !code) {
            return q.reject(new BaseError("WorkflowPlayService.loadDetails.RequireInformation", "IdOrCodeIsRequired"));
        }

        if (id) {
            filterId.$or.push({ _id: { $eq: mongodb.ObjectId(id) } });
        }

        if (code) {
            code = decodeURIComponent(code);
            filterId.$or.push({
                code: {
                    $regex: code,
                    $options: "i",
                },
            });
        }

        return MongoDBProvider.getOne_onOffice(dbname_prefix, "workflow_play", filterId);
    }

    load(dbNamePrefix, aggregateSteps) {
        return MongoDBProvider.loadAggregate_onOffice(dbNamePrefix, "workflow_play", aggregateSteps);
    }

    count(dbname_prefix, aggregateSteps) {
        return MongoDBProvider.loadAggregate_onOffice(dbname_prefix, "workflow_play", aggregateSteps);
    }

    insert(
        dbname_prefix,
        username,
        department,
        title,
        flow_info,
        flow,
        event,
        document_type,
        attachment,
        originAttachment,
        relatedfile,
        tags_value,
        signatureTags,
        workflowFileType,
        appendix,
        created_at,
        archived_documents,
        parent,
        parents,
        department_destination,
        is_personal,
        is_department,
        transfer_ticket
    ) {
        let dfd = q.defer();
        let firstNodeItems = flow[0].items;
        let dfdAr = [];
        for (var i in firstNodeItems) {
            if (firstNodeItems[i].methods != 'flexible') {
                dfdAr.push(findUser_Employee(dbname_prefix, firstNodeItems[i]));
            } else {
                dfdAr.push(findUser_Employee_Department(dbname_prefix, firstNodeItems[i]));
            }
        }

        q.all(dfdAr).then(function (data) {
            let objects = [];
            for (var i in data) {
                for (var j in data[i]) {
                    const playNowItem = workflowPlayUtil.mapUserToItem(
                        data[i][j],
                        flow[0],
                    );
                    objects.push(playNowItem);
                }
            }
            if (!objects.length) {
                dfd.reject({ path: "WorkflowPlayService.insert.ApproverIsNull", mes: "ApproverIsNull" });
            } else {
                let directoryAbbreviation;
                new DirectoryService().loadDetail(
                    dbname_prefix,
                    WORKFLOW_PLAY_DIRECTORY_MASTER_KEY,
                    document_type,
                )
                    .then(function (directoryDetail) {
                        if (!directoryDetail) {
                            return dfd.reject({
                                path: 'WorkflowPlayService.insert',
                                mes: 'DocumentTypeNotFound',
                            });
                        }

                        if (!directoryDetail.abbreviation) {
                            return dfd.reject({
                                path: 'WorkflowPlayService.insert',
                                mes: 'DocumentTypeAbbreviationNotFound',
                            });
                        }

                        directoryAbbreviation = directoryDetail.abbreviation;
                        return MongoDBProvider.getAutoIncrementNumber_onManagement(
                            dbname_prefix,
                            WORKFLOW_PLAY_SEQUENCE_NUMBER_KEY(),
                        );
                    })
                    .then(function (workflowPlayNumber) {
                        const code = codeUtil.resolvePattern(
                            WORKFLOW_PLAY_CODE_PATTERN,
                            {
                                directoryAbbreviation,
                                workflowPlayNumber,
                            },
                        );
                        return MongoDBProvider.insert_onOffice(
                            dbname_prefix,
                            'workflow_play',
                            username,
                            {
                                username,
                                department,
                                title,
                                title_search: removeUnicode(title),
                                flow_info,
                                flow,
                                event,
                                document_type,
                                attachment,
                                originAttachment,
                                relatedfile,
                                play: { 0: objects },
                                node: 1,
                                status: 'Pending',
                                play_now: objects,
                                tags_value,
                                signatureTags,
                                code,
                                workflowFileType,
                                appendix,
                                created_at,
                                archived_documents,
                                parent,
                                parents,
                                department_destination,
                                is_personal,
                                is_department,
                                transfer_ticket
                            },
                        );
                    })
                    .then(
                        function (e) {
                            dfd.resolve(e.ops);
                            for (var i in objects) {
                                SocketProvider.IOEmitToRoom(
                                    objects[i].username,
                                    'justPushNotification',
                                    {
                                        title: 'ThereIs1DocumentThatNeedsApproval',
                                        body: title,
                                        url:
                                            '/signing-details?' +
                                            e.ops[0]._id.toString(),
                                    },
                                );
                            }
                        },
                    ).catch(
                    function (err) {
                        dfd.reject(err);
                        err = undefined;
                    },
                );
            }
        }, function (err) {
            dfd.reject({ path: "WorkflowPlayService.insert.Error", err });
            err = undefined;
        })
        .catch((err) => {
            dfd.reject({ path: "WorkflowPlayService.insert.Error", err });
            err = undefined;
        });
        return dfd.promise;
    }

    insert_transfer_ticket(
        dbname_prefix,
        username,
        department,
        title,
        flow_info,
        flow,
        event,
        document_type,
        attachment,
        originAttachment,
        relatedfile,
        tags_value,
        signatureTags,
        workflowFileType,
        appendix,
        created_at,
        archived_documents,
        parent,
        parents,
        user_and_department_destination,
        is_personal,
        is_department,
        transfer_ticket
    ) {
        let dfd = q.defer();
        let firstNodeItems = flow[0].items;
        let dfdAr = [];
        for (var i in firstNodeItems) {
            if (firstNodeItems[i].methods != 'flexible') {
                dfdAr.push(findUser_Employee(dbname_prefix, firstNodeItems[i]));
            } else {
                dfdAr.push(findUser_Employee_Department(dbname_prefix, firstNodeItems[i]));
            }
        }



        q.all(dfdAr).then(function (data) {
            let objects = [];
            for (var i in data) {
                for (var j in data[i]) {
                    const playNowItem = workflowPlayUtil.mapUserToItem(
                        data[i][j],
                        flow[0],
                    );
                    objects.push(playNowItem);
                }
            }
            if (!objects.length) {
                dfd.reject({ path: "WorkflowPlayService.insert.ApproverIsNull", mes: "ApproverIsNull" });
            } else {
                
                let directoryAbbreviation;
                new DirectoryService().loadDetail(
                    dbname_prefix,
                    WORKFLOW_PLAY_DIRECTORY_MASTER_KEY,
                    document_type,
                )
                    .then(function (directoryDetail) {

                        if (!directoryDetail) {
                            return dfd.reject({
                                path: 'WorkflowPlayService.insert',
                                mes: 'DocumentTypeNotFound',
                            });
                        }

                        if (!directoryDetail.abbreviation) {
                            return dfd.reject({
                                path: 'WorkflowPlayService.insert',
                                mes: 'DocumentTypeAbbreviationNotFound',
                            });
                        }

                        directoryAbbreviation = directoryDetail.abbreviation;

                        return MongoDBProvider.getAutoIncrementNumber_onManagement(
                            dbname_prefix,
                            WORKFLOW_PLAY_SEQUENCE_NUMBER_KEY(),
                        );
                    })
                    .then(function (workflowPlayNumber) {
                        const code = codeUtil.resolvePattern(
                            WORKFLOW_PLAY_CODE_PATTERN,
                            {
                                directoryAbbreviation,
                                workflowPlayNumber,
                            },
                        );
                        console.log(3)
                        return MongoDBProvider.insert_onOffice(
                            dbname_prefix,
                            'workflow_play',
                            username,
                            {
                                username,
                                department,
                                title,
                                title_search: removeUnicode(title),
                                flow_info,
                                flow,
                                event,
                                document_type,
                                attachment,
                                originAttachment,
                                relatedfile,
                                play: { 0: objects },
                                node: 1,
                                status: 'Pending',
                                play_now: objects,
                                tags_value,
                                signatureTags,
                                code,
                                workflowFileType,
                                appendix,
                                created_at,
                                archived_documents,
                                parent,
                                parents,
                                user_and_department_destination,
                                is_personal,
                                is_department,
                                transfer_ticket
                            },
                        );
                    })
                    .then(
                        function (e) {
                            dfd.resolve(e.ops);
                            for (var i in objects) {
                                SocketProvider.IOEmitToRoom(
                                    objects[i].username,
                                    'justPushNotification',
                                    {
                                        title: 'ThereIs1DocumentThatNeedsApproval',
                                        body: title,
                                        url:
                                            '/signing-details?' +
                                            e.ops[0]._id.toString(),
                                    },
                                );
                            }
                        },
                    ).catch(
                    function (err) {
                        dfd.reject(err);
                        err = undefined;
                    },
                );
            }
        }, function (err) {
            dfd.reject({ path: "WorkflowPlayService.insert.Error", err });
            err = undefined;
        })
        .catch((err) => {
            dfd.reject({ path: "WorkflowPlayService.insert.Error", err });
            err = undefined;
        });
        return dfd.promise;
    }


    update(
        dbname_prefix,
        username,
        id,
        department,
        title,
        flow_info,
        flow,
        event,
        document_type,
        attachment,
        originAttachment,
        relatedfile,
        tags_value,
        signatureTags,
        workflowFileType,
        appendix,
        created_at,
        archived_documents,
        parent,
        parents,
        department_destination,
        is_personal,
        is_department,
        transfer_ticket
    ) {
        let dfd = q.defer();
        MongoDBProvider.update_onOffice(
            dbname_prefix,
            'workflow_play',
            username,
            { _id: new require('mongodb').ObjectID(id) },
            {
                $set: {
                    parents: parents,
                },
            }
        ).then( (data)=> {
            dfd.resolve(data);
            }
        ).catch(
            function (err) {
                dfd.reject(err);
                err = undefined;
            }
        );
        return dfd.promise;
    }

    return_creator_additional_document(
        dbname_prefix,
        username,
        id,
        event,
        play_now,
        status,
        node,
        waiting_archive_id
    ) {
        let dfd = q.defer();
        MongoDBProvider.update_onOffice(
            dbname_prefix,
            'workflow_play',
            username,
            { _id: new require('mongodb').ObjectID(id) },
            {
                $set: {
                    play_now: play_now,
                    status: status,
                    // node: node,
                    waiting_archive_id: waiting_archive_id
                },
                $push:{ event }
            }
        ).then( (data)=> {
            dfd.resolve(data);
            }
        ).catch(
            function (err) {
                dfd.reject(err);
                err = undefined;
            }
        );
        return dfd.promise;
    }

    creator_additional_document(
        dbname_prefix,
        username,
        id,
        event,
        play_now,
        status,
        node,
    ) {
        let dfd = q.defer();
        MongoDBProvider.update_onOffice(
            dbname_prefix,
            'workflow_play',
            username,
            { _id: new require('mongodb').ObjectID(id) },
            {
                $set: {
                    play_now: play_now,
                    status: status,
                    node: node,
                },
                $push:{ event }
            }
        ).then( (data)=> {
            dfd.resolve(data);
            }
        ).catch(
            function (err) {
                dfd.reject(err);
                err = undefined;
            }
        );
        return dfd.promise;
    }

    approval(dbname_prefix, username, id, comment,note, relatedfile) {
        let dfd = q.defer();
        MongoDBProvider.load_onOffice(dbname_prefix, "workflow_play",
            {
                $and: [
                    { "_id": { $eq: new require('mongodb').ObjectID(id) } },
                    { play_now: { $elemMatch: { username } } }

                ]
            }
        ).then(function (data) {
            if (data[0]) {
                let updateData = {
                    $set: {},
                    $push: {}
                };
                let dfdAr = [];
                const d = new Date();
                const flowLength = data[0].flow.length;
                const currentNodeNumber = data[0].node;
                const currentNodeData = workflowPlayUtil.getCurrentNodeOfWorkflowPlay(data[0]);

                let fromDepartment = null;
                let toDepartment = null;
                for (const flow of data[0].flow) {
                    for (const item of flow.items) {
                        if (item.signature === 'chukyA') {
                            fromDepartment = item.department;
                        } else if (item.signature === 'chukyB') {
                            toDepartment = item.department;
                        }
                    }
                }

                switch (currentNodeData.type) {
                    case "one":
                        if (flowLength === currentNodeNumber) {
                            updateData.$set = {
                                node: -1,
                                status: "Approved",
                                play_now: [],
                                [`flow.${currentNodeNumber - 1}.completed_at`]: new Date().getTime(),
                            };
                            updateData.$push = {
                                event: {
                                    username,
                                    time: d.getTime(),
                                    action: 'Approved',
                                    node: data[0].node,
                                    comment,
                                    note,
                                    valid: true,
                                    relatedfile,
                                },
                            };
                        } else {
                            const nextNodeTime = workflowPlayUtil.calculateFlowNodeTimes(
                                data[0],
                                d.getTime(),
                                currentNodeNumber,
                            );
                            updateData.$set = {
                                node: currentNodeNumber + 1,
                                status: data[0].status,
                                [`flow.${currentNodeNumber - 1}.completed_at`]: new Date().getTime(),
                                [`flow.${currentNodeNumber}.start_at`]: nextNodeTime.startAt,
                                [`flow.${currentNodeNumber}.expected_complete_at`]: nextNodeTime.expectedCompleteAt,
                            };
                            updateData.$push = {
                                event: {
                                    username,
                                    time: d.getTime(),
                                    action: 'Approved',
                                    node: currentNodeNumber,
                                    comment,
                                    note,
                                    valid: true,
                                    relatedfile,
                                },
                            };

                            for (const item of data[0].flow[currentNodeNumber].items) {
                                if (item.methods != 'flexible') {
                                    dfdAr.push(findUser_Employee(dbname_prefix, item));
                                } else {
                                    dfdAr.push(findUser_Employee_Department(dbname_prefix, item));
                                }
                            }
                        }
                        break;
                    case "all":
                        const count = workflowPlayUtil.countApprovalOfWorkflow(data[0]);
                        if (count >= currentNodeData.items.length) {
                            if (flowLength === currentNodeNumber) {
                                updateData.$set = {
                                    node: -1,
                                    status: 'Approved',
                                    play_now: [],
                                    [`flow.${currentNodeNumber - 1}.completed_at`]: new Date().getTime(),
                                };
                                updateData.$push = {
                                    event: {
                                        username,
                                        time: d.getTime(),
                                        action: 'Approved',
                                        node: data[0].node,
                                        comment,
                                        note,
                                        valid: true,
                                        relatedfile,
                                    },
                                };
                            } else {
                                const nextNodeTime = workflowPlayUtil.calculateFlowNodeTimes(
                                    data[0],
                                    d.getTime(),
                                    currentNodeNumber,
                                );
                                updateData.$set = {
                                    node: currentNodeNumber + 1,
                                    status: data[0].status,
                                    [`flow.${currentNodeNumber - 1}.completed_at`]: new Date().getTime(),
                                    [`flow.${currentNodeNumber}.start_at`]: nextNodeTime.startAt,
                                    [`flow.${currentNodeNumber}.expected_complete_at`]: nextNodeTime.expectedCompleteAt,
                                };
                                updateData.$push = {
                                    event: {
                                        username,
                                        time: d.getTime(),
                                        action: 'Approved',
                                        node: data[0].node,
                                        comment,
                                        note,
                                        valid: true,
                                        relatedfile,
                                    },
                                };
                                for (const item of data[0].flow[currentNodeNumber].items) {
                                    dfdAr.push(findUser_Employee(dbname_prefix, item));
                                }
                            }
                        } else {
                            let d = new Date();
                            updateData.$push = {
                                event: {
                                    username,
                                    time: d.getTime(),
                                    action: 'Approved',
                                    node: data[0].node,
                                    comment,
                                    note,
                                    valid: true,
                                    relatedfile,
                                },
                            };
                            updateData.$set = {
                                node: data[0].node,
                                status: data[0].status,
                                play_now: workflowPlayUtil.removeUsernameInPlayNow(
                                    data[0].play_now,
                                    username,
                                ),
                            };
                        }
                        break;
                }
                if (dfdAr.length > 0) {
                    q.all(dfdAr).then(function (temp) {
                        let objects = [];
                        for (var i in temp) {
                            for (var j in temp[i]) {
                                const playNowItem = workflowPlayUtil.mapUserToItem(
                                    temp[i][j],
                                    data[0].flow[data[0].node],
                                );
                                objects.push(playNowItem);
                            }
                        }
                        if (objects.length === 0) {
                            dfd.reject({ path: "WorkflowPlayService.approval.ApproverIsNull", mes: "ApproverIsNull" });
                        } else {
                            updateData.$set.play_now = objects;
                            MongoDBProvider.update_onOffice(dbname_prefix, "workflow_play", username, { _id: { $eq: new require('mongodb').ObjectID(id) } }, updateData).then(function () {
                                let responseData = JSON.parse(JSON.stringify(data[0]));
                                responseData.event.push(updateData.$push.event);
                                responseData.node = updateData.$set.node;
                                responseData.play_now = objects;
                                responseData.fromDepartment = fromDepartment;
                                responseData.toDepartment = toDepartment;
                                dfd.resolve(responseData);
                                for (var i in objects) {
                                    SocketProvider.IOEmitToRoom(objects[i].username, "justPushNotification", {
                                        title: 'ThereIs1DocumentThatNeedsApproval',
                                        body: data[0].title,
                                        url: "/signing-details?" + id
                                    });
                                }
                                responseData = undefined;
                            }, function (err) {
                                dfd.reject(err);
                                err = undefined;
                            });
                        }
                    }, function (err) {
                        dfd.reject({ path: "WorkflowPlayService.approval.InvalidInformation", err: err.toString() });
                        err = undefined;
                    });
                } else {
                    MongoDBProvider.update_onOffice(dbname_prefix, "workflow_play", username, { _id: { $eq: new require('mongodb').ObjectID(id) } }, updateData).then(function () {
                        let responseData = JSON.parse(JSON.stringify(data[0]));
                        responseData.event.push(updateData.$push.event);
                        responseData.node = updateData.$set.node;
                        responseData.status = updateData.$set.status;
                        responseData.fromDepartment = fromDepartment;
                        responseData.toDepartment = toDepartment;
                        dfd.resolve(responseData);
                        SocketProvider.IOEmitToRoom(data[0], "justPushNotification", {
                            title: 'YourDocumentHasBeenApproved',
                            body: data[0].title,
                            url: "/signing-details?" + id
                        });
                        let users = [];
                        for (var i in data[0].event) {
                            if (data[0].event[i].action == "Approved"
                                && users.indexOf(data[0].event[i].username) == -1
                                && data[0].event[i].username !== data[0].username
                            ) {
                                users.push(data[0].event[i].username);
                            }
                        }
                        for (var i in users) {
                            SocketProvider.IOEmitToRoom(data[0], "justPushNotification", {
                                title: 'TheDocumentHasBeenApproved',
                                body: data[0].title,
                                url: "/signing-details?" + id
                            });
                        }
                        responseData = undefined;
                    }, function (err) {
                        dfd.reject(err);
                        err = undefined;
                    });
                }
            } else {
                dfd.reject({
                    path: 'WorkflowPlayService.approval.YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists',
                    mes: 'YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists',
                });
            }
        }, function (err) {
            dfd.reject(err);
            err = undefined;
        });
        return dfd.promise;
    }

    receiver(dbname_prefix, username, id, comment, relatedfile) {
        let dfd = q.defer();
        MongoDBProvider.load_onOffice(dbname_prefix, "workflow_play",
            {
                $and: [
                    { "_id": { $eq: new require('mongodb').ObjectID(id) } },
                    { play_now: { $elemMatch: { username } } }

                ]
            }
        ).then(function (data) {
            if (data[0]) {
                let updateData = {
                    $set: {},
                    $push: {}
                };
                let dfdAr = [];
                const d = new Date();
                const flowLength = data[0].flow.length;
                const currentNodeNumber = data[0].node;
                const currentNodeData = workflowPlayUtil.getCurrentNodeOfWorkflowPlay(data[0]);

                if (flowLength === currentNodeNumber) {
                    updateData.$set = {
                        node: -1,
                        status: "Received",
                        play_now: [],
                        [`flow.${currentNodeNumber - 1}.received_at`]: new Date().getTime(),
                    };
                    updateData.$push = {
                        event: {
                            username,
                            time: d.getTime(),
                            action: 'TransactionNotificationReceived',
                            node: data[0].node,
                            comment,
                            valid: true,
                            relatedfile,
                        },
                    };
                } else {
                    const nextNodeTime = workflowPlayUtil.calculateFlowNodeTimes(
                        data[0],
                        d.getTime(),
                        currentNodeNumber,
                    );
                    updateData.$set = {
                        node: currentNodeNumber + 1,
                        status: data[0].status,
                        [`flow.${currentNodeNumber - 1}.completed_at`]: new Date().getTime(),
                        [`flow.${currentNodeNumber}.start_at`]: nextNodeTime.startAt,
                        [`flow.${currentNodeNumber}.expected_complete_at`]: nextNodeTime.expectedCompleteAt,
                    };
                    updateData.$push = {
                        event: {
                            username,
                            time: d.getTime(),
                            action: 'Received',
                            node: currentNodeNumber,
                            comment,
                            valid: true,
                            relatedfile,
                        },
                    };
                    for (const item of data[0].flow[currentNodeNumber].items) {
                        dfdAr.push(findUser_Employee(dbname_prefix, item));
                    }
                }
                if (dfdAr.length > 0) {
                    q.all(dfdAr).then(function (temp) {
                        let objects = [];
                        for (var i in temp) {
                            for (var j in temp[i]) {
                                const playNowItem = workflowPlayUtil.mapUserToItem(
                                    temp[i][j],
                                    data[0].flow[data[0].node],
                                );
                                objects.push(playNowItem);
                            }
                        }
                        if (objects.length === 0) {
                            dfd.reject({ path: "WorkflowPlayService.approval.ApproverIsNull", mes: "ApproverIsNull" });
                        } else {
                            updateData.$set.play_now = objects;
                            MongoDBProvider.update_onOffice(dbname_prefix, "workflow_play", username, { _id: { $eq: new require('mongodb').ObjectID(id) } }, updateData).then(function () {
                                let responseData = JSON.parse(JSON.stringify(data[0]));
                                responseData.event.push(updateData.$push.event);
                                responseData.node = updateData.$set.node;
                                responseData.play_now = objects;
                                dfd.resolve(responseData);
                                for (var i in objects) {
                                    SocketProvider.IOEmitToRoom(objects[i].username, "justPushNotification", {
                                        title: 'ThereIs1DocumentThatNeedsApproval',
                                        body: data[0].title,
                                        url: "/signing-details?" + id
                                    });
                                }
                                responseData = undefined;
                            }, function (err) {
                                dfd.reject(err);
                                err = undefined;
                            });
                        }
                    }, function (err) {
                        dfd.reject({ path: "WorkflowPlayService.approval.InvalidInformation", err: err.toString() });
                        err = undefined;
                    });
                } else {
                    MongoDBProvider.update_onOffice(dbname_prefix, "workflow_play", username, { _id: { $eq: new require('mongodb').ObjectID(id) } }, updateData).then(function () {
                        let responseData = JSON.parse(JSON.stringify(data[0]));
                        responseData.event.push(updateData.$push.event);
                        responseData.node = updateData.$set.node;
                        responseData.status = updateData.$set.status;
                        dfd.resolve(responseData);
                        SocketProvider.IOEmitToRoom(data[0], "justPushNotification", {
                            title: 'YourDocumentHasBeenApproved',
                            body: data[0].title,
                            url: "/signing-details?" + id
                        });
                        let users = [];
                        for (var i in data[0].event) {
                            if (data[0].event[i].action == "Received"
                                && users.indexOf(data[0].event[i].username) == -1
                                && data[0].event[i].username !== data[0].username
                            ) {
                                users.push(data[0].event[i].username);
                            }
                        }
                        for (var i in users) {
                            SocketProvider.IOEmitToRoom(data[0], "justPushNotification", {
                                title: 'TheDocumentHasBeenApproved',
                                body: data[0].title,
                                url: "/signing-details?" + id
                            });
                        }
                        responseData = undefined;
                    }, function (err) {
                        dfd.reject(err);
                        err = undefined;
                    });
                }
            } else {
                dfd.reject({
                    path: 'WorkflowPlayService.approval.YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists',
                    mes: 'YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists',
                });
            }
        }, function (err) {
            dfd.reject(err);
            err = undefined;
        });
        return dfd.promise;
    }

    process(dbname_prefix, username, id, odbId) {
        let dfd = q.defer();
        MongoDBProvider.load_onOffice(dbname_prefix, "workflow_play", {
            $and: [{ _id: { $eq: new require("mongodb").ObjectID(id) } }, { play_now: { $elemMatch: { username } } }],
        })
            .then(function (data) {
                if (data[0]) {
                    let references = data[0].references || [];
                    if (odbId) {
                        references = references
                            .filter((ref) => ref.object !== "outgoing_dispatch")
                            .concat({
                                type: "object",
                                object: "outgoing_dispatch",
                                value: odbId,
                            });
                    }

                    let updateData = {};
                    let dfdAr = [];
                    const currentNodeNumber = data[0].node;
                    const d = new Date();

                    if (data[0].flow.length === data[0].node) {
                        updateData.$set = {
                            node: -1,
                            status: "SaveODB",
                            [`flow.${currentNodeNumber - 1}.completed_at`]: d.getTime(),
                        };
                        updateData.$push = {
                            event: {
                                username,
                                time: d.getTime(),
                                action: "SaveODB",
                                node: data[0].node,
                                comment: "",
                                valid: true,
                            },
                        };
                    } else {
                        const nextNodeTime = workflowPlayUtil.calculateFlowNodeTimes(
                            data[0],
                            d.getTime(),
                            currentNodeNumber,
                        );

                        updateData.$set = {
                            node: data[0].node + 1,
                            status: data[0].status,
                            [`flow.${currentNodeNumber - 1}.completed_at`]: d.getTime(),
                            [`flow.${currentNodeNumber}.start_at`]: nextNodeTime.startAt,
                            [`flow.${currentNodeNumber}.expected_complete_at`]: nextNodeTime.expectedCompleteAt,
                        };
                        updateData.$push = {
                            event: {
                                username,
                                time: d.getTime(),
                                action: "SaveODB",
                                node: data[0].node,
                                comment: "",
                                valid: true,
                            },
                        };
                    }

                    // Remove all username in play_now when user save to ODB
                    updateData.$set.play_now = [];
                    updateData.$set.references = references;

                    MongoDBProvider.update_onOffice(
                        dbname_prefix,
                        "workflow_play",
                        username,
                        { _id: { $eq: new require("mongodb").ObjectID(id) } },
                        updateData,
                    ).then(
                        function () {
                            let responseData = JSON.parse(JSON.stringify(data[0]));
                            responseData.event.push(updateData.$push.event);
                            responseData.node = updateData.$set.node;
                            responseData.status = updateData.$set.status;
                            dfd.resolve(responseData);
                            SocketProvider.IOEmitToRoom(data[0], "justPushNotification", {
                                title: "YourDocumentHasBeenSaveODB",
                                body: data[0].title,
                                url: "/signing-details?" + id,
                            });
                            let users = [];
                            for (var i in data[0].event) {
                                if (
                                    data[0].event[i].action == "SaveODB" &&
                                    users.indexOf(data[0].event[i].username) == -1 &&
                                    data[0].event[i].username !== data[0].username
                                ) {
                                    users.push(data[0].event[i].username);
                                }
                            }
                            for (var i in users) {
                                SocketProvider.IOEmitToRoom(data[0], "justPushNotification", {
                                    title: "TheDocumentHasBeenSaveODB",
                                    body: data[0].title,
                                    url: "/signing-details?" + id,
                                });
                            }
                            responseData = undefined;
                        },
                        function (err) {
                            dfd.reject(err);
                            err = undefined;
                        },
                    );
                } else {
                    dfd.reject({
                        path: "WorkflowPlayService.approval.YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists",
                        mes: "YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists",
                    });
                }
            })
            .catch(function (error) {
                dfd.reject(error);
            });
        return dfd.promise;
    }

    transformSignOther(dbname_prefix, username, receiver, id) {
        let dfd = q.defer();
        MongoDBProvider.load_onOffice(dbname_prefix, "workflow_play",
            {
                $and: [
                    { "_id": { $eq: new require('mongodb').ObjectID(id) } },
                    { play_now: { $elemMatch: { username } } }

                ]
            }
        ).then(function (data) {
            if (data[0]) {
                let updateData = {};
                let d = new Date();
                let newEvent = data[0].event;
                let updatedEvents = newEvent.map((event) => {
                    if (event.action === 'transformSign' && event.node === data[0].node && event.valid === true) {
                        return { ...event, valid: false };
                    }
                    return event;
                });
                updatedEvents.push({ username, time: d.getTime(), action: "transformSign", node: data[0].node, comment: '', valid: true, receiver: receiver });
                updateData.$push = {
                    play_now: { username: receiver }
                };
                updateData.$set = {
                    event: updatedEvents
                }
                MongoDBProvider.update_onOffice(dbname_prefix, "workflow_play", username, { _id: { $eq: new require('mongodb').ObjectID(id) } }, updateData).then(function () {
                    let responseData = JSON.parse(JSON.stringify(data[0]));
                    responseData.event = updateData.$set.event;
                    dfd.resolve(responseData);
                    SocketProvider.IOEmitToRoom(data[0], "justPushNotification", {
                        title: 'YourDocumentHasBeenSaveODB',
                        body: data[0].title,
                        url: "/signing-details?" + id
                    });
                    let users = [];
                    for (var i in data[0].event) {
                        if (data[0].event[i].action == "transformSign"
                            && users.indexOf(data[0].event[i].username) == -1
                            && data[0].event[i].username !== data[0].username
                        ) {
                            users.push(data[0].event[i].username);
                        }
                    }
                    for (var i in users) {
                        SocketProvider.IOEmitToRoom(data[0], "justPushNotification", {
                            title: 'TheDocumentHasBeenTransformSign',
                            body: data[0].title,
                            url: "/signing-details?" + id
                        });
                    }
                    responseData = undefined;
                }, function (err) {
                    dfd.reject(err);
                    err = undefined;
                });
            } else {
                dfd.reject({ path: "WorkflowPlayService.approval.YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists", mes: "YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists" });
            }
        }, function (err) {
            dfd.reject(err);
            err = undefined;
        });
        return dfd.promise;
    }

    signOther(dbname_prefix, username, id, comment) {
        let dfd = q.defer();
        MongoDBProvider.load_onOffice(dbname_prefix, "workflow_play",
            {
                $and: [
                    { "_id": { $eq: new require('mongodb').ObjectID(id) } },
                    { play_now: { $elemMatch: { username } } }

                ]
            }
        ).then(function (data) {
            if (data[0]) {
                let updateData = {};
                let d = new Date();
                updateData.$push = {
                    event: { username, time: d.getTime(), action: "Approved", node: data[0].node, comment, valid: true }
                };

                let newPlayNow = data[0].play_now.filter(pn => pn.username !== username);

                updateData.$set = {
                    play_now: newPlayNow
                }

                MongoDBProvider.update_onOffice(dbname_prefix, "workflow_play", username, { _id: { $eq: new require('mongodb').ObjectID(id) } }, updateData).then(function () {
                    let responseData = JSON.parse(JSON.stringify(data[0]));
                    responseData.event.push(updateData.$push.event);
                    dfd.resolve(responseData);
                    SocketProvider.IOEmitToRoom(data[0], "justPushNotification", {
                        title: 'YourDocumentHasBeenSaveODB',
                        body: data[0].title,
                        url: "/signing-details?" + id
                    });
                    let users = [];
                    for (var i in data[0].event) {
                        if (data[0].event[i].action == "Approved"
                            && users.indexOf(data[0].event[i].username) == -1
                            && data[0].event[i].username !== data[0].username
                        ) {
                            users.push(data[0].event[i].username);
                        }
                    }
                    for (var i in users) {
                        SocketProvider.IOEmitToRoom(data[0], "justPushNotification", {
                            title: 'TheDocumentHasBeenTransformSign',
                            body: data[0].title,
                            url: "/signing-details?" + id
                        });
                    }
                    responseData = undefined;
                }, function (err) {
                    dfd.reject(err);
                    err = undefined;
                });
            } else {
                dfd.reject({ path: "WorkflowPlayService.approval.YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists", mes: "YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists" });
            }
        }, function (err) {
            dfd.reject(err);
            err = undefined;
        });
        return dfd.promise;
    }

    reject(dbname_prefix, username, id, comment,note, relatedfile) {
        let dfd = q.defer();
        MongoDBProvider.load_onOffice(dbname_prefix, "workflow_play",
            {
                $and: [
                    { "_id": { $eq: new require('mongodb').ObjectID(id) } },
                    { play_now: { $elemMatch: { username } } }

                ]
            }
        ).then(function (data) {
            if (data[0]) {
                let updateData = {};
                updateData.$set = {
                    status: "Rejected",
                    play_now: [],
                    node: -1
                };
                let d = new Date();
                updateData.$push = {
                    event: {
                        username,
                        time: d.getTime(),
                        action: 'Rejected',
                        node: data[0].node,
                        comment,
                        note,
                        relatedfile,
                    },
                };
                MongoDBProvider.update_onOffice(dbname_prefix, "workflow_play", username,
                    { _id: { $eq: new require('mongodb').ObjectID(id) } }, updateData).then(function () {
                        let responseData = JSON.parse(JSON.stringify(data[0]));
                        responseData.event.push(updateData.$push.event);
                        responseData.status = "Rejected";
                        responseData.play_now = [];
                        responseData.node = -1;
                        dfd.resolve(responseData);
                        SocketProvider.IOEmitToRoom(data[0], "justPushNotification", {
                            title: 'YourDocumentHasBeenRejected',
                            body: data[0].title,
                            url: "/signing-details?" + id
                        });
                        let users = [];
                        for (var i in data[0].event) {
                            if (data[0].event[i].action == "Approved"
                                && users.indexOf(data[0].event[i].username) == -1
                                && data[0].event[i].username !== data[0].username
                            ) {
                                users.push(data[0].event[i].username);
                            }
                        }
                        for (var i in users) {
                            SocketProvider.IOEmitToRoom(data[0], "justPushNotification", {
                                title: 'TheDocumentHasBeenRejected',
                                body: data[0].title,
                                url: "/signing-details?" + id
                            });
                        }
                    }, function (err) {
                        dfd.reject(err);
                        err = undefined;
                    });
            } else {
                dfd.reject({ path: "WorkflowPlayService.reject.YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists", mes: "YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists" });
            }
        }, function (err) {
            dfd.reject(err);
            err = undefined;
        });
        return dfd.promise;
    }

    return(dbname_prefix, username, id, comment,note, relatedfile) {
        let dfd = q.defer();
        MongoDBProvider.load_onOffice(dbname_prefix, "workflow_play",
            {
                $and: [
                    { "_id": { $eq: new require('mongodb').ObjectID(id) } },
                    { play_now: { $elemMatch: { username } } }

                ]
            }
        ).then(function (data) {
            if (data[0]) {
                let updateData = {};
                updateData.$set = {
                    status: WORKFLOW_PLAY_STATUS.RETURNED,
                    play_now: [{ username: data[0].username }],
                    node: 0,
                };
                let d = new Date();
                updateData.$push = {
                    event: {
                        username,
                        time: d.getTime(),
                        action: 'Returned',
                        node: data[0].node,
                        comment,
                        note,
                        relatedfile,
                    },
                };
                MongoDBProvider.update_onOffice(dbname_prefix, "workflow_play", username,
                    { _id: { $eq: new require('mongodb').ObjectID(id) } }, updateData).then(function () {
                        let responseData = JSON.parse(JSON.stringify(data[0]));
                        responseData.status = "Returned";
                        responseData.play_now = [{ username: data[0].username }];
                        responseData.node = 0;
                        responseData.event.push({ username, time: d.getTime(), action: "Returned", node: data[0].node, comment });
                        dfd.resolve(responseData);
                        SocketProvider.IOEmitToRoom(data[0], "justPushNotification", {
                            title: 'YourDocumentHasBeenReturned',
                            body: data[0].title,
                            url: "/signing-details?" + id
                        });
                        let users = [];
                        for (var i in data[0].event) {
                            if (data[0].event[i].action == "Approved"
                                && users.indexOf(data[0].event[i].username) == -1
                                && data[0].event[i].username !== data[0].username
                            ) {
                                users.push(data[0].event[i].username);
                            }
                        }
                        for (var i in users) {
                            SocketProvider.IOEmitToRoom(data[0], "justPushNotification", {
                                title: 'TheDocumentHasBeenReturned',
                                body: data[0].title,
                                url: "/signing-details?" + id
                            });
                        }
                        responseData = undefined;
                    }, function (err) {
                        dfd.reject(err);
                        err = undefined;
                    });
            } else {
                dfd.reject({ path: "WorkflowPlayService.reject.YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists", mes: "YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists" });
            }
        }, function (err) {
            dfd.reject(err);
            err = undefined;
        });
        return dfd.promise;
    }

    delete(dbname_prefix, username, id) {
        let dfd = q.defer();
        MongoDBProvider.load_onOffice(dbname_prefix, "workflow_play",
            {
                $and: [
                    { _id: { $eq: new require('mongodb').ObjectID(id) } },
                    { username: { $eq: username } }
                ]
            }
        ).then(function (data) {
            if (data[0]) {
                if (data[0].status != 'Approval') {
                    MongoDBProvider.delete_onOffice(dbname_prefix, "workflow_play", username,
                        { _id: { $eq: new require('mongodb').ObjectID(id) } }
                    ).then(function () {
                        dfd.resolve(data[0]);
                    }, function (err) {
                        dfd.reject(err);
                        err = undefined;
                    });
                } else {
                    dfd.reject({ path: "WorkflowPlayService.delete.ApprovedDataCannotBeDeleted", mes: "ApprovedDataCannotBeDeleted" });
                }

            } else {
                dfd.reject({ path: "WorkflowPlayService.delete.YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists", mes: "YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists" });
            }
        }, function (err) {
            dfd.reject(err);
            err = undefined;
        });
        return dfd.promise;
    }

    removeAttachment(dbname_prefix, username, id, filename, recoverRecord) {
        let dfd = q.defer();
        MongoDBProvider.load_onOffice(dbname_prefix, "workflow_play",
            {
                $and: [
                    { _id: { $eq: new require('mongodb').ObjectID(id) } },
                    { play_now: { $elemMatch: { username } } }
                ]
            }
        ).then(function (data) {
            if (data[0]) {
                MongoDBProvider.update_onOffice(dbname_prefix, "workflow_play", username,
                    { _id: { $eq: new require('mongodb').ObjectID(id) } },
                    {
                        $pull: { attachment: { name: filename } },
                        $push: { [StoreConst.recoverFound]: recoverRecord }
                    }).then(function () {
                        dfd.resolve(data[0]);
                    }, function (err) {
                        dfd.reject(err);
                        err = undefined;
                    })
            } else {
                dfd.reject({ path: "WorkflowPlayService.removeAttachment.YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists", mes: "YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists" });
            }
        }, function (err) { dfd.reject(err); err = undefined; })
        return dfd.promise;
    }

    removeRelatedFile(dbname_prefix, username, id, filename, recoverRecord) {
        let dfd = q.defer();
        MongoDBProvider.load_onOffice(dbname_prefix, "workflow_play",
            {
                $and: [
                    { _id: { $eq: new require('mongodb').ObjectID(id) } },
                    { play_now: { $elemMatch: { username } } }
                ]
            }
        ).then(function (data) {
            if (data[0]) {
                MongoDBProvider.update_onOffice(dbname_prefix, "workflow_play", username,
                    { _id: { $eq: new require('mongodb').ObjectID(id) } },
                    {
                        $pull: { relatedfile: { name: filename } },
                        $push: { [StoreConst.recoverFound]: recoverRecord }
                    }).then(function () {
                        dfd.resolve(data[0]);
                    }, function (err) {
                        dfd.reject(err);
                        err = undefined;
                    })
            } else {
                dfd.reject({ path: "WorkflowPlayService.removeRelatedFile.YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists", mes: "YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists" });
            }
        }, function (err) { dfd.reject(err); err = undefined; })
        return dfd.promise;
    }

    pushAttachment(dbname_prefix, username, id, file) {
        let dfd = q.defer();
        MongoDBProvider.load_onOffice(dbname_prefix, "workflow_play",
            {
                $and: [
                    { _id: { $eq: new require('mongodb').ObjectID(id) } },
                    { play_now: { $elemMatch: { username } } }
                ]
            }
        ).then(function (data) {
            if (data[0]) {
                MongoDBProvider.update_onOffice(dbname_prefix, "workflow_play", username
                    , { _id: { $eq: new require('mongodb').ObjectID(id) } },
                    { $addToSet: { attachment: file } }).then(function () {
                        dfd.resolve(data[0]);
                    }, function (err) {
                        dfd.reject(err);
                        err = undefined;
                    })
                return dfd.promise;
            } else {
                dfd.reject({ path: "WorkflowPlayService.pushAttachment.YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists", mes: "YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists" });
            }
        }, function (err) { dfd.reject(err); err = undefined; })
        return dfd.promise;
    }

    pushRelatedFile(dbname_prefix, username, id, file) {
        let dfd = q.defer();
        MongoDBProvider.load_onOffice(dbname_prefix, "workflow_play",
            {
                $and: [
                    { _id: { $eq: new require('mongodb').ObjectID(id) } },
                    { play_now: { $elemMatch: { username } } }
                ]
            }
        ).then(function (data) {
            if (data[0]) {
                MongoDBProvider.update_onOffice(dbname_prefix, "workflow_play", username
                    , { _id: { $eq: new require('mongodb').ObjectID(id) } },
                    { $addToSet: { relatedfile: file } }).then(function () {
                        dfd.resolve(data[0]);
                    }, function (err) {
                        dfd.reject(err);
                        err = undefined;
                    })
                return dfd.promise;
            } else {
                dfd.reject({ path: "WorkflowPlayService.pushRelatedFile.YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists", mes: "YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists" });
            }
        }, function (err) { dfd.reject(err); err = undefined; })
        return dfd.promise;
    }

    resubmit(dbname_prefix, username, id, title, attachment, originAttachment, relatedFiles, signatureTags, tagsValue, event, appendix) {
        let dfd = q.defer();

        let workflowPlayDetail;
        let play;

        MongoDBProvider.load_onOffice(dbname_prefix, 'workflow_play', {
            $and: [
                { _id: { $eq: new require('mongodb').ObjectID(id) } },
                { play_now: { $elemMatch: { username } } },
            ],
        })
            .then(function (checkData) {
                workflowPlayDetail = checkData[0];
                if (!workflowPlayDetail) {
                    return dfd.reject({
                        path: 'WorkflowPlayService.resubmit.YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists',
                        mes: 'YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists',
                    });
                }

                const firstNode = workflowPlayDetail.flow[0];
                return findUser_Employee_OneNode(dbname_prefix, firstNode);

            })
            .then(function (approvers) {
                if (!approvers.length) {
                    return dfd.reject({
                        path: 'WorkflowPlayService.resubmit.ApproverIsNull',
                        mes: 'ApproverIsNull',
                    });
                }
                play = approvers;
                return MongoDBProvider.update_onOffice(
                    dbname_prefix,
                    'workflow_play',
                    username,
                    {
                        _id: new require('mongodb').ObjectID(id),
                    },
                    {
                        $set: {
                            title,
                            node: 1,
                            status: WORKFLOW_PLAY_STATUS.PENDING,
                            play: { 0: approvers },
                            play_now: approvers,
                            attachment,
                            originAttachment,
                            signatureTags,
                            relatedfile: relatedFiles,
                            tags_value: tagsValue,
                            appendix,
                        },
                        $push: { event },
                    },
                );
            })
            .then((e) => {
                let responseData = JSON.parse(
                    JSON.stringify(workflowPlayDetail),
                );
                responseData.play = { 0: play };
                responseData.node = 1;
                responseData.status = 'Pending';
                responseData.play_now = play;
                responseData.originAttachment = originAttachment;
                responseData.attachment = attachment;
                responseData.event.push(event);
                dfd.resolve(responseData);
                for (var i in play) {
                    q.fcall(() => {
                        SocketProvider.IOEmitToRoom(
                            play[i].username,
                            'justPushNotification',
                            {
                                title: 'ThereIs1DocumentThatNeedsApproval',
                                body: workflowPlayDetail.title,
                                url:
                                    '/signing-details?' +
                                    workflowPlayDetail._id.toString(),
                            },
                        );
                    }).catch((err) => {
                        LogProvider.error(`Submit IO error: ${ err }`);
                    });
                }
            })
            .catch((err) => {
                LogProvider.error(`Process resubmit error: ${ err }`);
                dfd.reject({
                    path: 'WorkflowPlayService.resubmit.Error',
                    mess: 'ProcessResubmitError',
                });
            });
        return dfd.promise;
    }

    getUserInFlow(dbname_prefix, flow) {
        let dfd = q.defer();
        let dfdAr = [];
        for (let i in flow) {
            dfdAr.push(findUser_Employee_OneNode(dbname_prefix, flow[i]));
        }
        q.all(dfdAr).then(
            function (data) {
                for (const i of data) {
                    flow[i].usernameAr = data[i].map((e) => e.username);
                }
                dfd.resolve(flow);
            },
            function (err) {
                dfd.reject(err);
            }
        );
        return dfd.promise;
    }

    signAFile(dbname_prefix, username, id, filename, event, signInfo) {
        return MongoDBProvider.update_onOffice(
            dbname_prefix,
            'workflow_play',
            username,
            {
                $and: [
                    { _id: { $eq: new require('mongodb').ObjectID(id) } },
                    { 'attachment.name': filename },
                ],
            },
            {
                $push: {
                    'attachment.$.sign': signInfo,
                    event,
                },
                $set: {
                    'attachment.$.timePath': signInfo.timePath,
                    'attachment.$.locate': signInfo.locate,
                    'attachment.$.display': signInfo.display,
                    'attachment.$.name': signInfo.name,
                    'attachment.$.nameLib': signInfo.nameLib,
                },
            },
        );
    }

    updateWorkflowPlayAfterSigned(
        dbname_prefix,
        username,
        id,
        attachment,
        signatureTags,
        event
    ) {
        return MongoDBProvider.update_onOffice(
            dbname_prefix,
            'workflow_play',
            username,
            {
                $and: [{ _id: { $eq: new require('mongodb').ObjectID(id) } }],
            },
            {
                $push: {
                    event,
                },
                $set: {
                    attachment,
                    signatureTags,
                },
            },
        );
    }

    notifyUpcomingWorkflowPlayDaily (dbNamePrefix) {
        const dfd = q.defer();
        q.fcall(() => {
            const workflowEndTomorrow = WorkflowPlayFilter.buildJobLoadAggregate(1);
            const workflowEndToday = WorkflowPlayFilter.buildJobLoadAggregate(0);
            return q.all([
                MongoDBProvider.loadAggregate_onOffice(dbNamePrefix, "workflow_play", workflowEndTomorrow),
                MongoDBProvider.loadAggregate_onOffice(dbNamePrefix, "workflow_play", workflowEndToday),
            ]);
        })
            .then(([workflowEndTomorrow, workflowEndToday]) => {
                const promises = [];
                for (const element of workflowEndTomorrow) {
                    const params = {
                        title: element.title,
                        code: element.code,
                        workflow_id: element._id.toString(),
                        mes: "WorkflowPlayExpireSoon",
                        from_date: element.current_node.start_at,
                        to_date: element.current_node.expected_complete_at,
                    };
                    const sendTo = element.play_now.map((e) => e.username);
                    promises.push(createNewRingBellItem(dbNamePrefix, params, sendTo));
                }

                for (const element of workflowEndToday) {
                    const params = {
                        title: element.title,
                        code: element.code,
                        workflow_id: element._id.toString(),
                        mes: "WorkflowPlayExpireToday",
                        from_date: element.current_node.start_at,
                        to_date: element.current_node.expected_complete_at,
                    };
                    const sendTo = element.play_now.map((e) => e.username);
                    promises.push(createNewRingBellItem(dbNamePrefix, params, sendTo));
                }
                return q.all(promises);
            })
            .then(() => {
                dfd.resolve();
            })
            .catch((err) => {
                dfd.reject(err);
            });
        return dfd.promise;
    }

    complete(dbname_prefix, username, id, comment, relatedfile) {
        let dfd = q.defer();
        const d = new Date();
        MongoDBProvider.load_onOffice(dbname_prefix, "workflow_play",
            {
                $and: [
                    { "_id": { $eq: new require('mongodb').ObjectID(id) } },
                    { play_now: { $elemMatch: { username } } },
                    { document_type: 'exploit_document' }
                ]
            }
        ).then((data) => {
            if (data[0]) {
                let updateData = {};
                const currentNodeNumber = data[0].node;

                updateData.$set = {
                    node: -1,
                    status: WORKFLOW_PLAY_STATUS.COMPLETED,
                    [`flow.${currentNodeNumber - 1}.completed_at`]: d.getTime(),
                };
                updateData.$push = {
                    event: {
                        username,
                        time: d.getTime(),
                        action: WORKFLOW_PLAY_STATUS.COMPLETED,
                        node: data[0].node,
                        comment: comment,
                        valid: true,
                        relatedfile
                    },
                };
                updateData.$set.play_now = [];

                MongoDBProvider.update_onOffice(
                    dbname_prefix,
                    'workflow_play',
                    username,
                    { _id: { $eq: new require('mongodb').ObjectID(id) } },
                    updateData,
                ).then(() => {
                    dfd.resolve(true);
                }).catch(err => {
                    dfd.reject(err);
                    err = undefined;
                })

            } else {
                dfd.reject({
                    path: 'WorkflowPlayService.complete.YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists',
                    mes: 'YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists',
                });
            }
        }).catch(err => {
            dfd.reject(err);
            err = undefined;
        });
        return dfd.promise;
    }

    loadWorkflowPlayByTaskId(dbNamePrefix, username, taskId) {
        const dfd = q.defer();
        const filter = {
            "parent.object": OBJECT_NAME.TASK,
            "parent.value": taskId,
        };
        MongoDBProvider.load_onOffice(dbNamePrefix, "workflow_play", filter)
            .then((workflowPlay) => {
                if (workflowPlay.length === 0) {
                    return dfd.resolve(null);
                }
                dfd.resolve(workflowPlay[0]);
            })
            .catch((err) => {
                dfd.reject(err);
            });
        return dfd.promise;
    }

    linkTaskIntoWorkflowPlay(dbNamePrefix, username, taskId, id) {
        const dfd = q.defer();
        q.fcall(() => {
            const updatedData = {
                $set: {
                    parent: {
                        object: OBJECT_NAME.TASK,
                        value: taskId,
                    },
                },
            };
            return MongoDBProvider.update_onOffice(
                dbNamePrefix,
                "workflow_play",
                username,
                { _id: new mongodb.ObjectId(id) },
                updatedData,
            );
        })
            .then(() => {
                dfd.resolve(true);
            })
            .catch((err) => {
                dfd.reject(err);
            });
        return dfd.promise;
    }

}

class TaskWorkFlowPlayService {
    constructor() {}

    loadTaskbyWFPId(
        dbname_prefix,
        id
    ) {
        return MongoDBProvider.load_onOffice(
            dbname_prefix,
            "task",
            { workflowPlay_id: id } )
    }

    updateTaskStatusbyWFP (dbname_prefix, username, workflowPlay_id, status) {
        return MongoDBProvider.update_onOffice(
            dbname_prefix,
            "task",
            username,
            { workflowPlay_id: workflowPlay_id },
            {
                $set: {
                    status,
                    progress: 100,
                },
            },
        );
    }
}

class DepartmentService {
    constructor () { }

    getDepartmentById (dbname_prefix, departmentId) {
        const dfd = q.defer();
        MongoDBProvider.load_onOffice(dbname_prefix, 'organization', {
                id: departmentId,
            })
            .then(function (departments) {
                if (departments.length > 0) {
                    dfd.resolve(departments[0]);
                } else {
                    dfd.resolve(null);
                }
            })
            .catch(function (err) {
                dfd.reject(err);
            });
        return dfd.promise;
    }
}

class DirectoryService {
    constructor () {}

    loadDetail (dbname_prefix, masterKey, value) {
        return MongoDBProvider.getOne_onManagement(
            dbname_prefix,
            'directory',
            {
                'master_key': WORKFLOW_PLAY_DIRECTORY_MASTER_KEY,
                'value': value,
            },
        );
    }

}

class ODBService {
    constructor() {}

    getByWorkflowPlayId(dbname_prefix, username, workflowPlayId) {
        const dfd = q.defer();
        MongoDBProvider.load_onOffice(dbname_prefix, "outgoing_dispatch", { workflow_play_id: { $eq: workflowPlayId } })
            .then((data) => dfd.resolve(data[0]))
            .catch(() => dfd.resolve(null));
        return dfd.promise;
    }

    loadDetail(dbname_prefix, username, id) {
        const dfd = q.defer();
        let filter;
        q.fcall(() => {
            filter = {
                _id: new mongodb.ObjectId(id),
            };
        })
            .then(() => {
                return MongoDBProvider.load_onOffice(
                    dbname_prefix,
                    'outgoing_dispatch',
                    filter
                );
            })
            .then((result) => {
                if (!Array.isArray(result) || result.length === 0) {
                    dfd.resolve(null);
                } else {
                    dfd.resolve(result[0]);
                }
            })
            .catch((error) => {
                LogProvider.error(
                    "Could not load outgoing dispatch with reason: " + error.mes ||
                    error.message
                );
                dfd.reject(
                    new BaseError(
                        "OutgoingDispatchService.loadDetail.err",
                        "ProcessLoadOutGoingDispatchFailed"
                    )
                );
            });
        return dfd.promise;
    }
}

class UserService {
    constructor() { }

    loadUser(dbname_prefix, filter) {
        return MongoDBProvider.loadAggregate_onManagement(dbname_prefix, "user", filter);
    }
}

exports.WorkflowPlayService = new WorkflowPlayService();
exports.TaskWorkFlowPlayService = new TaskWorkFlowPlayService();
exports.ODBService = new ODBService();
exports.UserService = new UserService();
