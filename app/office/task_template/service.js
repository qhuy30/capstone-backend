const q = require("q");
const mongodb = require("mongodb");
const moment = require("moment");

const BaseError = require("../../../shared/error/BaseError");

const { MongoDBProvider } = require("../../../shared/mongodb/db.provider");
const { LogProvider } = require("../../../shared/log_nohierarchy/log.provider");
const { removeUnicode } = require("../../../utils/util");

const filters = require("./filter");

const { TASK_TEMPLATE_STATUS, TASK_TEMPLATE_UPDATE_ACTION, HEAD_TASK_ORIGIN } = require("../../../utils/constant");
const { TaskService } = require("../task/service");
const { RingBellItemService } = require('../../management/ringbell_item/service');

const TASK_ACTION_STRATEGIES = {
    [TASK_TEMPLATE_UPDATE_ACTION.PAUSE]: handlePauseJob,
    [TASK_TEMPLATE_UPDATE_ACTION.RESUME]: handleResumeJob,
    [TASK_TEMPLATE_UPDATE_ACTION.CANCEL]: handleCancelJob,
};

function handlePauseJob(dbname_prefix, collection, username, data) {
    const dfd = q.defer();
    const { id, department } = data;
    q.fcall(() => {
        return exports.TaskTemplateService.getById(dbname_prefix, id);
    })
        .then((templates) => {
            if (TASK_TEMPLATE_STATUS.ACTIVE !== templates.status) {
                LogProvider.error("Can not pause job with template status: " + templates.status);
                throw new BaseError("TaskTemplateService.pauseJob.TemplateIsNotActive", "TemplateIsNotActive");
            }

            if (!department) {
                return MongoDBProvider.update_onOffice(
                    dbname_prefix,
                    collection,
                    username,
                    { _id: new mongodb.ObjectID(id) },
                    {
                        $set: {
                            status: TASK_TEMPLATE_STATUS.PAUSE,
                            "department.$[].tasks.$[i].status": TASK_TEMPLATE_STATUS.PAUSE,
                        },
                    },
                    {
                        arrayFilters: [{ "i.status": TASK_TEMPLATE_STATUS.ACTIVE }],
                    }
                );
            }

            let curDepartment = templates.department.find((dep) => dep.department_id === department);
            let task = curDepartment.tasks.find(
                (task) => task.id === curDepartment.latest_task_id && task.status === TASK_TEMPLATE_STATUS.ACTIVE
            );

            if (!task) {
                LogProvider.error("Can not pause job with department: " + department);
                throw new BaseError("TaskTemplateService.pauseJob.DepartmentIsNotActive", "DepartmentIsNotActive");
            }

            return MongoDBProvider.update_onOffice(
                dbname_prefix,
                collection,
                username,
                {
                    _id: new mongodb.ObjectID(id),
                    "department.department_id": department,
                    "department.tasks.id": task.id,
                },
                {
                    $set: {
                        "department.$[i].tasks.$[j].status": TASK_TEMPLATE_STATUS.PAUSE,
                    },
                },
                {
                    arrayFilters: [{ "i.department_id": department }, { "j.id": task.id }],
                }
            );
        })
        .then((result) => {
            dfd.resolve(result);
        })
        .catch((error) => {
            dfd.reject(error);
        });
    return dfd.promise;
}

function handleResumeJob(dbname_prefix, collection, username, data) {
    const dfd = q.defer();
    const { id, department, action } = data;
    q.fcall(() => {
        return exports.TaskTemplateService.getById(dbname_prefix, id);
    })
        .then((template) => {
            if (!department) {
                if (TASK_TEMPLATE_STATUS.PAUSE !== template.status) {
                    LogProvider.error("Can not resume job with template status: " + template.status);
                    throw new BaseError("TaskTemplateService.resumeJob.TemplateIsNotPause", "TemplateIsNotPause");
                }
                return MongoDBProvider.update_onOffice(
                    dbname_prefix,
                    collection,
                    username,
                    { _id: new mongodb.ObjectID(id) },
                    {
                        $set: {
                            status: TASK_TEMPLATE_STATUS.ACTIVE,
                            "department.$[].tasks.$[i].status": TASK_TEMPLATE_STATUS.ACTIVE,
                        },
                    },
                    {
                        arrayFilters: [{ "i.status": TASK_TEMPLATE_STATUS.PAUSE }],
                    }
                );
            } else {
                if (TASK_TEMPLATE_STATUS.ACTIVE !== template.status) {
                    LogProvider.error("Can not resume job with template status: " + template.status);
                    throw new BaseError("TaskTemplateService.resumeJob.TemplateIsNotActive", "TemplateIsNotActive");
                }

                let curDepartment = template.department.find((dep) => dep.department_id === department);
                let task = curDepartment.tasks.find(
                    (task) => task.id === curDepartment.latest_task_id && task.status === TASK_TEMPLATE_STATUS.PAUSE
                );

                if (!task) {
                    LogProvider.error("Can not resume job with department: " + department);
                    throw new BaseError("TaskTemplateService.resumeJob.DepartmentIsNotPause", "DepartmentIsNotPause");
                }

                return MongoDBProvider.update_onOffice(
                    dbname_prefix,
                    collection,
                    username,
                    {
                        _id: new mongodb.ObjectID(id),
                        "department.department_id": department,
                        "department.tasks.id": task.id,
                    },
                    {
                        $set: {
                            "department.$[i].tasks.$[j].status": TASK_TEMPLATE_STATUS.ACTIVE,
                        },
                    },
                    {
                        arrayFilters: [{ "i.department_id": department }, { "j.id": task.id }],
                    }
                );
            }
        })
        .then((result) => {
            dfd.resolve(result);
        })
        .catch((error) => {
            dfd.reject(error);
        });
    return dfd.promise;
}

function handleCancelJob(dbname_prefix, collection, username, data) {
    const dfd = q.defer();
    const { id, department } = data;
    q.fcall(() => {
        return exports.TaskTemplateService.getById(dbname_prefix, id);
    })
        .then((template) => {
            if (TASK_TEMPLATE_STATUS.CANCELLED === template.status) {
                LogProvider.error("Can not cancel job with template status: " + template.status);
                throw new BaseError("TaskTemplateService.cancelJob.TemplateIsCancelled", "TemplateIsCancelled");
            }

            if (!department) {
                return MongoDBProvider.update_onOffice(
                    dbname_prefix,
                    collection,
                    username,
                    { _id: new mongodb.ObjectID(id) },
                    {
                        $set: {
                            status: TASK_TEMPLATE_STATUS.CANCELLED,
                            "department.$[].tasks.$[i].status": TASK_TEMPLATE_STATUS.CANCELLED,
                        },
                    },
                    {
                        arrayFilters: [
                            { "i.status": { $in: [TASK_TEMPLATE_STATUS.ACTIVE, TASK_TEMPLATE_STATUS.PAUSE] } },
                        ],
                    }
                );
            }

            let curDepartment = template.department.find((dep) => dep.department_id === department);
            let task = curDepartment.tasks.find(
                (task) =>
                    task.id === curDepartment.latest_task_id &&
                    [TASK_TEMPLATE_STATUS.ACTIVE, TASK_TEMPLATE_STATUS.PAUSE].includes(task.status)
            );
            if (!task) {
                LogProvider.error("Can not cancel job with department: " + department);
                throw new BaseError("TaskTemplateService.cancelJob.DepartmentIsCancelled", "DepartmentIsCancelled");
            }

            return MongoDBProvider.update_onOffice(
                dbname_prefix,
                collection,
                username,
                {
                    _id: new mongodb.ObjectId(id),
                },
                {
                    $set: {
                        "department.$[i].tasks.$[j].status": TASK_TEMPLATE_STATUS.CANCELLED,
                    },
                },
                {
                    arrayFilters: [{ "i.department_id": department }, { "j.id": task.id }],
                }
            );
        })
        .then((result) => {
            dfd.resolve(result);
        })
        .catch((error) => {
            LogProvider.error("TaskTemplateService.cancelJob error:" + error.mes || error.message, error);
            dfd.reject(error);
        });
    return dfd.promise;
}

class TaskTemplateService {
    constructor() {
        this.collectionName = "task_template";
    }

    load(dbname_prefix, username, data) {
        const dfd = q.defer();

        let aggregationSteps = [];
        q.fcall(() => {
            filters.buildLoadAggregation(aggregationSteps, username, data);
            return MongoDBProvider.loadAggregate_onOffice(dbname_prefix, this.collectionName, aggregationSteps);
        })
            .then((result) => {
                if (!result.length) {
                    dfd.resolve([]);
                    return;
                }
                dfd.resolve(result);
            })
            .catch((error) => {
                LogProvider.error(
                    "Process load template failed with reason: " + error.err || error.mes || error.message
                );
                dfd.reject(
                    error instanceof BaseError
                        ? error
                        : new BaseError("TaskTemplateService.load.err", "ProcessLoadTemplateFailed")
                );
            });

        return dfd.promise;
    }

    count(dbname_prefix, username, data) {
        const dfd = q.defer();

        let aggregationSteps = [];
        q.fcall(() => {
            filters.buildCountAggregation(aggregationSteps, username, data);
            return MongoDBProvider.loadAggregate_onOffice(dbname_prefix, this.collectionName, aggregationSteps);
        })
            .then((result) => {
                if (!result.length) {
                    dfd.resolve({
                        total: 0,
                    });
                    return;
                }
                dfd.resolve(result[0]);
            })
            .catch((error) => {
                LogProvider.error(
                    "Process count template failed with reason: " + error.err || error.mes || error.message
                );
                dfd.reject(
                    error instanceof BaseError
                        ? error
                        : new BaseError("TaskTemplateService.count.err", "ProcessCountTemplateFailed")
                );
            });

        return dfd.promise;
    }

    loadDetail(dbname_prefix, username, data) {
        const dfd = q.defer();
        q.fcall(() => {
            const aggregationSteps = filters.buildLoadDetailAggregation([], username, data);
            return MongoDBProvider.loadAggregate_onOffice(dbname_prefix, this.collectionName, aggregationSteps);
        })
            .then((result) => {
                if (!result.length) {
                    dfd.reject({
                        path: "TaskTemplateService.loadDetail.DataIsNotExists",
                        mes: "DataIsNotExists",
                    });
                    return;
                }
                dfd.resolve(result[0]);
            })
            .catch((error) => {
                LogProvider.error(
                    "Process load template detail failed with reason: " + error.err || error.mes || error.message
                );
                dfd.reject(
                    error instanceof BaseError
                        ? error
                        : new BaseError("TaskTemplateService.loadDetail.err", "ProcessLoadTemplateDetailFailed")
                );
            });
        return dfd.promise;
    }

    insert(dbname_prefix, username, data) {
        let dfd = q.defer();
        const {
            title,
            department: listOfDepartmentId,
            priority,
            task_type,
            from_date,
            to_date,
            repetitive,
        } = data;

        let department = listOfDepartmentId.map((departmentId) => {
            return {
                department_id: departmentId,
                is_customized: false,
                latest_task_id: null,
                tasks: [],
            };
        });

        MongoDBProvider.insert_onOffice(dbname_prefix, this.collectionName, username, {
            username,
            title,
            title_search: removeUnicode(title),
            department,
            priority,
            task_type,
            from_date,
            to_date,
            repetitive,
            status: TASK_TEMPLATE_STATUS.ACTIVE,
        }).then((data) => {
            return this.getById(dbname_prefix, data.insertedId.toString());
        }).then((rootSeries) => {
            return this.repeatTasksByRootSeries(dbname_prefix, rootSeries);
        }).then(() => {
            dfd.resolve(true);
        }).catch(err => {
            dfd.reject(err);
            err = undefined;
        });
        return dfd.promise;
    }

    getById(dbname_prefix, id) {
        let dfd = q.defer();
        MongoDBProvider.load_onOffice(dbname_prefix, this.collectionName, {
            $and: [{ _id: { $eq: new mongodb.ObjectID(id) } }],
        })
            .then((data) => {
                if (data[0]) {
                    dfd.resolve(data[0]);
                } else {
                    dfd.reject({ path: "TaskTemplateService.update.DataIsNotExists", mes: "DataIsNotExists" });
                }
            })
            .catch((err) => {
                dfd.reject(err);
                err = undefined;
            });
        return dfd.promise;
    }

    update(dbname_prefix, username, id, template, data) {
        let dfd = q.defer();

        const {
            title,
            department: listOfDepartmentId,
            priority,
            task_type,
            from_date,
            to_date,
            repetitive,
        } = data;

        let department = listOfDepartmentId.map((departmentId) => {
            let foundDepartment = template.department.find(dep => dep.department_id === departmentId);
            if (foundDepartment) {
                return {
                    department_id: departmentId,
                    is_customized: false,
                    latest_task_id: foundDepartment.latest_task_id,
                    tasks: foundDepartment.tasks
                }
            } else {
                return {
                    department_id: departmentId,
                    is_customized: false,
                    latest_task_id: null,
                    tasks: []
                };
            }
        });

        const item = {
            title,
            department,
            priority,
            task_type,
            from_date,
            to_date,
            repetitive
        };

        MongoDBProvider.update_onOffice(
            dbname_prefix,
            this.collectionName,
            username,
            { _id: { $eq: new mongodb.ObjectID(id) } },
            {
                $set: item,
                $push: { event: { username, time: new Date().getTime(), action: "UpdatedInformation" } },
            }
        )
            .then(function (data) {
                dfd.resolve(true);
            })
            .catch((err) => {
                dfd.reject(err);
                err = undefined;
            });

        return dfd.promise;
    }

    getRepetitiveInformation(dbname_prefix, task) {
        let dfd = q.defer();
        MongoDBProvider.load_onOffice(dbname_prefix, this.collectionName, {
            $and: [{ _id: { $eq: new mongodb.ObjectID(task.task_template_id) } }],
        })
            .then((data) => {
                if (data[0]) {
                    return q.resolve(data[0].repetitive);
                } else {
                    return q.resolve(null);
                }
            }).then(repetitive => {
                Object.assign(task, { repetitive });
                dfd.resolve(task);
            })
            .catch((err) => {
                dfd.reject(err);
                err = undefined;
            });
        return dfd.promise;
    }

    setChildTaskCustomized(dbname_prefix, username, template_id, department_id, task_id) {
        let dfd = q.defer();
        MongoDBProvider.update_onOffice(
            dbname_prefix,
            this.collectionName,
            username,
            {
                _id: { $eq: new mongodb.ObjectID(template_id) },
                "department.department_id": department_id,
                "department.latest_task_id": task_id,
            },
            {
                $set: {
                    "department.$.is_customized": true,
                },
            }
        )
            .then(function (data) {
                dfd.resolve(true);
            })
            .catch((err) => {
                dfd.resolve(false);
            });
        return dfd.promise;
    }

    repeatTemplateTasks(dbname_prefix) {
        let dfd = q.defer();
        const date = new Date();

        MongoDBProvider.load_onOffice(dbname_prefix, this.collectionName, {
            status: TASK_TEMPLATE_STATUS.ACTIVE,
            $expr: {
                $gte: [{ $size: "$department" }, 1],
            },
            $or: [
                { "repetitive.expired_date": null },
                {
                    $expr: {
                        $gte: [
                            "$repetitive.expired_date",
                            { $toDouble: date },
                        ],
                    },
                },
            ]
        })
            .then((templates) => {
                let promises = [];
                if (templates && templates.length > 0) {
                    for (var i in templates) {
                        promises.push(this.repeatTasksByRootSeries(dbname_prefix, templates[i]))
                    }
                }

                return q.all(promises);
            })
            .then((listStatus) => {
                dfd.resolve(
                    listStatus.reduce(
                        (pre, cur) => {
                            if (cur) {
                                pre.total += cur.total;
                                pre.success += cur.success;
                                pre.failure += cur.failure;
                            }
                            return pre;
                        },
                        { total: 0, success: 0, failure: 0 }
                    )
                );
            })
            .catch((err) => {
                LogProvider.error(
                    "TaskTemplateService.repeatTemplateTasks error:" + err.mes ||
                    err.message,
                    err
                );
                dfd.reject(err);
            });

        return dfd.promise;
    }

    repeatTasksByRootSeries(dbname_prefix, rootSeries) {
        let dfd = q.defer();

        const rootTemplate = {
            username: rootSeries.username,
            title: rootSeries.title,
            priority: rootSeries.priority,
            task_type: rootSeries.task_type,
            from_date: rootSeries.from_date,
            to_date: rootSeries.to_date,
            level: "HeadTask",
            content: "",
            task_list: [],
            main_person: [],
            participant: [],
            observer: [],
            attachments: [],
            object: [],
            has_time: false,
            hours: 0,
            goals: null,
            head_task_id: null,
            reference: [],
            label: []
        }

        let promises = [];

        for (var i in rootSeries.department) {
            let childSeries = rootSeries.department[i];
            // For case has no child series -> 1st time repeat series;
            if (!childSeries.tasks || !childSeries.latest_task_id) {
                promises.push({ ...rootTemplate, department: childSeries.department_id });
                continue;
            }

            let latestChildStatus = childSeries.tasks.find(task => task.id === childSeries.latest_task_id);
            if (latestChildStatus.status !== TASK_TEMPLATE_STATUS.ACTIVE) {
                continue;
            } else {
                promises.push(TaskService.getById(dbname_prefix, childSeries.latest_task_id));
            }
        }

        q.all(promises).then((listChildSeries) => {
            let repetitivePromises = [];

            const {
                repetitive: {
                    per: repetitiveAmount,
                    cycle: repetitiveUnit
                }
            } = rootSeries;

            const isRepeatEligible = function (childSeries) {
                const curDate = moment().startOf("day");

                // Do NOT repeat tasks on Weekend
                const weekDay = curDate.utcOffset('+0700').isoWeekday();
                if (weekDay === 6 || weekDay == 7) {
                    return false;
                }

                // Repeat at the correct cycle
                let diff = curDate.diff(moment(childSeries.from_date), `${repetitiveUnit}s`);
                if (Number.isInteger(diff) && diff % repetitiveAmount == 0) {
                    return true;
                }

                // If the current day is Monday, repeat to compensate for the weekend
                if (weekDay == 1) {
                    let sunday = moment(curDate).utcOffset('+0700').subtract(1, 'day');
                    let saturday = moment(curDate).utcOffset('+0700').subtract(2, 'day');

                    let diffSunday = sunday.diff(childSeries.from_date, `${repetitiveUnit}s`);
                    let diffSaturday = saturday.diff(childSeries.from_date, `${repetitiveUnit}s`);
                    if ((Number.isInteger(diffSunday) && diffSunday % repetitiveAmount == 0) ||
                        (Number.isInteger(diffSaturday) && diffSaturday % repetitiveAmount == 0)) {
                        return true;
                    }
                }

                return false;
            };

            for (i in listChildSeries) {
                let childSeries = listChildSeries[i];

                // Check for case has repeated already
                if (childSeries._id && moment(childSeries.from_date).isSameOrAfter(moment().startOf('day'))) {
                    continue;
                }

                let seriesConfig = rootSeries.department.find(dep => dep.department_id = childSeries.department);
                if (childSeries._id && !seriesConfig.is_customized) {
                    childSeries.title = rootTemplate.title;
                    childSeries.priority = rootTemplate.priority;
                    childSeries.task_type = rootTemplate.task_type;
                    childSeries.from_date = rootTemplate.from_date;
                    childSeries.to_date = rootTemplate.to_date;
                }

                if (isRepeatEligible(childSeries)) {
                    repetitivePromises.push(
                        this.insertRepetitiveTask(dbname_prefix, childSeries, rootSeries, repetitiveAmount, repetitiveUnit)
                    )
                }
            }
            return repetitivePromises;
        }).then((listStatus) => {
            const total = listStatus.length;
            const success = listStatus.reduce((pre, cur) => (pre += cur ? 1 : 0), 0);
            const failure = listStatus.reduce((pre, cur) => (pre += cur ? 0 : 1), 0);
            LogProvider.info(
                `TaskTemplateService.repeatTasksByRootSeries for root series: ${rootSeries._id} with total: ${total}, success: ${success}, failure: ${failure}`);

            dfd.resolve({ total, success, failure });
        }).catch(err => {
            LogProvider.error(
                "TaskTemplateService.repeatTasksByRootSeries error:" + err.mes ||
                err.message,
                err
            );
            dfd.resolve(false);
        });
        return dfd.promise;
    }

    insertRepetitiveTask(dbname_prefix, template, rootSeries, repetitiveAmount, repetitiveUnit) {
        let dfd = q.defer();
        const date = new Date();

        // Get next from/to date
        const from_date = moment().utcOffset('+0700').startOf('day').toDate().getTime();
        const diff = Math.ceil(Math.abs(moment(template.to_date).diff(moment(template.from_date), 'days')));
        const to_date = moment().utcOffset('+0700').endOf('day').add(diff, 'day').toDate().getTime();

        TaskService.insert(
            dbname_prefix,
            template.username,
            template.priority,
            template.department,
            template.title,
            template.content,
            template.task_list,
            template.main_person,
            template.participant,
            template.observer,
            template.attachments,
            from_date,
            to_date,
            template.object,
            template.has_time,
            template.hours,
            template.task_type,
            null,
            template.goals,
            date,
            template.level,
            template.head_task_id,
            template.reference,
            template.label,
            rootSeries._id.toString(),
            HEAD_TASK_ORIGIN.OTHER
        ).then(res => {
            let usernameToNotify = [];
            usernameToNotify = usernameToNotify.concat(template.observer);
            usernameToNotify = usernameToNotify.concat(template.main_person);
            usernameToNotify = usernameToNotify.concat(template.participant);
            RingBellItemService.insert(
                dbname_prefix,
                template.username,
                'task_assigned',
                { taskCode: res.code, title: template.title, username_create_task: template.username },
                usernameToNotify,
                [],
                'createTask',
                date.getTime(),
            );

            let curDepartment = rootSeries.department.find(dep => dep.department_id === template.department);
            let tasks = (curDepartment.tasks || []).map(task => {
                if (task.id === curDepartment.latest_task_id) {
                    task.status = TASK_TEMPLATE_STATUS.END;
                }
                return task
            });

            tasks.push({
                id: res.idInserted,
                status: TASK_TEMPLATE_STATUS.ACTIVE
            })


            return MongoDBProvider.update_onOffice(dbname_prefix, this.collectionName, template.username,
                {
                    _id: { $eq: new mongodb.ObjectID(rootSeries._id) },
                    "department.department_id": template.department,
                },
                {
                    $set: {
                        "department.$.latest_task_id": idInserted,
                        "department.$.tasks": tasks
                    }
                });
        }).then(() => {
            dfd.resolve(true);
        }).catch(function (err) {
            LogProvider.error(`TaskTemplateService.repeatTasksByRootSeries for root series: ${rootSeries._id}, department: ${template.department} with error: ` + err.mes || err.message, err);
            dfd.resolve(false);
        });

        return dfd.promise;
    }

    updateJobStatus(dbname_prefix, username, data) {
        const dfd = q.defer();
        q.fcall(() => {
            const { action } = data;
            if (!TASK_ACTION_STRATEGIES[action]) {
                LogProvider.error("Can not update job with action: " + action);
                throw new BaseError("TaskTemplateService.updateJobStatus.InvalidAction", "InvalidAction");
            }
            return TASK_ACTION_STRATEGIES[action](dbname_prefix, this.collectionName, username, data);
        })
            .then((result) => {
                dfd.resolve({ success: true });
            })
            .catch((error) => {
                LogProvider.error(
                    "TaskTemplateService.updateJobStatus error:" + error.mes || error.message,
                    error
                );
                dfd.reject(error);
            });
        return dfd.promise;
    }

}

exports.TaskTemplateService = new TaskTemplateService();
