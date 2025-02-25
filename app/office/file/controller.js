const { gcpProvider } = require('../../../shared/store/gcp/gcp.provider');
const { FileService } = require('./service');
const { FileProvider } = require('../../../shared/file/file.provider');
const validation = require('./validation');
const Decimal = require('decimal.js');
const { removeUnicode } = require('../../../utils/util');
const { getCurrentDate } = require('../../../utils/util');
const { MongoDBProvider } = require('../../../shared/mongodb/db.provider');

const q = require('q');

const folderPath = 'office';
const nameLib = 'file';

const countFilter = function (body) {
    let count = 0;
    if (body.search !== undefined && body.search !== '') {
        count++;
    }
    if (
        body.from_date !== undefined &&
        body.from_date !== '' &&
        body.last_update_date !== undefined &&
        body.last_update_date !== ''
    ) {
        count++;
    }

    if (body.tab !== undefined && body.tab !== '') {
        count++;
    }
    return count;
};

const genFilter = function (body, count) {
    if (count == 1) {
        let filter = { $and: [{ $or: [{ isDelete: false }, { isDelete: null }, { isDelete: { $exists: false } }] }] };
        switch (body.tab) {
            case 'created':
            case 'general':
            case 'department':
            case 'project':
                filter.$and.push(convertFilter(body.tab, body));
                break;
            case 'share':
                filter.$and.push({ share: { $eq: body.username } });
                break;
            default:
                filter = {};
                break;
        }
        return filter;
    }

    let filter = { $and: [{ $or: [{ isDelete: false }, { isDelete: null }, { isDelete: { $exists: false } }] }] };
    switch (body.tab) {
        case 'created':
        case 'general':
        case 'department':
        case 'project':
            filter.$and.push(convertFilter(body.tab, body));
            if (!body.path || body.path === '') {
                filter.$and.push({ path: { $size: 0 } });
            } else if (body.path) {
                filter.$and.push({ $expr: { $eq: [{ $arrayElemAt: ['$path', -1] }, body.path.toString()] } });
            }
            break;
        case 'share':
            filter.$and.push({ share: { $eq: body.username } });

            break;
    }

    if (body.search && body.search !== '') {
        filter.$and.push({ $text: { $search: body.search } });
    }

    if (body.from_date && body.last_update_date) {
        filter.$and.push({
            $or: [
                {
                    $and: [
                        { from_date: { $gte: body.from_date } },
                        { last_update_date: { $lte: body.last_update_date } },
                    ],
                },
            ],
        });
    }

    // if ((body.path == '' || body.path) && body.tab !== 'share') {
    // }

    return filter;
};

const convertFilter = function (tab, body) {
    let result = {};
    switch (tab) {
        case 'created':
            result = {
                username: { $eq: body.username },
                isGeneral: false,
                department: '',
                project: '',
            };
            break;
        case 'general':
            result = { isGeneral: true };
            break;
        case 'department':
            result = { department: { $eq: body.department } };
            break;
        case 'project':
            result = { project: { $eq: body.project } };
            break;
        default:
            result = {};
            break;
    }
    return result;
};

const updateVersion = function (version) {
    const numberString = '0.1';
    const numberToAdd = new Decimal(parseFloat(version));
    const parsedNumber = new Decimal(numberString);
    const updateVersion = parsedNumber.plus(numberToAdd);
    return updateVersion.toString();
};

// const genFilterCountSize = function (body, count) {
//     let filter = { $and: [{ type: 'file' }] };
//     switch (body.tab) {
//         case 'created':
//             filter.$and.push({ username: { $eq: body.username } });
//             break;
//         case 'share':
//             filter.$and.push({ share: { $eq: body.username } });
//             break;
//     }

//     if (body.path == '' || body.path) {
//         filter.$and.push({ path: body.path });
//     }

//     return filter;
// };

const genFilterCountSize = function (path, body) {
    let filter = {
        $and: [{ type: 'file' }, { $or: [{ isDelete: false }, { isDelete: null }, { isDelete: { $exists: false } }] }],
    };
    filter.$and.push(convertFilter(body.tab, body));
    // switch (feature) {
    //     case 'created':
    //         filter.$and.push({ username: { $eq: body.username } });
    //         break;
    //     case 'share':
    //         filter.$and.push({ share: { $eq: body.username } });
    //         break;
    // }

    if (path == '' || path) {
        filter.$and.push({ path: path });
    }

    return filter;
};

const genData = function (fields) {
    let result = {};
    result.version = fields.version;
    result.type = fields.type;
    result.department = fields.department;
    result.isGeneral = parseStringToBoolean(fields.isGeneral);
    result.project = fields.project;
    result.share = JSON.parse(fields.share);
    result.from_date = fields.from_date;
    result.last_update_date = fields.last_update_date;
    result.path = JSON.parse(fields.path);

    return result;
};

const parseStringToBoolean = function (str) {
    if (str.toLowerCase() === 'true') {
        return true;
    } else if (str.toLowerCase() === 'false') {
        return false;
    } else {
        throw new Error('Invalid boolean string');
    }
};

class FileController {
    constructor() {}

    load(body) {
        let count = countFilter(body);
        let filter = genFilter(body, count);
        return FileService.loadList(body._service[0].dbname_prefix, filter, body.top, body.offset, body.sort);
    }

    countSize(body) {
        let dfd = q.defer();
        let dfdArray = [];
        let data = body.data;
        for (var i in body.data) {
            let filter = genFilterCountSize(body.data[i].name, body);

            dfdArray.push(FileService.loadList(body._service[0].dbname_prefix, filter));
        }

        q.all(dfdArray).then(
            (res) => {
                let mergeArray = [];
                for (var i in res) {
                    mergeArray = [...mergeArray, ...res[i]];
                }
                data = data.map((item1) => {
                    var matchedItem = mergeArray.filter((item2) => item2.path.includes(item1.name));

                    if (matchedItem.length > 0) {
                        let count = 0;
                        for (var i in matchedItem) {
                            count += parseInt(matchedItem[i].size);
                        }
                        return { ...item1, size: count };
                    } else {
                        return item1;
                    }
                });
                dfd.resolve(data);
            },
            (err) => {
                dfd.reject(err);
            }
        );

        return dfd.promise;
    }

    download(body) {
        let dfd = q.defer();
        FileProvider.download(
            body._service[0].dbname_prefix +
                '/' +
                folderPath +
                '/' +
                body.value.nameLib +
                '/' +
                body.username +
                '/' +
                body.value.name
        ).then(
            (url) => {
                dfd.resolve(url);
                url = undefined;
            },
            (error) => {
                dfd.reject(error);
                error = undefined;
            }
        );
        return dfd.promise;
    }

    insert(body) {
        let dfd = q.defer();
        FileService.insert(
            body._service[0].dbname_prefix,
            body.username,
            body.name,
            body.size,
            body.version,
            body.type,
            body.department,
            body.isGeneral,
            body.project,
            body.share,
            body.value,
            body.from_date,
            body.last_update_date,
            body.path
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

    insert_file(req) {
        let dfd = q.defer();

        FileProvider.upload(req, nameLib, validation.insert, undefined, folderPath, req.body.username).then(
            function (res) {
                let data = genData(res.Fields);
                let value = [];
                if (res.fileInfo.file) {
                    for (let i in res.fileInfo.file) {
                        if (!res.fileInfo.file[i].huge) {
                            value.push({
                                timePath: res.fileInfo.file[i].timePath,
                                locate: res.fileInfo.file[i].type,
                                display: res.fileInfo.file[i].filename,
                                name: res.fileInfo.file[i].named,
                                nameLib,
                            });
                        }
                    }
                }

                FileService.insert_file(
                    req.body._service[0].dbname_prefix,
                    req.body.username,
                    data.version,
                    data.type,
                    data.department,
                    data.isGeneral,
                    data.project,
                    data.share,
                    value,
                    data.from_date,
                    data.last_update_date,
                    data.path,
                    res.Fields
                ).then(
                    function () {
                        dfd.resolve(true);
                    },
                    function (err) {
                        dfd.reject(err);
                    }
                );
            },
            function (err) {
                dfd.reject(err);
                err = undefined;
                req = undefined;
            }
        );

        return dfd.promise;
    }
    update(body) {
        let dfd = q.defer();
        if (body.type === 'file') {
            let updateVersionFile = updateVersion(body.version);

            let item = {
                name: body.name,
                'value.display': body.name,
                share: body.share,
                version: updateVersionFile,
                last_update_date: body.last_update_date,
                name_search: removeUnicode(body.name),
            };

            FileService.update(body._service[0].dbname_prefix, body.username, body._id, item).then(
                function () {
                    dfd.resolve(true);
                },
                function (err) {
                    dfd.reject(err);
                }
            );
        } else if (body.type === 'folder') {
            let dfdArray = [];
            let updateVersionFolder = updateVersion(body.version);
            let itemFolder = {
                name: body.name,
                share: body.share,
                version: updateVersionFolder,
                last_update_date: body.last_update_date,
                name_search: removeUnicode(body.name),
            };

            dfdArray.push(FileService.update(body._service[0].dbname_prefix, body.username, body._id, itemFolder));

            let filter = { $and: [convertFilter(body.tab, body), { path: { $eq: body.oldName } }] };

            FileService.loadList(body._service[0].dbname_prefix, filter).then(
                (res) => {
                    for (let i in res) {
                        let path = res[i].path;
                        let index = path.indexOf(body.oldName);
                        if (index >= 0) {
                            path[index] = body.name;
                        }
                        let itemFile = {
                            path: path,
                        };

                        if (body.share.length > 0) {
                            let itemShare = body.share;
                            itemFile.share = itemShare;
                        }

                        dfdArray.push(
                            FileService.update(body._service[0].dbname_prefix, res[i].username, res[i]._id, itemFile)
                        );
                    }

                    q.all(dfdArray).then(
                        (result) => {
                            dfd.resolve(true);
                            result = undefined;
                        },
                        (e) => {
                            dfd.reject(err);
                            e = undefined;
                        }
                    );
                },
                (err) => {
                    dfd.reject(err);
                    err = undefined;
                }
            );
        }

        return dfd.promise;
    }

    delete(body) {
        let dfd = q.defer();
        MongoDBProvider.load_onOffice(body._service[0].dbname_prefix, 'file', {
            $and: [{ _id: { $eq: new require('mongodb').ObjectID(body.id) } }, convertFilter(body.tab, body)],
        }).then(
            function (data) {
                // TODO: Handle Recoverfound after
                if (data[0]) {
                    if (data[0].type === 'file') {
                        FileService.delete(body._service[0].dbname_prefix, body.username, body.id, {
                            timePath: getCurrentDate(),
                            fullPath:
                                body._service[0].dbname_prefix +
                                '/' +
                                folderPath +
                                '/' +
                                data[0].value.nameLib +
                                '/' +
                                body.username +
                                '/' +
                                data[0].value.name,
                        }).then(
                            function () {
                                dfd.resolve(true);
                            },
                            function (err) {
                                dfd.reject(err);
                                err = undefined;
                            }
                        );
                    } else if (data[0].type === 'folder') {
                        let dfdArray = [];
                        dfdArray.push(FileService.delete(body._service[0].dbname_prefix, body.username, body.id, {}));
                        let filter = {
                            $and: [
                                convertFilter(body.tab, body),
                                { path: { $eq: data[0].name } },
                                { $or: [{ isDelete: false }, { isDelete: null }, { isDelete: { $exists: false } }] },
                            ],
                        };
                        MongoDBProvider.load_onOffice(body._service[0].dbname_prefix, 'file', filter).then(
                            (result) => {
                                if (result.length > 0) {
                                    for (var i in result) {
                                        dfdArray.push(
                                            FileService.delete(
                                                body._service[0].dbname_prefix,
                                                body.username,
                                                result[i]._id,
                                                {
                                                    timePath: getCurrentDate(),
                                                    fullPath:
                                                        body._service[0].dbname_prefix +
                                                        '/' +
                                                        folderPath +
                                                        '/' +
                                                        result[i].value.nameLib +
                                                        '/' +
                                                        body.username +
                                                        '/' +
                                                        result[i].value.name,
                                                }
                                            )
                                        );
                                    }
                                }
                                q.all(dfdArray).then(
                                    (data) => {
                                        dfd.resolve(true);
                                        data = undefined;
                                        result = undefined;
                                        data = undefined;
                                    },
                                    (err) => {
                                        dfd.reject(err);
                                        err = undefined;
                                        result = undefined;
                                        data = undefined;
                                    }
                                );
                            },
                            (error) => {
                                dfd.reject(error);
                                error = undefined;
                                data = undefined;
                            }
                        );
                    }
                } else {
                    dfd.reject({
                        path: 'FileService.delete.YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists',
                        mes: 'YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists',
                    });
                    data = undefined;
                }
            },
            function (err) {
                dfd.reject(err);
                err = undefined;
            }
        );
        return dfd.promise;
    }

    load_department(body) {
        let dfd = q.defer();
        let filter = { level: { $eq: 1 } };

        FileService.load_department(body._service[0].dbname_prefix, filter).then(
            function (data) {
                dfd.resolve(data);
            },
            function (err) {
                dfd.reject(err);
            }
        );

        return dfd.promise;
    }
}

exports.FileController = new FileController();
