const { forEach } = require('../../../shared/localization/office/vi-VN');
const { MongoDBProvider } = require('../../../shared/mongodb/db.provider');
const { removeUnicode } = require('../../../utils/util');
const q = require('q');
const { StoreConst } = require('../../../shared/store/gcp/store.const');

class FileService {
    constructor() {}

    loadList(dbname_prefix, filter, top, offset, sort) {
        return MongoDBProvider.load_onOffice(dbname_prefix, 'file', filter, top, offset, sort);
    }

    insert(
        dbname_prefix,
        username,
        name,
        size,
        version,
        type,
        department,
        isGeneral,
        project,
        share,
        value,
        from_date,
        last_update_date,
        path
    ) {
        let dfd = q.defer();

        let item = {
            name,
            size,
            version,
            type,
            department,
            isGeneral,
            project,
            share,
            value,
            from_date,
            last_update_date,
            path,
            username,
            name_search: removeUnicode(name),
            isDelete: false,
        };

        MongoDBProvider.insert_onOffice(dbname_prefix, 'file', username, item).then(
            function (e) {
                dfd.resolve(true);
            },
            function (err) {
                dfd.reject(err);
            }
        );
        return dfd.promise;
    }

    insert_file(
        dbname_prefix,
        username,
        version,
        type,
        department,
        isGeneral,
        project,
        share,
        value,
        from_date,
        last_update_date,
        path,
        data
    ) {
        let dfd = q.defer();

        let items = [];
        for (var i in value) {
            items.push({
                name: value[i].display,
                size: data[value[i].display],
                version,
                type,
                department,
                isGeneral,
                project,
                share,
                value: value[i],
                from_date: parseInt(from_date),
                last_update_date: parseInt(last_update_date),
                path,
                username,
                name_search: removeUnicode(value[i].name),
                isDelete: false,
            });
        }

        MongoDBProvider.insertMany_onOffice(dbname_prefix, 'file', username, items).then(
            function () {
                dfd.resolve(true);
            },
            function (err) {
                dfd.reject(err);
            }
        );
        return dfd.promise;
    }

    update(dbname_prefix, username, id, item) {
        let dfd = q.defer();
        MongoDBProvider.update_onOffice(
            dbname_prefix,
            'file',
            username,
            { _id: { $eq: new require('mongodb').ObjectID(id) } },
            { $set: item }
        ).then(
            function () {
                dfd.resolve(true);
            },
            function (err) {
                dfd.reject(err);
            }
        );
        return dfd.promise;
    }

    delete(dbname_prefix, username, id, recoverRecord) {
        return MongoDBProvider.update_onOffice(
            dbname_prefix,
            'file',
            username,
            { _id: { $eq: new require('mongodb').ObjectID(id) } },
            {
                $set: { isDelete: true },
                $push: { [StoreConst.recoverFound]: recoverRecord },
            }
        );
    }

    
    load_department(dbname_prefix, filter) {
        return MongoDBProvider.load_onOffice(dbname_prefix, "organization", filter);
    }
}

exports.FileService = new FileService();
