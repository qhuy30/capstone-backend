const { MongoDBProvider } = require('../../../shared/mongodb/db.provider');
const q = require('q');
const { LogProvider } = require("@shared/log_nohierarchy/log.provider");
const collectionName = "registration";
const {SCHEDULE_MEETING_ROOM_FEATURE_NAME, MEETING_ROOM_SCHEDULE_FLOW, MEETING_ROOM_SCHEDULE_STATUS} = require('./const')
const {
    MEETING_ROOM_SCHEDULE_EVENT
} = require("@utils/constant");
const CodeUtil = require('../../../utils/codeUtil');

class MeetingRoomService {
    constructor() { }

    register(
        dbname_prefix,
        username,
        data,
        event,
        code
    ) {
        let dfd = q.defer();
        MongoDBProvider.insert_onOffice(dbname_prefix, collectionName, username, {
            ...data,
            status: MEETING_ROOM_SCHEDULE_STATUS.REGISTERED,
            feature:SCHEDULE_MEETING_ROOM_FEATURE_NAME,
            username,
            flow:MEETING_ROOM_SCHEDULE_FLOW.APPROVE,
            event: [event],
            code,
        }).then(function (dataInsert) {
            dfd.resolve(dataInsert.ops[0]);
        }, function (err) {
            dfd.reject(err);
        });
        return dfd.promise;
    }

    executeAggregate(dbname_prefix, filter) {
        return MongoDBProvider.loadAggregate_onOffice(dbname_prefix, collectionName, filter);
    }

    deleteRegistered(dbname_prefix, id, username) {
        return MongoDBProvider.delete_onOffice(dbname_prefix, collectionName, username,
            { $and: [{ _id: { $eq: new require('mongodb').ObjectID(id) } }] });
    }

    loadDetail(dbname_prefix, id, code) {
        let dfd = q.defer();
        const filter = id ? { _id: { $eq: new require("mongodb").ObjectID(id) } } : { code: code };
        MongoDBProvider.getOne_onOffice(dbname_prefix, collectionName,
            filter
        ).then(function(data){
            dfd.resolve(data)
        },function(err){
            dfd.reject(err);
        });
        return dfd.promise;
    }

    loadDetailRequestCancel(dbname_prefix, id){
        let dfd = q.defer();
        MongoDBProvider.getOne_onOffice(dbname_prefix, collectionName,
            { 
                _id: { $eq: new require('mongodb').ObjectID(id) },
                flow: MEETING_ROOM_SCHEDULE_FLOW.APPROVE
            },
        ).then(function(data){
            dfd.resolve(data)
        },function(err){
            dfd.reject(err);
        });
        return dfd.promise;
    }

    updateRegistered(dbname_prefix, username, id, data, event) {
        let dataUpdate = {
            host_scope: data.host_scope,
            host_external: data.host_external,
            room: data.room,
            title: data.title,
            date_start: data.date_start,
            date_end: data.date_end,
            type: data.type,
            host: data.host,
            participants: data.participants,
            other_participants: data.other_participants,
            to_department: data.to_department,
            content: data.content,
            person: data.person,
            service_proposal: data.service_proposal,
            service_proposal_text: data.service_proposal_text,
            helpdesk: data.helpdesk,
            helpdesk_text: data.helpdesk_text,
            teabreak: data.teabreak,
            teabreak_text: data.teabreak_text,
            attachments: data.newAttachments,
        };

        return MongoDBProvider.update_onOffice(
            dbname_prefix,
            collectionName,
            username,
            { _id: { $eq: new require("mongodb").ObjectID(id) } },
            {
                $set: dataUpdate,
                $push: { event },
            }
        )

    }

    approveDepartment(dbname_prefix, username, id, data, event, status) {
        let dataUpdate = {
            host_scope: data.host_scope,
            host_external: data.host_external,
            room: data.room,
            title: data.title,
            date_start: data.date_start,
            date_end: data.date_end,
            type: data.type,
            host: data.host,
            participants: data.participants,
            other_participants: data.other_participants,
            to_department: data.to_department,
            content: data.content,
            person: data.person,
            service_proposal: data.service_proposal,
            service_proposal_text: data.service_proposal_text,
            helpdesk: data.helpdesk,
            helpdesk_text: data.helpdesk_text,
            teabreak: data.teabreak,
            teabreak_text: data.teabreak_text,
            attachments: data.newAttachments,
            status: status
        };

        return MongoDBProvider.update_onOffice(
            dbname_prefix,
            collectionName,
            username,
            { _id: { $eq: new require("mongodb").ObjectID(id) } },
            {
                $set: dataUpdate,
                $push: { event },
            }
        )
    }

    assess_department_level(dbname_prefix, username, id, status, event) {
        return MongoDBProvider.update_onOffice(dbname_prefix, collectionName, username,
            { _id: { $eq: new require("mongodb").ObjectID(id) } },
            { $set: { status }, $push: { event } });
    }

    assess_management_level(dbname_prefix, username, id, status, room, event) {
        return MongoDBProvider.update_onOffice(dbname_prefix, collectionName, username,
            { _id: { $eq: new require("mongodb").ObjectID(id) } },
            { $set: { status, room }, $push: { event } });
    }

    assess_lead_level(dbname_prefix, username, id, status, room, event) {
        return MongoDBProvider.update_onOffice(dbname_prefix, collectionName, username,
            { _id: { $eq: new require("mongodb").ObjectID(id) } },
            { $set: { status, room }, $push: { event } });
    }

    request_cancel(dbname_prefix, username, id, status, flow, event){
        return MongoDBProvider.update_onOffice(dbname_prefix, collectionName, username,
            { _id: { $eq: new require("mongodb").ObjectID(id) } },
            { $set: { status, flow }, $push: { event } });
    }

    reject_recall(dbname_prefix, username, id, status, flow, event){
        return MongoDBProvider.update_onOffice(dbname_prefix, collectionName, username,
            { _id: { $eq: new require("mongodb").ObjectID(id) } },
            { $set: { status, flow }, $push: { event } });
    }

    assess_recall_management_level(dbname_prefix, username, id, status, event) {
        return MongoDBProvider.update_onOffice(dbname_prefix, collectionName, username,
            { _id: { $eq: new require("mongodb").ObjectID(id) } },
            { $set: { status }, $push: { event } });
    }

    assess_recall_lead_level(dbname_prefix, username, id, status, event) {
        return MongoDBProvider.update_onOffice(dbname_prefix, collectionName, username,
            { _id: { $eq: new require("mongodb").ObjectID(id) } },
            { $set: { status }, $push: { event } });
    }

    getCode(dbname_prefix, department) {
        let dfd = q.defer();
        MongoDBProvider.getAutoIncrementNumber_onManagement(dbname_prefix, `DKP-${new Date().getFullYear()}-${String(department).padStart(2, '0')}`).then(function (sequenceNumber) {
            dfd.resolve(CodeUtil.resolvePattern(`DKP-${new Date().getFullYear()}-${String(department).padStart(2, '0')}-{sequenceNumber}`, {
                sequenceNumber: String(sequenceNumber).padStart(5, '0')
            }));
        }, function (err) { dfd.reject(err) })
        return dfd.promise;
    }
    
}

class UserService {
    constructor() { }

    loadUser(dbname_prefix, filter) {
        return MongoDBProvider.load_onManagement(dbname_prefix, "user", filter);
    }

    getNotifyUsers(dbname_prefix,filter){
        let dfd = q.defer();
        MongoDBProvider.loadAggregate_onManagement(
            dbname_prefix,
            "user",
            filter
        ).then(function(users){
            dfd.resolve(users);
        },function(err){
            dfd.reject(err);
        })
        return dfd.promise;
    }

    loadUsersInGroup(dbname_prefix, filter) {
        return MongoDBProvider.loadAggregate_onManagement(dbname_prefix, "group", filter);
    }

    getUsersInGroup(dbname_prefix, groupFilter) {
        let dfd = q.defer();
        MongoDBProvider.loadAggregate_onManagement(
            dbname_prefix,
            "group",
            groupFilter
        ).then(function(groups){
            dfd.resolve(groups);
        },function(err){
            dfd.reject(err);
        })
        return dfd.promise;
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

    loadAggregate(dbname_prefix, filter) {
        return MongoDBProvider.loadAggregate_onManagement(dbname_prefix, this.collectionName, filter);
    }
}

class CalendarRoomService {
    constructor() { 
        this.collectionName = "calendar_room";
    }

    insert(dbname_prefix, username, registration_id, room_value, date_start, date_end, status) {
        let dfd = q.defer();
        MongoDBProvider.insert_onManagement(dbname_prefix, this.collectionName, username, {
            registration_id,
            room_value,
            date_start,
            date_end,
            status
        }).then(function (dataInsert) {
            dfd.resolve(dataInsert.ops[0]);
        }, function (err) {
            dfd.reject(err);
        });
        return dfd.promise;
    }

    update(dbname_prefix, username, registration_id, room_value, updatedFields) {
        const { new_room_value, status } = updatedFields;

        const updateData = { $set: {} };
        if (status !== undefined) updateData.$set.status = status;
        if (new_room_value !== undefined) updateData.$set.room_value = new_room_value;

        return MongoDBProvider.update_onManagement(dbname_prefix, this.collectionName, username, 
            { registration_id: registration_id, room_value: room_value },
            updateData
        );
    }

    delete(dbname_prefix, username, registration_id, room_value) {
        return MongoDBProvider.delete_onManagement(dbname_prefix, this.collectionName, username,
            { registration_id: registration_id, room_value: room_value }
        );
    }
}

exports.UserService = new UserService();
exports.DirectoryService = new DirectoryService();
exports.CalendarRoomService = new CalendarRoomService();

exports.MeetingRoomService = new MeetingRoomService();
