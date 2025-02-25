


const { AddFriendService } = require('./service');


class AddFriendController {
    constructor() { }
    getFriend(body){
        let filter={};
        if(body.search!="" && body.search!==undefined && body.search!==null){
            filter={$and:[
                {username:{$eq:body.username}},
                {$text: { $search: body.search}}
            ]};
        }else{
            filter={username:{$eq:body.username}};
        }
        return AddFriendService.getFriend(body._service[0].dbname_prefix,filter,body.top,body.offset,{count:-1,display_name_friend:-1});
    }


}

exports.AddFriendController = new AddFriendController(); 