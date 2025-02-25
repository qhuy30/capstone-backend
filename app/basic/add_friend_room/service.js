const { MongoDBProvider } = require('../../../shared/mongodb/db.provider');
const q = require('q');
const { SocketProvider } = require('./../../../shared/socket/provider');
class AddFriendRoomService {
    constructor() { }
    load_show(dbname_prefix, username) {
        let dfd = q.defer();
        MongoDBProvider.load_onBasic(dbname_prefix, "add_friend_room", { members: { $eq: username } }).then(function (rooms) {
            let valid_room = rooms.filter(r => r.show.indexOf(username) !== -1);
            let exclude_room = rooms.filter(r => r.show.indexOf(username) === -1);
            let arID = [];
            for (var i in exclude_room) {
                arID.push(exclude_room[i]._id.toString());
            }

            MongoDBProvider.loadAggregate_onBasic(dbname_prefix, "add_friend_room_message",
                [
                    {
                        $match: {
                            $and: [
                                { room: { $in: arID } },
                                { seen: { $ne: username } }
                            ]
                        }
                    },
                    {
                        $sort: { _id: -1 }
                    },
                    {
                        $group: {
                            _id: "$room",
                            count: { $sum: 1 }
                        },
                    }
                ]
            ).then(function (report) {
                for (var j in exclude_room) {
                    for (var i in report) {
                        if (report[i].count > 0
                            && exclude_room[j]._id.toString() === report[i].room) {
                            valid_room.push(exclude_room[j]);
                        }
                    }
                }
                dfd.resolve(valid_room);
            }, function (err) {
                dfd.reject(err);
            });


        }, function (err) {
            dfd.reject(err);
        });
        return dfd.promise;
    }

    pushShow(dbname_prefix, username, room) {
        return MongoDBProvider.update_onBasic(dbname_prefix,
           "add_friend_room", username ,
            {
                $and: [
                    { members: { $eq: username } },
                    { _id: { $eq: new require('mongodb').ObjectID(room) } }
                ]
            },
            {
                $addToSet: {
                    show: username
                }
            }
        );
    }

    pullShow(dbname_prefix, username, room) {
        return MongoDBProvider.update_onBasic(dbname_prefix,
             "add_friend_room", username ,
            {
                $and: [
                    { members: { $eq: username } },
                    { _id: { $eq: new require('mongodb').ObjectID(room) } }
                ]
            },
            {
                $pull: {
                    show: username
                }
            }
        );
    }

    getRoom(dbname_prefix,username, request_id) {
        return MongoDBProvider.getOne_onBasic(dbname_prefix,"add_friend_room", {
            $and: [
                { request_id: { $eq: request_id } },
                { members: { $eq: username } }
            ]
        }
        );
    }

    getTyping(id) {
        let dfd = q.defer();
        SocketProvider.getData("typingFriendRoom" + id).then(function name(mems) {
            dfd.resolve(mems);
        }, function name(err) {
            dfd.resolve([]);
        })
        return dfd.promise;
    }
}
exports.AddFriendRoomService = new AddFriendRoomService();