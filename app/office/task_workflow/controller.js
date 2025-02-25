const { TaskWorkflowService } = require('./service');



const countFilter = function (body) {
    let count = 0;
    if (body.search !== undefined && body.search !== "") {
        count++;
    }

    if (body.status !== undefined && body.status !== "") {
        count++;
    }
    
    return count;
}

const genFilter = function (body, count) {
    if(count ===0){return {};}
    if (count == 1) {
        if (body.status && body.status !== "") {
            return { $text: { $search: body.search } };
        }
        if (body.status && body.status !== "") {
            return { status: { $eq: body.status } };
        }
    }

    let filter = { $and: [] };
    if (body.status && body.status !== "") {
        filter.$and.push({ status: { $eq: body.status } });
    }

    if (body.search && body.search !== '') {
        filter.$and.push({ $text: { $search: body.search } });
    }

    return filter;
}

class TaskWorkflowController {
    constructor() { }

    loadDetails(body) {
        return TaskWorkflowService.loadDetails(body._service[0].dbname_prefix, body.id);
    }

    load(body) {
        let count = countFilter(body);
        let filter = genFilter(body, count);

        return TaskWorkflowService.loadList(body._service[0].dbname_prefix, filter, body.top, body.offset,body.sort);
    }

    count(body) {
        let count = countFilter(body);
        let filter = genFilter(body, count);
        return TaskWorkflowService.countList(body._service[0].dbname_prefix, filter);
    }

    insert(body) {
        return TaskWorkflowService.insert(body._service[0].dbname_prefix,body.username,body.title, body.status, body.project, body.department, body.flow)
    }

    update(body) {
        return TaskWorkflowService.update(body._service[0].dbname_prefix,body.username,body.id,body.title, body.status, body.project, body.department, body.flow);
    }

    delete(body) {
        return TaskWorkflowService.delete(body._service[0].dbname_prefix, body.username,  body.id);
    }
}

exports.TaskWorkflowController = new TaskWorkflowController();