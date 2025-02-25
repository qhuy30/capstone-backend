const { MongoDBProvider } = require('../../../../shared/mongodb/db.provider');
const { removeUnicode } = require('../../../../utils/util');
const q = require('q');
class WikiService {
    constructor() { }

    checkExistProject(dbname_prefix, project) {
        let dfd = q.defer();
        MongoDBProvider.count_onOffice(dbname_prefix, "project", { _id: { $in: project } }).then(function (res) {
            if (res >= project.length) {
                dfd.resolve(true);
            } else {
                dfd.reject({ path: "WikiService.checkExistProject.ProjectIsNotExist", mes: "ProjectIsNotExist" });
            }
            res = undefined;
            dfd = undefined;
            filter = undefined;
        }, function (err) {
            dfd.reject({ path: "WikiService.checkExistProject.db", err });
            err = undefined;
            filter = undefined;
        });

        return dfd.promise;
    }

    load(dbname_prefix, filter, top, offset) {
        return MongoDBProvider.load_onOffice(dbname_prefix, "wiki", filter,
            top, offset, { _id: -1 });
    }

    count(dbname_prefix, filter) {
        return MongoDBProvider.count_onOffice(dbname_prefix, "wiki", filter);
    }

    insert(dbname_prefix, username, title, content, project, department, is_popular, attachment, event) {
        return MongoDBProvider.insert_onOffice(dbname_prefix, "wiki", username,
            {
                title, content,username,
                project, department, is_popular,
                attachment,
                view: 0,
                events: [event],
                like: [],
                watched: [],
                title_search: removeUnicode(title),
                is_public: true
            });
    }

    update(dbname_prefix, username, id, title, content) {
        return MongoDBProvider.update_onOffice(dbname_prefix, "wiki", username,
            { _id: { $eq: new require('mongodb').ObjectID(id) } }, { $set: { title, content } });
    }

    delete(dbname_prefix, id, username) {
        return MongoDBProvider.delete_onOffice(dbname_prefix, "wiki", username,
            { _id: { $eq: new require('mongodb').ObjectID(id) } });
    }

    checkPermission(dbname_prefix, username, project) {
        let dfd = q.defer();
        MongoDBProvider.count_onOffice(dbname_prefix, "project",
            {
                $and: [
                    { participant: { $eq: username } },
                    { _id: { $in: project } }
                ]
            }
        ).then(function (res) {
            if (res > 0) {
                dfd.resolve(true);
            } else {
                dfd.reject({ path: "WikiService.checkPermission.NotPermission", mes: "NotPermission" });
            }
            res = undefined;
            dfd = undefined;
            project = undefined;
        }, function (err) {
            dfd.reject({ path: "WikiService.checkPermission.db", err });
            err = undefined;
            project = undefined;
        });
        return dfd.promise;
    }

    upView(dbname_prefix, username, id) {
        return MongoDBProvider.update_onOffice(dbname_prefix, "wiki", username,
            { _id: { $eq: new require('mongodb').ObjectID(id) } },
            { $inc: { view: 1 }, $addToSet: { watched: username } });
    }

    loadDetails(dbname_prefix, id) {
        return MongoDBProvider.getOne_onOffice(dbname_prefix, "wiki",
            { _id: { $eq: new require('mongodb').ObjectID(id) } }
        );
    }

    like(dbname_prefix, username, id) {
        return MongoDBProvider.update_onOffice(dbname_prefix, "wiki", username,
            { _id: { $eq: new require('mongodb').ObjectID(id) } },
            { $addToSet: { like: username } });
    }

    unlike(dbname_prefix, username, id) {
        return MongoDBProvider.update_onOffice(dbname_prefix, "wiki", username,
            { _id: { $eq: new require('mongodb').ObjectID(id) } },
            { $pull: { like: username } });
    }

    pushAttachment(dbname_prefix, username, id, attachment, time) {
        return MongoDBProvider.update_onOffice(dbname_prefix, "wiki", username,
            { _id: { $eq: new require('mongodb').ObjectID(id) } },
            { $addToSet: { attachment, events: { username, action: "removedAttachment", time } } });
    }

    removeAttachment(dbname_prefix, username, id, nameAttachment, time) {
        return MongoDBProvider.update_onOffice(dbname_prefix, "wiki", username,
            { _id: { $eq: new require('mongodb').ObjectID(id) } }, {
            $pull: { attachment: { name: nameAttachment } }
            , $push: { events: { username, action: "removedAttachment", time } }
        });
    }
}


exports.WikiService = new WikiService();