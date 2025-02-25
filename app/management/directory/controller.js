const { DirectoryService } = require('./service');


function countFilter(body) {
    let count = 0;
    if (body.search) {
        count++;
    }

    if (body.master_key) {
        count++;
    }
    if(body.filter){
        for(var i in body.filter){
            count++;
        }
    }
    return count;
}

function genFilter(body) {
    let filter = {};
    let count = countFilter(body);
    if (count == 1) {
        filter = { master_key: { $eq: body.master_key } };
    }

    if (count > 1) {
        filter = {
            $and: [{ master_key: { $eq: body.master_key } }],
        };
        
        if (body.search) {
            filter.$and.push({ $text: { $search: body.search } });
        }
        
        if (body.filter) {
            for (var i in body.filter) {
                filter.$and.push(body.filter[i]);
            }
        }
    }
    return filter;
}

function genFilter_for_directive(body) {
    let filter = { isactive: { $eq: true } };
    let count = countFilter(body);
    if (count == 1) {
        filter = {
            $and: [
                {
                    master_key: { $eq: body.master_key }
                },
                { isactive: { $eq: true } }
            ]

        };
    }

    if (count >1) {
        filter = {
            $and: [
                { master_key: { $eq: body.master_key } },
                { isactive: { $eq: true } }
            ]
        }
        if(body.search){
            filter.$and.push({ $text: { $search: body.search } }); 
        }

        if(body.filter){
            for(var i in body.filter){
                filter.$and.push(body.filter[i]);
            }
        }
    }
    return filter;
}

class DirectoryController {
    constructor() { }
    getOrderNumber(body) {
        return DirectoryService.getOrderNumber(body._service[0].dbname_prefix, body.master_key);
    }

    loadDetails(body) {
        return DirectoryService.loadDetails(body._service[0].dbname_prefix, body.type, body.id,body.master_key);
    }

    load_for_directive(body) {
        let filter = genFilter_for_directive(body);
        return DirectoryService.load(body._service[0].dbname_prefix, filter, body.top, body.offset);
    }

    count_for_directive(body){
        let filter = genFilter_for_directive(body);
        return DirectoryService.count(body._service[0].dbname_prefix, filter);
    }

    load(body) {
        let filter = genFilter(body);
        return DirectoryService.load(body._service[0].dbname_prefix, filter, body.top, body.offset);
    }

    count(body) {
        let filter = genFilter(body);
        return DirectoryService.count(body._service[0].dbname_prefix, filter);
    }

    insert(body) {
        return DirectoryService.insert(body._service[0].dbname_prefix,
            body.username, body.master_key, body.ordernumber, body.title, body.value, body.item || {}, body.isactive);
    }

    update(body) {
        return DirectoryService.update(body._service[0].dbname_prefix, body.username
            , body.id, body.ordernumber, body.title, body.value, body.item || {}, body.isactive);
    }

    delete(body) {
        return DirectoryService.delete(body._service[0].dbname_prefix, body.username, body.id);
    }

    loadDetailsMany(body) {
        return DirectoryService.loadDetailsMany(body._service[0].dbname_prefix, body.type, body.ids,body.master_key);
    }
}

exports.DirectoryController = new DirectoryController();