const q = require("q");
const mongodb = require("mongodb");

const BaseError = require('../../../shared/error/BaseError');

const CommonUtils = require("@utils/util");

const { MongoDBProvider } = require("../../../shared/mongodb/db.provider");
const CodeUtil = require("../../../utils/codeUtil");
const filterBuilder = require("./filter");
const { LogProvider } = require("../../../shared/log_nohierarchy/log.provider");
const { TASK_LEVEL, OBD_STATUS } = require("@utils/constant");

const { TENANT_IDENTIFIER } = process.env;
const BRIEFCASE_CODE_PATTERN = `${TENANT_IDENTIFIER || "BHS"}.{day}.{month}.{year}.{briefcaseNumber}`;
const BRIEFCASE_SEQUENCE_NUMBER_KEY = () =>
    `briefcase_${new Date().getFullYear()}_${new Date().getMonth() + 1}_${new Date().getDate()}`;
const { resolveReferences, flattenReferencesAndRetrieveAdditionalFields } = require("../../../utils/referenceUtil.js");
const { DISPATCH_STATUS } = require("../outgoing_dispatch/const");
const { ARCHIVE_STATUS, ARCHIVE_EVENT } = require("./const");
const { v4: uuidv4 } = require('uuid');


const SELECTED_FIELDS = {
    _id: 1,
    title: 1,
    code: 1,
    id: 1,
};

function loadOutGoingDispatch(dbname_prefix, briefcase, reference) {
    const dfd = q.defer();
    exports.OutgoingDispatchService.loadDetail(dbname_prefix, null, reference.id)
        .then((result) => {
            Object.assign(reference, {
                detail: result,
            });
            dfd.resolve(briefcase);
        })
        .catch(dfd.reject);
    return dfd.promise;
}

function loadDispatchArrived(dbname_prefix, briefcase, reference) {
    const dfd = q.defer();
    exports.DispatchArrivedService.loadDetail(dbname_prefix, null, reference.id)
        .then((result) => {
            Object.assign(reference, {
                detail: result,
            });
            dfd.resolve(briefcase);
        })
        .catch(dfd.reject);
    return dfd.promise;
}

function loadReferences(dbname_prefix, briefcase, skipReferences = false) {
    if (skipReferences) {
        return q.resolve(briefcase);
    }
    const dfd = q.defer();
    const promises = [];
    for (const ref of briefcase.reference || []) {
        switch (ref.type) {
            case "OutgoingDispatch":
                promises.push(loadOutGoingDispatch(dbname_prefix, briefcase, ref));
                break;

            case "DispatchArrived":
                promises.push(loadDispatchArrived(dbname_prefix, briefcase, ref));
                break;
        }
    }

    q.all(promises)
        .then(() => {
            dfd.resolve(briefcase);
        })
        .catch(dfd.reject);

    return dfd.promise;
}

function searchArrivedDispatch(dbname_prefix, searchKey) {
    const dfd = q.defer();
    const filter = {
        $or: [{ code: { $regex: searchKey, $options: "i" } }, { title: { $regex: searchKey, $options: "i" } }],
    };
    MongoDBProvider.load_onOffice(dbname_prefix, "dispatch_arrived", filter, 1, 0, null, SELECTED_FIELDS)
        .then((dispatchArrived) => {
            dfd.resolve(dispatchArrived.map((dispatch) => Object.assign(dispatch, { object: "dispatch_arrived" })));
        })
        .catch((err) => {
            LogProvider.error("Load dispatch arrived by code failed with reason: " + err.mes || err.message);
            dfd.resolve([]);
        });
    return dfd.promise;
}

function searchOutgoingDispatch(dbname_prefix, searchKey) {
    const dfd = q.defer();
    const filter = {
        $or: [{ code: { $regex: searchKey, $options: "i" } }, { title: { $regex: searchKey, $options: "i" } }],
    };
    MongoDBProvider.load_onOffice(dbname_prefix, "outgoing_dispatch", filter, 1, 0, null, SELECTED_FIELDS)
        .then((outgoingDispatch) => {
            dfd.resolve(outgoingDispatch.map((dispatch) => Object.assign(dispatch, { object: "outgoing_dispatch" })));
        })
        .catch((err) => {
            LogProvider.error("Load outgoing dispatch by code failed with reason: " + err.mes || err.message);
            dfd.resolve([]);
        });
    return dfd.promise;
}

function searchProject(dbname_prefix, searchKey) {
    const dfd = q.defer();
    const filter = {
        $or: [{ code: { $regex: searchKey, $options: "i" } }, { title: { $regex: searchKey, $options: "i" } }],
    };
    MongoDBProvider.load_onOffice(dbname_prefix, "project", filter, 1, 0, null, SELECTED_FIELDS)
        .then((projects) => {
            dfd.resolve({
                object: "project",
                value: projects,
            });
        })
        .catch((err) => {
            LogProvider.error("Load outgoing dispatch by code failed with reason: " + err.mes || err.message);
            dfd.resolve([]);
        });
    return dfd.promise;
}

function searchHeadTask(dbname_prefix, searchKey) {
    const dfd = q.defer();
    const filter = {
        $and: [
            { level: { $eq: TASK_LEVEL.HEAD_TASK } },
            { $or: [{ code: { $regex: searchKey, $options: "i" } }, { title: { $regex: searchKey, $options: "i" } }] },
        ],
    };

    MongoDBProvider.load_onOffice(dbname_prefix, "task", filter, 1, 0, null, SELECTED_FIELDS)
        .then((tasks) => {
            dfd.resolve(tasks.map((task) => Object.assign(task, { object: "task" })));
        })
        .catch((err) => {
            LogProvider.error("Load task detail by code failed with reason: " + err.mes || err.message);
            dfd.resolve([]);
        });
    return dfd.promise;
}

function searchWorkflowPlay(dbname_prefix, keyword) {
    const dfd = q.defer();
    const filter = {
        $or: [{ code: { $regex: keyword, $options: "i" } }, { title: { $regex: keyword, $options: "i" } }],
    };
    MongoDBProvider.load_onOffice(dbname_prefix, "workflow_play", filter, 1, 0, null, SELECTED_FIELDS)
        .then((workflowPlays) => {
            dfd.resolve(workflowPlays.map((workflowPlay) => Object.assign(workflowPlay, { object: "workflow_play" })));
        })
        .catch((err) => {
            LogProvider.error("Load workflow play by code failed with reason: " + err.mes || err.message);
            dfd.resolve([]);
        });
    return dfd.promise;
}

function buildInsertEntity(dto) {
    return {
        title: dto.title,
        organ_id: dto.organ_id,
        outgoing_dispatch_id: dto.outgoing_dispatch_id,
        file_notation: dto.file_notation,
        maintenance_time: dto.maintenance_time,
        usage_mode: dto.usage_mode,
        language: dto.language,
        storage_name: dto.storage_name,
        storage_position: dto.storage_position,
        year: dto.year,
        description: dto.description,
        references: groupReferences(dto.references),
    };
}

function buildUpdateEntity(dto, briefcase) {
    return {
        title: dto.title,
        organ_id: dto.organ_id,
        file_notation: dto.file_notation,
        maintenance_time: dto.maintenance_time,
        usage_mode: dto.usage_mode,
        language: dto.language,
        storage_name: dto.storage_name,
        storage_position: dto.storage_position,
        year: dto.year,
        description: dto.description,
        references: groupReferences(dto.references),
    };
}

function buildUpdateReferencesEntity(dto) {
    return {
        references: groupReferences(dto.references)
    };
}

function groupReferences(references) {
    const result = {};

    for (const reference of references) {
        if (!result[reference.object]) {
            result[reference.object] = [];
        }
        result[reference.object].push(reference.id);
    }

    return Object.keys(result).map((key) => ({
        type: "array",
        object: key,
        value: result[key],
    }));
}

class BriefCaseService {
    constructor() {}

    executeAggregate(dbname_prefix, filter) {
        return MongoDBProvider.loadAggregate_onOffice(dbname_prefix, "briefcase", filter);
    }

    searchReferences(dbPrefix, username, searchKey) {
        const dfd = q.defer();
        q.fcall(() => {
            return q.all([
                searchArrivedDispatch(dbPrefix, searchKey),
                searchOutgoingDispatch(dbPrefix, searchKey),
                searchHeadTask(dbPrefix, searchKey),
                searchWorkflowPlay(dbPrefix, searchKey),
            ]);
        })
            .then((data) => {
                const results = [].concat(...data).map((result) => {
                    result.id = result._id;
                    result.title = CommonUtils.generateLocalizeTitle(result.title);
                    delete result._id;
                    return result;
                });
                dfd.resolve(results);
            })
            .catch((error) => {
                LogProvider.error("Can not search references with reason: " + error.mes || error.message);
                dfd.reject(new BaseError("BriefCaseService.searchReferences.err", "ProcessSearchReferencesFailed"));
            });

        return dfd.promise;
    }

    insert(dbname_prefix, username, body,parents,parent) {
        const dfd = q.defer();

        let entity = null;
        q.fcall(() => {
            if(Array.isArray(parents) && parents.length > 0) {
                const originReference = parents.map((parent) => ({
                        object: parent.object,
                        id: parent.id,
                    }));
                    if (Array.isArray(body.references)) {
                        body.references = body.references.concat(originReference);
                    } else {
                        body.references = originReference;
                    }
                }
                entity = buildInsertEntity(body);
                entity.parents = parents;
                entity.parent = parent;
                return MongoDBProvider.getAutoIncrementNumberDaily_onManagement(
                    dbname_prefix,
                    BRIEFCASE_SEQUENCE_NUMBER_KEY(),
                );
            })
                
            .then((briefcaseNumber) => {
                const d = new Date();
                const code = CodeUtil.resolvePattern(BRIEFCASE_CODE_PATTERN, {
                    day: String(d.getDate()).padStart(2, "0"),
                    month: String(d.getMonth() + 1).padStart(2, "0"),
                    year: d.getFullYear(),
                    briefcaseNumber: String(briefcaseNumber).padStart(3, "0"),
                });

                const event = {
                    id: uuidv4(),
                    action: ARCHIVE_EVENT.ARCHIVE,
                    time: new Date().getTime(),
                    username: username,
                    department: body.session.department,
                }


                Object.assign(entity, {
                    code,
                });

                entity.status = ARCHIVE_STATUS.ARCHIVED;

                const dataUpdate ={
                    $set: { ...entity },
                    $push: { event: event },
                }

                return MongoDBProvider.update_onOffice(
                    dbname_prefix,
                    "briefcase",
                    username,
                    { _id: new mongodb.ObjectID(body.id)}, dataUpdate
                );
            })
            .then((result) => {
                dfd.resolve(result);
            })
            .catch((err) => {
                dfd.reject(err);
            });

        return dfd.promise;
    }

    insert_waiting_additional_document(dbname_prefix, username, entity){
        const {
            title,
            odb_id,
            odb_code,
            status = ARCHIVE_STATUS.WAITING_ADDITIONAL_DOCUMENT,
            event,
            parents
        } = entity;

        return MongoDBProvider.insert_onOffice(dbname_prefix, "briefcase", username,
            {
                title,
                odb_id,
                odb_code,
                status,
                event:[event],
                username,
                parents,
                time: new Date().getTime(),
            }
        );
    }

    update_addtional_document(dbname_prefix, username, id, event, attachments){
        return MongoDBProvider.update_onOffice(
            dbname_prefix,
            "briefcase",
            username,
            { _id: { $eq: require("mongodb").ObjectID(id) } },
            {
                $set: {addtional_documents: attachments, status: ARCHIVE_STATUS.WAITING_STORAGE},
                $push: {
                    event: event,
                },
            },
        );
    }

  getById(dbname_prefix, username, briefcaseId) {
    const dfd = q.defer();
    MongoDBProvider.load_onOffice(dbname_prefix, "briefcase", {
      _id: { $eq: new require("mongodb").ObjectID(briefcaseId) },
    })
      .then((data) => {
        if (data) {
          dfd.resolve(data[0]);
        }
      })
      .catch((err) => {
        dfd.reject({
          path: "BriefCaseService.getById.err",
          mes: "Process load briefcase by Id error",
        });
      });
    return dfd.promise;
  }

  getByWorkflowPlayId(dbname_prefix, username, workflowPlayId) {
    const dfd = q.defer();
    MongoDBProvider.load_onOffice(dbname_prefix, "task", {
      workflowPlay_id: { $eq: workflowPlayId },
    })
      .then((tasks) => {
        if (tasks[0] && tasks[0].reference) {
          let dispatchArrived = tasks[0].reference.find(
            (ref) => ref.object == "DispatchArrived"
          );
          if (dispatchArrived) {
            MongoDBProvider.load_onOffice(dbname_prefix, "briefcase", {
              reference: {
                $elemMatch: {
                  type: "DispatchArrived",
                  id: dispatchArrived.id,
                },
              },
            })
              .then((briefcases) => {
                dfd.resolve(briefcases[0]);
              })
              .catch((err) => {
                dfd.reject({
                  path: "BriefCaseService.getByWorkflowPlayId.err",
                  mes: "Process load briefcase by Workflow Play Id error",
                });
              });
          } else {
            dfd.resolve(null);
          }
        } else {
          dfd.resolve(null);
        }
      })
      .catch((err) => {
        dfd.reject({
          path: "BriefCaseService.getByWorkflowPlayId.err",
          mes: "Process load task by Workflow Play Id error",
        });
      });

    return dfd.promise;
  }

  addReference(dbname_prefix, username, briefcaseId, reference) {
    const dfd = q.defer();
    MongoDBProvider.load_onOffice(dbname_prefix, "briefcase", {
      _id: { $eq: new require("mongodb").ObjectID(briefcaseId) },
    }).then(
      function (briefcase) {
        if (briefcase[0]) {
          let curCode = briefcase[0].code;
          let rest = curCode.substring(0, curCode.lastIndexOf(".") + 1);
          let orderNumber = curCode.substring(curCode.lastIndexOf(".") + 1, curCode.length);
          let newCode = rest + String(parseInt(orderNumber) + 1).padStart(2, "0");

          MongoDBProvider.update_onOffice(
            dbname_prefix,
            "briefcase",
            username,
            { _id: { $eq: new require("mongodb").ObjectID(briefcaseId) } },
            {
              $push: { reference: reference },
              $set: { code: newCode }
            }
          )
            .then(() => {
              dfd.resolve(true);
            })
            .catch((err) => {
              dfd.reject(err);
            });
        } else {
          dfd.reject({
            path: "BriefCaseService.addReference.DataIsNotExists",
            mes: "DataIsNotExists",
          });
        }
      },
      function (err) {
        dfd.reject(err);
        err = undefined;
      }
    );
    return dfd.promise;
  }

    loadAll(dbname_prefix, username, filter = {}) {
        const dfd = q.defer();
        const aggregations = filterBuilder.generateSearchAggregation(filter);
        MongoDBProvider.loadAggregate_onOffice(dbname_prefix, "briefcase", aggregations)
            .then((data) => {
                let promises = [];
                if (data && data.length > 0) {
                    const retrieveFields = ["code"];
                    const transformFields = [{ from: "value", to: "id" }];
                    for (const briefcase of data) {
                        promises.push(flattenReferencesAndRetrieveAdditionalFields(dbname_prefix, briefcase, "references", retrieveFields, transformFields));
                    }
                }
                return q.all(promises);
            }).then((result) => dfd.resolve(result))
            .catch(error => {
                LogProvider.error("Can not load briefcase with reason: " + error.mes || error.message);
                dfd.reject(new BaseError("BriefCaseService.loadAll.err", "ProcessLoadBriefCaseFailed"));
            });
        return dfd.promise;
    }

    loadDetail(dbname_prefix, username, body) {
        const dfd = q.defer();
        let filter = {};
        q.fcall(() => {
            if (body.id) {
                filter = { _id: new mongodb.ObjectId(body.id) };
            } else if (body.code) {
                body.code = decodeURIComponent(body.code);
                filter = {
                    code: {
                        $regex: body.code,
                        $options: "i",
                    },
                };
            } else {
                throw new BaseError("BriefCaseService.loadDetail.err", "IdOrCodeIsRequired");
            }
        })
            .then(() => {
                return MongoDBProvider.load_onOffice(dbname_prefix, "briefcase", filter);
            })
            .then((result) => {
                if (!Array.isArray(result) || result.length === 0) {
                    throw BaseError.notFound("BriefCaseService.loadDetail.err");
                }

                if (body.skipReferences || body.cancelled_at) {
                    return result[0];
                }

                const retrieveFields = ["code", "title"];
                const transformFields = [{ from: "value", to: "id" }];
                return flattenReferencesAndRetrieveAdditionalFields(dbname_prefix, result[0], "references", retrieveFields, transformFields);
            })
            .then((detail) => {
                dfd.resolve(detail);
            })
            .catch((error) => {
                LogProvider.error("Could not load detail with reason: " + error.mes || error.message);
                dfd.reject(
                    error instanceof BaseError
                        ? error
                        : new BaseError("BriefCaseService.loadAll.err", "ProcessLoadDetailFailed"),
                );
            });
        return dfd.promise;
    }

  generatePreviewCode(dbname_prefix) {
      const dfd = q.defer();
      MongoDBProvider.load_onManagement(dbname_prefix, "sequenceid", {
          name: BRIEFCASE_SEQUENCE_NUMBER_KEY(),
      })
          .then((sequences) => {
              let number = 1;
              if (sequences[0]) {
                  number = sequences[0].value + 1;
              }
              const d = new Date();
              const code = CodeUtil.resolvePattern(BRIEFCASE_CODE_PATTERN, {
                  day: String(d.getDate()).padStart(2, "0"),
                  month: String(d.getMonth() + 1).padStart(2, "0"),
                  year: d.getFullYear(),
                  briefcaseNumber: String(number).padStart(3, "0"),
              });
              dfd.resolve(code);
          })
          .catch((err) => dfd.resolve(null));

      return dfd.promise;
  }

    update(dbname_prefix, username, body) {
        const dfd = q.defer();

        let entity = null;
        q.fcall(() => {
            return this.loadDetail(dbname_prefix, username, body);
        })
            .then((briefcase) => {
                if (briefcase.cancelled_at) {
                    dfd.reject(new BaseError("BriefCaseService.update.CanNotUpdateBriefCaseCancelled", "CanNotUpdateBriefCaseCancelled"));
                }
                entity = buildUpdateEntity(body, briefcase);
            }).then(() => {
                return MongoDBProvider.update_onOffice(dbname_prefix, "briefcase", username,
                    {
                        _id: new mongodb.ObjectId(body.id),
                    },
                    {
                        $set: entity,
                    }
                );
            }).then((result) => {
                dfd.resolve(true);
            })
            .catch((err) => {
                dfd.reject(err);
            });

        return dfd.promise;
    }

    updateReferences(dbname_prefix, username, body) {
        const dfd = q.defer();

        let entity = null;
        q.fcall(() => {
            return this.loadDetail(dbname_prefix, username, body);
        })
            .then((briefcase) => {
                if (briefcase.cancelled_at) {
                    dfd.reject(new BaseError("BriefCaseService.update.CanNotUpdateBriefCaseCancelled", "CanNotUpdateBriefCaseCancelled"));
                }
                entity = buildUpdateReferencesEntity(body);
            }).then(() => {
                return MongoDBProvider.update_onOffice(dbname_prefix, "briefcase", username,
                    {
                        _id: new mongodb.ObjectId(body.id),
                    },
                    {
                        $set: entity,
                    }
                );
            }).then((result) => {
                dfd.resolve(true);
            })
            .catch((err) => {
                dfd.reject(err);
            });

        return dfd.promise;
    }

    cancel(dbname_prefix, username, body) {
        const dfd = q.defer();
        const date = new Date();
        q.fcall(() => {
            return MongoDBProvider.update_onOffice(dbname_prefix, "briefcase", username,
                {
                    _id: new mongodb.ObjectId(body.id),
                },
                {
                    $set: { cancelled_at: date.getTime(), cancelled_by: username, cancelled_reason: body.reason},
                }
            );
        }).then((result) => {
            dfd.resolve(true);
        }).catch((err) => {
            dfd.reject(err);
        });

        return dfd.promise;
    }

}

class OutgoingDispatchService {
    constructor() {
        this.collection = "outgoing_dispatch";
    }

    saveBriefCase(dbname_prefix, username, id) {
        const dfd = q.defer();
        q.fcall(() => {
            return MongoDBProvider.update_onOffice(
                dbname_prefix,
                'waiting_archive',
                username,
                {
                    _id: new mongodb.ObjectId(id),
                    status: DISPATCH_STATUS.WAITING_FOR_SRORAGE,
                },
                { $set: { status: DISPATCH_STATUS.SAVE_BRIEFCASE } },
            );
        })
            .then((result) => {
                dfd.resolve(result);
            })
            .catch((err) => {
                LogProvider.error("Could not save briefcase with reason: " + err.mes || err.message);
                dfd.reject(new BaseError("OutgoingDispatchService.saveBriefCase.err", "ProcessSaveBriefCaseFailed"));
            });
        return dfd.promise;
    }

    loadDetail(dbname_prefix, username, id) {
        const dfd = q.defer();
        let filter;
        q.fcall(() => {
            filter = {
                _id: new mongodb.ObjectId(id),
            };
        })
            .then(() => {
                return MongoDBProvider.load_onOffice(dbname_prefix, this.collection, filter);
            })
            .then((result) => {
                if (!Array.isArray(result) || result.length === 0) {
                    dfd.resolve(null);
                } else {
                    dfd.resolve(result[0]);
                }
            })
            .catch((error) => {
                LogProvider.error("Could not load outgoing dispatch with reason: " + error.mes || error.message);
                dfd.reject(
                    new BaseError("OutgoingDispatchService.loadDetail.err", "ProcessLoadOutGoingDispatchFailed"),
                );
            });
        return dfd.promise;
    }

    loadDetail_waiting_archive(dbname_prefix, username, id) {
        const dfd = q.defer();
        let filter;
        q.fcall(() => {
            filter = {
                _id: new mongodb.ObjectId(id),
            };
        })
            .then(() => {
                return MongoDBProvider.load_onOffice(dbname_prefix, 'waiting_archive', filter);
            })
            .then((result) => {
                if (!Array.isArray(result) || result.length === 0) {
                    dfd.resolve(null);
                } else {
                    dfd.resolve(result[0]);
                }
            })
            .catch((error) => {
                LogProvider.error("Could not load outgoing dispatch with reason: " + error.mes || error.message);
                dfd.reject(
                    new BaseError("OutgoingDispatchService.loadDetail.err", "ProcessLoadOutGoingDispatchFailed"),
                );
            });
        return dfd.promise;
    }
}

class DispatchArrivedService {
    constructor() {
        this.collection = "dispatch_arrived";
    }

    loadDetail(dbname_prefix, username, id) {
        const dfd = q.defer();
        let filter;
        q.fcall(() => {
            filter = {
                _id: new mongodb.ObjectId(id),
            };
        })
            .then(() => {
                return MongoDBProvider.load_onOffice(dbname_prefix, this.collection, filter);
            })
            .then((result) => {
                if (!Array.isArray(result) || result.length === 0) {
                    dfd.resolve(null);
                } else {
                    dfd.resolve(result[0]);
                }
            })
            .then(dfd.resolve)
            .catch(error => {
                LogProvider.error("Could not load dispatch arrived with reason: " + error.mes || error.message);
                dfd.reject(new BaseError("DispatchArrivedService.loadDetail.err", "ProcessLoadDispatchArrivedFailed"));
            });
        return dfd.promise;
    }

}

exports.BriefCaseService = new BriefCaseService();
exports.OutgoingDispatchService = new OutgoingDispatchService();
exports.DispatchArrivedService = new DispatchArrivedService();
