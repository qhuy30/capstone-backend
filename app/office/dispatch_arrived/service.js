const q = require("q");
const mongodb = require("mongodb");

const BaseError = require("@shared/error/BaseError");

const { MongoDBProvider } = require("../../../shared/mongodb/db.provider");

const { RingBellItemService } = require("@management/ringbell_item/service");
const { OrganizationService } = require("@office/organization/organization.service");
const { SettingService } = require("@management/setting/service");
const { TaskService: TskService } = require("@office/task/service");

const { OBJECT_NAME } = require("@utils/referenceConstant");
const { OFFICE_DEPARTMENT_SETTING_KEY, BOARD_OF_DIRECTORS_SETTING_KEY, APPROVE_LEVEL_1_RULE, CONFIRM_RULE, LEAD_RULE } = require("./const");
const {
    DISPATCH_ARRIVED_STATUS,
    TASK_STATUS,
    DISPATCH_ARRIVED_VIEW_STATUS,
    DISPATCH_RESPONSE_TYPE,
} = require("@utils/constant");
const { LogProvider } = require("@shared/log_nohierarchy/log.provider");

const DATABASE_COLLECTION = "dispatch_arrived";

function checkPermissionViewDispatch(check, username, dispatch) {
    if (check) {
        return true;
    }

    if (dispatch["username"] && dispatch.username === username) {
        return true;
    }

    if (Array.isArray(dispatch["responsibility"]) && dispatch["responsibility"].includes(username)) {
        return true;
    }

    if (dispatch["handler"] && dispatch["handler"].username === username) {
        return true;
    }

    return false;
}

function pushRingBellWhenAccept(dbPrefix, department, dispatch, username) {
    let dfdAr = [];
    const filter = {
        $and: [
            { "parent.object": OBJECT_NAME.DISPATCH_ARRIVED },
            { "parent.value": dispatch._id.toString() },
            { status: TASK_STATUS.NOT_STARTED_YET },
            { department }
        ]
    };


    dfdAr.push(OrganizationService.loadDetails(dbPrefix, department));
    dfdAr.push(MongoDBProvider.load_onOffice(dbPrefix, "task", filter));
    q.all(dfdAr).then(function (data) {
        RingBellItemService.insert(
            dbPrefix,
            username,
            "da_department_accept_dispatch_arrived",
            {
                code: dispatch.code,
                dispatch_id: dispatch._id.toString(),
                action_by: username,
                mes: "LeaderAcceptDispatchArrived",
                department_title: data[0].title,
            },
            [dispatch.username],
            [],
            "LeaderAcceptDispatchArrived",
            new Date().getTime(),
        )


        RingBellItemService.insert(
            dbPrefix, username, "da_new_task", {
            department_title: data[0].title,
            taskCode: data[1][0].code,
            task_title: data[1][0].title,
            dispatch_id: dispatch._id.toString()
        },
            [username], [], "LeaderAcceptDispatchArrived",
            new Date().getTime()
        )


    }, function (err) {
        LogProvider.error(err)
    });

}

function handleResponseAccept(dbPrefix, username, department, dispatch, note) {
    const dfd = q.defer();
    let taskServiceObj = new TaskService();
    taskServiceObj.updateStatusByDispatchIdAndDepartment(
        dbPrefix,
        username,
        dispatch._id.toString(),
        department,
        TASK_STATUS.NOT_STARTED_YET,
    )
        .then(() => {
            const updateData = {
                $push: {
                    event: {
                        action: "ResponseAccept",
                        username,
                        time: new Date().getTime(),
                        note,
                    },
                },
            };
            MongoDBProvider.update_onOffice(
                dbPrefix,
                DATABASE_COLLECTION,
                username,
                { _id: new mongodb.ObjectId(dispatch._id.toString()) },
                updateData,
            ).then(function () {
                dfd.resolve(true);
                pushRingBellWhenAccept(dbPrefix, department, dispatch, username);

            }, function (err) {
                dfd.reject(err instanceof BaseError ? err : new BaseError("DAService.handleResponseAccept.pushEvent", "pushEventFailed"));
            })
        }, function (err) {
            dfd.reject(err instanceof BaseError ? err : new BaseError("DAService.handleResponseAccept.updateStatusByDispatchIdAndDepartment", "updateStatusByDispatchIdAndDepartmentFailed"));
        })
    // .then(() => {
    //     dfd.resolve(true);

    // OrganizationService.loadDetails(dbPrefix, department)
    //     .then((departmentDetail) => {
    //         return RingBellItemService.insert(
    //             dbPrefix,
    //             username,
    //             "da_department_accept_dispatch_arrived",
    //             {
    //                 code: dispatch.code,
    //                 dispatch_id: dispatch._id.toString(),
    //                 action_by: username,
    //                 mes: "LeaderAcceptDispatchArrived",
    //                 department_title: departmentDetail.title,
    //             },
    //             [dispatch.username],
    //             [],
    //             "LeaderAcceptDispatchArrived",
    //             new Date().getTime(),
    //         )

    //     })
    //     .then(() => {
    //         LogProvider.debug("Send notification success");
    //     })
    //     .catch((err) => {
    //         LogProvider.error(err);
    //     });
    // })
    // .catch((error) => {

    // });
    return dfd.promise;
}

function handleResponseReject(dbPrefix, username, department, dispatch, note) {
    const dfd = q.defer();
    q.fcall(() => {
        return exports.TaskService.updateStatusByDispatchIdAndDepartment(
            dbPrefix,
            username,
            dispatch._id.toString(),
            department,
            TASK_STATUS.REJECTED,
        );
    })
        .then(() => {
            const updateData = {
                $set: {
                    status: DISPATCH_ARRIVED_STATUS.REJECTED,
                },
                $push: {
                    event: {
                        action: "ResponseReject",
                        username,
                        time: new Date().getTime(),
                        note,
                    },
                },
            };
            return MongoDBProvider.update_onOffice(
                dbPrefix,
                DATABASE_COLLECTION,
                username,
                { _id: new mongodb.ObjectId(dispatch._id.toString()) },
                updateData,
            );
        })
        .then(() => {
            dfd.resolve(true);
            OrganizationService.loadDetails(dbPrefix, department)
                .then((departmentDetail) => {
                    return RingBellItemService.insert(
                        dbPrefix,
                        username,
                        "da_department_reject_dispatch_arrived",
                        {
                            code: dispatch.code,
                            dispatch_id: dispatch._id.toString(),
                            action_by: username,
                            mes: "LeaderRejectDispatchArrived",
                            department_title: departmentDetail.title,
                        },
                        [dispatch.username],
                        [],
                        "LeaderRejectDispatchArrived",
                        new Date().getTime(),
                    );
                })
                .then(() => {
                    LogProvider.debug("Send notification success");
                })
                .catch((err) => {
                    LogProvider.error(err);
                });
        })
        .catch((error) => {
            dfd.reject(
                error instanceof BaseError
                    ? error
                    : new BaseError("DAService.handleResponseReject.Error", "ResponseRejectError"),
            );
        });
    return dfd.promise;
}

function handleResponseRead(dbPrefix, username, department, dispatch, note) {
    const dfd = q.defer();
    q.fcall(() => {
        const updateData = {
            $set: {
                "view_only_departments.$[ele].status": DISPATCH_ARRIVED_VIEW_STATUS.READ,
            },
            $push: {
                event: {
                    action: "ResponseRead",
                    username,
                    time: new Date().getTime(),
                    note,
                },
            },
        };
        return MongoDBProvider.update_onOffice(
            dbPrefix,
            DATABASE_COLLECTION,
            username,
            { _id: new mongodb.ObjectId(dispatch._id.toString()) },
            updateData,
            { arrayFilters: [{ "ele.department": department }] },
        );
    })
        .then(() => {
            dfd.resolve(true);
            OrganizationService.loadDetails(dbPrefix, department)
                .then((departmentDetail) => {
                    return RingBellItemService.insert(
                        dbPrefix,
                        username,
                        "da_department_read_dispatch_arrived",
                        {
                            code: dispatch.code,
                            dispatch_id: dispatch._id.toString(),
                            action_by: username,
                            mes: "LeaderReadDispatchArrived",
                            department_title: departmentDetail.title,
                        },
                        [dispatch.username],
                        [],
                        "LeaderReadDispatchArrived",
                        new Date().getTime(),
                    );
                })
                .then(() => {
                    LogProvider.debug("Send notification success");
                })
                .catch((err) => {
                    LogProvider.error(err);
                });
        })
        .catch((error) => {
            dfd.reject(
                error instanceof BaseError
                    ? error
                    : new BaseError("DAService.handleResponseAccept.Error", "ResponseAcceptError"),
            );
        });
    return dfd.promise;
}

function sendNotificationForLeaderOfDepartments(dbPrefix, dispatch, username) {
    const dfd = q.defer();
    q.fcall(() => {
        const dispatchId = dispatch._id.toString();
        return TskService.loadByDispatchArrivedId(dbPrefix, dispatchId);
    })
        .then((tasks) => {
            const departmentIds = tasks.map((task) => task.department);
            const promises = departmentIds.map((departmentId) => {
                return OrganizationService.loadLeaderInDepartment(dbPrefix, departmentId);
            });
            return q.all(promises);
        })
        .then((leaderInDepartments) => {
            let usernames = [];
            leaderInDepartments.forEach((leaders) => {
                usernames = usernames.concat(leaders.map((leader) => leader.username));
            });
            return RingBellItemService.insert(
                dbPrefix,
                username,
                "da_forward_to_departments",
                {
                    code: dispatch.code,
                    dispatch_id: dispatch._id.toString(),
                    action_by: username,
                    mes: "ForwardHeadTaskToDepartments",
                },
                usernames,
                [],
                "ForwardToDepartments",
                new Date().getTime(),
            );
        })
        .catch((error) => {
            dfd.reject(
                error instanceof BaseError
                    ? error
                    : new BaseError("DAService.sendNotificationForViewOnlyDepartments.Error", "SendNotificationError"),
            );
        });
    return dfd.promise;
}

function sendNotificationForViewOnlyDepartments(dbPrefix, dispatch, username) {
    const dfd = q.defer();
    q.fcall(() => {
        const departmentIds = dispatch.view_only_departments.map((viewOnlyDepartment) => viewOnlyDepartment.department);
        const promises = departmentIds.map((departmentId) => {
            return OrganizationService.loadLeaderInDepartment(dbPrefix, departmentId);
        });
        return q.all(promises);
    })
        .then((leaderInDepartments) => {
            let usernames = [];
            leaderInDepartments.forEach((leaders) => {
                usernames = usernames.concat(leaders.map((leader) => leader.username));
            });
            return RingBellItemService.insert(
                dbPrefix,
                username,
                "da_forward_to_departments",
                {
                    code: dispatch.code,
                    dispatch_id: dispatch._id.toString(),
                    action_by: username,
                    mes: "ForwardNotifyToViewOnlyDepartments",
                },
                usernames,
                [],
                "ForwardToDepartments",
                new Date().getTime(),
            );
        })
        .catch((error) => {
            dfd.reject(
                error instanceof BaseError
                    ? error
                    : new BaseError("DAService.sendNotificationForLeaderOfDepartments.Error", "SendNotificationError"),
            );
        });
    return dfd.promise;
}

class DAService {
    constructor() { }

    executeAggregate(dbname_prefix, filter) {
        return MongoDBProvider.loadAggregate_onOffice(dbname_prefix, DATABASE_COLLECTION, filter);
    }

    load_quick_handle(dbname_prefix, filter) {
        return MongoDBProvider.loadAggregate_onOffice(dbname_prefix, "dispatch_arrived", filter);
    }

    count_quick_handle(dbname_prefix, filter) {
        return MongoDBProvider.loadAggregate_onOffice(dbname_prefix, "dispatch_arrived", filter);
    }

    // loadDetails(dbname_prefix, username, id, check, code = null) {
    //     let dfd = q.defer();
    //     let filter = {
    //         $and: []
    //     };

    //     if (id) {
    //         filter.$and.push({ _id: { $eq: new require('mongodb').ObjectID(id) } });
    //     }

    //     if (code) {
    //         code = decodeURIComponent(code);
    //         filter.$and.push({
    //             code: {
    //                 $regex: code,
    //                 $options: "i",
    //             },
    //         });
    //     }

    //     MongoDBProvider.load_onOffice(dbname_prefix, "dispatch_arrived", filter)
    //         .then(function (data) {
    //             if (data.length === 0) {
    //                 return q.resolve([null, null, null]);
    //             }

    //             const dispatch = data[0];
    //             return q.all([
    //                 dispatch,
    //                 MongoDBProvider.load_onOffice(dbname_prefix, "task", {
    //                     $and: [
    //                         {
    //                             "parent.object": OBJECT_NAME.DISPATCH_ARRIVED,
    //                             "parent.value": dispatch._id.toString(),
    //                         },
    //                     ],
    //                 }),
    //                 MongoDBProvider.load_onOffice(dbname_prefix, "notify", {
    //                     $and: [
    //                         { da: { $eq: dispatch._id.toString() } },
    //                         {
    //                             $or: [
    //                                 { username: { $eq: username } },
    //                                 { to_user: { $eq: username } },
    //                                 { type: { $eq: "public" } },
    //                             ],
    //                         },
    //                     ],
    //                 }),
    //             ]);
    //         })
    //         .then(([dispatch, tasks, notify]) => {
    //             if (!dispatch) {
    //                 throw BaseError.notFound("DAService.loadDetails.PermissionDenied");
    //             }

    //             if (!check && !checkPermissionViewDispatch(check, username, dispatch)) {
    //                 throw BaseError.permissionDenied("DAService.loadDetails.PermissionDenied");
    //             }

    //             Object.assign(dispatch, {
    //                 tasks,
    //                 notify,
    //             });
    //             dfd.resolve(dispatch);
    //         })
    //         .catch((error) => {
    //             dfd.reject(
    //                 error instanceof BaseError
    //                     ? error
    //                     : new BaseError("DAService.loadDetails.Error", "LoadDetailsError"),
    //             );
    //         });
    //     return dfd.promise;
    // }

    loadDetails(dbname_prefix, id, code) {
        const filter = id ? { _id: { $eq: new require("mongodb").ObjectID(id) } } : { code: code };
        return MongoDBProvider.getOne_onOffice(dbname_prefix, 'dispatch_arrived', filter);
    }

    loadList(dbname_prefix, filter, top, offset, sort) {
        return MongoDBProvider.load_onOffice(dbname_prefix, "dispatch_arrived", filter,
            top, offset, sort
        );
    }

    countList(dbname_prefix, filter) {
        return MongoDBProvider.count_onOffice(dbname_prefix, "dispatch_arrived", filter);
    }

    countPending(dbname_prefix, username) {
        return MongoDBProvider.count_onOffice(dbname_prefix, "dispatch_arrived",
            { "handler.username": { $eq: username } }
        );
    }

    getNumber(dbname_prefix, da_book) {
        let dfd = q.defer();
        MongoDBProvider.load_onOffice(dbname_prefix, "dispatch_arrived", { da_book: { $eq: da_book } },
            1, 0, { number: -1 }, { number: true }).then(function (data) {

                if (data[0]) {
                    dfd.resolve(data[0].number + 1);
                } else {
                    dfd.resolve(1);
                }
                data = undefined;
            }, function (err) {
                dfd.reject(err);
            });
        return dfd.promise;
    }

    insert(dbname_prefix, username, entity) {
        // const {
        //     year,
        //     code,
        //     incoming_number,
        //     incomming_date,
        //     symbol_number,
        //     sending_place,
        //     type,
        //     field,
        //     security_level,
        //     urgency_level,
        //     date_sign,
        //     content,
        //     attachments,
        //     incoming_file,
        //     events,
        //     department,
        //     status,
        //     expried,
        //     task_label,
        //     // task
        // } = entity;
        // return MongoDBProvider.insert_onOffice(dbname_prefix, DATABASE_COLLECTION, username,
        //     {
        //         year,
        //         code,
        //         incoming_number,
        //         incomming_date,
        //         symbol_number,
        //         sending_place,
        //         type,
        //         field,
        //         security_level,
        //         urgency_level,
        //         date_sign,
        //         content,
        //         attachments,
        //         incoming_file,
        //         events,
        //         department,
        //         username,
        //         // task,
        //         expried,
        //         status,
        //         task_label,
        //         time: new Date().getTime(),
        //     }
        // );
        return MongoDBProvider.insert_onOffice(dbname_prefix, DATABASE_COLLECTION, username, {
            ...entity, // Sao chép toàn bộ thuộc tính từ entity
            username,  // Ghi đè hoặc bổ sung thuộc tính username
            time: new Date().getTime(), // Bổ sung thêm thuộc tính time
        });
    }

    insertMany(dbname_prefix, username, listDataInsert) {
        return MongoDBProvider.insertMany_onOffice(dbname_prefix, DATABASE_COLLECTION, username, listDataInsert);
    }

    handling(dbname_prefix, username, id, forward, comment) {
        let dfd = q.defer();
        MongoDBProvider.load_onOffice(dbname_prefix, "dispatch_arrived", {
            $and: [
                { _id: { $eq: require('mongodb').ObjectID(id) } },
                {
                    $or: [
                        { "responsibility": { $eq: username } },
                        { "handler.username": { $eq: username } },
                        { "forward": { $eq: username } }
                    ]
                }
            ]
        }
        ).then(function (data) {
            if (data[0]) {
                let d = new Date();
                let event = [];
                let status;

                if (forward.length > 0) {
                    event = [{ username, time: d.getTime(), action: "HandlingAndForward", to: forward, comment }];
                    status = "Pending";
                } else {
                    event = [{ username, time: d.getTime(), action: "Handling", to: forward, comment }];
                    status = "Completed";
                }
                MongoDBProvider.update_onOffice(dbname_prefix, "dispatch_arrived", username,
                    { _id: { $eq: require('mongodb').ObjectID(id) } },
                    { $push: { event: { $each: event }, forward: { $each: forward } }, $set: { handler: forward, status } }).then(function () {
                        dfd.resolve(true);
                    }, function (err) {
                        dfd.reject(err);
                        err = undefined;
                    });
            } else {
                dfd.reject({ path: "DAService.handling.InvalidInformation", mes: "InvalidInformation" });
            }
        }, function (err) {
            dfd.reject(err);
            err = undefined;
        });
        return dfd.promise;
    }

    delete(dbname_prefix, username, id) {
        return MongoDBProvider.delete_onOffice(dbname_prefix, "dispatch_arrived", username,
            { _id: { $eq: require('mongodb').ObjectID(id) } });
    }

    insertTask(dbname_prefix, username, department, id, title, content, task_list, main_person, participant, observer, attachment, from_date, to_date, object, priority) {
        let d = new Date();
        MongoDBProvider.update_onOffice(dbname_prefix, "dispatch_arrived", username, { _id: { $eq: require('mongodb').ObjectID(id) } }
            , { $set: { have_task: true }, $push: { event: { username, action: "AddTaskForThis", to: main_person, time: d.getTime() } } });
        return MongoDBProvider.insert_onOffice(dbname_prefix, "task", username,
            { reference: [{ object: "DispatchArrived", id }], username, department, title, content, task_list, main_person, participant, observer, attachment, from_date, to_date, status: "NotStartedYet", event: [{ username, time: d.getTime(), action: "Created" }], object, comment: [], priority, progress: 0 });
    }

    update(dbname_prefix, username, id, entity, event) {
        return MongoDBProvider.update_onOffice(
            dbname_prefix,
            "dispatch_arrived",
            username,
            { _id: { $eq: require("mongodb").ObjectID(id) } },
            {
                $set: entity,
                $push: {
                    events: event,
                },
            },
        );
    }

    send_lead_department(dbname_prefix, username, id, entity, event) {
        return MongoDBProvider.update_onOffice(
            dbname_prefix,
            "dispatch_arrived",
            username,
            { _id: { $eq: require("mongodb").ObjectID(id) } },
            {
                $set: entity,
                $push: {
                    events:  event,
                },
            },
        );
    }

    send_lead_external(dbname_prefix, username, id, entity, event) {
        return MongoDBProvider.update_onOffice(
            dbname_prefix,
            "dispatch_arrived",
            username,
            { _id: { $eq: require("mongodb").ObjectID(id) } },
            {
                $set: entity,
                $push: {
                    events:  event,
                },
            },
        );
    }

    reject_department(dbname_prefix, username, id, event, status) {
        return MongoDBProvider.update_onOffice(
            dbname_prefix,
            "dispatch_arrived",
            username,
            { _id: { $eq: require("mongodb").ObjectID(id) } },
            {
                $set: {status: status},
                $push: {
                    events:  event,
                },
            },
        );
    }

    return_lead_department(dbname_prefix, username, id, entity, event) {
        return MongoDBProvider.update_onOffice(
            dbname_prefix,
            "dispatch_arrived",
            username,
            { _id: { $eq: require("mongodb").ObjectID(id) } },
            {
                $set: entity,
                $push: {
                    events:  event,
                },
            },
        );
    }

    transfer_department(dbname_prefix, username, id, entity, event) {
        return MongoDBProvider.update_onOffice(
            dbname_prefix,
            "dispatch_arrived",
            username,
            { _id: { $eq: require("mongodb").ObjectID(id) } },
            {
                $set: entity,
                $push: {
                    events:  event,
                },
            },
        );
    }

    transfer_department_approve(dbname_prefix, username, id, event, status, task_code) {
        return MongoDBProvider.update_onOffice(
            dbname_prefix,
            "dispatch_arrived",
            username,
            { _id: { $eq: require("mongodb").ObjectID(id) } },
            {
                $set: {status: status, task_code: task_code},
                $push: {
                    events:  event,
                },
            },
        );
    }

    seen_work(dbname_prefix, username, id, event, department_receiver) {
        return MongoDBProvider.update_onOffice(
            dbname_prefix,
            "dispatch_arrived",
            username,
            { _id: { $eq: require("mongodb").ObjectID(id) } },
            {
                $set: {department_receiver: department_receiver},
                $push: {
                    events:  event,
                },
            },
        );
    }

    signAcknowledge(dbname_prefix, username, id, noteSignAcknowledge, with_task) {
        let d = new Date();
        let setValues = { signKnowledge: true, noteSignAcknowledge };

        if (!with_task) {
            setValues = { ...setValues, status: "Completed" };
        }

        return MongoDBProvider.update_onOffice(
            dbname_prefix,
            "dispatch_arrived",
            username,
            { _id: { $eq: require("mongodb").ObjectID(id) } },
            {
                $set: setValues,
                $push: { event: { username, action: "SignedToAcknowledge", time: d.getTime() } },
            },
        );
    }

    loadDispatchArrivedInfo(dbPrefix,id){
        return MongoDBProvider.load_onOffice(dbPrefix, "dispatch_arrived", {
            _id: new mongodb.ObjectId(id)
        });
    }



    response(dbPrefix, username, department, entity) {
        const dfd = q.defer();
        q.fcall(() => {
            return this.loadById(dbPrefix, entity.id);
        })
            .then((dispatchArrived) => {
                switch (entity.type) {
                    case DISPATCH_RESPONSE_TYPE.ACCEPT:
                        return handleResponseAccept(dbPrefix, username, department, dispatchArrived, entity.note);
                    case DISPATCH_RESPONSE_TYPE.REJECT:
                        return handleResponseReject(dbPrefix, username, department, dispatchArrived, entity.note);
                    case DISPATCH_RESPONSE_TYPE.READ:
                        return handleResponseRead(dbPrefix, username, department, dispatchArrived, entity.note);
                    default:
                        throw new BaseError("DAService.response.InvalidResponseType", "InvalidResponseType");
                }
            })
            .then(() => {
                dfd.resolve(true);
            })
            .catch((error) => {
                dfd.reject(
                    error instanceof BaseError ? error : new BaseError("DAService.response.Error", "ResponseError"),
                );
            });
        return dfd.promise;
    }

    loadById(dbname_prefix, id) {
        const dfd = q.defer();
        q.fcall(() => {
            return MongoDBProvider.load_onOffice(dbname_prefix, "dispatch_arrived", { _id: new mongodb.ObjectId(id) });
        })
            .then((result) => {
                if (result.length === 0) {
                    return dfd.resolve(null);
                }
                dfd.resolve(result[0]);
            })
            .catch((error) => {
                dfd.reject(error);
            });
        return dfd.promise;
    }

    dynamic_update(dbname_prefix, username, id,updateOperator){
        return MongoDBProvider.update_onOffice(
            dbname_prefix,
            "dispatch_arrived",
            username,
            { _id: { $eq: require("mongodb").ObjectID(id) } },
            updateOperator
        );
    }

    sendNotificationForLeaderOfDepartments(dbPrefix, dispatch, username) {
        const dfd = q.defer();
        q.fcall(() => {
            const dispatchId = dispatch._id.toString();
            return TskService.loadByDispatchArrivedId(dbPrefix, dispatchId);
        })
            .then((tasks) => {
                const departmentIds = tasks.map((task) => task.department);
                const promises = departmentIds.map((departmentId) => {
                    return OrganizationService.loadLeaderInDepartment(dbPrefix, departmentId);
                });
                return q.all(promises);
            })
            .then((leaderInDepartments) => {
                let usernames = [];
                leaderInDepartments.forEach((leaders) => {
                    usernames = usernames.concat(leaders.map((leader) => leader.username));
                });
                return RingBellItemService.insert(
                    dbPrefix,
                    username,
                    "da_forward_to_departments",
                    {
                        code: dispatch.code,
                        dispatch_id: dispatch._id.toString(),
                        action_by: username,
                        mes: "ForwardHeadTaskToDepartments",
                    },
                    usernames,
                    [],
                    "ForwardToDepartments",
                    new Date().getTime(),
                );
            })
            .catch((error) => {
                dfd.reject(
                    error instanceof BaseError
                        ? error
                        : new BaseError("DAService.sendNotificationForViewOnlyDepartments.Error", "SendNotificationError"),
                );
            });
        return dfd.promise;
    }

    sendNotificationForViewOnlyDepartments(dbPrefix, dispatch, username) {
        const dfd = q.defer();
        q.fcall(() => {
            const departmentIds = dispatch.view_only_departments.map((viewOnlyDepartment) => viewOnlyDepartment.department);
            const promises = departmentIds.map((departmentId) => {
                return OrganizationService.loadLeaderInDepartment(dbPrefix, departmentId);
            });
            return q.all(promises);
        })
            .then((leaderInDepartments) => {
                let usernames = [];
                leaderInDepartments.forEach((leaders) => {
                    usernames = usernames.concat(leaders.map((leader) => leader.username));
                });
                return RingBellItemService.insert(
                    dbPrefix,
                    username,
                    "da_forward_to_departments",
                    {
                        code: dispatch.code,
                        dispatch_id: dispatch._id.toString(),
                        action_by: username,
                        mes: "ForwardNotifyToViewOnlyDepartments",
                    },
                    usernames,
                    [],
                    "ForwardToDepartments",
                    new Date().getTime(),
                );
            })
            .catch((error) => {
                dfd.reject(
                    error instanceof BaseError
                        ? error
                        : new BaseError("DAService.sendNotificationForLeaderOfDepartments.Error", "SendNotificationError"),
                );
            });
        return dfd.promise;
    }


}

class DepartmentService {
    constructor() { }
    load(dbname_prefix) {
        return MongoDBProvider.load_onOffice(dbname_prefix, "organization", { type: { $eq: "department" } });
    }

    getDepartmentById(dbname_prefix, departmentId) {
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

class EmployeeService {
    constructor() { }
    load(dbname_prefix, department) {
        return MongoDBProvider.load_onOffice(dbname_prefix, "employee", { department: { $eq: department } });
    }
}

class DirectoryService {
    constructor() { }

    loadDetail(dbname_prefix, masterKey, value) {
        return MongoDBProvider.getOne_onManagement(
            dbname_prefix,
            'directory',
            {
                'master_key': masterKey,
                'value': value,
            },
        );
    }

    addIncommingNumber(dbname_prefix, username, value, incomming_number) {
        return MongoDBProvider.update_onManagement(
            dbname_prefix,
            'directory',
            username,
            {
                'master_key': 'incomming_dispatch_book',
                'value': value,
            },
            {
                $push: { used_values: incomming_number },
            },
        );
    }

    removeIncommingNumber(dbname_prefix, username, value, incomming_number) {
        return MongoDBProvider.update_onManagement(
            dbname_prefix,
            'directory',
            username,
            {
                'master_key': 'incomming_dispatch_book',
                'value': value,
            },
            {
                $pull: { used_values: incomming_number }
            }
        );
    }
}

class TaskService {
    updateStatusByDispatchId(dbPrefix, dispatchId, status) {
        const dfd = q.defer();
        q.fcall(() => {
            const filter = {
                "parent.object": OBJECT_NAME.DISPATCH_ARRIVED,
                "parent.value": dispatchId,
                status: {
                    $in: [TASK_STATUS.WAITING_FOR_APPROVAL],
                },
            };
            const updateData = {
                $set: {
                    status,
                },
            };
            return MongoDBProvider.update_onOffice(dbPrefix, "task", null, filter, updateData);
        })
            .then(() => {
                dfd.resolve(true);
            })
            .catch((error) => {
                dfd.reject(
                    error instanceof BaseError
                        ? error
                        : new BaseError("TaskService.updateStatusByIds.Error", "UpdateStatusError"),
                );
            });
        return dfd.promise;
    }

    updateStatusByDispatchIdAndDepartment(dbPrefix, username, dispatchId, department, status) {
        const dfd = q.defer();
        const filter = {
            $and: [
                { "parent.object": OBJECT_NAME.DISPATCH_ARRIVED },
                { "parent.value": dispatchId },
                { status: TASK_STATUS.WAITING_FOR_ACCEPT },
                { department }
            ]
        };
        const updateData = {
            $set: {
                status,
            },
        };
        MongoDBProvider.update_onOffice(dbPrefix, "task", username, filter, updateData).then(function (res) {

            dfd.resolve(res);
        }, function (err) {
            dfd.reject(
                err instanceof BaseError
                    ? err
                    : new BaseError("TaskService.updateStatusByIds.Error", "UpdateStatusError"),
            );
        });
        return dfd.promise;
    }

    updateRejectedTaskToWaitingForApproval(dbPrefix, username, dispatchId) {
        const dfd = q.defer();
        const filter = {
            "parent.object": OBJECT_NAME.DISPATCH_ARRIVED,
            "parent.value": dispatchId,
            status: TASK_STATUS.REJECTED,
        };
        const updateData = {
            $set: {
                status: TASK_STATUS.WAITING_FOR_APPROVAL,
            },
        };
        MongoDBProvider.update_onOffice(dbPrefix, "task", username, filter, updateData).then(function () {
            dfd.resolve(true);
        }, function (err) {
            dfd.reject(
                err instanceof BaseError
                    ? err
                    : new BaseError("TaskService.updateRejectedTaskToWaitingForApproval.Error", "UpdateStatusError"),
            );
        })
        return dfd.promise;
    }

}

class UserService {
    constructor() { }

    loadUserAggregate(dbname_prefix, filter) {
        return MongoDBProvider.loadAggregate_onManagement(dbname_prefix, 'user', filter)
    }

    loadLeadOfOffice(dbPrefix) {
        return MongoDBProvider.load_onManagement(dbPrefix, "user", { "rule.rule": { $eq: LEAD_RULE } });
    }

    loadLeadLevel1(dbPrefix) {
        return MongoDBProvider.load_onManagement(dbPrefix, "user", { "rule.rule": { $eq: APPROVE_LEVEL_1_RULE } });
    }

    loadLeadOfDepartment(dbPrefix) {
        return MongoDBProvider.load_onManagement(dbPrefix, "user",
            {
                "rule.rule": { $eq: CONFIRM_RULE }
            });
    }
}

exports.UserService = new UserService();
exports.DAService = new DAService();
exports.DepartmentService = new DepartmentService();
exports.EmployeeService = new EmployeeService();
exports.DirectoryService = new DirectoryService();
exports.TaskService = new TaskService();
