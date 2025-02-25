const { MasterDirectoryService } = require('./service');

function countFilter(body){
    let count =0;
    if(body.search){
        count ++;
    }


    return count;
}

function genFilter(body){
    let filter ={};
    let count = countFilter(body);
    if(count ==1){
        filter= {title_to_search: { $regex: body.search }};
    }
    return filter;
}
class MasterDirectoryController{
    constructor(){}
    load(body){
        let filter = genFilter(body);
        return MasterDirectoryService.load(body._service[0].dbname_prefix,filter,body.top,body.offset);
    }

    count(body){
        let filter = genFilter(body);
        return MasterDirectoryService.count(body._service[0].dbname_prefix,filter);
    }

    loadDetails(body){
        return MasterDirectoryService.loadDetails(body._service[0].dbname_prefix,body.key);
    }

    getOrderNumber(body){
        return MasterDirectoryService.getOrderNumber(body._service[0].dbname_prefix);
    }

    insert(body){
        return MasterDirectoryService.insert(body._service[0].dbname_prefix,
            body.username,body.ordernumber,body.title,body.key,body.extend);
    }

    update(body){
        return MasterDirectoryService.update(body._service[0].dbname_prefix,
            body.username,body.id,body.ordernumber,body.title,body.key,body.extend)
    }

    delete(body){
        return MasterDirectoryService.delete(body._service[0].dbname_prefix,body.username,body.key);
    }
}

exports.MasterDirectoryController = new MasterDirectoryController();
