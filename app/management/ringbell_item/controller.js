


const { RingBellItemService } = require('./service');

function generateFilter(body) {
    if (body.tab === "all") {
        return { to_username: { $eq: body.username } }
    }
    return {
        $and: [
            { seen: { $nin:[body.username]} },
            { to_username: { $eq: body.username } }
        ]
    }
}

class RingBellItemController {
    constructor() { }
    load(body) {
     
        return RingBellItemService.loadList(body._service[0].dbname_prefix, body.username, generateFilter(body), body.top, body.offset);
    }

    count(body) {
        return RingBellItemService.countList(body._service[0].dbname_prefix, body.username);
    }

    countAll(body) {
        return RingBellItemService.countAll(body._service[0].dbname_prefix,generateFilter(body));
    }

    seen(body) {
        return RingBellItemService.seen(body._service[0].dbname_prefix, body.username, body.id);
    }

    seenAll(body){
        return RingBellItemService.seenAll(body._service[0].dbname_prefix, body.username);
    }
}

exports.RingBellItemController = new RingBellItemController(); 