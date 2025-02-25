const q = require("q");
const mongodb = require("mongodb");
const moment = require("moment");

const { MongoDBProvider } = require("../../../shared/mongodb/db.provider");
const { removeUnicode, isValidValue, NumberToStringForDate } = require("../../../utils/util");
const { SocketProvider } = require("./../../../shared/socket/provider");
const {
    TASK_STATUS,
    TASK_EVENT,
    TASK_PRIORITY,
} = require("../../../utils/constant");
const { NOTIFY_SCOPE, NOTIFY_STATUS } = require("./const");
const { LogProvider } = require("../../../shared/log_nohierarchy/log.provider");
const { StoreConst } = require("../../../shared/store/gcp/store.const");
const CodeUtil = require("../../../utils/codeUtil");
const NOTIFY_CODE_PATTERN = "BT-{year}-{notifyNumber}";
const NOTIFY_SEQUENCE_NUMBER_KEY = () => `notify_${new Date().getFullYear()}`;



class NotifyService {
    constructor() {
        this.collection = "notify";
    }


    find_approval_user(dbname_prefix, rule) {
        let dfd = q.defer();
        const approverFilter = {
            rule: {
                $elemMatch: {
                    rule: rule,
                    "details.type": { $ne: "None" }
                }
            }
        }
        MongoDBProvider.load_onManagement(
            dbname_prefix,
            "user",
            approverFilter,
            undefined,
            0,
            { title: 1 },
            undefined,
            true,
        ).then(
            function (res) {
                dfd.resolve(res);
            },
            function (err) {
                dfd.reject(err);
            },
        );
        return dfd.promise
    }

    load_quick_handle(dbname_prefix, filter) {
        return MongoDBProvider.loadAggregate_onOffice(dbname_prefix, this.collection, filter);
    }

    count_quick_handle(dbname_prefix, filter) {
        return MongoDBProvider.loadAggregate_onOffice(dbname_prefix, this.collection, filter);
    }

    load(dbname_prefix, filter) {
        return MongoDBProvider.loadAggregate_onOffice(dbname_prefix, this.collection, filter)
    }

    count(dbname_prefix, filter) {
        return MongoDBProvider.loadAggregate_onOffice(dbname_prefix, this.collection, filter);
    }

    count_not_seen(dbname_prefix, username) {
        return MongoDBProvider.count_onOffice(dbname_prefix, this.collection, {
            $and: [
                { status: { $eq: NOTIFY_STATUS.APPROVED } },
                { username: { $ne: username } },
                {
                    event: { $not: { $elemMatch: { username: { $eq: username }, action: { $eq: "Seen" } } } },
                },
                {
                    to_user: { $eq: username },
                },
                { in_recyclebin: { $ne: username } },
            ],
        });
    }

    count_pending(dbname_prefix, filter) {
        return MongoDBProvider.count_onOffice(dbname_prefix, this.collection, filter);
    }

    insert(
        dbname_prefix,
        username,
        department,
        title,
        content,
        group,
        type,
        attachments,
        status,
        to_employee,
        to_department,
        to_director,
        event,
        task_id,
        scope,
        filter,
    ) {
        let dfd = q.defer();

        const reference = [];
        if (isValidValue(task_id)) {
            reference.push({
                object: "task",
                id: task_id,
            });
        }
        let to_user = [];
        q.all([
            MongoDBProvider.load_onManagement(
                dbname_prefix,
                "user",
                filter,
                undefined,
                0,
                { title: 1 },
                undefined,
                true,
            ).then((u) => {
                if (u && u.length) {
                    switch (scope) {
                        case NOTIFY_SCOPE.EXTERNAL:
                            to_user = u.map((user) => user.username);
                            break;
                        case NOTIFY_SCOPE.INTERNAL:
                            to_user = u.map((user) => user.username);
                            to_employee
                                .filter(
                                    (employee) =>
                                        to_user.indexOf(employee) === -1,
                                )
                                .forEach((employee) => to_user.push(employee));
                            to_director
                                .filter(
                                    (director) =>
                                        to_user.indexOf(director) === -1,
                                )
                                .forEach((director) => to_user.push(director));
                            break;
                    }
                }
            }),
            MongoDBProvider.getAutoIncrementNumber_onManagement(dbname_prefix, NOTIFY_SEQUENCE_NUMBER_KEY()),
        ])
            .then(([, sequenceNumber]) => {
                const code = CodeUtil.resolvePattern(NOTIFY_CODE_PATTERN, {
                    notifyNumber: sequenceNumber,
                });
                return MongoDBProvider.insert_onOffice(dbname_prefix, this.collection, username, {
                    username,
                    title,
                    title_search: removeUnicode(title),
                    department,
                    content,
                    group,
                    type,
                    status,
                    attachments,
                    to_employee,
                    to_department,
                    to_director,
                    to_user,
                    sms: {},
                    event,
                    in_recyclebin: [],
                    watched: [],
                    view: 0,
                    like: [],
                    reference,
                    scope,
                    code,
                });
            })
            .then((e) => {
                dfd.resolve(e);
            })
            .catch((error) => {
                LogProvider.error("Can not insert new notify with reason: " + error.mes || error.message || error);
                dfd.reject({
                    path: "NotifyService.insert.err",
                    mes: "ProcessInsertFailed",
                });
            });
        return dfd.promise;
    }

    update(
        dbname_prefix,
        username,
        id,
        title,
        content,
        group,
        type,
        to_employee,
        to_department,
        to_director,
        task_id,
        scope
    ) {
        const d = new Date();
        let dfd = q.defer();
        let filter = {};
        let item = {
            title,
            title_search: removeUnicode(title),
            content,
            group,
            type,
            to_employee,
            to_department,
            to_director,
            task_id,
            scope
        };
        switch (type) {
            case "WholeSchool":
                break;
            case "Employee":
                filter = { username: { $in: to_employee } };
                break;

            case "Department":
                filter = { department: { $in: to_department } };
        }

        const reference = [];
        if (isValidValue(task_id)) {
            reference.push({
                object: "task",
                id: task_id,
            });
        }

        MongoDBProvider.load_onManagement(dbname_prefix, "user", filter, undefined, 0, { title: 1 }, undefined, true)
            .then((u) => {
                item.to_user = u.map((i) => {
                    if (i.username !== username) return i.username;
                });
                return MongoDBProvider.update_onOffice(
                    dbname_prefix,
                    this.collection,
                    username,
                    { _id: { $eq: new require("mongodb").ObjectID(id) } },
                    {
                        $set: item,
                        $push: {
                            event: {
                                username,
                                time: d.getTime(),
                                action: "UpdatedInformation",
                            },
                        },
                    },
                );
            })
            .then((e) => {
                dfd.resolve(e);
                return new Promise((resolve, reject) => {
                    if (isValidValue(task_id) && NOTIFY_STATUS.APPROVED === status) {
                        exports.TaskService.completedTaskById(dbname_prefix, username, task_id)
                            .then(function () {
                                resolve(e);
                            })
                            .catch(function (error) {
                                reject(error);
                            });
                    } else {
                        resolve(e);
                    }
                });
            })
            .catch((error) => {
                LogProvider.error("Can not update new notify with reason: " + error.mes || error.message || error);
                dfd.reject({
                    path: "NotifyService.update.err",
                    mes: "ProcessUpdateFailed",
                });
            });
        return dfd.promise;
    }

    approve_department(
        dbname_prefix,
        username,
        id,
        title,
        content,
        group,
        type,
        to_employee,
        to_department,
        to_director,
        task_id,
        scope,
        note,
        status
    ) {
        const d = new Date();
        let dfd = q.defer();
        let filter = {};

        let item = {
            title,
            title_search: removeUnicode(title),
            content,
            group,
            type,
            to_employee,
            to_department,
            to_director,
            task_id,
            scope,
            status,
            changeStatusTime: d.getTime()
        };
        switch (type) {
            case "WholeSchool":
                break;
            case "Employee":
                filter = { username: { $in: to_employee } };
                break;

            case "Department":
                filter = { department: { $in: to_department } };
        }

        const reference = [];
        if (isValidValue(task_id)) {
            reference.push({
                object: "task",
                id: task_id,
            });
        }

        MongoDBProvider.load_onManagement(dbname_prefix, "user", filter, undefined, 0, { title: 1 }, undefined, true)
            .then((u) => {
                
                item.to_user = u.map((i) => {
                    if (i.username !== username) return i.username;
                });
                to_director
                    .filter(
                        (director) =>
                            item.to_user.indexOf(director) === -1,
                    )
                    .forEach((director) => item.to_user.push(director));
                return MongoDBProvider.update_onOffice(
                    dbname_prefix,
                    this.collection,
                    username,
                    { _id: { $eq: new require("mongodb").ObjectID(id) } },
                    {
                        $set: item,
                        $push: {
                            event: {
                                username,
                                action: status,
                                time: d.getTime(),
                                status,
                                note
                            },
                        },
                    },
                );
            })
            .then((e) => {
                dfd.resolve(e);
                return new Promise((resolve, reject) => {
                    if (isValidValue(task_id) && NOTIFY_STATUS.APPROVED === status) {
                        exports.TaskService.completedTaskById(dbname_prefix, username, task_id)
                            .then(function () {
                                resolve(e);
                            })
                            .catch(function (error) {
                                reject(error);
                            });
                    } else {
                        resolve(e);
                    }
                });
            })
            .catch((error) => {
                console.log(error);
                LogProvider.error("Can not update new notify with reason: " + error.mes || error.message || error);
                dfd.reject({
                    path: "NotifyService.update.err",
                    mes: "ProcessUpdateFailed",
                });
            });
        return dfd.promise;
    }

    approval(dbname_prefix, username, id, status, note) {
        const d = new Date();
        return MongoDBProvider.update_onOffice(
            dbname_prefix,
            this.collection,
            username,
            {
                _id: new mongodb.ObjectId(id),
            },
            {
                $set: {
                    status: status,
                    changeStatusTime: d.getTime()
                },
                $push: {
                    event: {
                        username,
                        action: status,
                        time: d.getTime(),
                        status,
                        note
                    },
                },
            },
        );
    }

    reject(dbname_prefix, username, id, reason, nextStatus) {
        let d = new Date();
        return MongoDBProvider.update_onOffice(
            dbname_prefix,
            this.collection,
            username,
            {
                $and: [
                    { _id: { $eq: new require("mongodb").ObjectID(id) } },
                    { status: { $in: [NOTIFY_STATUS.PENDING, NOTIFY_STATUS.PENDING_RECALLED, NOTIFY_STATUS.APPROVED_BY_DEPARTMENT_LEADER, NOTIFY_STATUS.APPROVED_RECALL_BY_DEPARTMENT_LEADER, NOTIFY_STATUS.APPROVED_LEAD_EXTERNAL] } },
                ],
            },
            {
                $set: { status: nextStatus, changeStatusTime: d.getTime() },
                $push: { event: { username, action: NOTIFY_STATUS.REJECTED, time: d.getTime(), reason } },
            },
        );
    }

    up_view(dbname_prefix, username, id) {
        return MongoDBProvider.update_onOffice(
            dbname_prefix,
            this.collection,
            username,
            { _id: { $eq: new require("mongodb").ObjectID(id) } },
            { $inc: { view: 1 }, $addToSet: { watched: username } },
        );
    }

    add_user_seen(dbname_prefix, username, id, code) {
        const filterId = id ? { _id: { $eq: new require("mongodb").ObjectID(id) } } : { code: code };
        const filter = {
            ...filterId,
            $nor: [{
                event: {
                    $elemMatch: {
                        username: username,
                        action: "Seen"
                    }
                }
            }]
        }
        let d = new Date();
        return MongoDBProvider.update_onOffice(dbname_prefix, this.collection, username, filter, {
            $push: {
                event: {
                    username,
                    action: "Seen",
                    time: d.getTime(),
                },
            },
        });
    }

    // load_details(dbname_prefix, username, id, code) {
    //     const filter = id ? { _id: { $eq: new require("mongodb").ObjectID(id) } } : { code: code };
    //     let dfd = q.defer();
    //     MongoDBProvider.load_onOffice(dbname_prefix, this.collection, {
    //         $and: [
    //             filter,
    //             {
    //                 $or: [
    //                     { to_user: { $eq: username } },
    //                     { username: { $eq: username } },

    //                 ],
    //             },
    //         ],
    //     }).then(
    //         function (res) {
    //             if (res[0]) {
    //                 dfd.resolve(res[0]);
    //                 let check = true;
    //                 for (var i in res[0].event) {
    //                     if (res[0].event[i].username == username && action == "Seen") {
    //                         check = false;
    //                         break;
    //                     }
    //                 }
    //                 if (check) {
    //                     let d = new Date();
    //                     MongoDBProvider.update_onOffice(dbname_prefix, this.collection, username, filter, {
    //                         $push: {
    //                             event: {
    //                                 username,
    //                                 action: "Seen",
    //                                 time: d.getTime(),
    //                             },
    //                         },
    //                     });
    //                 }
    //             } else {
    //                 dfd.reject({ path: "NotifyService.loadDetails.DataIsNull", mes: "DataIsNull" });
    //             }
    //             res = undefined;
    //             dfd = undefined;
    //             code = undefined;
    //             username = undefined;
    //         },
    //         function (err) {
    //             dfd.reject({ path: "NotifyService.loadDetails.db", err });
    //             err = undefined;
    //             code = undefined;
    //             username = undefined;
    //         },
    //     );
    //     return dfd.promise;
    // }

    loadDetails(dbname_prefix, id, code) {
        const filter = id ? { _id: { $eq: new require("mongodb").ObjectID(id) } } : { code: code };
        return MongoDBProvider.getOne_onOffice(dbname_prefix, this.collection, filter);
    }

    delete(dbname_prefix, username, id) {
        return MongoDBProvider.update_onOffice(
            dbname_prefix,
            this.collection,
            username,
            { _id: { $eq: new require("mongodb").ObjectID(id) } },
            {
                $push: { event: { username, action: "Deleted", time: new Date() } },
                $set: { is_delete: true },
            },
        );
    }

    recall(dbname_prefix, username, id, recall_reason, status) {
        const d = new Date();
        return MongoDBProvider.update_onOffice(
            dbname_prefix,
            this.collection,
            username,
            { _id: { $eq: new require("mongodb").ObjectID(id) } },
            {
                $set: {
                    status: status,
                    changeStatusTime: d.getTime()
                },
                $push: {
                    event: {
                        username,
                        action: status,
                        time: d.getTime(),
                        reason: recall_reason,
                        status,
                    },
                },
            },
        );
    }

    like(dbname_prefix, username, id) {
        return MongoDBProvider.update_onOffice(
            dbname_prefix,
            this.collection,
            username,
            {
                $and: [
                    { _id: { $eq: new require("mongodb").ObjectID(id) } },
                    {
                        $or: [
                            { status: { $eq: NOTIFY_STATUS.APPROVED } },
                            {
                                $and: [
                                    { status: { $eq: NOTIFY_STATUS.APPROVED_BY_DEPARTMENT_LEADER } },
                                    { scope: { $eq: NOTIFY_SCOPE.INTERNAL } }
                                ]
                            }
                        ]
                    }
                ],
            },
            {
                $addToSet: { like: username },
            },
        );
    }

    unlike(dbname_prefix, username, id) {
        return MongoDBProvider.update_onOffice(
            dbname_prefix,
            this.collection,
            username,
            {
                $and: [
                    { _id: { $eq: new require("mongodb").ObjectID(id) } },
                    {
                        $or: [
                            { status: { $eq: NOTIFY_STATUS.APPROVED } },
                            {
                                $and: [
                                    { status: { $eq: NOTIFY_STATUS.APPROVED_BY_DEPARTMENT_LEADER } },
                                    { scope: { $eq: NOTIFY_SCOPE.INTERNAL } }
                                ]
                            }
                        ]
                    }
                ],
            },
            { $pull: { like: username } },
        );
    }

    throw_to_recyclebin(dbname_prefix, username, id) {
        return MongoDBProvider.update_onOffice(
            dbname_prefix,
            this.collection,
            username,
            { _id: { $eq: new require("mongodb").ObjectID(id) } },
            { $push: { in_recyclebin: username } },
        );
    }

    restore_from_recyclebin(dbname_prefix, username, id) {
        return MongoDBProvider.update_onOffice(
            dbname_prefix,
            this.collection,
            username,
            { _id: { $eq: new require("mongodb").ObjectID(id) } },
            { $pull: { in_recyclebin: username } },
        );
    }

    get_by_id(dbname_prefix, id) {
        let dfd = q.defer();
        MongoDBProvider.load_onOffice(dbname_prefix, this.collection, {
            $and: [{ _id: { $eq: new require("mongodb").ObjectID(id) } }],
        })
            .then((data) => {
                if (data[0]) {
                    dfd.resolve(data[0]);
                } else {
                    dfd.reject({
                        path: "NotifyService.update.YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists",
                        mes: "YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists",
                    });
                }
            })
            .catch((err) => {
                dfd.reject(err);
                err = undefined;
            });
        return dfd.promise;
    }

    pushfile(dbname_prefix, username, id, file) {
        let dfd = q.defer();
        MongoDBProvider.load_onOffice(dbname_prefix, this.collection, {
            _id: { $eq: new require("mongodb").ObjectID(id) },
        }).then(
            function (data) {
                if (data[0]) {
                    const updateData = data[0].attachments
                        ? {
                            $addToSet: { attachments: file },
                        }
                        : {
                            $set: { attachments: [file] },
                        };
                    MongoDBProvider.update_onOffice(
                        dbname_prefix,
                        "notify",
                        username,
                        { _id: { $eq: new require("mongodb").ObjectID(id) } },
                        updateData,
                    ).then(
                        function () {
                            dfd.resolve(data[0]);
                        },
                        function (err) {
                            dfd.reject(err);
                            err = undefined;
                        },
                    );
                    return dfd.promise;
                } else {
                    dfd.reject({
                        path: "NotifyService.pushFile.YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists",
                        mes: "YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists",
                    });
                }
            },
            function (err) {
                dfd.reject(err);
                err = undefined;
            },
        );
        return dfd.promise;
    }

    removefile(dbname_prefix, username, id, filename) {
        return MongoDBProvider.update_onOffice(
            dbname_prefix,
            "notify",
            username,
            { _id: { $eq: new require("mongodb").ObjectID(id) } },
            {
                $pull: {
                    attachments: { name: filename },
                },
            },
        );
    }

    save_bookmark(dbname_prefix, username, id) {
        const dfd = q.defer();
        MongoDBProvider.update_onOffice(
            dbname_prefix,
            this.collection,
            username,
            { _id: new mongodb.ObjectId(id) },
            { $addToSet: { bookmark: username } }
        )
            .then((result) => {
                dfd.resolve(result);
            })
            .catch((err) => {
                dfd.reject(err);
            });
        return dfd.promise;
    }

    unsave_bookmark(dbname_prefix, username, id) {
        const dfd = q.defer();
        MongoDBProvider.update_onOffice(
            dbname_prefix,
            this.collection,
            username,
            { _id: new mongodb.ObjectId(id) },
            { $pull: { bookmark: username } }
        )
            .then((result) => {
                dfd.resolve(result);
            })
            .catch((err) => {
                dfd.reject(err);
            });
        return dfd.promise;
    }
}

class TaskService {
    constructor() {
        this.collection = "task";
    }

    completedTaskById(dbPrefix, username, id) {
        s;
        const dfd = q.defer();
        const now = moment();
        const filter = {
            _id: {
                $eq: new mongodb.ObjectId(id),
            },
        };

        let task;
        MongoDBProvider.load_onOffice(dbPrefix, this.collection, filter)
            .then((result) => {
                if (!Array.isArray(result) || result.length === 0) {
                    return dfd.reject({
                        path: "TaskService.updateTaskStatus.err",
                        mess: "NotFoundTaskToUpdate",
                    });
                }
                task = result[0];
                const updatedData = {
                    $set: {
                        status: TASK_STATUS.COMPLETED,
                        status_priority: TASK_PRIORITY.LOW,
                        progress: 100,
                        date_completed: now.format("YYYY/MM/DD"),
                        month_completed: now.format("YYYY/MM"),
                        year_completed: now.format("YYYY"),
                    },
                    $push: {
                        event: {
                            username,
                            time: now.valueOf(),
                            action: TASK_EVENT.COMPLETED,
                        },
                    },
                };
                return MongoDBProvider.update_onOffice(dbPrefix, this.collection, username, filter, updatedData);
            })
            .then(() => {
                dfd.resolve(true);
                const userArray = [task.username].concat(
                    task.main_person || [],
                    task.participant || [],
                    task.observer || [],
                );
                new Set(userArray).forEach((user) => {
                    SocketProvider.IOEmitToRoom(user, "justPushNotification", {
                        title: "TheTaskIsCompleted",
                        body: task.title,
                        url: "/task-details?" + id,
                    }).catch((error) => {
                        LogProvider.info("Push notify failed with reason: ", error.message);
                    });
                });
            })
            .catch(() => {
                dfd.reject({
                    path: "TaskService.updateTaskStatus.err",
                    mess: "ProcessUpdateTaskStatusFailed",
                });
            });
        return dfd.promise;
    }
}

class UserService {
    constructor() { }

    countUser(dbPrefix, users, department) {
        return MongoDBProvider.count_onManagement(dbPrefix, "user", {
            $and: [
                { username: { $in: users } },
                { department: { $ne: department } }
            ]
        })
    }

    loadUser(dbname_prefix, filter) {
        return MongoDBProvider.loadAggregate_onManagement(dbname_prefix, "user", filter);
    }

    loadUsersInGroup(dbname_prefix, filter) {
        return MongoDBProvider.loadAggregate_onManagement(dbname_prefix, "group", filter);
    }
}

exports.UserService = new UserService();
exports.NotifyService = new NotifyService();
exports.TaskService = new TaskService();
