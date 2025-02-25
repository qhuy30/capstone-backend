const { MongoDBProvider } = require('../../../shared/mongodb/db.provider');
const q = require('q');
const { SocketProvider } = require('./../../../shared/socket/provider');
const { FirebaseProvider } = require('@shared/firebase/firebase.provider');
class RingBellItemService {
    constructor() { }

    loadList(dbname_prefix, username, filter, top, offset) {
        return MongoDBProvider.load_onManagement(dbname_prefix,
            "ringbell_item",
            filter,
            top, offset,
            // { seen: 1, notify_time: -1 },
            { notify_time: -1 },
            {
                _id: true, key_map: true, params: true,
                seen: { $elemMatch: { $eq: username } }, action: true, notify_time: true
            });
    }

    countList(dbname_prefix, username) {
        return MongoDBProvider.count_onManagement(dbname_prefix,
            "ringbell_item",
            {
                $and: [{
                    to_username: { $eq: username }
                }, {
                    seen: { $nin: [username] }
                }]
            });
    }

    countAll(dbname_prefix, filter) {
        return MongoDBProvider.count_onManagement(dbname_prefix,
            "ringbell_item",
            filter);
    }
    insert(dbname_prefix, username, action, params, to_username, seen, from_action, notify_time, to_students = []) {
        let dfd = q.defer();
        MongoDBProvider.insert_onManagement(dbname_prefix, "ringbell_item", username,
            { action, params, to_username, seen, from_action, notify_time, to_students })
            .then(function() {
                // Send notifications to users
                for (let i in to_username) {
                    if (seen.indexOf(to_username[i]) === -1) {
                        SocketProvider.IOEmitToRoom(to_username[i], "new_ringbell_item", {
                            username, action, params, to_username, seen, from_action, notify_time, to_students
                        });
                    }
                }

                //Send notifications to firebase
                MongoDBProvider.load_onManagement(dbname_prefix, 'user', { username: { $in: to_username } }).then(function(users){
                    const fcmTokens = users.map(user => user.fcmToken).filter(token => token); 
                    const data = { username, action, to_username, seen, from_action, notify_time, to_students, params }
                    fcmTokens.forEach(token => {
                            FirebaseProvider.sendToDevice(
                            token,
                            action,
                            from_action,
                            { data: JSON.stringify(data) } 
                        )
                    });
                }, function(err){
                    console.log(err)
                })

            },function(err){
                dfd.reject(err);
            })
        return dfd.promise;
    }

    seen(dbname_prefix, username, id) {
        return MongoDBProvider.update_onManagement(dbname_prefix, "ringbell_item", username,
            { _id: { $eq: new require('mongodb').ObjectID(id) } },
            { $addToSet: { seen: username } });
    }

    seenAll(dbname_prefix, username) {
        return MongoDBProvider.update_onManagement(dbname_prefix, "ringbell_item", username,
            {
                $and: [
                    { seen: { $nin: [username] } },
                    { to_username: { $eq: username } }
                ]
            },
            { $addToSet: { seen: username } }
        )
    }
}




exports.RingBellItemService = new RingBellItemService();
