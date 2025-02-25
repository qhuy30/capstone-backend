const { MongoDBProvider } = require('../../../shared/mongodb/db.provider');
const { SocketProvider } = require('./../../../shared/socket/provider');
const q = require('q');
const { ItemSetup } = require('../../../shared/setup/items.const');

function findUser_Employee(dbname_prefix, NodeItem) {
    let dfd = q.defer();
    let dfdAr = [];
    let filter;
    if (NodeItem.competence) {
        filter = {
            $and: [
                { department: { $eq: NodeItem.department } },
                { competence: { $eq: NodeItem.competence } }
            ]
        };
    } else {
        filter = { department: { $eq: NodeItem.department } }
    }
    dfdAr.push(MongoDBProvider.load_onOffice(dbname_prefix, "employee", filter, undefined, undefined, undefined, { _id: true }));

    if (NodeItem.role && NodeItem.role !== "") {
        dfdAr.push(MongoDBProvider.load_onManagement(dbname_prefix, "user", { role: { $in: NodeItem.role } },
            undefined, undefined, undefined, { employee: true }));
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

            MongoDBProvider.load_onManagement(dbname_prefix, "user", filter
                , undefined, undefined, undefined, { username: true, employee: true }).then(function (data) {
                    dfd.resolve(data);
                }, function (err) {
                    dfd.reject(err);
                });
        }
    }, function (err) {
        dfd.reject({ path: "LeaveFormService.findUser_Employee.LoadErr", err });
        err = undefined;
    });
    return dfd.promise;
}

class LeaveFormService {
    constructor() { }
    init(dbname_prefix, department, competence, job, role) {
        let dfd = q.defer();

        MongoDBProvider.load_onOffice(dbname_prefix, "workflow", { department: { $eq: department } }).then(function (wf) {
            let Items = ItemSetup.getItems("tenant", "workflow_type");
            let wft = {};
            let temp = [];
            for (var i in Items) {
                if (Items[i].key === "leave_form") {
                    wft = Items[i];
                    break;
                }
            }

            for (var i in wf) {
                if ("leave_form" === wf[i].key) {
                    temp.push(wf[i]);
                    break;
                }
            }
            wf = temp;
            temp = [];
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
            wf = temp;
            dfd.resolve({
                wf,
                wft
            });
        }, function (err) {
            dfd.reject(err);
            err = undefined;
        });

        return dfd.promise;
    }

    countPending(dbname_prefix, username) {
        return MongoDBProvider.count_onOffice(dbname_prefix, "leave_form",
            { play_now: { $elemMatch: { username } } }
        );
    }

    loadDetails(dbname_prefix, username, id) {
        return MongoDBProvider.getOne_onOffice(dbname_prefix, "leave_form",
            {
                $and: [
                    { "_id": { $eq: new require('mongodb').ObjectID(id) } },
                    {
                        $or: [
                            { username: { $eq: username } },
                            {
                                $or: [
                                    { event: { $elemMatch: { username } } },
                                    { play_now: { $elemMatch: { username } } }
                                ]
                            }
                        ]
                    }
                ]
            }
        );
    }

    loadList(dbname_prefix, filter, top, offset, sort) {
        return MongoDBProvider.load_onOffice(dbname_prefix, "leave_form",
            filter,
            top, offset, sort
        );
    }

    countList(dbname_prefix, filter) {
        return MongoDBProvider.count_onOffice(dbname_prefix, "leave_form", filter);
    }

    countJTF(dbname_prefix) {
        return MongoDBProvider.count_onOffice(dbname_prefix, "leave_form", {
            $and: [
                { status: { $eq: "Approved" } },
                { use_jtf: { $eq: true } },
                { has_jtf: { $ne: true } },
                { cancel_jtf: { $ne: true } }
            ]
        }
        );
    }

    insert(dbname_prefix, username, title, department, from_date, to_date, type, number_day, content, flow, event, use_jtf, attachment) {
        let dfd = q.defer();
        let firstNodeItems = flow[0].items;
        let dfdAr = [];
        for (var i in firstNodeItems) {
            dfdAr.push(findUser_Employee(dbname_prefix, firstNodeItems[i]));
        }

        q.all(dfdAr).then(function (data) {
            let d = new Date();
            let objects = [];
            for (var i in data) {
                for (var j in data[i]) {
                    objects.push({
                        username: data[i][j].username
                    });
                }
            }
            if (objects.length === 0) {
                dfd.reject({ path: "LeaveFormService.insert.ApproverIsNull", mes: "ApproverIsNull" });
            } else {
                MongoDBProvider.insert_onOffice(dbname_prefix,
                    "leave_form", username,
                    {
                        username, department, from_date, to_date, type, number_day, content, flow, event, use_jtf, title,
                        workflow_type: "leave_form", attachment, play: { "0": objects }, node: 0, status: "Pending",
                        play_now: objects, event: [{ username, time: d.getTime(), action: "Created" }]
                    }).then(function (e) {
                        dfd.resolve(true);
                        for (var i in objects) {
                            SocketProvider.IOEmitToRoom(objects[i].username, "justPushNotification", {
                                title: 'ThereIs1LeaveFormThatNeedsApproval',
                                body: title,
                                url: "/leaveform-details?" + e.ops[0]._id.toString()
                            });
                        }
                    }, function (err) {
                        dfd.reject(err);
                        err = undefined;
                    });
            }
        }, function (err) {
            dfd.reject({ path: "LeaveFormService.insert.Error", err });
            err = undefined;
        });
        return dfd.promise;
    }

    approval(dbname_prefix, username, id, comment) {
        let dfd = q.defer();
        MongoDBProvider.load_onOffice(dbname_prefix, "leave_form",
            {
                $and: [
                    { "_id": { $eq: new require('mongodb').ObjectID(id) } },
                    { play_now: { $elemMatch: { username } } }

                ]
            }
        ).then(function (data) {
            if (data[0]) {
                let updateData = {};
                let dfdAr = [];
                switch (data[0].flow[data[0].node].type) {
                    case "one":
                        if ((data[0].flow.length - 1) == data[0].node) {
                            updateData.$set = {
                                node: -1,
                                status: "Approved",
                                play_now: []
                            };
                            let d = new Date();
                            updateData.$push = {
                                event: { username, time: d.getTime(), action: "Approved", node: data[0].node, comment }
                            };
                        } else {
                            updateData.$set = {
                                node: data[0].node + 1
                            };
                            for (var i in data[0].flow[data[0].node + 1].items) {
                                dfdAr.push(findUser_Employee(dbname_prefix, data[0].flow[data[0].node + 1].items[i]));
                            }
                            let d = new Date();
                            updateData.$push = {
                                event: { username, time: d.getTime(), action: "Approved", node: data[0].node, comment }
                            };
                        }
                        break;
                    case "all":
                        let count = 1;
                        for (var i in data[0].event) {
                            if (username == data[0].event[i].username
                                && data[0].node == data[0].event[i].node) {
                                count++;
                            }
                        }
                        if (count == data[0].play_now.length) {
                            if ((data[0].flow.length - 1) == data[0].node) {
                                updateData.$set = {
                                    node: -1,
                                    status: "Approved",
                                    play_now: []
                                };
                                let d = new Date();
                                updateData.$push = {
                                    event: { username, time: d.getTime(), action: "Approved", node: data[0].node, comment }
                                };
                            } else {
                                updateData.$set = {
                                    node: data[0].node + 1
                                };
                                for (var i in data[0].flow[data[0].node + 1].items) {
                                    dfdAr.push(findUser_Employee(dbname_prefix, data[0].flow[data[0].node + 1].items[i]));
                                }
                                let d = new Date();
                                updateData.$push = {
                                    event: { username, time: d.getTime(), action: "Approved", node: data[0].node, comment }
                                };
                            }
                        } else {
                            updateData.$push = {
                                event: { username, time: d.getTime(), action: "Approved", node: data[0].node, comment }
                            };
                        }
                        break;
                }
                if (dfdAr.length > 0) {
                    q.all(dfdAr).then(function (temp) {
                        let objects = [];
                        for (var i in temp) {
                            for (var j in temp[i]) {
                                objects.push({
                                    username: temp[i][j].username
                                });
                            }
                        }
                        if (objects.length === 0) {
                            dfd.reject({ path: "LeaveFormService.approval.ApproverIsNull", mes: "ApproverIsNull" });
                        } else {
                            updateData.$set.play_now = objects;
                            MongoDBProvider.update_onOffice(dbname_prefix, "leave_form", username
                                , { _id: { $eq: new require('mongodb').ObjectID(id) } }, updateData).then(function () {
                                    dfd.resolve(true);
                                    for (var i in objects) {
                                        SocketProvider.IOEmitToRoom(objects[i].username, "justPushNotification", {
                                            title: 'ThereIs1LeaveFormThatNeedsApproval',
                                            body: data[0].title,
                                            url: "/leaveform-details?" + id
                                        });
                                    }
                                }, function (err) {
                                    dfd.reject(err);
                                    err = undefined;
                                });
                        }
                    }, function (err) {
                        dfd.reject({ path: "LeaveFormService.approval.InvalidInformation", err: err.toString() });
                        err = undefined;
                    });
                } else {
                    MongoDBProvider.update_onOffice(dbname_prefix, "leave_form", username,
                        { _id: { $eq: new require('mongodb').ObjectID(id) } }, updateData).then(function () {
                            dfd.resolve(true);
                            SocketProvider.IOEmitToRoom(data[0], "justPushNotification", {
                                title: 'YourLeaveFormHasBeenApproved',
                                body: data[0].title,
                                url: "/leaveform-details?" + id
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
                                    title: 'TheLeaveFormHasBeenApproved',
                                    body: data[0].title,
                                    url: "/leaveform-details?" + id
                                });
                            }
                        }, function (err) {
                            dfd.reject(err);
                            err = undefined;
                        });
                }
            } else {
                dfd.reject({ path: "LeaveFormService.approval.InvalidInformation", mes: "InvalidInformation" });
            }
        }, function (err) {
            dfd.reject(err);
            err = undefined;
        });
        return dfd.promise;
    }

    reject(dbname_prefix, username, id, comment) {
        let dfd = q.defer();
        MongoDBProvider.load_onOffice(dbname_prefix, "leave_form",
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
                    event: { username, time: d.getTime(), action: "Rejected", node: data[0].node, comment }
                };
                MongoDBProvider.update_onOffice(dbname_prefix, "leave_form", username,
                    { _id: { $eq: new require('mongodb').ObjectID(id) } }, updateData).then(function () {
                        dfd.resolve(true);
                        SocketProvider.IOEmitToRoom(data[0], "justPushNotification", {
                            title: 'YourLeaveFormHasBeenRejected',
                            body: data[0].title,
                            url: "/leaveform-details?" + id
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
                                title: 'TheLeaveFormHasBeenRejected',
                                body: data[0].title,
                                url: "/leaveform-details?" + id
                            });
                        }
                    }, function (err) {
                        dfd.reject(err);
                        err = undefined;
                    });
            } else {
                dfd.reject({ path: "LeaveFormService.reject.InvalidInformation", mes: "InvalidInformation" });
            }
        }, function (err) {
            dfd.reject(err);
            err = undefined;
        });
        return dfd.promise;
    }

    delete(dbname_prefix, username, id) {
        let dfd = q.defer();
        MongoDBProvider.load_onOffice(dbname_prefix, "leave_form", {
            $and: [
                { _id: { $eq: new require('mongodb').ObjectID(id) } },
                { username: { $eq: username } }
            ]
        }
        ).then(function (data) {
            if (data[0]) {
                if (data[0].status != 'Approval') {
                    MongoDBProvider.delete_onOffice(dbname_prefix, "leave_form", username,
                        { _id: { $eq: new require('mongodb').ObjectID(id) } }
                    ).then(function () {
                        dfd.resolve(true);
                    }, function (err) {
                        dfd.reject(err);
                        err = undefined;
                    });
                } else {
                    dfd.reject({ path: "LeaveFormService.delete.ApprovedDataCannotBeDeleted", mes: "ApprovedDataCannotBeDeleted" });
                }

            } else {
                dfd.reject({ path: "LeaveFormService.delete.YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists", mes: "YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists" });
            }
        }, function (err) {
            dfd.reject(err);
            err = undefined;
        });
        return dfd.promise;
    }
}

exports.LeaveFormService = new LeaveFormService();