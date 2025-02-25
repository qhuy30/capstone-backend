const q = require("q");

const { TaskTemplateService } = require("./service");

class TaskTemplateController {

    load(dbname_prefix, currentUser, body) {
        return TaskTemplateService.load(dbname_prefix, currentUser.username, body);
    }

    count(dbname_prefix, currentUser, body) {
        return TaskTemplateService.count(dbname_prefix, currentUser.username, body);
    }

    loadDetail(dbname_prefix, currentUser, body) {
        return TaskTemplateService.loadDetail(dbname_prefix, currentUser.username, body);
    }

    insert(dbname_prefix, currentUser, body) {
        return TaskTemplateService.insert(dbname_prefix, currentUser.username, body);
    }

    update(dbname_prefix, currentUser, body) {
        let dfd = q.defer();
        let date = new Date();
        TaskTemplateService.getById(dbname_prefix, body.id)
            .then((template) => {
                dfd.resolve(TaskTemplateService.update(dbname_prefix, currentUser.username, body.id, template, body));
            })
            .catch((err) => {
                dfd.reject(err);
                err = undefined;
                date = undefined;
            });
        return dfd.promise;
    }

    updateJobStatus(dbname_prefix, currentUser, body) {
        return TaskTemplateService.updateJobStatus(dbname_prefix, currentUser.username, body);
    }

}
exports.TaskTemplateController = new TaskTemplateController();
