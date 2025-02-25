


const { AddFriendRoomService } = require('./service');

class AddFriendRoomController {
    constructor() { }
    load_show(body){
        return AddFriendRoomService.load_show(body._service[0].dbname_prefix,body.username);
    }
    push_show(body){
        return AddFriendRoomService.pushShow(body._service[0].dbname_prefix,body.username,body.room);
    }

    pull_show(body){
        return AddFriendRoomService.pullShow(body._service[0].dbname_prefix,body.username,body.room);
    }

    get_room(body){
        return AddFriendRoomService.getRoom(body._service[0].dbname_prefix,body.username,body.request_id);
    }
    get_typing(body){
        return AddFriendRoomService.getTyping(body.id);
    }

}

exports.AddFriendRoomController = new AddFriendRoomController(); 