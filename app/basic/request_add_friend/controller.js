

const q = require('q');
const { RequestAddFriendService } = require('./service');
const fieldSearchAr =["search","status"];
const {genFilter,countFilter} = require('./../../../utils/util');

class RequestAddFriendController {
    constructor() { }
    load_receive(body){
        return RequestAddFriendService.load_receive(body._service[0].dbname_prefix,body.username);
    }

    loadPending(body) {
        return RequestAddFriendService.loadPending(body._service[0].dbname_prefix,body.username);
    }

    countPending(body) {
        return RequestAddFriendService.countPending(body._service[0].dbname_prefix,body.username);
    }

    load(body) {
        let count = countFilter(body,fieldSearchAr);
        let filter = genFilter(body, count,fieldSearchAr);
        return RequestAddFriendService.loadList(body._service[0].dbname_prefix,filter, body.top, body.offset, body.sort);
    }

    count(body) {
        let count = countFilter(body,fieldSearchAr);
        let filter = genFilter(body, count,fieldSearchAr);
        return RequestAddFriendService.countList(body._service[0].dbname_prefix,filter);
    }

    insert(body) {
        return RequestAddFriendService.insert(body._service[0].dbname_prefix,body.username,body.session.title,body.friend);
    }

    delete(body){
        return RequestAddFriendService.delete(body._service[0].dbname_prefix,body.username,body.id);
    }

    accept(body){
        return RequestAddFriendService.accept(body._service[0].dbname_prefix,body.username,body.id);
    }

    decline(body){
        return RequestAddFriendService.decline(body._service[0].dbname_prefix,body.username,body.id);
    }
}

exports.RequestAddFriendController = new RequestAddFriendController(); 