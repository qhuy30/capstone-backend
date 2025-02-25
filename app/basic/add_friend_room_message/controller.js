const {AddFriendRoomMessageService } = require('./service');

class AddFriendRoomMessageController {
    constructor() { }

    insert(body) {
        return AddFriendRoomMessageService.insert(body._service[0].dbname_prefix,body.username,body.room,body.message);
    }

    countNotSeen(body) {
        return AddFriendRoomMessageService.countNotSeen(body._service[0].dbname_prefix,body.username,body.room);
    }

    load(body) {

        return AddFriendRoomMessageService.loadList(body._service[0].dbname_prefix,body.username,body.room,body.offset);
    }

    delete(body){
        return AddFriendRoomMessageService.delete(body._service[0].dbname_prefix,body.username,body.id);
    }


}

exports.AddFriendRoomMessageController = new AddFriendRoomMessageController(); 