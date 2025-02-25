const admin = require('firebase-admin');
const q = require('q');
const trycatch = require('trycatch');
const FirebaseConst = require('./firebase.const');

class FirebaseCore {
    constructor() { }

    initialize(param) {
        let dfd = q.defer();
        trycatch(function () {
            if (!admin.apps.length) {
                const config = {
                    credential: admin.credential.cert({
                        projectId: param.projectId || FirebaseConst.projectId,
                        clientEmail: param.clientEmail || FirebaseConst.clientEmail,
                        privateKey: (param.privateKey || FirebaseConst.privateKey).replace(/\\n/g, '\n')
                    })
                };
                admin.initializeApp(config);
                dfd.resolve(true);
            } else {
                dfd.resolve(true);
            }
        }, function (err) {
            dfd.reject({ path: "FirebaseCore.initialize", err: err.stack });
        });
        return dfd.promise;
    }

    send(param) {
        let dfd = q.defer();
        trycatch(async function () {
            const message = {
                notification: {
                    title: param.title,
                    body: param.body
                },
                data: param.data || {},
                android: param.android || {
                    priority: 'high',
                    notification: {
                        sound: 'default'
                    }
                },
                apns: param.apns || {
                    payload: {
                        aps: {
                            sound: 'default'
                        }
                    }
                }
            };

            // Add token or topic based on what's provided
            if (param.token) {
                message.token = param.token;
            } else if (param.topic) {
                message.topic = param.topic;
            } else if (param.tokens) {
                message.tokens = param.tokens;
            }

            try {
                let response;
                if (param.tokens) {
                    response = await admin.messaging().sendMulticast(message);
                } else {
                    response = await admin.messaging().send(message);
                }
                dfd.resolve(response);
            } catch (error) {
                dfd.reject({ path: "FirebaseCore.send", err: error });
            }
        }, function (err) {
            dfd.reject({ path: "FirebaseCore.send.trycatch", err: err.stack });
        });
        return dfd.promise;
    }

    subscribeTopic(param) {
        let dfd = q.defer();
        trycatch(async function () {
            try {
                const response = await admin.messaging().subscribeToTopic(
                    param.tokens,
                    param.topic
                );
                dfd.resolve(response);
            } catch (error) {
                dfd.reject({ path: "FirebaseCore.subscribeTopic", err: error });
            }
        }, function (err) {
            dfd.reject({ path: "FirebaseCore.subscribeTopic.trycatch", err: err.stack });
        });
        return dfd.promise;
    }

    unsubscribeTopic(param) {
        let dfd = q.defer();
        trycatch(async function () {
            try {
                const response = await admin.messaging().unsubscribeFromTopic(
                    param.tokens,
                    param.topic
                );
                dfd.resolve(response);
            } catch (error) {
                dfd.reject({ path: "FirebaseCore.unsubscribeTopic", err: error });
            }
        }, function (err) {
            dfd.reject({ path: "FirebaseCore.unsubscribeTopic.trycatch", err: err.stack });
        });
        return dfd.promise;
    }
}

exports.FirebaseCore = new FirebaseCore();
