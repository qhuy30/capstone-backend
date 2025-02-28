const { MongoDBProvider } = require('../../../shared/mongodb/db.provider');
const q = require('q');
const { SocketProvider } = require('./../../../shared/socket/provider');
const { FirebaseProvider } = require('@shared/firebase/firebase.provider');
const { getTitle, getContent } = require('@utils/mobileUtil');
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
                    users.forEach(user => {
                        const token = user.fcmToken; 
                        // const token = "fSKH4ZD_DEUVkYEybiXMhj:APA91bHxHf73hBFft058VA4a8nCvaIGLTGIq33ARCarheWwSlW_exmWlItApJdvQajRU4uENOe86dvvtbTqdj8CDIG6_u4DvF0dBG56DB0OqkP0z0RyuHx8"; 
                        if(token){
                            const data = { username, action, to_username, seen, from_action, notify_time, to_students, params }
                            const languageCurrent = (user.language_mobile ? user.language_mobile.current : 'vi-VN') || 'vi-VN';
                            FirebaseProvider.sendToDevice(
                                token,
                                getTitle(action, languageCurrent),
                                getContent(action, from_action, languageCurrent, params),
                                { data: JSON.stringify(data) } 
                            )
                        }

                    })
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
