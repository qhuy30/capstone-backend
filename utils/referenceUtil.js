const q = require("q");
const mongodb = require("mongodb");

const { MongoDBProvider } = require("@shared/mongodb/db.provider");
const { LogProvider } = require("@shared/log_nohierarchy/log.provider");
const { OBJECT_NAME } = require("@utils/referenceConstant");

const CONFIG_REFERENCES = {
    [OBJECT_NAME.DISPATCH_ARRIVED]: {
        dbName: "office",
        collection: "dispatch_arrived",
        isObjectId: true,
        idField: "_id",
        fieldName: {
            object: "dispatch_arrive",
            array: "dispatch_arrive",
        },
    },
    [OBJECT_NAME.PROJECT]: {
        dbName: "office",
        collection: "project",
        isObjectId: true,
        idField: "_id",
        fieldName: {
            object: "project",
            array: "projects",
        },
    },
    [OBJECT_NAME.TASK]: {
        dbName: "office",
        collection: "task",
        isObjectId: true,
        idField: "_id",
        fieldName: {
            object: "task",
            array: "tasks",
        },
    },
    [OBJECT_NAME.WORKFLOW_PLAY]: {
        dbName: "office",
        collection: "workflow_play",
        isObjectId: true,
        idField: "_id",
        fieldName: {
            object: "workflow_play",
            array: "workflow_plays",
        },
    },
    [OBJECT_NAME.OUTGOING_DISPATCH]: {
        dbName: "office",
        collection: "outgoing_dispatch",
        isObjectId: true,
        idField: "_id",
        fieldName: {
            object: "outgoing_dispatch",
            array: "outgoing_dispatches",
        },
    },
    [OBJECT_NAME.BRIEFCASE]: {
        dbName: "office",
        collection: "briefcase",
        isObjectId: true,
        idField: "_id",
        fieldName: {
            object: "briefcase",
            array: "briefcases",
        },
    },
    task: {
        dbName: "office",
        collection: "task",
        isObjectId: true,
        idField: "_id",
        fieldName: {
            object: "task",
            array: "tasks",
        },
    },
};


function loadDataFromParent(dbPrefix, parent) {
    const dfd = q.defer();
    q.fcall(() => {
        const config = CONFIG_REFERENCES[parent.object];
        const filter = {
            _id: new mongodb.ObjectId(parent.value),
        };
        return MongoDBProvider.load(dbPrefix, config.dbName, config.collection, filter, 1, 0);
    })
        .then((data) => {
            if (data.length) {
                return dfd.resolve(data[0]);
            }
            dfd.resolve(null);
        })
        .catch((err) => {
            dfd.resolve(null);
        });
    return dfd.promise;
}

function buildFilter(config, referenceItem) {
    switch (referenceItem.type) {
        case "object":
            return {
                [config.idField]: {
                    $eq: config.isObjectId ? new mongodb.ObjectId(referenceItem.value) : referenceItem.value,
                },
            };
        case "array":
            const values = referenceItem.value.map((value) => {
                return config.isObjectId ? new mongodb.ObjectId(value) : value;
            });
            return {
                [config.idField]: {
                    $in: values,
                },
            };
        default:
            return {};
    }
}

function resolveMapData(object, refType, fieldName, data) {
    switch (refType) {
        case "object":
            object[fieldName["object"]] = Array.isArray(data) && data.length > 0 ? data[0] : null;
            break;

        case "array":
            object[fieldName["array"]] = Array.isArray(data) ? data : [];
            break;

        default:
            LogProvider.info("Not support refType: " + refType);
            break;
    }
}

function resolveReference(dbPrefix, object, referenceItem) {
    const dfd = q.defer();
    let config = null;
    q.fcall(() => {
        const referenceObject = referenceItem.object;
        config = CONFIG_REFERENCES[referenceObject];

        if (!config) {
            LogProvider.error("Not found config for collection: " + referenceItem.collection);
            return dfd.resolve(undefined);
        }
        const filter = buildFilter(config, referenceItem);
        return MongoDBProvider.load(dbPrefix, config.dbName, config.collection, filter);
    })
        .then((data) => {
            resolveMapData(object, referenceItem.type, config.fieldName, data);
            dfd.resolve(object);
        })
        .catch((err) => {
            LogProvider.error("Error while resolve reference: " + err);
            dfd.resolve(object);
        });
    return dfd.promise;
}

function resolveReferences(dbPrefix, object, fieldName = "references") {
    const referenceItems = object[fieldName];
    if (!referenceItems || referenceItems.length === 0) {
        return object;
    }

    const dfd = q.defer();
    let promises = [];
    for (const referenceItem of referenceItems) {
        promises.push(resolveReference(dbPrefix, object, referenceItem));
    }

    q.all(promises)
        .then(() => {
            dfd.resolve(object);
        })
        .catch((err) => {
            LogProvider.error("Error while load references: " + err);
            dfd.resolve(object);
        });

    return dfd.promise;
}

function flattenReferenceAndRetrieveAdditionalFields(dbPrefix, referenceItem, retrieveFields = [], transformFields = []) {
    const dfd = q.defer();
    let config = null;
    q.fcall(() => {
        const referenceObject = referenceItem.object;
        config = CONFIG_REFERENCES[referenceObject];

        if (!config) {
            LogProvider.error("Not found config for collection: " + referenceItem.collection);
            return dfd.resolve(undefined);
        }
        const filter = buildFilter(config, referenceItem);
        return MongoDBProvider.load(dbPrefix, config.dbName, config.collection, filter);
    })
        .then((data) => {
            if (!data || data.length === 0) {
                return dfd.resolve(undefined);
            }

            let flattenData = [];

            if (referenceItem.type === "object") {
                const referenceData = data[0];
                for (const field of retrieveFields) {
                    referenceItem[field] = referenceData[field];
                }
                flattenData.push(referenceItem);
            } else if (referenceItem.type === "array") {
                for (const value of referenceItem.value) {
                    const referenceData = data.find((d) => d[config.idField] == value);
                    if (referenceData) {
                        let flattenReferenceData = {
                            ...referenceItem,
                            type: "object",
                            value
                        };
                        for (const field of retrieveFields) {
                            flattenReferenceData[field] = referenceData[field];
                        }
                        flattenData.push(flattenReferenceData);
                    }
                }
            }

            for (const field of transformFields) {
                flattenData = flattenData.map((item) => {
                    item[field.to] = item[field.from];
                    delete item[field.from];
                    return item;
                });
            }

            dfd.resolve(flattenData);
        })
        .catch((err) => {
            LogProvider.error("Error while flatten reference: " + err);
            dfd.resolve(undefined);
        });
    return dfd.promise;
}

function flattenReferencesAndRetrieveAdditionalFields(dbPrefix, object, fieldName = "references", retrieveFields = [], transformFields = []) {
    const referenceItems = object[fieldName];
    if (!referenceItems || referenceItems.length === 0) {
        return object;
    }

    const dfd = q.defer();
    let promises = [];
    for (const referenceItem of referenceItems) {
        promises.push(flattenReferenceAndRetrieveAdditionalFields(dbPrefix, referenceItem, retrieveFields, transformFields));
    }

    q.all(promises)
        .then((results) => {
            let flattenReferences = [];
            for (const result of results) {
                if (result) {
                    flattenReferences = flattenReferences.concat(result);
                }
            }
            object[fieldName] = flattenReferences;
            dfd.resolve(object);
        })
        .catch((err) => {
            LogProvider.error("Error while load references: " + err);
            dfd.resolve(object);
        });

    return dfd.promise;
}

function flattenReferencesAndRetrieveAdditionalFieldOfOGD(dbPrefix, object, fieldName = "references", retrieveFields = [], transformFields = []) {
    const referenceItems = object.outgoing_dispatch[fieldName];
    if (!referenceItems || referenceItems.length === 0) {
        return object;
    }

    const dfd = q.defer();
    let promises = [];
    for (const referenceItem of referenceItems) {
        if(!referenceItem.isDefault){
            promises.push(flattenReferenceAndRetrieveAdditionalFields(dbPrefix, referenceItem, retrieveFields, transformFields));
        } else {
            promises.push(referenceItem);
        }
    }

    q.all(promises)
        .then((results) => {
            let flattenReferences = [];
            for (const result of results) {
                if (result) {
                    flattenReferences = flattenReferences.concat(result);
                }
            }
            object.outgoing_dispatch[fieldName] = flattenReferences;
            dfd.resolve(object);
        })
        .catch((err) => {
            LogProvider.error("Error while load references: " + err);
            dfd.resolve(object);
        });

    return dfd.promise;
}


function flattenReferencesAndRetrieveAdditionalFieldsOfOGD(dbPrefix, object, fieldName = "references", retrieveFields = [], transformFields = []) {
    const referenceItems = object[fieldName];
    if (!referenceItems || referenceItems.length === 0) {
        return object;
    }

    const dfd = q.defer();
    let promises = [];
    for (const referenceItem of referenceItems) {
        if(!referenceItem.isDefault){
            promises.push(flattenReferenceAndRetrieveAdditionalFields(dbPrefix, referenceItem, retrieveFields, transformFields));
        } else {
            promises.push(referenceItem);
        }
    }

    q.all(promises)
        .then((results) => {
            let flattenReferences = [];
            for (const result of results) {
                if (result) {
                    flattenReferences = flattenReferences.concat(result);
                }
            }
            object[fieldName] = flattenReferences;
            dfd.resolve(object);
        })
        .catch((err) => {
            LogProvider.error("Error while load references: " + err);
            dfd.resolve(object);
        });

    return dfd.promise;
}



function resolveParents(dbPrefix, object) {
    let dfd = q.defer();
    dfd.resolve(object);
    return dfd.promise;
}

module.exports = {
    resolveReference,
    resolveReferences,
    resolveParents,
    flattenReferenceAndRetrieveAdditionalFields,
    flattenReferencesAndRetrieveAdditionalFields,
    flattenReferencesAndRetrieveAdditionalFieldOfOGD,
    flattenReferencesAndRetrieveAdditionalFieldsOfOGD
};
