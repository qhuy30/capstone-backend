const { MongoDBProvider } = require("../../../shared/mongodb/db.provider");
const q = require("q");
const { EVENT_FEATURE_NAME, STATUS_EVENT_CALENDAR, EVENT_CALENDAR_TYPE, FLOW_STATUS, EVENT_CALENDAR_ACTION_NAME, EVENT_CALENDAR_FROM_ACTION } = require('./const');
const CollectionName = "registration";
const CodeUtil = require('../../../utils/codeUtil');

class EventCalendarService {
    constructor() {}

    executeAggregate(dbname_prefix, filter) {
        return MongoDBProvider.loadAggregate_onOffice(dbname_prefix, CollectionName, filter);
    }

    loaddetails(dbname_prefix, id) {
        const filter = { _id: new require("mongodb").ObjectID(id), feature: EVENT_FEATURE_NAME };
        return MongoDBProvider.load_onOffice(dbname_prefix, CollectionName, filter);
    }

    insert(
        dbname_prefix, 
        username, 
        data,
        code
    ) {
        const dfd = q.defer();
        const d = new Date();
        const dataInsert = {
            title: data.title,
            start_date: data.start_date,
            end_date: data.end_date,
            main_person: data.main_person,
            main_person_info: data.main_person_info,
            departments: data.departments,
            participants: data.participants,
            participants_info: data.participants_info,
            content: data.content,
            type: data.type,
            meeting_link: data.meeting_link,
            room_booking_id: data.room_booking_id,
            other_info: data.other_info,
            vehicle_booking_id: data.vehicle_booking_id,
            department: data.department,
            attachments: data.attachments,
            level: data.level,

            status: STATUS_EVENT_CALENDAR.CREATED,
            flow_status: FLOW_STATUS.APPROVE,
            username: username,
            feature: EVENT_FEATURE_NAME,
            time: d.getTime(),
            event: [
                {
                    username,
                    time: d.getTime(),
                    action: EVENT_CALENDAR_FROM_ACTION.CREATED,
                    reason: null,
                },
            ],
            code: code,
        }

        MongoDBProvider.insert_onOffice(dbname_prefix, CollectionName, username, dataInsert)
        .then((result) => {
            dfd.resolve(result.ops[0]);
        })
        .catch((err) => {
            console.log(err);
            dfd.reject(err);
        });

        return dfd.promise;
    }

    update(dbname_prefix, username, id, data, event) {
        const dfd = q.defer();
        let dataUpdate = {
            title: data.title,
            start_date: data.start_date,
            end_date: data.end_date,
            main_person: data.main_person,
            main_person_info: data.main_person_info,
            departments: data.departments,
            participants: data.participants,
            participants_info: data.participants_info,
            content: data.content,
            type: data.type,
            meeting_link: data.meeting_link,
            room_booking_id: data.room_booking_id,
            vehicle_booking_id: data.vehicle_booking_id,
            other_info: data.other_info,
            attachments: data.attachments,
            level: data.level
        };
        MongoDBProvider.update_onOffice(
            dbname_prefix,
            CollectionName,
            username,
            { _id: { $eq: new require("mongodb").ObjectID(id) } },
            {
                $set: dataUpdate,
                $push: { event },
            }
        ).then(function(data){
            dfd.resolve(data);
        },function(error){
            dfd.reject(error);
        })
        
        return dfd.promise;
    }

    delete(dbname_prefix, id, username) {
        return MongoDBProvider.delete_onOffice(dbname_prefix, CollectionName, username, {
            $and: [
                { _id: { $eq: new require("mongodb").ObjectID(id) } },
                { isactive: { $ne: true } }],
                $or:[
                    { status: { $eq:STATUS_EVENT_CALENDAR.CREATED } },
                ]
        });
    }

    approve(dbname_prefix, username, id, status) {
        let dfd = q.defer();
        const updateFields = {
            $set: { status },
            $push: {
                event: {
                    username,
                    time: new Date().getTime(),
                    action: `${status}`,
                },
            },
        };
        
        MongoDBProvider.update_onOffice(
            dbname_prefix,
            CollectionName,
            username,
            { _id: { $eq: new require("mongodb").ObjectID(id) } },
            updateFields
        )
            .then(function () {
                dfd.resolve(true);
            })
            .catch(function (err) {
                dfd.reject(err);
                err = undefined;
            });

        return dfd.promise;
    }

    requestCancel(dbname_prefix, username, id, status, lastStatus, reason) {
        let dfd = q.defer();
        const updateFields = {
            $set: { status, lastStatus, reasonCancel: reason, flow_status: FLOW_STATUS.CANCEL },
            $push: {
                event: {
                    username,
                    time: new Date().getTime(),
                    action: EVENT_CALENDAR_FROM_ACTION.REQUEST_CANCEL,
                    reason: reason
                },
            },
        };
        
        MongoDBProvider.update_onOffice(
            dbname_prefix,
            CollectionName,
            username,
            { _id: { $eq: new require("mongodb").ObjectID(id) } },
            updateFields,
        ).then(function () {
            dfd.resolve(true);
        },function(err){
            dfd.reject(err);
        })

        return dfd.promise;
    }

    reject(dbname_prefix, username, id, nextStatus, flow, reason) {
        let dfd = q.defer();
        const updateFields = {
            $set: { status: nextStatus, flow_status: flow },
            $push: {
                event: {
                    username,
                    time: new Date().getTime(),
                    action: `Rejected`,
                    reason: reason,
                },
            },
        };
        
        MongoDBProvider.update_onOffice(
            dbname_prefix,
            CollectionName,
            username,
            { _id: { $eq: new require("mongodb").ObjectID(id) } },
            updateFields
        )
            .then(function () {
                dfd.resolve(true);
            })
            .catch(function (err) {
                dfd.reject(err);
                err = undefined;
            });

        return dfd.promise;
    }
    
    pushFile(dbname_prefix, username, id, file) {
        let dfd = q.defer();
        MongoDBProvider.load_onOffice(dbname_prefix, CollectionName, {
            $and: [{ _id: { $eq: new require("mongodb").ObjectID(id) } }],
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
                        CollectionName,
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
                        path: "EventCalendarService.pushFile.YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists",
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

    removeFile(dbname_prefix, username, id, filename, fileInfo) {
        let dfd = q.defer();
        MongoDBProvider.load_onOffice(dbname_prefix, CollectionName, {
            $and: [{ _id: { $eq: new require("mongodb").ObjectID(id) } }],
        }).then(
            function (data) {
                if (data[0]) {
                    MongoDBProvider.update_onOffice(
                        dbname_prefix,
                        CollectionName,
                        username,
                        { _id: { $eq: new require("mongodb").ObjectID(id) } },
                        {
                            $pull: { attachments: { name: filename } },
                        },
                    ).then(
                        function () {
                            dfd.resolve(data[0]);
                        },
                        function (err) {
                            dfd.reject(err);
                            err = undefined;
                        },
                    );
                } else {
                    dfd.reject({
                        path: "EventCalendarService.removeFile.YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists",
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

    loadDetail(dbname_prefix, id) {
        return MongoDBProvider.getOne_onOffice(dbname_prefix, CollectionName,
            { _id: { $eq: new require('mongodb').ObjectID(id) } }
        );
    }

    assess_department_level(dbname_prefix, username, id, status, event) {
        return MongoDBProvider.update_onOffice(dbname_prefix, CollectionName, username,
            { _id: { $eq: new require('mongodb').ObjectID(id) } },
            { $set: { status }, $push: { event } });
    }

    assess_host_level(dbname_prefix, username, id, status, event) {
        return MongoDBProvider.update_onOffice(dbname_prefix, CollectionName, username,
            { _id: { $eq: new require('mongodb').ObjectID(id) } },
            { $set: { status }, $push: { event } });
    }

    request_cancel(dbname_prefix, username, id, status, flow, event) {
        return MongoDBProvider.update_onOffice(dbname_prefix, CollectionName, username,
            { _id: { $eq: new require('mongodb').ObjectID(id) } },
            { $set: { status, flow_status:flow }, $push: { event } });
    }

    assess_recall_department(dbname_prefix, username, id, status, flow, event) {
        return MongoDBProvider.update_onOffice(dbname_prefix, CollectionName, username,
            { _id: { $eq: new require('mongodb').ObjectID(id) } },
            { $set: { status, flow_status:flow }, $push: { event } });
    }

    assess_recall_host(dbname_prefix, username, id, status, flow, event) {
        return MongoDBProvider.update_onOffice(dbname_prefix, CollectionName, username,
            { _id: { $eq: new require('mongodb').ObjectID(id) } },
            { $set: { status, flow_status:flow }, $push: { event } });
    }

    getCode(dbname_prefix, department) {
        let dfd = q.defer();
        MongoDBProvider.getAutoIncrementNumber_onManagement(dbname_prefix, `LCT-${new Date().getFullYear()}-${String(department).padStart(2, '0')}`).then(function (sequenceNumber) {
            dfd.resolve(CodeUtil.resolvePattern(`LCT-${new Date().getFullYear()}-${String(department).padStart(2, '0')}-{sequenceNumber}`, {
                sequenceNumber: String(sequenceNumber).padStart(5, '0')
            }));
        }, function (err) { dfd.reject(err) })
        return dfd.promise;
    }
}

class UserService {
    constructor() { }

    loadUser(dbname_prefix, filter) {
        return MongoDBProvider.loadAggregate_onManagement(dbname_prefix, "user", filter);
    }

    loadUsersInGroup(dbname_prefix, filter) {
        return MongoDBProvider.load_onManagement(dbname_prefix, "group", filter);
    }

    loadDetails(dbname_prefix, account) {
        return MongoDBProvider.getOne_onManagement(dbname_prefix, "user", { username: { $eq: account } });
    }

    loadDepartmenByUsername(dbname_prefix, username) {
        return MongoDBProvider.load_onManagement(dbname_prefix, "user", { username: { $in: username }});
    }
}

class DirectoryService {
    constructor() { 
        this.collectionName = "directory";
    }

    loadRoom(dbname_prefix, conditions = []) {
        const master_key = 'meeting_room';
        const filter = {
            $and: [
                ...conditions,
                {
                    master_key: { $eq: master_key }
                }
            ]
        }
        return MongoDBProvider.load_onManagement(dbname_prefix, this.collectionName, filter, 0, 0);
    }

    loadLocation(dbname_prefix, values) {
        const master_key = 'location_list';
        const filter = {
            $and: [
                {
                    master_key: { $eq: master_key }
                },
                {
                    value: { $in: values }
                },
                { isactive: { $eq: true } }
            ]
        }
        return MongoDBProvider.load_onManagement(dbname_prefix, "directory", filter, 0, 0);
    }

    loadCar(dbname_prefix, values) {
        const master_key = 'vehicle_list';
        const filter = {
            $and: [
                {
                    master_key: { $eq: master_key }
                },
                {
                    value: { $in: values }
                },
                { isactive: { $eq: true } }
            ]
        }
        return MongoDBProvider.load_onManagement(dbname_prefix, "directory", filter, 0, 0);
    }

    loadAggregate(dbname_prefix, filter) {
        return MongoDBProvider.loadAggregate_onManagement(dbname_prefix, this.collectionName, filter);
    }
}

exports.UserService = new UserService();

exports.EventCalendarService = new EventCalendarService();
exports.DirectoryService = new DirectoryService();
