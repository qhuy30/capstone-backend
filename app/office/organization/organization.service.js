const q = require("q");
const { ObjectId } = require("mongodb");

const settings = require("../../../utils/setting");
const { MongoDBProvider } = require("../../../shared/mongodb/db.provider");
const { gcpProvider } = require("../../../shared/store/gcp/gcp.provider");
const { LogProvider } = require("../../../shared/log_nohierarchy/log.provider");
const BaseError = require("../../../shared/error/BaseError");

const { removeUnicode, generateSearchText } = require("../../../utils/util");
const { COMMON_EVENT } = require("../../../utils/constant");

const folderArray = ["management", "user"];
const collectionName = "organization";
const userCollection = "user";
function getUserInfo(dbname_prefix, id) {
    let dfd = q.defer();
    let dfdArr = [];
    MongoDBProvider.load_onManagement(dbname_prefix, "user", { department: { $eq: id } }).then((data) => {
        for (var i in data) {
            dfdArr.push(getImageForUser(dbname_prefix, data[i]));
        }

        q.all(dfdArr).then((dataResponse) => {
            dfd.resolve(dataResponse);
        }, (err) => {
            dfd.reject(err);
        });
    });

    return dfd.promise;
}

const getImageForUser = function (dbname_prefix, user) {
    if (user.avatar) {
        const dfd = q.defer();
        const folderPath = folderArray.join("/");
        const avatarURL = `${dbname_prefix}/${folderPath}/${user.avatar.nameLib}/${user.username}/${user.avatar.name}`;
        gcpProvider.getSignedUrl(avatarURL).then(
            (imgUrl) => {
                user.avatar.url = imgUrl;
                dfd.resolve(user);
            },
            (err) => {
                user.avatar.url = settings.adminDomain + "/datasources/images/default/avatar_default.png";
                dfd.resolve(user);
            },
        );

        return dfd.promise;
    } else {
        return q.resolve(user);
    }
};

const transformEntityToDto = function (user) {
    return {
        id: user._id,
        title: user.title,
        title_search: user.title_search,
        department: user.department,
        username: user.username,
        competence: user.competence,
        role: user.role,
    };
};

const buildGroupOrganizationFilter = function (filter = {}) {
    const conditions = [];
    if (filter.search) {
        conditions.push({
            $text: {
                $search: `"${filter.search}"`,
            },
        });
    }

    if (filter.id) {
        conditions.push({
            _id: new ObjectId(filter.id),
        });
    }

    if (typeof filter.isActive === "boolean") {
        conditions.push({
            isActive: filter.isActive,
        });
    }

    if (conditions.length > 0) {
        return {
            $and: conditions,
        };
    }

    return null;
};

class OrganizationService {
    constructor() { }

    loadAllDepartment(dbname_prefix, keys) {
        return MongoDBProvider.load_onOffice(dbname_prefix, collectionName, 
            {
                $and: [
                    { type: { $eq: "department" } },
                    { abbreviation: { $ne: "system" } }
                ]
            },
            undefined, undefined, { ordernumber: 1 }, keys
        );
    }

    load(dbname_prefix, filter) {
        let dfd = q.defer();
        MongoDBProvider.load_onOffice(dbname_prefix, collectionName,
            filter, undefined, undefined, { ordernumber: 1 },
        ).then(function (data) {

            if (data.length == 0) {
                dfd.resolve(data);
            } else {
                try {
                    let parentIdArray = [];
                    let thisFilter;
                    for (var i in data) {
                        parentIdArray.push(data[i].id);
                    }
                    thisFilter = { parent: { $in: parentIdArray } };
                    MongoDBProvider.load_onOffice(dbname_prefix, collectionName,
                        thisFilter,
                    ).then(function (childs) {
                        for (var i in data) {
                            for (var j in childs) {
                                if (childs[j].parent.indexOf(data[i].id) !== -1) {
                                    data[i].canExpand = true;
                                }
                            }
                        }
                        dfd.resolve(data);
                    }, function (err) {
                        dfd.reject(err);
                        err = undefined;
                    });
                } catch (error) {
                    console.log(error);
                }

            }
        }, function (err) {
            dfd.reject(err);
            err = undefined;
        });
        return dfd.promise;
    }

    justLoadNotHandleAnythingElse (dbname_prefix, filter){
        return MongoDBProvider.load_onOffice(dbname_prefix, collectionName,
            filter, undefined, undefined, { ordernumber: 1 },
        )
    }
    
    load_for_workflow(dbname_prefix, sessionDepartment, filter) {
        let dfd = q.defer();
        MongoDBProvider.load_onOffice(dbname_prefix, collectionName,
            filter, undefined, undefined, { ordernumber: 1 },
        ).then(function (data) {

            if (data.length == 0) {
                dfd.resolve(data);
            } else {
                try {
                    data = sessionDepartment ? data.filter(org => org.id === sessionDepartment) : data;

                    let parentIdArray = [];
                    let dfdAr = [];
                    for (var i in data) {
                        parentIdArray.push(data[i].id);
                    }
                    dfdAr.push(MongoDBProvider.load_onOffice(
                        dbname_prefix,
                        collectionName,
                        { parent: { $in: parentIdArray } },
                    ));
                    dfdAr.push(MongoDBProvider.load_onOffice(
                        dbname_prefix,
                        "workflow",
                        { department: { $in: parentIdArray } },
                    ));

                    q.all(dfdAr).then(function (res) {
                        let childs = res[0];
                        let wfs = res[1];
                        for (var i in data) {
                            for (var j in childs) {
                                if (childs[j].parent.indexOf(data[i].id) !== -1) {
                                    data[i].canExpand = true;
                                    break;
                                }
                            }

                            for (var j in wfs) {
                                if (wfs[j].department === data[i].id) {
                                    data[i].canExpand = true;
                                    break;
                                }
                            }
                        }

                        dfd.resolve({ departments: data, isFilteredWithUserRule: sessionDepartment ? true : false });
                    }, function (err) {
                        dfd.reject(err);
                        err = undefined;
                    });
                } catch (error) {
                    console.log(error);
                }

            }
        }, function (err) {
            dfd.reject(err);
            err = undefined;
        });
        return dfd.promise;
    }

    load_for_pick_user_directive(dbname_prefix, filter) {
        let dfd = q.defer();
        MongoDBProvider.load_onOffice(dbname_prefix, collectionName,
            filter, undefined, undefined, { ordernumber: 1 },
        ).then(function (data) {

            if (data.length == 0) {
                dfd.resolve(data);
            } else {
                try {
                    let parentIdArray = [];
                    let dfdAr = [];
                    for (var i in data) {
                        parentIdArray.push(data[i].id);
                    }
                    dfdAr.push(MongoDBProvider.load_onOffice(
                        dbname_prefix,
                        collectionName,
                        { parent: { $in: parentIdArray } },
                    ));
                    dfdAr.push(MongoDBProvider.load_onManagement(
                        dbname_prefix,
                        "user",
                        { department: { $in: parentIdArray } },
                    ));

                    q.all(dfdAr).then(function (res) {
                        let childs = res[0];
                        let users = res[1];
                        for (var i in data) {
                            for (var j in childs) {
                                if (childs[j].parent.indexOf(data[i].id) !== -1) {
                                    data[i].canExpand = true;
                                    break;
                                }
                            }

                            for (var j in users) {
                                if (users[j].department === data[i].id) {
                                    data[i].canExpand = true;
                                    break;
                                }
                            }
                        }

                        dfd.resolve(data);
                    }, function (err) {
                        dfd.reject(err);
                        err = undefined;
                    });
                } catch (error) {
                    console.log(error);
                }

            }
        }, function (err) {
            dfd.reject(err);
            err = undefined;
        });
        return dfd.promise;
    }

    loadDetails(dbname_prefix, id) {
        let dfd = q.defer();
        MongoDBProvider.load_onOffice(dbname_prefix, collectionName, {
            $or: [
                { id: { $eq: id } },
                {'title.en-US': { $eq: id }},
                {'title.vi-VN': { $eq: id }},
        ] }).then(function (data) {
            dfd.resolve(data[0] || {});
            data = undefined;
        }, function (err) {
            dfd.reject(err);
            err = undefined;
        });
        return dfd.promise;
    }

    loadDetailWithTasks(dbname_prefix, id, filter) {
        let dfd = q.defer();
        let dfdArr = [];

        dfdArr.push(MongoDBProvider.load_onOffice(
            dbname_prefix,
            "task",
            filter,
            undefined,
            undefined,
            { ordernumber: 1 },
        ));
        dfdArr.push(getUserInfo(dbname_prefix, id));

        q.all(dfdArr).then((data) => {
            let tasks = data[0];
            let users = data[1];
            let responseData = [];
            for (const user of users) {
                let fromDate;
                let toDate;
                let progress;
                const taskList = tasks.filter(task => task.participant && task.participant.includes(user.username));
                if (taskList.length > 0) {
                    let sum = 0;
                    fromDate = taskList[0].from_date;
                    for (const task of taskList) {
                        if (task.from_date < fromDate) {
                            fromDate = task.from_date;
                        }

                        sum += task.progress;
                    }

                    toDate = taskList[0].to_date;
                    for (const task of taskList) {
                        if (task.to_date > toDate) {
                            toDate = task.to_date;
                        }
                    }

                    progress = sum / taskList.length;
                } else {
                    fromDate = null;
                    toDate = null;
                    progress = null;
                }
                let taskDetail = {
                    _id: user._id,
                    username: user.title,
                    from_date: fromDate,
                    to_date: toDate,
                    task_list: taskList,
                    avatar: user.avatar.url,
                    progress,
                };
                responseData.push(taskDetail);
            }
            dfd.resolve(responseData);
            data = undefined;
            responseData = undefined;
            tasks = undefined;
            users = undefined;
        }, (err) => {
            dfd.reject(err);
            err = undefined;
        });

        return dfd.promise;
    }

    loadDetails_multi(dbname_prefix, id) {
        return MongoDBProvider.load_onOffice(dbname_prefix, collectionName,
            { id: { $in: id } },
        );
    }

    load_department_branch(dbname_prefix, filter) {
        let dfd = q.defer();
        MongoDBProvider.load_onOffice(dbname_prefix, collectionName,
            filter, undefined, undefined, { ordernumber: 1 },
        ).then(function (data) {
            let thisFilter;
            if (data.length == 0) {
                dfd.resolve(data);
            } else {
                if (data.length === 1) {
                    thisFilter = {
                        $and: [
                            {
                                $or: [
                                    { type: { $eq: "department" } },
                                    { type: { $eq: "branch" } },
                                ],
                            },
                            { parent: { $eq: data[0].id } },
                        ],
                    };
                } else {
                    thisFilter = {
                        $and: [
                            {
                                $or: [
                                    { type: { $eq: "department" } },
                                    { type: { $eq: "branch" } },
                                ],
                            },
                            {
                                $or: [],
                            },
                        ],
                    };
                    for (var i in data) {
                        thisFilter.$and[1].$or.push({ parent: { $eq: data[i].id } });
                    }
                }
                MongoDBProvider.load_onOffice(dbname_prefix, collectionName,
                    thisFilter, undefined, undefined, undefined, { parent: true },
                ).then(function (childs) {
                    for (var i in data) {
                        for (var j in childs) {
                            if (childs[j].parent.indexOf(data[i].id) !== -1) {
                                data[i].hasChild = true;
                            }
                        }
                    }
                    dfd.resolve(data);
                }, function (err) {
                    dfd.reject(err);
                    err = undefined;
                });
            }
        }, function (err) {
            dfd.reject(err);
            err = undefined;
        });
        return dfd.promise;
    }

    insert(dbname_prefix, username, ordernumber, title, icon, parent, level, isactive, abbreviation, leader, departmentLeader,type) {
        const dfd = q.defer();
        let d = new Date();

        this.getDepartmentByAbbreviation(dbname_prefix, abbreviation)
            .then((data) => {
                if (data) {
                    return dfd.reject({
                        path: "OrganizationService.insert.getDepartmentByAbbreviation",
                        mes: "AbbreviationIsExist",
                    });
                }
                return MongoDBProvider.insert_onOffice(
                    dbname_prefix,
                    collectionName,
                    username,
                    {
                        ordernumber,
                        title,
                        icon,
                        parent,
                        level,
                        isactive,
                        id: d.getTime().toString(),
                        type,
                        role: [],
                        competence: [],
                        title_search: removeUnicode(title["en-US"]),
                        abbreviation,
                        leader,
                        departmentLeader,
                        entity: {
                            abbreviationHis: [
                                {
                                    abbreviation,
                                    created: d.getTime(),
                                    createdby: username,
                                },
                            ],
                        },
                    },
                );
            })
            .then((data) => {
                dfd.resolve(data);
            })
            .catch((error) => {
                dfd.reject({
                    path:
                        error.path ||
                        "OrganizationService.insert.insert_onOffice",
                    mes: error.mes || "CanNotInsertDepartment",
                });
            });
        return dfd.promise;
    }

    update(dbname_prefix, username, id, ordernumber, title, icon, parent, level, isactive, abbreviation, leader, departmentLeader,type) {
        const dfd = q.defer();

        this.getDepartmentByAbbreviation(dbname_prefix, abbreviation)
            .then((data) => {
                if (data && data._id.toString() !== id) {
                    return dfd.reject({
                        path: "OrganizationService.update.getDepartmentByAbbreviation",
                        mes: "AbbreviationIsExist",
                    });
                }

                const pushObject = {};
                if (!data || data.abbreviation !== abbreviation) {
                    Object.assign(pushObject, {
                        "entity.abbreviationHis": {
                            abbreviation,
                            created: new Date().getTime(),
                            createdby: username,
                        },
                    });
                }

                return MongoDBProvider.update_onOffice(
                    dbname_prefix,
                    collectionName,
                    username,
                    { _id: { $eq: new require("mongodb").ObjectId(id) } },
                    {
                        $set: {
                            ordernumber,
                            title,
                            icon,
                            parent,
                            level,
                            isactive,
                            title_search: removeUnicode(title["en-US"]),
                            abbreviation,
                            leader,
                            departmentLeader,
                            type
                        },
                        $push: pushObject,
                    },
                );
            })
            .then((data) => {
                dfd.resolve(data);
            })
            .catch((error) => {
                dfd.reject({
                    path: error.path || "OrganizationService.update.update_onOffice",
                    mes: error.mes || "CanNotUpdateDepartment",
                });
            });
        return dfd.promise;
    }

    checkChild(dbname_prefix, id) {
        let dfd = q.defer();
        MongoDBProvider.load_onOffice(dbname_prefix, collectionName,
            { $and: [{ parent: { $eq: id } }, { status: { $eq: true } }] },
            undefined, undefined, undefined,
            { key: true },
        ).then(function (res) {
            if (res[0]) {
                dfd.reject({ path: "OrganizationService.checkChild.ChildIsActive", mes: "ChildIsActive" });
            } else {
                dfd.resolve(true);
            }
            res = undefined;
            dfd = undefined;
        }, function (err) {
            dfd.reject(err);
            err = undefined;
        });
        return dfd.promise;
    }

    delete(dbname_prefix, id, username) {
        let dfd = q.defer();
        let obj = new OrganizationService();
        obj.checkChild(dbname_prefix, id).then(function () {
            MongoDBProvider.delete_onOffice(dbname_prefix, collectionName, username,
                {
                    $and: [
                        {
                            $or: [
                                { _id: { $eq: new require("mongodb").ObjectID(id) } },
                                { parent: { $eq: id } },
                            ],
                        },
                        { isactive: { $eq: false } },
                    ],
                },
            ).then(function () {
                dfd.resolve(true);
                dfd = undefined;
            }, function (err) {
                dfd.reject(err);
                err = undefined;
            });
        }, function (err) {
            dfd.reject(err);
            err = undefined;
        });

        return dfd.promise;
    }

    loadAllEmployee(dbPrefix, departmentId) {
        const dfd = q.defer();
        const filter = {
            department: departmentId,
        };

        MongoDBProvider.load_onManagement(dbPrefix, "user", filter)
            .then((data) => {
                dfd.resolve(data.map(transformEntityToDto));
            })
            .catch((error) => {
                dfd.reject({
                    path: "OrganizationService.loadAllEmployee.load_onOffice",
                    mes: "Can not load employee",
                });
            });

        return dfd.promise;
    }

    loadMultipleEmployee(dbPrefix, body) {
        const dfd = q.defer();
        const filter = {};
        const conditions = [];
        if (body.department) {
            conditions.push({
                department: body.department,
            });
        }

        if (body.search) {
            conditions.push({
                $text: {
                    $search: `"${body.search}" "${generateSearchText(body.search)}"`,
                },
            });
        }
        if (conditions.length > 0) {
            filter.$and = conditions;
        }

        MongoDBProvider.load_onManagement(
            dbPrefix,
            "user",
            filter,
            parseInt(body.top) || null,
            parseInt(body.offset) || null,
        )
            .then((data) => {
                dfd.resolve(data.map(transformEntityToDto));
            })
            .catch((error) => {
                LogProvider.error("Can not load multiple employee with reason: " + error.mes || error.message || error);
                dfd.reject({
                    path: "OrganizationService.loadAllEmployee.load_onOffice",
                    mes: "Can not load employee",
                });
            });
        return dfd.promise;
    }

    getDepartmentByAbbreviation(dbPrefix, abbreviation) {
        const dfd = q.defer();
        MongoDBProvider.load_onOffice(dbPrefix, collectionName, {
            abbreviation,
        })
            .then(function (data) {
                dfd.resolve(data.length > 0 ? data[0] : null);
            })
            .catch(function (error) {
                return dfd.reject(error);
            });
        return dfd.promise;
    }

    loadLeaderInDepartment(dbPrefix, departmentId) {
        const dfd = q.defer();
        MongoDBProvider.getOne_onOffice(dbPrefix, collectionName, { id: departmentId }).then(function (departmenDetails) { 
            if(departmenDetails.departmentLeader){
                MongoDBProvider.getOne_onManagement(dbPrefix,userCollection,{username:departmenDetails.departmentLeader}).then(
                    function(userDetails){
                        dfd.resolve([userDetails]);
                    },function(err){
                        dfd.reject(err instanceof BaseError
                            ? err
                            : new BaseError("GroupOrganizationService.loadLeaderInDepartment.loadUserDetailsFailed", "loadUserDetailsFailed"));
                    }
                );
            }else{
                dfd.resolve([]);
            }
        }, function (err) {
            dfd.reject(err instanceof BaseError
                ? err
                : new BaseError("GroupOrganizationService.loadLeaderInDepartment.err", "ProcessloadLeaderInDepartmentFailed"));
        });
        return dfd.promise;
    }

}

class GroupOrganizationService {
    constructor() {
        this.collection = collectionName;
    }

    loadAll(dbNamePrefix, username, filter = {}) {
        const dfd = q.defer();
        q.fcall(() => {
            const condition = buildGroupOrganizationFilter(filter);
            let aggregationSteps = [];
            if (condition) {
                aggregationSteps.push({
                    $match: condition,
                });
            }
            if (Number.parseInt(filter.top) > 0) {
                aggregationSteps.push({ $limit: Number.parseInt(filter.top) });
            }

            if (Number.parseInt(filter.offset) >= 0) {
                aggregationSteps.push({ $skip: Number.parseInt(filter.offset) });
            }

            if (typeof filter.sort === "object" && Object.keys(filter.sort).length > 0) {
                aggregationSteps.push({ $sort: filter.sort });
            }

            return MongoDBProvider.loadAggregate_onOffice(dbNamePrefix, this.collection, aggregationSteps);
        })
            .then((result) => {
                dfd.resolve(result);
            })
            .catch((error) => {
                LogProvider.error("Can not process load all group with reason: " + error.mes || error.err || error.message);
                dfd.reject(
                    error instanceof BaseError
                        ? error
                        : new BaseError("GroupOrganizationService.loadAll.err", "ProcessLoadFailed"),
                );
            });
        return dfd.promise;
    }

    insertGroup(dbNamePrefix, username, { title, isActive, departments = [] }) {
        const dfd = q.defer();
        q.fcall(() => {
            const entity = {
                title,
                title_search: generateSearchText(title),
                departments: Array.from(new Set(departments)),
                isActive,
                event: [{
                    type: COMMON_EVENT.CREATED,
                    username,
                    time: new Date().getTime(),
                }],
            };
            return MongoDBProvider.insert_onOffice(dbNamePrefix, this.collection, username, entity);
        })
            .then((result) => {
                dfd.resolve(result.ops[0]);
            })
            .catch((error) => {
                dfd.reject(
                    error instanceof BaseError
                        ? error
                        : new BaseError("GroupOrganizationService.insertGroup.err", "ProcessInsertFailed"),
                );
            });
        return dfd.promise;
    }

    updateOrganizationsGroup(dbNamePrefix, username, id, { title, departments = [], isActive }) {
        const dfd = q.defer();
        let filter;
        q.fcall(() => {
            filter = buildGroupOrganizationFilter({ id });
            return MongoDBProvider.load_onOffice(dbNamePrefix, this.collection, filter);
        })
            .then((result) => {
                if (!Array.isArray(result) || result.length === 0) {
                    throw new BaseError("GroupOrganizationService.updateOrganizationsGroup", "NotFoundGroup");
                }
                const updatedData = {
                    $set: {
                        title,
                        title_search: generateSearchText(title),
                        departments: Array.from(new Set(departments)),
                        isActive,
                    },
                    $push: {
                        event: {
                            type: COMMON_EVENT.UPDATED,
                            username,
                            time: new Date().getTime(),
                        },
                    },
                };
                return MongoDBProvider.update_onOffice(dbNamePrefix, this.collection, username, filter, updatedData);
            })
            .then((result) => {
                dfd.resolve({
                    success: true,
                });
            })
            .catch((error) => {
                LogProvider.error("Can not process update group organizations with reason: " + error.mes ||
                    error.message);
                dfd.reject(
                    error instanceof BaseError
                        ? error
                        : new BaseError("GroupOrganizationService.updateOrganizationsGroup.err", "ProcessUpdateFailed"),
                );
            });
        return dfd.promise;
    }

    addOrganizationsIntoGroup(dbNamePrefix, username, id, departments = []) {
        const dfd = q.defer();
        let filter;
        q.fcall(() => {
            filter = {
                _id: new ObjectId,
            };
            return MongoDBProvider.load_onOffice(dbNamePrefix, this.collection, filter);
        })
            .then((result) => {
                if (!Array.isArray(result) || result.length === 0) {
                    throw new BaseError("GroupOrganizationService.addOrganizationsIntoGroup", "NotFoundGroup", 400);
                }
                const updateDate = {
                    $push: {
                        event: {
                            type: COMMON_EVENT.UPDATED,
                            username,
                            time: new Date().getTime(),
                        },
                    },
                    $addToSet: {
                        departments,
                    },
                };
                return MongoDBProvider.update_onOffice(dbNamePrefix, this.collection, username, updateDate);
            })
            .then((result) => {
                dfd.resolve({
                    success: true,
                });
            })
            .catch((error) => {
                LogProvider.error(
                    "Can not process add organizations into group  with reason: " + error.mes || error.message,
                );
                dfd.reject(
                    error instanceof BaseError
                        ? error
                        : new BaseError(
                            "GroupOrganizationService.addOrganizationsIntoGroup.err",
                            "ProcessAddOrganizationsIntoGroupFailed",
                        ),
                );
            });
        return dfd.promise;
    }

}

exports.OrganizationService = new OrganizationService();
exports.GroupOrganizationService = new GroupOrganizationService();
