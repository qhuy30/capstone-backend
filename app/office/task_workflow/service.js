const { MongoDBProvider } = require('../../../shared/mongodb/db.provider');
const { removeUnicode } = require('../../../utils/util');
const q = require('q');

class TaskWorkflowService {
    constructor() { }

    loadDetails(dbname_prefix, id) {
        let dfd = q.defer();
        MongoDBProvider.load_onOffice(dbname_prefix,
            "task_workflow",
            { "_id": { $eq: new require('mongodb').ObjectID(id) } }
        ).then(function (data) {
            if (data[0]) {
                dfd.resolve(data[0]);
            } else {
                dfd.reject({ path: "TaskWorkflowService.loadDetails.DataIsNull", mes: "DataIsNull" });
            }
            data = undefined;
        }, function (err) {
            dfd.reject(err);
            err = undefined;
        });
        return dfd.promise;
    }

    loadList(dbname_prefix, filter, top, offset,sort) {
        return MongoDBProvider.load_onOffice(dbname_prefix, "task_workflow", filter,
            top, offset, sort);
    }

    countList(dbname_prefix, filter) {
        return MongoDBProvider.count_onOffice(dbname_prefix, "task_workflow", filter);
    }

    insert(dbname_prefix, username, title, status, project, department, flow) {
        let item = {
            username, title, title_search: removeUnicode(title),
            status, project, department, flow, event:[{
                 username, time: new Date().getTime(), action: "CreatedTaskWorkFlow" 
            }]
        };
        return MongoDBProvider.insert_onOffice(dbname_prefix, "task_workflow", username, item);
    }


    update(dbname_prefix, username, id, title, status, project, department, flow) {
        let item = { title, title_search: removeUnicode(title),
            status, project, department, flow
        };
        return MongoDBProvider.update_onOffice(dbname_prefix, "task_workflow", username,
            { _id: { $eq: new require('mongodb').ObjectID(id) } },
            {
                $set: item,
                $push: { event: { username, time: new Date().getTime(), action: "UpdatedInformation" } }
            }
        );
    }

    delete(dbname_prefix,username, id) {
        return MongoDBProvider.delete_onOffice(dbname_prefix, "task_workflow", username,
            { _id: { $eq: new require('mongodb').ObjectID(id) } }
        );
    }

}


exports.TaskWorkflowService = new TaskWorkflowService();