const _ = require("lodash");
const q = require("q");
const mongodb = require("mongodb");

const { MongoDBProvider } = require("../../../shared/mongodb/db.provider");
const commonUtil = require("../../../utils/util");
const { isValidValue } = require("../../../utils/util");
const { LogProvider } = require("../../../shared/log_nohierarchy/log.provider");
const BaseError = require("../../../shared/error/BaseError");
const { LABEL_EVENT } = require("../../../utils/constant");

const LABEL_COLLECTION = "label";

function buildEntity(data, username) {
    const is_has_department = typeof data.is_has_department === "boolean" ? data.is_has_department : false;
    return {
        title: data.title,
        title_search: commonUtil.generateSearchText(data.title),
        parent_label: commonUtil.getValidValue(data.parent_label, null),
        is_has_department,
        departments: is_has_department ? data.departments : [],
        username,
    };
}

function buildSearchFilter({ search, department = [] }, options = {}) {
    const isIgnoreUnicodeChar = options.ignoreUnicodeChar === true;
    const isStrict = options.strict === true;
    const filterArr = [];
    if (isValidValue(search)) {
        if (isStrict) {
            const condition = { $or: [{ title: { $eq: search } }] };
            if (isIgnoreUnicodeChar) {
                condition.$or.push({
                    title_search: commonUtil.generateSearchText(search),
                });
            }
            filterArr.push(condition);
        } else {
            filterArr.push({
                $text: {
                    $search: `"${search}"` + !isIgnoreUnicodeChar ? ` "${commonUtil.generateSearchText(search)}"` : "",
                },
            });
        }
    }

    if (department && department.length > 0) {
        //TODO: Handle filter by department for label and sub-label
    }

    if (filterArr.length) {
        return {
            $and: filterArr,
        };
    }
    return {};
}

function groupLabel(dbPrefix, labels = []) {
    const dfd = q.defer();
    const parentLabelsMap = new Map();
    const childLabelMap = new Map();
    const missingParentIds = [];

    q.fcall(() => {
        for (const label of labels) {
            if (label.parent_label) {
                childLabelMap.set(label.parent_label, (childLabelMap.get(label.parent_label) || []).concat([label]));
            } else {
                parentLabelsMap.set(label._id.toString(), label);
            }
        }

        childLabelMap.forEach((val, key) => {
            if (!parentLabelsMap.has(key)) {
                missingParentIds.push(key);
            }
        });

        if (missingParentIds.length > 0) {
            return exports.LabelService.loadByIds(dbPrefix, null, missingParentIds);
        } else {
            return q.resolve([]);
        }
    })
        .then((parentLabels = []) => {
            for (const parentLabel of parentLabels) {
                parentLabelsMap.set(parentLabel._id.toString(), parentLabel);
            }
            parentLabelsMap.forEach((parentValue, parentKey) => {
                if (childLabelMap.has(parentKey)) {
                    Object.assign(parentValue, { child_labels: childLabelMap.get(parentKey) });
                }
            });
            dfd.resolve(Array.from(parentLabelsMap.values()));
        })
        .catch((error) => {
            LogProvider.error("Can not group label with reason: " + error.mes || error.message);
            dfd.reject(new BaseError(null, "GroupLabelFailed"));
        });

    return dfd.promise;
}

class LabelService {
    constructor() {}

    findByName(dbPrefix, text) {
        const dfd = q.defer();
        const filter = buildSearchFilter({ search: text }, { strict: true });
        MongoDBProvider.load_onOffice(dbPrefix, LABEL_COLLECTION, filter)
            .then((result) => {
                dfd.resolve(result);
            })
            .catch((error) => {
                dfd.reject(error);
            });
        return dfd.promise;
    }

    loadAll(dbPrefix, filter) {
        return MongoDBProvider.loadAggregate_onOffice(dbPrefix, LABEL_COLLECTION, filter)
    }

    loadByIds(dbPrefix, username, ids) {
        const dfd = q.defer();
        q.fcall(function () {
            if (!Array.isArray(ids) || ids.length === 0) {
                return dfd.reject({
                    path: "LabelService.loadByIds.err",
                    mes: "IdsMustBeArrayAndNotEmpty",
                });
            }
            const objectIds = ids
                .filter((item) => {
                    try {
                        new mongodb.ObjectId(item);
                        return true;
                    } catch (e) {
                        return false;
                    }
                })
                .map((item) => new mongodb.ObjectId(item));
            return {
                _id: {
                    $in: objectIds,
                },
            };
        })
            .then(function (filter) {
                return MongoDBProvider.load_onOffice(dbPrefix, LABEL_COLLECTION, filter);
            })
            .then(function (data) {
                if (!Array.isArray(data) || data.length === 0) {
                    return dfd.resolve([]);
                }
                dfd.resolve(data.sort((a, b) => ids.indexOf(a._id.toString()) - ids.indexOf(b._id.toString())));
            })
            .catch(function (error) {
                return dfd.reject({
                    path: "LabelService.loadByIds.err",
                    mes: "LoadByIdsFailed",
                });
            });
        return dfd.promise;
    }

    loadDetailById(dbPrefix, username, id) {
        const dfd = q.defer();
        q.fcall(function () {
            const filter = {
                _id: mongodb.ObjectId(id),
            };
            return q.resolve(filter);
        })
            .then(function (filter) {
                return MongoDBProvider.load_onOffice(dbPrefix, LABEL_COLLECTION, filter, 1);
            })
            .then(function (data) {
                if (!Array.isArray(data) || data.length === 0) {
                    dfd.resolve(null);
                } else {
                    dfd.resolve(data[0]);
                }
            })
            .catch(function (error) {
                dfd.reject({
                    path: "LabelService.loadDetailById.err",
                    mes: "GetLabelDetailFailed",
                });
            });
        return dfd.promise;
    }

    insert(dbPrefix, permissionCheck, username, body) {
        const dfd = q.defer();
        let entity;
        q.fcall(() => {
            entity = buildEntity(body, username);
            entity.event = [{ action: LABEL_EVENT.CREATED, username, time: new Date().getTime() }];
            return this.findByName(dbPrefix, entity.title);
        })
            .then((result) => {
                if (Array.isArray(result) && result.length > 0) {
                    LogProvider.error(
                        `Can not insert new label with reason: Duplicate label with name ${entity.title}`
                    );
                    throw new BaseError("LabelService.insert.findByName", "DuplicateLabelName");
                }

                if (!entity.parent_label) {
                    if (!permissionCheck.parent.check) {
                        throw new BaseError(null, "NotHavePermissionInsertParentLabel");
                    }

                    if (Array.isArray(permissionCheck.parent.department) && permissionCheck.parent.department.length > 0) {
                        const notAllowDepartment = _.difference(entity.departments, permissionCheck.parent.department);
                        if (notAllowDepartment.length > 0) {
                            throw new BaseError(null, "ParentLabelHaveNotAllowDepartment");
                        }
                    }
                }

                if (entity.parent_label) {
                    return this.loadDetailById(dbPrefix, username, entity.parent_label);
                } else {
                    return q.resolve(null);
                }
            })
            .then((result) => {
                if (entity.parent_label && !result) {
                    throw new BaseError(null, "NotFoundParentLabel");
                }

                if (entity.parent_label) {
                    if (!permissionCheck.child.check) {
                        throw new BaseError(null, "NotHavePermissionInsertChildLabel");
                    }

                    if (Array.isArray(permissionCheck.child.department) && permissionCheck.child.department.length > 0) {
                        const notAllowDepartment = _.difference(result.departments, permissionCheck.child.department);
                        if (notAllowDepartment.length > 0) {
                            throw new BaseError(null, "ChildLabelHaveNotAllowDepartment");
                        }
                    }
                }
                return MongoDBProvider.insert_onOffice(dbPrefix, LABEL_COLLECTION, username, entity);
            })
            .then((result) => {
                dfd.resolve(result.ops[0]);
            })
            .catch((error) => {
                if (error instanceof BaseError) {
                    dfd.reject(error);
                } else {
                    LogProvider.error("Process insert label failed with reason: " + error.message);
                    dfd.reject({
                        path: "LabelService.insert.err",
                        mes: "InsertLabelFailed",
                    });
                }
            });
        return dfd.promise;
    }

    update(dbPrefix, permissionCheck, username, body) {
        const dfd = q.defer();
        let filter;
        let currentLabel;
        let updatedEntity;
        let existingLabel;

        q.fcall(() => {
            filter = {
                _id: mongodb.ObjectId(body.id),
            };
            return MongoDBProvider.load_onOffice(dbPrefix, LABEL_COLLECTION, filter);
        })
            .then((result) => {
                if (!Array.isArray(result) || result.length === 0) {
                    throw new BaseError("LabelService.update", "LabelNotFound");
                }
                currentLabel = result[0];
                if (currentLabel.title === body.title) {
                    return q.resolve([]);
                } else {
                    return this.findByName(dbPrefix, body.title);
                }
            })
            .then((result) => {
                existingLabel = result;
                if (existingLabel.length > 0) {
                    LogProvider.error("Duplicate label with title: " + body.title);
                    throw new BaseError("LabelService.update", "DuplicateLabelTitle");
                }

                updatedEntity = buildEntity(body, username);

                if (!updatedEntity.parent_label) {
                    if (!permissionCheck.parent.check) {
                        throw new BaseError(null, "NotHavePermissionUpdateParentLabel");
                    }

                    if (
                        Array.isArray(permissionCheck.parent.department) &&
                        permissionCheck.parent.department.length > 0
                    ) {
                        const notAllowDepartment = _.difference(
                            updatedEntity.departments,
                            permissionCheck.parent.department
                        );
                        if (notAllowDepartment.length > 0) {
                            throw new BaseError(null, "ParentLabelHaveNotAllowDepartment");
                        }
                    }
                }

                if (updatedEntity.parent_label && existingLabel.parent_label !== updatedEntity.parent_label) {
                    return this.loadDetailById(dbPrefix, username, updatedEntity.parent_label);
                } else {
                    return q.resolve(null);
                }
            })
            .then((result) => {
                if (
                    updatedEntity.parent_label &&
                    existingLabel.parent_label !== updatedEntity.parent_label &&
                    !result
                ) {
                    throw new BaseError(null, "NotFoundParentLabel");
                }

                if (updatedEntity.parent_label) {
                    if (!permissionCheck.child.check) {
                        throw new BaseError(null, "NotHavePermissionUpdateChildLabel");
                    }

                    if (
                        Array.isArray(permissionCheck.child.department) &&
                        permissionCheck.child.department.length > 0
                    ) {
                        const notAllowDepartment = _.difference(
                            result.departments,
                            permissionCheck.child.department
                        );
                        if (notAllowDepartment.length > 0) {
                            throw new BaseError(null, "ChildLabelHaveNotAllowDepartment");
                        }
                    }
                }

                const updatedData = {
                    $set: updatedEntity,
                    $push: {
                        event: { action: LABEL_EVENT.UPDATED, username, time: new Date().getTime() },
                    },
                };
                return MongoDBProvider.update_onOffice(dbPrefix, LABEL_COLLECTION, username, filter, updatedData);
            })
            .then((result) => {
                dfd.resolve({
                    status: "success",
                    mes: "UpdateLabelSuccess",
                });
            })
            .catch((error) => {
                if (error instanceof BaseError) {
                    dfd.reject(error);
                } else {
                    LogProvider.error("Can not process update label with reason: " + error.message);
                    dfd.reject({
                        mes: "ProcessUpdateFailed",
                    });
                }
            });
        return dfd.promise;
    }
}

exports.LabelService = new LabelService();
