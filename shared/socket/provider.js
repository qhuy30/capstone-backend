var initResource = require('./../init').init;
const { CacheInterface } = require('./../redis/cache.interface');
const { prefixSocket, prefixRoom } = require('./../redis/redis.const');
const { AuthenticationProvider } = require('./../authentication/authentication.provider');
const jwt = require('jsonwebtoken');
const { JWTOptions } = require('./../authentication/authentication.const');
class SocketProvider {
    constructor() { }

    socketOn(socket, event, func) {
        return socket.on(event, function (data) {
            if (event === "disconnect") {
                if (socket.username) {
                    func({ username: socket.username, data: data.data });
                }
            } else {
                if (socket.username) {
                    func({ username: socket.username, data: data.data });
                } else {
                    jwt.verify(data.token, JWTOptions.jwtSecret, function (err, payload) {
                        if (err) {
                            socket.emit("unauthorized", { data: err });
                        } else {
                            socket.username = AuthenticationProvider.decrypt_lv1(payload.data).username;
                            func({ username: AuthenticationProvider.decrypt_lv1(payload.data).username, data: data.data });
                        }
                    });
                }
            }

        });
    }

    socketEmit(socket, event, data) {
        return socket.emit(event, data);
    }

    joinRoom(socket, room) {
        return socket.join(room);
    }

    leaveRoom(socket, room) {
        return socket.leave(room);
    }

    IOEmitToRoom(room, event, data) {
        return initResource.io.to(room).emit(event, data)
    }

    socketEmitToRoom(socket, room, event, data) {

        return socket.to(room).emit(event, data);
    }

    getData(key) {
        return CacheInterface.get(prefixSocket, "", key);
    }

    putData(key, data) {
        return CacheInterface.put(prefixSocket, "", key, data);
    }

    delData(key) {
        return CacheInterface.del(prefixSocket, "", key);
    }
}

exports.SocketProvider = new SocketProvider();