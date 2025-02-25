const { MongoDBProvider } = require('../../../shared/mongodb/db.provider');
const q = require('q');
const { removeUnicode, NumberToStringForDate } = require('../../../utils/util');
class StrategicService {
    constructor() { }

    load_base_department(dbname_prefix, filter, top, offset) {
        return MongoDBProvider.load_onOffice(dbname_prefix, "strategic", filter, top, offset, { to_date: 1 });
    }

    load_base_project(dbname_prefix, filter, top, offset) {
        return MongoDBProvider.load_onOffice(dbname_prefix, "strategic", filter, top, offset, { to_date: 1 });
    }

    count_base_department(dbname_prefix, filter) {
        return MongoDBProvider.count_onOffice(dbname_prefix, "strategic", filter);
    }

    count_base_project(dbname_prefix, filter) {
        return MongoDBProvider.count_onOffice(dbname_prefix, "strategic", filter);
    }

    insert(dbname_prefix, username, title, from_date, to_date, department, project) {
        let dfd = q.defer();

        if (department || project) {
            let dfdAr = [];
            if (department) {
                dfdAr.push(MongoDBProvider.getOne_onOffice(dbname_prefix, "organization", { id: { $eq: department } }));
            }

            if (project) {
                dfdAr.push(MongoDBProvider.getOne_onOffice(dbname_prefix, "project", { _id: { $eq: new require('mongodb').ObjectID(project) } }));
            }
            let d = new Date();
            let events = [{ username, time: d.getTime(), action: "Created" }];
            let item = {
                username, title, from_date, to_date, department, project, progress: 0, status: "Processing", events, object: [],
                title_search: removeUnicode(title),
                date_created: d.getFullYear() + "/" + NumberToStringForDate((d.getMonth() + 1)) + "/" + NumberToStringForDate(d.getDate()),
                month_created: d.getFullYear() + "/" + NumberToStringForDate((d.getMonth() + 1)),
                year_created: d.getFullYear()
            };

            q.all(dfdAr).then(function () {
                MongoDBProvider.insert_onOffice(dbname_prefix, "strategic", username, item).then(function () {
                    dfd.resolve(true);
                }, function (err) {
                    dfd.reject(err);
                });
            }, function (err) { dfd.reject(err); });
        } else {
            dfd.reject({ path: "StrategicService.insert.InvalidData", mes: "InvalidData" });
        }

        return dfd.promise;
    }

    update(dbname_prefix, username, id, title, from_date, to_date, progress) {
        let d = new Date();
        let event = { username, time: d.getTime(), action: "Updated" };
        let item  = { title, from_date, to_date, progress, title_search: removeUnicode(title)};

        return MongoDBProvider.update_onOffice(dbname_prefix, "strategic", username, { _id: { $eq: new require('mongodb').ObjectID(id) } },
            { $set: item, $push: { events: event } });
    }

    obtained(dbname_prefix, username, id) {
        let dfd = q.defer();
        let d = new Date();
        let event = { username, time: d.getTime(), action: "Obtained" };
        MongoDBProvider.update_onOffice(dbname_prefix, "strategic", username,
            { _id: { $eq: new require('mongodb').ObjectID(id) } }
            ,
            {
                $push: { events: event, "object.$[elem].events": { username, time: d.getTime(), action: "Obtained" } },
                $set: { status: "Obtained", progress: 100,
                date_obtained: d.getFullYear() + "/" + NumberToStringForDate((d.getMonth() + 1)) + "/" + NumberToStringForDate(d.getDate()),
                month_obtained: d.getFullYear() + "/" + NumberToStringForDate((d.getMonth() + 1)),
                year_obtained: d.getFullYear(), 
                "object.$[elem].status": "Obtained", "object.$[elem].progress": 100 }
            }, {
            multi: true,
            arrayFilters: [{ "elem.status": { $eq: "Processing" } }]
        }).then(function () {
            dfd.resolve(true);
        }, function (err) {
            dfd.reject(err);
        });
        return dfd.promise;
    }

    delete(dbname_prefix, username, id) {
        return MongoDBProvider.delete_onOffice(dbname_prefix, "strategic", username, { _id: { $eq: new require('mongodb').ObjectID(id) } });
    }

    insert_object(dbname_prefix, username, id, title, from_date, to_date) {
        let d = new Date();
        let itemId = d.getTime().toString();
        let event = { username, time: d.getTime(), action: "CreateGoals", goals: title };
        return MongoDBProvider.update_onOffice(dbname_prefix, "strategic", username,
            {
                $and: [
                    { status: { $ne: "Obtained" } },
                    { _id: { $eq: new require('mongodb').ObjectID(id) } }
                ]
            }
            ,
            {
                $push:
                {
                    events: event,
                    object: { id: itemId, title, from_date, to_date, progress: 0, status: "Processing", events: [{ username, time: d.getTime(), action: "Created", goals: title }] }
                }
            });
    }

    update_object(dbname_prefix, username, id, itemid, title, from_date, to_date, progress) {
        let d = new Date();
        let event = { username, time: d.getTime(), action: "UpdatedGoals", goals: title };
        return MongoDBProvider.update_onOffice(dbname_prefix, "strategic", username,
            {
                $and: [
                    { _id: { $eq: new require('mongodb').ObjectID(id) } },
                    { "object.id": { $eq: itemid } },
                    { status: { $ne: "Obtained" } }
                ]
            },
            {
                $set: {
                    "object.$.title": title,
                    "object.$.from_date": from_date,
                    "object.$.to_date": to_date,
                    "object.$.progress": progress
                },
                $push: {
                    events: event,
                    "object.$.events": { username, time: d.getTime(), action: "Updated" }
                }
            });
    }

    delete_object(dbname_prefix, username, id, itemid) {
        let dfd = q.defer();
        MongoDBProvider.getOne_onOffice(dbname_prefix, "strategic",
            {
                $and: [
                    { status: { $ne: "Obtained" } },
                    { _id: { $eq: new require('mongodb').ObjectID(id) } }
                ]
            }
        ).then(function (data) {
            let thisItem = data.object.filter(e => e.id === itemid)[0];
            if (thisItem) {
                let d = new Date();
                let event = { username, time: d.getTime(), action: "DeletedGoals", goals: thisItem.title };

                MongoDBProvider.update_onOffice(dbname_prefix, "strategic", username,
                    {
                        $and: [
                            { status: { $ne: "Obtained" } },
                            { _id: { $eq: new require('mongodb').ObjectID(id) } }
                        ]
                    },
                    {
                        $pull: {
                            object: { id: { $eq: itemid } },
                        },
                        $push: {
                            events: event
                        }
                    }).then(function () {
                        dfd.resolve(true);
                    }, function (err) {
                        dfd.reject(err);
                    });
            } else {
                dfd.reject({ path: "StrategicService.delete_object.DataIsNotExists", mes: "DataIsNotExists" });
            }

        }, function (err) { dfd.reject(err) });


        return dfd.promise;
    }

    obtained_object(dbname_prefix, username, id, itemid) {
        let dfd = q.defer();
        MongoDBProvider.getOne_onOffice(dbname_prefix, "strategic",
            {
                $and: [
                    { status: { $ne: "Obtained" } },
                    { _id: { $eq: new require('mongodb').ObjectID(id) } }
                ]
            }
        ).then(function (data) {
            let thisItem = data.object.filter(e => e.id === itemid)[0];
            if (thisItem) {
                let d = new Date();
                let event = { username, time: d.getTime(), action: "ObtainedGoals", goals: thisItem.title };

                MongoDBProvider.update_onOffice(dbname_prefix, "strategic", username,
                    {
                        $and: [
                            { _id: { $eq: new require('mongodb').ObjectID(id) } },
                            { "object.id": { $eq: itemid } },
                            { status: { $ne: "Obtained" } }
                        ]
                    },
                    {
                        $set: {
                            "object.$.status": "Obtained",
                            "object.$.progress": 100
                        },
                        $push: {
                            events: event,
                            "object.$.events": { username, time: d.getTime(), action: "Obtained" }
                        }
                    }).then(function () {
                        dfd.resolve(true);
                    }, function (err) { dfd.reject(err); });
            } else {
                dfd.reject({ path: "StrategicService.obtained_object.DataIsNotExists", mes: "DataIsNotExists" });
            }

        }, function (err) { dfd.reject(err) });
        return dfd.promise;
    }
}

exports.StrategicService = new StrategicService();