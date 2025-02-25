const { MongoDBProvider } = require('../../../shared/mongodb/db.provider');
const q = require('q');
const { SocketProvider } = require('./../../../shared/socket/provider');

class JTFService {
    constructor() { }

    loadDetails(dbname_prefix, id) {
        return MongoDBProvider.getOne_onOffice(dbname_prefix, "journey_time_form",
            { "_id": { $eq: new require('mongodb').ObjectID(id) } });
    }

    loadList(dbname_prefix, filter, top, offset, sort) {
        return MongoDBProvider.load_onOffice(dbname_prefix,
            "journey_time_form",
            filter, top, offset, sort);
    }

    countList(dbname_prefix, filter) {
        return MongoDBProvider.count_onOffice(dbname_prefix, "journey_time_form", filter);
    }


    insert(dbname_prefix, username, title, number_day, leave_form, note) {
        let dfd = q.defer();
        MongoDBProvider.load_onOffice(dbname_prefix, "leave_form",
            { "_id": { $eq: new require('mongodb').ObjectID(leave_form) } }
        ).then(function (data) {
            if (data[0]) {
                let d = new Date();
                MongoDBProvider.update_onOffice(dbname_prefix, "leave_form", username,
                    { "_id": { $eq: new require('mongodb').ObjectID(leave_form) } },
                    { $push: { event: { username, time: d.getTime().toString(), action: "AddJourneyTimeForm" } }, $set: { has_jtf: true } });
                MongoDBProvider.insert_onOffice(dbname_prefix, "journey_time_form", username
                    , { username, department: data[0].department, title, type: data[0].type, number_day, leave_form, to_employee: data[0].username, note, event: [{ username, action: "Created", time: d.getTime().toString() }] }).then(function (e) {
                        dfd.resolve(true);
                        SocketProvider.IOEmitToRoom(data[0].username, "justPushNotification", {
                            title: 'YouAreGrantedANewJourneyTimeForm',
                            body: data[0].title,
                            url: "/journey-time-form-details?" + e.ops[0]._id.toString()
                        });
                    }, function (err) {
                        dfd.reject(err);
                    });
            } else {
                dfd.reject({ path: "JTFService.insert.DataIsNull", mes: "DataIsNull" });
            }
        }, function (err) {
            dfd.reject(err);
            err = undefined;
        });
        return dfd.promise;
    }

    cancel(dbname_prefix, username, id, note) {
        let dfd = q.defer();
        let d = new Date();
        MongoDBProvider.load_onOffice(dbname_prefix, "leave_form",
            { "_id": { $eq: new require('mongodb').ObjectID(leave_form) } }
        ).then(function (data) {
            if (data[0]) {
                MongoDBProvider.update_onOffice(dbname_prefix, "leave_form", username,
                    { "_id": { $eq: new require('mongodb').ObjectID(id) } },
                    {
                        $push: { event: { username, time: d.getTime().toString(), action: "CancelJourneyTimeForm", comment: note } },
                        $set: { cancel_jtf: true }
                    }).then(function () {
                        dfd.resolve(true);
                        SocketProvider.IOEmitToRoom(data[0].username, "justPushNotification", {
                            title: 'YourJourneyTimeFormPermitApplicationHasBeenCancelled',
                            body: data[0].title,
                            url: "/leaveform-details?" + id
                        });
                    }, function (err) {
                        dfd.reject(err);
                    });
            } else {
                dfd.reject({ path: "JTFService.insert.DataIsNull", mes: "DataIsNull" });
            }
        }, function (err) {
            dfd.reject(err);
            err = undefined;
        });
        return dfd.promise;
    }

    delete(dbname_prefix, username, id) {
        return MongoDBProvider.delete_onOffice(dbname_prefix, "journey_time_form", username,
            { "_id": { $eq: new require('mongodb').ObjectID(id) } });
    }


}
exports.JTFService = new JTFService();