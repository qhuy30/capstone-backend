const { MongoDBProvider } = require('../../../shared/mongodb/db.provider');
const q = require('q');
const { generateSearchText } = require('./../../../utils/util');
const { SocketProvider } = require('./../../../shared/socket/provider');
class RequestAddFriendService {
    constructor() { }
    insert(dbname_prefix, username, display_name, friend) {
        let dfd = q.defer();
        MongoDBProvider.getOne_onManagement(dbname_prefix, "user", { username: { $eq: friend } }).then(function (data) {
            let display_name_friend = data.title;
            MongoDBProvider.insert_onBasic(dbname_prefix, "request_add_friend", username,
                {
                    username,
                    display_name,
                    display_name_to_search: generateSearchText(display_name),
                    friend,
                    display_name_friend,
                    display_name_friend_to_search: generateSearchText(display_name_friend),
                    status: "Pending"
                }
            ).then(function (res) {
                dfd.resolve(true);
            }, function (err) {
                dfd.reject(err);
            });
        }, function (err) {
            dfd.reject(err);
        });
        return dfd.promise;
    }

    loadList(dbname_prefix, filter, top, offset, sort) {
        return MongoDBProvider.load_onBasic(dbname_prefix, "request_add_friend", filter, top, offset, sort, { entity: false });
    }

    countList(dbname_prefix, filter) {
        return MongoDBProvider.count_onBasic(dbname_prefix, "request_add_friend", filter);
    }

    load_receive(dbname_prefix, username) {
        return MongoDBProvider.load_onBasic(dbname_prefix, "request_add_friend",
            {
                $and: [{ friend: { $eq: username } },
                { status: { $eq: "Pending" } }]
            },
            5000, 0, { _id: -1 }, { entity: false });
    }

    loadPending(dbname_prefix, username) {
        return MongoDBProvider.load_onBasic(dbname_prefix, "request_add_friend",
            { $and: [{ username: { $eq: username } }, { status: { $eq: "Pending" } }] },
            100, 0, { _id: 1 }, { entity: false });
    }

    countPending(dbname_prefix, username) {
        return MongoDBProvider.count_onBasic(dbname_prefix, "request_add_friend",
            {
                $and: [{ username: { $eq: username } },
                { status: { $eq: "Pending" } }]
            });
    }

    delete(dbname_prefix, username, id) {
        return MongoDBProvider.delete_onBasic(dbname_prefix, "request_add_friend", username, { $and: [{ _id: { $eq: new require('mongodb').ObjectID(id) } }, { status: { $ne: "Accepted" } }] });
    }

    accept(dbname_prefix, username, id) {
        let dfd = q.defer();
        MongoDBProvider.getOne_onBasic(dbname_prefix, "request_add_friend",
            {
                $and: [
                    { friend: { $eq: username } },
                    { status: { $eq: "Pending" } },
                    { _id: { $eq: new require('mongodb').ObjectID(id) } }
                ]
            })
            .then(function (data) {
                let dfdAr = [];
                dfdAr.push(MongoDBProvider.update_onBasic(dbname_prefix, "request_add_friend", username,
                    { _id: { $eq: new require('mongodb').ObjectID(id) } },
                    { $set: { status: "Accepted" } }));
                dfdAr.push(MongoDBProvider.insert_onBasic(
                    dbname_prefix, "add_friend", username,
                    {
                        username: data.username, friend: data.friend,
                        request_id: id,
                        display_name_friend: data.display_name_friend,
                        display_name_friend_to_search: data.display_name_friend_to_search,
                        count: 0
                    }));
                dfdAr.push(MongoDBProvider.insert_onBasic(
                    dbname_prefix, "add_friend", username
                    , {
                        friend: data.username,
                        username: data.friend,
                        request_id: id,
                        display_name_friend: data.display_name,
                        display_name_friend_to_search: data.display_name_to_search,
                        count: 0
                    }));
                dfdAr.push(MongoDBProvider.insert_onBasic(
                    dbname_prefix, "add_friend_room", username,
                    {
                        username: username,
                        request_id: id,
                        members: [data.username, data.friend],
                        show: []
                    }));
                q.all(dfdAr).then(function () {
                    SocketProvider.IOEmitToRoom(data.username, "updateFriendList", data.username);
                    dfd.resolve(true);
                }, function (err) {
                    dfd.reject(err);
                });
            }, function (err) {
                dfd.reject(err);
            });
        return dfd.promise;
    }

    decline(dbname_prefix,username, id) {
        let dfd = q.defer();
        MongoDBProvider.getOne_onBasic(dbname_prefix,"request_add_friend",
            {
                $and: [
                    { friend: { $eq: username } },
                    { status: { $eq: "Pending" } },
                    { _id: { $eq: new require('mongodb').ObjectID(id) } }
                ]
            })
            .then(function () {
                MongoDBProvider.delete_onBasic(dbname_prefix, "request_add_friend", username , { _id: { $eq: new require('mongodb').ObjectID(id) } }).then(function () {
                    dfd.resolve(true);
                }, function (err) {
                    dfd.reject(err);
                });
            }, function (err) {
                dfd.reject(err);
            });
        return dfd.promise;
    }
}
exports.RequestAddFriendService = new RequestAddFriendService();