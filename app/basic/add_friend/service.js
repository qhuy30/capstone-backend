const { MongoDBProvider } = require('../../../shared/mongodb/db.provider');
const q = require('q');

class AddFriendService {
    constructor() { }


    getFriend(dbname_prefix,filter, top, offset, sort){
        return MongoDBProvider.load_onBasic(dbname_prefix,"add_friend",filter,top, offset, sort,{entity:false});
    }
}


exports.AddFriendService = new AddFriendService();