const { MongoDBProvider } = require('../../../shared/mongodb/db.provider');
const q = require('q');

const { SocketProvider } = require('./../../../shared/socket/provider');
class AddFriendRoomMessageService {
    constructor() { }
    insert(dbname_prefix, username, room_id, message) {
        let dfd = q.defer();
        MongoDBProvider.getOne_onBasic(dbname_prefix, "add_friend_room",
            {
                $and: [
                    { _id: { $eq: new require('mongodb').ObjectID(room_id) } },
                    { members: { $eq: username } }
                ]
            }
        ).then(function (room) {
            let d = new Date();
            let mes = {
                username,
                message,
                room: room_id,
                delete: [],
                seen: [
                    {
                        time: d.getTime(),
                        username
                    }
                ]
            };
            MongoDBProvider.insert_onBasic(dbname_prefix, "add_friend_room_message", username, mes).then(function () {
                for (var i in room.members) {
                    if (username !== room.members[i]) {
                        SocketProvider.IOEmitToRoom(room.members[i], "updateFriendMessage", { room: room_id, request_id: room.request_id });
                    }
                }
                dfd.resolve(true);
            }, function (err) {
                dfd.reject(err);
            });
        }, function (err) {
            dfd.reject(err);
        });
        return dfd.promise;
    }

    countNotSeen(dbname_prefix, username, room_id) {
        let dfd = q.defer();
        MongoDBProvider.getOne_onBasic(dbname_prefix, "add_friend_room",
            {
                $and: [
                    { _id: { $eq: new require('mongodb').ObjectID(room_id) } },
                    { members: { $eq: username } }
                ]
            }
        )
            .then(function (room) {
                MongoDBProvider.count_onBasic(dbname_prefix, "add_friend_room_message",
                    {
                        $and: [
                            {
                                room: { $eq: room._id.toString() }
                            },
                            {
                                "seen.username": { $ne: username }
                            }
                        ]
                    }).then(function (count) {
                        dfd.resolve(count);
                    }, function (err) {
                        dfd.reject(err);
                    })
            }, function (err) {
                dfd.reject(err);
            });
        return dfd.promise;
    }

    loadList(dbname_prefix, username, room_id, offset) {
        let dfd = q.defer();
        MongoDBProvider.getOne_onBasic(dbname_prefix, "add_friend_room",
            {
                $and: [
                    { _id: { $eq: new require('mongodb').ObjectID(room_id) } },
                    { members: { $eq: username } }
                ]
            }
        ).then(function () {
            MongoDBProvider.load_onBasic(dbname_prefix, "add_friend_room_message",
                { room: { $eq: room_id } }, 100, offset, { _id: 1 }, { entity: false }
            ).then(function (data) {
                dfd.resolve(data);
            }, function (err) {
                dfd.reject(err);
            });
        }, function (err) {
            dfd.reject(err);
        });

        return dfd.promise;
    }

    delete(dbname_prefix,username, id) {
        return MongoDBProvider.delete_onBasic(dbname_prefix, "add_friend_room_message", username , { _id: { $eq: new require('mongodb').ObjectID(id) } });
    }

}
exports.AddFriendRoomMessageService = new AddFriendRoomMessageService();