const FirebaseCore = require('./firebase.core').FirebaseCore;
const q = require('q');

class FirebaseInterface {
    constructor() { }

    initialize(param) {
        return FirebaseCore.initialize(param);
    }

    sendToDevice(param) {
        return FirebaseCore.send({
            token: param.token,
            title: param.title,
            body: param.body,
            data: param.data,
            android: param.android,
            apns: param.apns
        });
    }

    sendToTopic(param) {
        return FirebaseCore.send({
            topic: param.topic,
            title: param.title,
            body: param.body,
            data: param.data,
            android: param.android,
            apns: param.apns
        });
    }

    sendToMultipleDevices(param) {
        return FirebaseCore.send({
            tokens: param.tokens,
            title: param.title,
            body: param.body,
            data: param.data,
            android: {
                notification: {
                    sound: "default",  // Hoặc tên tệp âm thanh tùy chỉnh (nếu có)
                    vibrateTimings: [0, 500, 1000],  // Rung, sau đó nghỉ, sau đó rung lại
                    priority: "high"  // Ưu tiên cao
                }
            },
            apns: {
                payload: {
                    aps: {
                        alert: {
                            title: param.title,
                            body: param.body
                        },
                        sound: "default",  // Âm thanh thông báo
                        badge: 1  // Cập nhật badge trên biểu tượng ứng dụng
                    }
                }
            }
        });
    }

    subscribeTopic(param) {
        return FirebaseCore.subscribeTopic(param);
    }

    unsubscribeTopic(param) {
        return FirebaseCore.unsubscribeTopic(param);
    }
}

exports.FirebaseInterface = new FirebaseInterface();
