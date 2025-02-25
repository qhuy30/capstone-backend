const { StrategicService } = require('./service');

function genFilter(body,type) {
    let filter = {
        $and: [
            {
                $or: [
                    {
                        $and: [
                            { from_date: { $lte: body.from_date } },
                            { to_date: { $gte: body.from_date } }
                        ]
                    },
                    {
                        $and: [
                            { from_date: { $lte: body.to_date } },
                            { to_date: { $gte: body.to_date } }
                        ]
                    },
                    {
                        $and: [
                            { from_date: { $gte: body.from_date } },
                            { to_date: { $lte: body.to_date } }
                        ]
                    },
                    {
                        $and: [
                            { from_date: { $lte: body.from_date } },
                            { to_date: { $gte: body.to_date } }
                        ]
                    }
                ]
            }
        ]
    }
    switch(type){
        case "department":
            filter.$and.push({department: { $eq: body.department } });
            break;
        case "project":
            filter.$and.push({project: { $eq: body.project } });
            break;
    }

    if (body.status && body.status !== "") {
        filter.$and.push({ status: { $eq: body.status } });
    }

    if (body.search && body.search !== '') {
        filter.$and.push({ $text: { $search: body.search } });
    }

    return filter;

}

class StrategicController {
    constructor() { }

    load_base_department(body) {
        return StrategicService.load_base_department(body._service[0].dbname_prefix, genFilter(body,"department"),body.top,body.offset);
    }

    load_base_project(body) {
        return StrategicService.load_base_project(body._service[0].dbname_prefix, genFilter(body,"project"),body.top,body.offset);
    }

    count_base_department(body) {
        return StrategicService.count_base_department(body._service[0].dbname_prefix, genFilter(body,"department"));
    }

    count_base_project(body) {
        return StrategicService.count_base_project(body._service[0].dbname_prefix, genFilter(body,"project"));
    }


    insert(body) {
        return StrategicService.insert(body._service[0].dbname_prefix, body.username, body.title, body.from_date, body.to_date, body.department, body.project);
    }

    update(body) {
        return StrategicService.update(body._service[0].dbname_prefix, body.username, body.id, body.title, body.from_date, body.to_date, body.progress);
    }

    delete(body) {
        return StrategicService.delete(body._service[0].dbname_prefix, body.username, body.id);
    }

    obtained(body) {
        return StrategicService.obtained(body._service[0].dbname_prefix, body.username, body.id);
    }

    insert_object(body) {
        return StrategicService.insert_object(body._service[0].dbname_prefix, body.username, body.id, body.title, body.from_date, body.to_date);
    }

    update_object(body) {
        return StrategicService.update_object(body._service[0].dbname_prefix, body.username, body.id, body.itemid, body.title, body.from_date, body.to_date, body.progress);
    }

    delete_object(body) {
        return StrategicService.delete_object(body._service[0].dbname_prefix, body.username, body.id, body.itemid);
    }

    obtained_object(body) {
        return StrategicService.obtained_object(body._service[0].dbname_prefix, body.username, body.id, body.itemid);
    }
}

exports.StrategicController = new StrategicController();