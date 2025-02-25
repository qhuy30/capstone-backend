const FirebaseInterface = require('./firebase.interface').FirebaseInterface;
const q = require('q');

class FirebaseProvider {
    constructor() { }

    async initialize(credentials = {}) {
        try {
            await FirebaseInterface.initialize(credentials);
            console.log('Init firebase success')
            return { success: true };
        } catch (error) {
            console.log(error)
            return { success: false, error: error.message };
        }
    }

    sendToDevice(token, title, body, data = {}, options = {}) {
        return FirebaseInterface.sendToDevice({
            token,
            title,
            body,
            data,
            ...options
        });
    }

    sendToTopic(topic, title, body, data = {}, options = {}) {
        return FirebaseInterface.sendToTopic({
            topic,
            title,
            body,
            data,
            ...options
        });

    }

    sendToMultipleDevices(tokens, title, body, data = {}, options = {}) {
        return FirebaseInterface.sendToMultipleDevices({
            tokens,
            title,
            body,
            data,
            ...options
        });
    }

    subscribeTopic(tokens, topic) {
        return FirebaseInterface.subscribeTopic({
            tokens,
            topic
        });  
    }

    unsubscribeTopic(tokens, topic) {
        return FirebaseInterface.unsubscribeTopic({
            tokens,
            topic
        });
    }
}

exports.FirebaseProvider = new FirebaseProvider();
