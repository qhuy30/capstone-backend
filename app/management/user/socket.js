
const { SocketProvider } = require('./../../../shared/socket/provider');
const q = require('q');
const { UserService } = require('./user.service');
function sendSignalToUserFriend(username, event, data) {
    let dfd = q.defer();
    UserService.getFriend(username).then(function (friends) {
        for (var i in friends) {
            SocketProvider.IOEmitToRoom(friends[i].username, event, data);
        }
        SocketProvider.IOEmitToRoom(username, event, data);
    }, function (err) {
        dfd.reject(err);
    });
    return dfd.promise;
}
module.exports = function (socket) {
    SocketProvider.socketOn(socket, 'login', function (data) {
        SocketProvider.joinRoom(socket, data.username);
        SocketProvider.getData("memberOnline").then(function (memberOnline) {
            let thisGuy = memberOnline.filter(member => member.username === data.username);

            if (thisGuy.length == 0) {
                memberOnline.push({ username: data.username, socketIds: [socket.id] });
            } else {
                for (var i in memberOnline) {
                    if (memberOnline[i].socketIds.indexOf(socket.id) == -1
                        && memberOnline[i].username === data.username) {
                        memberOnline[i].socketIds.push(socket.id);
                    }
                }
            }
      
            SocketProvider.putData('memberOnline', memberOnline).then(function (params) {
                
                sendSignalToUserFriend(data.username, "updateMemberOnline", data.username);
            });
        }, function (err) {
            SocketProvider.putData('memberOnline', [{ username: data.username, socketIds: [socket.id] }]).then(function (params) {
                sendSignalToUserFriend(data.username, "updateMemberOnline", data.username);
            });
        });

    });

    SocketProvider.socketOn(socket, "logout", function (data) {
        SocketProvider.leaveRoom(socket, data.username);

        SocketProvider.socketEmitToRoom(socket, data.username, "logout", data.username);
        SocketProvider.getData("memberOnline").then(function (memberOnline) {
            let member = memberOnline.filter(mem =>mem.username !==data.username );
            SocketProvider.putData('memberOnline', member).then(function (params) {
                sendSignalToUserFriend(data.username, "updateMemberOnline", data.username);
            });
        }, function (err) {
            SocketProvider.putData('memberOnline', []);
        });
    })

    SocketProvider.socketOn(socket, "disconnect", function (data) {
      
        SocketProvider.getData("memberOnline").then(function (memberOnline) {
            let members = [];
            for (var i in memberOnline) {

                if (data.username === memberOnline[i].username) {
                    let socketId = [];
                    for (var j in memberOnline[i].socketIds) {
                        if (socket.id !== memberOnline[i].socketIds[j]) {
                            socketId.push(memberOnline[i].socketIds[j]);
                        }
                    }
                    memberOnline[i].socketIds = socketId;
                    if (memberOnline[i].socketIds.length > 0) {
                        members.push(memberOnline[i]);
                    }
                } else {
                    members.push(memberOnline[i]);
                }
            }
            SocketProvider.putData('memberOnline', members).then(function () {
                sendSignalToUserFriend(data.username, "updateMemberOnline", data.username);
            });

        }, function (err) {
            SocketProvider.putData('memberOnline', []);

        });
    });
}