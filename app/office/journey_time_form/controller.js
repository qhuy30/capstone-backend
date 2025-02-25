
const { JTFService } = require('./service');
const fieldSearchAr = ["search", "type", "from_date","to_date","tab"];

const countFilter = function (body) {
    let count = 0;
    for (var i in fieldSearchAr) {
        if (body[fieldSearchAr[i]] !== undefined && body[fieldSearchAr[i]] !== "") {
            count++;
        }
    }
    return count;
}

const genFilter = function (body, count) {

    if (count == 1) {
        let filter = {};
        switch(body.tab){
            case "my_journey_time_form":
                filter = {to_employee : {$eq:body.username}};
                break;
            case "handled":
                filter ={_id :{$ne:false}};
                break;
        }
        return filter;
    }

    let filter = { $and: [] };
    for (var i in fieldSearchAr) {
        if (body[fieldSearchAr[i]] !== undefined && body[fieldSearchAr[i]] !== "") {
            switch (fieldSearchAr[i]) {
                case "tab":
                    switch(body.tab){
                        case "my_journey_time_form":
                            filter.$and.push({to_employee : {$eq:body.username}});
                            break;
                        case "handled":
                            filter.$and.push({_id :{$ne:false}});
                            break;
                    }
                    break;
                case "search":
                    filter.$and.push({ $text:{$search: body[fieldSearchAr[i]]}});
                    break;
                
                case "from_date":
                    filter ={event :{$elemMatch : {time : {$gte:body.from_date},  action : "Created" }}};
                    break;
                case "to_date":
                    filter ={event :{$elemMatch : {time : {$gte:body.to_date},  action : "Created" }}};
                    break;    
                default:
                    let item = {};
                    item[fieldSearchAr[i]] = { $eq: body[fieldSearchAr[i]] };
                    filter.$and.push(item);
            }
        }
    }

    return filter;
}




class JTFController {
    constructor() { }
    loadDetails(body){
        return JTFService.loadDetails(body._service[0].dbname_prefix,body.username,body.id);
    }



    load(body) {
        let count = countFilter(body);
        let filter = genFilter(body, count);
        return JTFService.loadList(body._service[0].dbname_prefix,filter, body.top, body.offset, body.sort);
    }


    count(body) {
        let count = countFilter(body);
        let filter = genFilter(body, count);
        return JTFService.countList(body._service[0].dbname_prefix,filter);
    }



    insert(body){
        return JTFService.insert(body._service[0].dbname_prefix,body.username,body.title,body.number_day,body.leave_form,body.note);
    }

    cancel(body){
        return JTFService.cancel(body._service[0].dbname_prefix,body.username,body.id,body.note);
    }

    delete(body){
        return JTFService.delete(body._service[0].dbname_prefix,body.username,body.id);
    }
}

exports.JTFController = new JTFController(); 