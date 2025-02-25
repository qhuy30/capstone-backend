const moment = require('moment');
const { MongoDBProvider } = require('../../../shared/mongodb/db.provider');
const q = require('q');
const collectionName = "training_point";

class TrainingPointService {
    constructor() { }

    loadList(dbname_prefix, filter, top, offset, sort) {
        return MongoDBProvider.load_onEducation(dbname_prefix, collectionName, filter, top, offset, sort);
    }

    countList(dbname_prefix, filter) {
        return MongoDBProvider.count_onEducation(dbname_prefix, collectionName, filter);
    }


    insert(dbname_prefix, username, title, title_search, content, quantity, start_registered_date, end_registered_date,
        start_date, end_date, point, members, status
    ) {
        const d = new Date();
        let history = [
            {
                username, action: "created", time: d.getTime().toString()
            }
        ];
        return MongoDBProvider.insert_onEducation(dbname_prefix, collectionName, username, {
            title, title_search, content, quantity, start_registered_date, end_registered_date,
            start_date, end_date, point, members, status, history
        }
        )
    }

    update(dbname_prefix, username, id, title, title_search, content, quantity, start_registered_date, end_registered_date,
        start_date, end_date, point, status
    ) {
        let dfd = q.defer();
        const d = new Date();
        let history = {
            username, action: "updated", time: d.getTime().toString(), to: {
                title, title_search, content, quantity, start_registered_date, end_registered_date,
                start_date, end_date, point, status
            }
        };

        MongoDBProvider.getOne_onEducation(dbname_prefix, collectionName, {
            _id: { $eq: new require('mongodb').ObjectID(id) }
        }).then(function (item) {
            history.from = item;
            MongoDBProvider.update_onEducation(dbname_prefix, collectionName, username, {
                _id: { $eq: new require('mongodb').ObjectID(id) }
            }, {
                $set: {
                    title, title_search, content, quantity, start_registered_date, end_registered_date,
                    start_date, end_date, point, status
                },
                $push: {
                    history
                }

            }).then(function () {
                dfd.resolve(true);
            }, function (err) { dfd.reject(err) })
        }, function (err) { dfd.reject(err) });
        return dfd.promise;
    }

    delete(dbname_prefix, username, id) {
        let dfd = q.defer();
        MongoDBProvider.load_onEducation(dbname_prefix, collectionName, {
            $and: [
                { _id: { $eq: new require('mongodb').ObjectID(id) } },
                {
                    members: {
                        $exists: true,
                        $gt: [],
                        // $size: {
                        //     $gt: 0
                        // }
                    }
                }
            ]
        }).then(function (data) {
            if (data.length > 0) {
                dfd.reject({
                    path: "TrainingPointService.delete.CannotDeleteAnItemHaveRegisteredMember",
                    mes: "CannotDeleteAnItemHaveRegisteredMember"
                });
            } else {
                MongoDBProvider.delete_onEducation(dbname_prefix, collectionName, username,
                    { _id: { $eq: new require('mongodb').ObjectID(id) } }).then(function () {
                        dfd.resolve(true);
                    }, function (err) { dfd.reject(err) })
            }
        }, function (err) {
            dfd.reject(err);
        });
        return dfd.promise;
    }

    register(dbname_prefix, id, student) {
        let dfd = q.defer();
        const d = new Date();
        let history = {
            student, action: "registered", time: d.getTime().toString()
        };
        MongoDBProvider.getOne_onEducation(dbname_prefix, collectionName, {
            _id: { $eq: new require('mongodb').ObjectID(id) }
        }).then(function (data) {
            if (data.members.length < data.quantity) {
                MongoDBProvider.update_onEducation(dbname_prefix, collectionName, "system",
                    {
                        _id: { $eq: new require('mongodb').ObjectID(id) }
                    },
                    {
                        $addToSet: {
                            members: student
                        },
                        $push: {
                            history
                        }
                    },
                ).then(function(){
                    dfd.resolve(true);
                },function(err){
                    dfd.reject(err);
                });
            } else {
                dfd.reject({ path: "TrainingPointService.register.EventIsFull", mes: "EventIsFull" });
            }
        }, function (err) {
            dfd.reject(err)
        });
        return dfd.promise;
    }

    unregister(dbname_prefix, id, student) {
        const d = new Date();
        let history = {
            student, action: "unregistered", time: d.getTime().toString()
        };
        return MongoDBProvider.update_onEducation(dbname_prefix, collectionName, "system",
            {
                _id: { $eq: new require('mongodb').ObjectID(id) }
            },
            {
                $pull: {
                    members: student
                },
                $push: {
                    history
                }
            }
        )
    }

    loadListStudent(dbname_prefix, filter, top, offset, sort) {                
        let dfd = q.defer();
        MongoDBProvider.load_onEducation(dbname_prefix, collectionName, filter, top, offset, sort)
        .then(function (data) {
            // retrieve only members from documemts and push members to an array
            const uniqueMembers = {};
            data.forEach(doc => {
                doc.members.forEach(member => {                    
                    // store the member obj in the uniqueMembers obj using studentId as the key
                    uniqueMembers[member.studentId] = member;                    
                });
            });
            // convert uniqueMembers obj to array
            const filteredResult = Object.values(uniqueMembers)
            dfd.resolve(filteredResult);
        }, function (err) {
            dfd.reject(err);
        });
        return dfd.promise;
    }

    loadRegisteredEventByStudentId(dbname_prefix, filter, top, offset, sort) {                
        let dfd = q.defer();
        MongoDBProvider.load_onEducation(dbname_prefix, collectionName, filter, top, offset, sort)
        .then(function (data) {
            const transformedData = transformResponse(data);
            dfd.resolve(transformedData);
        }, function (err) {
            dfd.reject(err);
        });
        return dfd.promise;
    }
    
    getById(dbname_prefix, id) {
        return MongoDBProvider.getOne_onEducation(dbname_prefix, collectionName, {
            _id: { $eq: new require('mongodb').ObjectID(id) }
        });
    }

    ackTrainingEvent(dbname_prefix, username, id, studentId, type) {
        let dfd = q.defer();
        const d = new Date();
        let history = {
            username, studentId, action: type, time: d.getTime().toString()
        };

        MongoDBProvider.getOne_onEducation(dbname_prefix, collectionName, {
            _id: { $eq: new require('mongodb').ObjectID(id) }
        }).then(function (data) {
            if (data.members) {
                let setQuery = type ==='checkin' ? {
                    $set: { "members.$.checkedInDate": d.getTime() }
                } : 
                {
                    $set: { "members.$.checkedOutDate": d.getTime() }
                }

                setQuery.$push = {
                    history
                }

                MongoDBProvider.update_onEducation(dbname_prefix, collectionName, "system",
                    {
                        _id: { $eq: new require('mongodb').ObjectID(id) },
                        "members.studentId": studentId
                    },
                    setQuery
                ).then(function(){
                    dfd.resolve(true);
                },function(err){
                    dfd.reject(err);
                });
            } else {
                dfd.reject({ path: "TrainingPointService.ackTrainingEvent.ProcessFailed", mes: "ProcessFailed" });
            }
        }, function (err) {
            dfd.reject(err)
        });
        return dfd.promise;
    }

    exportCheckoutList(dbname_prefix, id) {
        let dfd = q.defer();

        MongoDBProvider.getOne_onEducation(dbname_prefix, collectionName, {
            _id: { $eq: new require('mongodb').ObjectID(id) }
        }).then(function (data) {
            if (data) {
                dfd.resolve({
                    title: data.title,
                    trainingPoint: data.point,
                    checkoutList: data.members.reduce((pre, cur)=> {
                        if(cur.checkedInDate && cur.checkedOutDate) {
                            cur.registeredDate = moment(cur.registeredDate).format("DD/MM/YY HH:MM:SS");
                            cur.checkedInDate = moment(cur.checkedInDate).format("DD/MM/YY HH:MM:SS");
                            cur.checkedOutDate = moment(cur.checkedOutDate).format("DD/MM/YY HH:MM:SS");
                            pre.push(cur);
                        }
                        return pre;
                    }, [])
                });
            } else {
                dfd.reject({ path: "TrainingPointService.ackTrainingEvent.DataIsNotExists", mes: "DataIsNotExists" });
            }
        }).catch(function (err) {
            dfd.reject(err)
        });
        return dfd.promise;
    }
}

function transformResponse(data) {
    const transformedData = data.map(doc => ({
        title: doc.title,
        title_search: doc.title_search,
        content: doc.content,
        quantity: doc.quantity,
        start_registered_date: doc.start_registered_date,
        end_registered_date: doc.end_registered_date,
        start_date: doc.start_date,
        end_date: doc.end_date,
        point: doc.point
    }));
    return transformedData;
}

exports.TrainingPointService = new TrainingPointService();