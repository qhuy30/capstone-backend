
const { SocketProvider } = require('./../../../shared/socket/provider');


module.exports = function (socket) {
    SocketProvider.socketOn(socket, 'typingFriendRoom', function (data) {
        SocketProvider.IOEmitToRoom(data.data.friend,"typingFriendRoom", {
            room: data.data.room,
            value: data.data.value
        });
        SocketProvider.getData("typingFriendRoom"+data.data.room).then(function (data2) {
            if(data.data.value){
               let check = true;
               for(var i in data2){
                   if(data2[i]===data.username){
                    check= false;
                    break;
                   }
               }
               if(check){
                   data2.push(data.username);
                   SocketProvider.putData("typingFriendRoom"+data.data.room,data2);
               }
            }else{
                let temp =[]
                for(var i in data2){
                    if(data2[i]!==data.username){
                        temp.push(data2[i])
                     break;
                    }
                }
                SocketProvider.putData("typingFriendRoom"+data.data.room,temp);
            }
        },function (err) {
            if(data.data.value){
                SocketProvider.putData("typingFriendRoom"+data.data.room,[data.username]);
            }else{
                SocketProvider.putData("typingFriendRoom"+data.data.room,[]);
            }
            
        });
    });
}