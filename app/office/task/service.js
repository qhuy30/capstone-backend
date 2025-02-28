const q = require("q");
const mongodb = require("mongodb");
const moment = require("moment");
const _ = require("lodash");
const { v4: uuidv4 } = require('uuid');
const { ObjectId } = require("mongodb");

const BaseError = require('@shared/error/BaseError');

const { MongoDBProvider } = require('../../../shared/mongodb/db.provider');
const { SocketProvider } = require('./../../../shared/socket/provider');
const { StoreConst } = require('../../../shared/store/gcp/store.const');

const { removeUnicode, NumberToStringForDate, isValidValue } = require('../../../utils/util');
const CodeUtil = require('../../../utils/codeUtil');
const taskFilterUtil = require('../../../utils/taskFilterUtil');

const TASK_CODE_PATTERN = '{code}-{taskNumber}';
const TASK_CODE_ORIGIN_PATTERN = '{year}-{origin}-{departmentOrderNumber}-{taskNumber}';
const TASK_DISPATCH_ARRIVED_CODE_PATTERN = '{year}-1-{departmentOrderNumber}-{taskNumber}';
const TASK_DEPARTMENT_SEQUENCE_NUMBER_KEY = (department_code,source_id) => `${new Date().getFullYear()}_${source_id}_${department_code}`;
const TASK_SEQUENCE_NUMBER_KEY = (project_code) => `${new Date().getFullYear()}_5_${project_code}`;
const TASK_DISPATCH_ARRIVED_NUMBER_KEY = (department_code) => `${new Date().getFullYear()}_1_${department_code}`;
const WORK_ITEM_SEQUENCE_NUMBER_KEY = () => `work_item_${new Date().getFullYear()}`;
const {
    CUSTOM_TEMPLATE_TAG_TYPE,
    TRANSFER_TICKET_TEMPLATE_CONFIG,
    TASK_LEVEL,
    TASK_STATUS,
    TASK_EVENT,
    TASK_PRIORITY,
    TASK_COMMENT_TYPE,
    HEAD_TASK_ORIGIN,
    TASK_RULE,
} = require("@utils/constant");

const templateUtil = require("../../../utils/templateUtil");
const path = require("path");
const { FileProvider } = require("../../../shared/file/file.provider");
const DocumentTemplate = require("../../../shared/docxtemplater/DocumentTemplate");
const { LogProvider } = require("../../../shared/log_nohierarchy/log.provider");
const { RingBellItemService } = require("../../management/ringbell_item/service");
const { FileConst } = require("../../../shared/file/file.const");
const { gcpProvider } = require("../../../shared/store/gcp/gcp.provider");
const settings = require("../../../utils/setting");
const { WorkflowPlayService: WFPService } = require("@office/workflow_play/service");

const { OBJECT_NAME } = require("@utils/referenceConstant");
const { object } = require("joi");
const { dbname_prefix, _id } = require("@shared/multi_tenant/pnt-tenant");

const STATISTIC_COUNT_DEFAULT_VAL = {
    completed: 0,
    process: 0,
    not_start: 0,
    cancelled: 0,
    pending_approval: 0,
    done: 0,
    all: 0,
    not_seen: 0,
    waitting: 0,
    waiting_receive: 0
};

const STATISTIC_GROW_DEFAULT_VAL = {
    created: 0,
    completed: 0,
};

function checkPermissionForTaskOfDepartment(user, departmentId) {
    let isUserHaveRule = false;
    const createTaskDepartmentRule = user.rule.find((rule) => rule.rule === 'Office.Task.Create_Task_Department');
    if (createTaskDepartmentRule) {
        switch (createTaskDepartmentRule.details.type) {
            case 'Working':
                isUserHaveRule = user.department === departmentId;
                break;
            case 'All':
                isUserHaveRule = true;
                break;
            case 'Specific':
                isUserHaveRule = createTaskDepartmentRule.details.department.includes(departmentId);
                break;
        }
    }
    return isUserHaveRule;
}

function checkPermissionForTaskOfProject(user, project) {
    let isUserHaveRule = false;
    const createTaskProjectRule = user.rule.find((rule) => rule.rule === 'Office.Task.Create_Task_Project');
    if (createTaskProjectRule) {
        switch (createTaskProjectRule.details.type) {
            case 'All':
                isUserHaveRule = true;
                break;
            case 'Self':
                isUserHaveRule = project.entity.his.some((history) => history.createdby === user.username);
                break;
            case 'Join':
                isUserHaveRule = project.participant.some((participant) => participant === user.username);
                break;
            case 'Specific':
                isUserHaveRule = createTaskProjectRule.details.project.includes(project._id.toString());
                break;
        }
    }
    return isUserHaveRule;
}

function generateStatisticDepartmnetAggeration(context = {}) {
    const aggerationSteps = [];
    addStepsBuildDepartmentFilter(aggerationSteps, context);
    addStepsBuildEmployeeFilter(aggerationSteps, context);
    addStepsBuildTasksFilter(aggerationSteps, context);
    addStepSortDepartment(aggerationSteps, context);
    return aggerationSteps;
}

function addStepsBuildDepartmentFilter(aggerationSteps = [], { check, body }) {
    const parentId = body.department_id;
    const level = parentId ? (body.department_grade || 0) + 1 : 1;
    const departmentIds = check.department || [];

    const cond = [];
    const filter = {
        level,
        ...(parentId && { parent: parentId }),
        ...(!check.all && { id: { $in: departmentIds } }),
    };
    cond.push(filter);

    if (body.search) {
        cond.push({
            $text: {
                $search: `"${body.search}"`,
            },
        });
    }

    aggerationSteps.push({
        $match: {
            $and: cond,
        },
    });
}

function addStepsBuildEmployeeFilter(aggerationSteps = [], { competences = [] }) {
    aggerationSteps.push({
        $lookup: {
            from: 'employee',
            as: 'employees',
            let: {
                departmentId: '$id',
                competences: competences,
            },
            pipeline: [
                {
                    $match: {
                        $expr: {
                            $eq: ['$department', '$$departmentId'],
                        },
                    },
                },
                {
                    $addFields: {
                        map_competences: {
                            $first: {
                                $filter: {
                                    input: '$$competences',
                                    as: 'item',
                                    cond: {
                                        $eq: ['$$item.value', '$competence'],
                                    },
                                },
                            },
                        },
                    },
                },
                {
                    $project: {
                        _id: '$_id',
                        fullname: '$fullname',
                        competence: '$competence',
                        ordernumber: '$map_competences.ordernumber',
                    },
                },
                {
                    $sort: {
                        'ordernumber': 1,
                    },
                },
            ],
        },
    });
    aggerationSteps.push({
        $addFields: {
            leader: {
                $first: {
                    $cond: [
                        { $gt: [{ $size: '$employees' }, 0] },
                        '$employees',
                        [null],
                    ],
                },
            },
            total_employee: {
                $size: '$employees',
            },
        },
    });
    aggerationSteps.push({
        $unset: ['employees'],
    });
}

function addStepsBuildTasksFilter(aggerationSteps = [], { body }) {
    let varibles = { departmentId: '$id' };
    let filters = [
        {
            $and: [
                { $eq: ['$department', '$$departmentId'] },
                { $eq: ['$level', 'HeadTask'] }
            ]
        }

    ]


    if (body.from_date) {
        varibles.fromDate = body.from_date;
    }

    if (body.to_date) {
        varibles.toDate = body.to_date;
    }

    if (body.from_date && body.to_date) {
        filters.push({
            $or: [
                { $and: [{ $lte: ['$from_date', '$$fromDate'] }, { $gte: ['$to_date', '$$fromDate'] }] },
                { $and: [{ $lte: ['$from_date', '$$toDate'] }, { $gte: ['$to_date', '$$toDate'] }] },
                { $and: [{ $gte: ['$from_date', '$$fromDate'] }, { $lte: ['$to_date', '$$toDate'] }] },
                { $and: [{ $lte: ['$from_date', '$$fromDate'] }, { $gte: ['$to_date', '$$toDate'] }] },
                { $and: [{ $lte: ['$from_date', '$$fromDate'] }, { $gte: ['$time_completed', '$$fromDate'] }] },
                { $and: [{ $lte: ['$from_date', '$$toDate'] }, { $gte: ['$time_completed', '$$toDate'] }] },
                { $and: [{ $gte: ['$from_date', '$$fromDate'] }, { $lte: ['$time_completed', '$$toDate'] }] },
                { $and: [{ $lte: ['$from_date', '$$fromDate'] }, { $gte: ['$time_completed', '$$toDate'] }] }
            ]
        });
    }

    aggerationSteps.push({
        $lookup: {
            from: 'task',
            as: 'task_statistic_lookup',
            let: varibles,
            pipeline: [
                {
                    $match: {
                        $expr: {
                            $and: filters
                        },
                    },
                },
                {
                    $addFields: {
                        all_username: {
                            $concatArrays: [
                                '$main_person',
                                '$participant',
                                '$observer',
                                ['$username'],
                            ],
                        },
                        now_date: {
                            $toLong: '$$NOW',
                        },
                    },
                },
                {
                    $addFields: {
                        total_duration: {
                            $subtract: ['$to_date', '$from_date'],
                        },
                        elapsed_duration: {
                            $subtract: ['$now_date', '$from_date'],
                        },
                    },
                },
                {
                    $addFields: {
                        state: {
                            $cond: [
                                {
                                    $eq: ['$status', 'Completed'],
                                },
                                'OnSchedule',
                                {
                                    $cond: [
                                        { $lt: ['$to_date', '$now_date'] },
                                        'Overdue',
                                        {
                                            $cond: [
                                                {
                                                    $and: [
                                                        { $lt: ['$progress', 50] },
                                                        {
                                                            $gt: [
                                                                '$elapsed_duration',
                                                                {
                                                                    $divide: [
                                                                        '$total_duration',
                                                                        2,
                                                                    ],
                                                                },
                                                            ],
                                                        },
                                                    ],
                                                },
                                                'GonnaLate',
                                                'OnSchedule',
                                            ],
                                        },
                                    ],
                                    $cond: [
                                        {
                                            $eq: ['$dispatch_arrived_id', null],
                                        },
                                        'DispatchArrivedTask',
                                        'OnSchedule'
                                    ]
                                },
                            ],
                        },
                    }
                },
                {
                    $group: {
                        _id: '$department',
                        open: {
                            $sum: {
                                $cond: [
                                    {
                                        $in: [
                                            '$status',
                                            [
                                                TASK_STATUS.NOT_SEEN,
                                                TASK_STATUS.PROCESSING,
                                                TASK_STATUS.WAITING_FOR_APPROVAL,
                                            ],
                                        ],
                                    },
                                    1,
                                    0,
                                ],
                            },
                        },
                        closed: {
                            $sum: {
                                $cond: [
                                    {
                                        $in: [
                                            '$status',
                                            [
                                                TASK_STATUS.COMPLETED,
                                            ],
                                        ],
                                    },
                                    1,
                                    0,
                                ],
                            },
                        },
                        over_due: {
                            $sum: {
                                $cond: [{ $eq: ['$state', 'Overdue'] }, 1, 0],
                            },
                        },
                        gonna_late: {
                            $sum: {
                                $cond: [{ $eq: ['$state', 'GonnaLate'] }, 1, 0],
                            },
                        },
                        on_schedule: {
                            $sum: {
                                $cond: [{ $eq: ['$state', 'OnSchedule'] }, 1, 0],
                            },
                        },
                        dispatch_arrived_task: {
                            $sum: {
                                $cond: [{ $eq: ['$state', 'DispatchArrivedTask'] }, 1, 0],
                            },
                        },

                    },
                },
            ],
        },
    });
    aggerationSteps.push({
        $addFields: {
            task_static: {
                $arrayElemAt: [
                    {
                        $concatArrays: [
                            '$task_statistic_lookup',
                            [{
                                open: { $sum: '$task_statistic_lookup.open' },
                                closed: { $sum: '$task_statistic_lookup.closed' },
                                over_due: { $sum: '$task_statistic_lookup.over_due' },
                                gonna_late: { $sum: '$task_statistic_lookup.gonna_late' },
                                dispatch_arrived_task: { $sum: '$task_statistic_lookup.dispatch_arrived_task' },
                            }],
                        ],
                    },
                    0,
                ],
            },
        },
    });
    aggerationSteps.push({
        $unset: ['task_static._id'],
    });
}

function addStepSortDepartment(aggerationSteps = [], { body }) {
    const currentSession = body.session;
    const currentLanguage = currentSession.language.current;
    let sorting_order = body.sorting_order ? JSON.parse(JSON.stringify(body.sorting_order)) : 1;

    if (body.sort_by === 'title' || !body.sort_by) {
        if (currentLanguage === 'vi-VN') {
            aggerationSteps.push({
                $sort: {
                    'title.vi-VN': sorting_order,
                    'title.en-US': sorting_order,
                },
            });
        } else {
            aggerationSteps.push({
                $sort: {
                    'title.en-US': sorting_order,
                    'title.vi-VN': sorting_order,
                },
            });
        }
    } else {
        let sort = {};
        sort[`task_static.${body.sort_by}`] = sorting_order;
        aggerationSteps.push({ $sort: sort });
    }

}

function loadLeaderDetail(dbPrefix, department) {
    const dfd = q.defer();

    if (!department.leader) {
        dfd.resolve(null);
        return dfd.promise;
    }

    loadDepartmentLeader(dbPrefix, department.departmentLeader).then(function (departmentLeader) {
        if (departmentLeader.length > 0) {
            const employeeId = departmentLeader[0].employee;
            exports.UserService.loadDetails(dbPrefix, employeeId).then((result) => {
                    dfd.resolve(Object.assign(department, { leader: result }));
                })
                .catch(error => {
                    dfd.reject(error);
                });
        } else {
            dfd.resolve(Object.assign(department, { leader: [] }));
        }
    })

    return dfd.promise;
}

function loadDepartmentLeader(dbPrefix, departmentLeaderName) {
    return MongoDBProvider.load_onManagement(dbPrefix, 'user', {
        username: { $eq: departmentLeaderName },
    });
}

function loadChildTaskByHeadTaskId(dbPrefix, parentTaskId) {
    const filter = {
        head_task_id: {
            $eq: new String(parentTaskId).toString(),
        },
    };
    return MongoDBProvider.load_onOffice(dbPrefix, "task", filter);
}

function generateTaskCode(dbname_prefix, insertData, origin = HEAD_TASK_ORIGIN.OTHER) {
    const dfd = q.defer();

    if (isValidValue(insertData.head_task_id) && HEAD_TASK_ORIGIN.INTER_DEPARTMENT !== origin && !insertData.dispatch_arrived_id) {
        let headTask;
        exports.TaskService.getById(dbname_prefix, insertData.head_task_id)
            .then(data => {
                headTask = _.cloneDeep(data);
                return MongoDBProvider.getAutoIncrementNumber_onManagement(dbname_prefix, headTask.code);
            }).then(sequenceNumber => {
                dfd.resolve(CodeUtil.resolvePattern(`${headTask.code}-{taskNumber}`, {
                    taskNumber: sequenceNumber,
                }));
            })
            .catch(err => dfd.reject(err));
    } else if (insertData.project) {
        exports.ProjectService.getProjectById(dbname_prefix, insertData.project).then(function(project){
            MongoDBProvider.getAutoIncrementNumber_onManagement(dbname_prefix, TASK_SEQUENCE_NUMBER_KEY(project.code)).then(function(sequenceNumber){
                dfd.resolve(CodeUtil.resolvePattern(TASK_CODE_PATTERN, {
                    code: project.code,
                    taskNumber: String(sequenceNumber).padStart(5, '0')
                }));
            },function(err){dfd.reject(err)})
        },function(err){
            dfd.reject(err);
        })

    } else if(insertData.dispatch_arrived_id){
        exports.DepartmentService.getDepartmentById(dbname_prefix, insertData.department).then(function(department){
            MongoDBProvider.getAutoIncrementNumber_onManagement(dbname_prefix, TASK_DISPATCH_ARRIVED_NUMBER_KEY(department.ordernumber)).then(function(sequenceNumber){
                dfd.resolve(CodeUtil.resolvePattern(TASK_DISPATCH_ARRIVED_CODE_PATTERN, {
                    year: new Date().getFullYear(),
                    departmentOrderNumber: String(department.ordernumber).padStart(2, '0'),
                    taskNumber: String(sequenceNumber).padStart(5, '0'),
                }));
            },function(err){dfd.reject(err)})
        }, function(err){ dfd.reject(err) })
        
    }else {
        let department = null;
        q.fcall(() => {
            return exports.DepartmentService.getDepartmentById(dbname_prefix, insertData.department);
        }).then(data => {
            if (!data) {
                return dfd.reject({ path: 'generateTaskCode', mes: 'DepartmentNotFound' });
            }
            department = data;
            return MongoDBProvider.getAutoIncrementNumber_onManagement(dbname_prefix, TASK_DEPARTMENT_SEQUENCE_NUMBER_KEY(department.ordernumber,origin))
        }).then((sequenceNumber) => {
            dfd.resolve(CodeUtil.resolvePattern(
                TASK_CODE_ORIGIN_PATTERN,
                {
                    year: new Date().getFullYear(),
                    origin: origin,
                    departmentOrderNumber: String(department.ordernumber).padStart(2, '0'),
                    taskNumber: String(sequenceNumber).padStart(5, '0'),
                },
            ));
        }).catch(err => dfd.reject(err));
    }
    return dfd.promise;
}

function buildParentFieldForTask(task) {
    let parent = null;

    if (task["parent"]) {
        return task;
    }

    if (task.dispatch_arrived_id) {
        parent = {
            object: OBJECT_NAME.DISPATCH_ARRIVED,
            value: task.dispatch_arrived_id,
        };
        delete task["dispatch_arrived_id"];
    }

    if (task.project) {
        parent = {
            object: OBJECT_NAME.PROJECT,
            value: task.project,
        };
        delete task["project"];
    }

    if (task.head_task_id) {
        parent = {
            object: OBJECT_NAME.TASK,
            value: task.head_task_id,
        };
        delete task["head_task_id"];
    }

    Object.assign(task, { parent });
    return task;
}

class TaskService {
    constructor() { }

     loadStatisticTaskCompleted(dbPrefix, body) {
        const loadStatisticTaskCompletedAgg = taskFilterUtil.buildLoadStatisticTaskCompleted(body);
        return MongoDBProvider.loadAggregate_onOffice(dbPrefix, "task", loadStatisticTaskCompletedAgg);
    }

    countStatisticTaskCompleted(dbPrefix, body) {
        const countStatisticTaskCompletedAgg = taskFilterUtil.buildCountStatisticTaskCompleted(body);
        return MongoDBProvider.loadAggregate_onOffice(dbPrefix, "task", countStatisticTaskCompletedAgg);
    }

    loadStatisticTaskUncompleted(dbPrefix, body) {
        const loadStatisticTaskUncompletedAgg = taskFilterUtil.buildLoadStatisticTaskUncompleted(body);
        return MongoDBProvider.loadAggregate_onOffice(dbPrefix, "task", loadStatisticTaskUncompletedAgg);
    }
    
    countStatisticTaskUncompleted(dbPrefix, body) {
        const countStatisticTaskUncompletedAgg = taskFilterUtil.buildCountStatisticTaskUncompleted(body);
        return MongoDBProvider.loadAggregate_onOffice(dbPrefix, "task", countStatisticTaskUncompletedAgg);
    }

    exportStatisticTaskCompleted(dbPrefix, body) {
        const exportStatisticTaskCompletedAgg = taskFilterUtil.buildExportStatisticTaskCompleted(body);
        return MongoDBProvider.loadAggregate_onOffice(dbPrefix, "task", exportStatisticTaskCompletedAgg);
    }
    
    statisticTasksPerson(dbPrefix, body) {
        const dfd = q.defer();
        const aggregation = taskFilterUtil.buildStatisticTasksPersonalAggregation(body);
        MongoDBProvider.loadAggregate_onOffice(dbPrefix, "task", aggregation)
            .then((result) => {
                if (Array.isArray(result) && result.length > 0) {
                    dfd.resolve(result[0]);
                } else {
                    dfd.resolve([]);
                }
            })
            .catch((error) => {
                dfd.reject(error);
            });
        return dfd.promise;
    }

    loadByDispatchArrivedId(dbname_prefix, dispatch_arrived_id) {
        return MongoDBProvider.load_onOffice(dbname_prefix, "task", {
            "parent.object": OBJECT_NAME.DISPATCH_ARRIVED,
            "parent.value": dispatch_arrived_id,
        });
    }

    load_department(dbname_prefix, filter) {
        return MongoDBProvider.load_onOffice(dbname_prefix, "organization", filter);
    }

    loadBaseDepartment(dbPrefix, body, permissionCheck) {
        const dfd = q.defer();
        exports.UserService.loadEmployeeByDepartmentId(dbPrefix, body.department)
            .then((employees) => {
                Object.assign(body, { departmentEmployees: employees.map(e => e.username) });
                const aggregation = taskFilterUtil.buildLoadBaseDepartmentAggregation(body, permissionCheck);
                return MongoDBProvider.loadAggregate_onOffice(dbPrefix, 'task', aggregation);
            })
            .then((result) => {
                dfd.resolve(result);
            })
            .catch((error) => {
                dfd.reject(error);
            });
        return dfd.promise;
    }

    countBaseDepartment(dbPrefix, body, permissionCheck) {
        const dfd = q.defer();
        exports.UserService.loadEmployeeByDepartmentId(dbPrefix, body.department)
            .then((employees) => {
                Object.assign(body, { departmentEmployees: employees.map(e => e.username) });
                const aggregation = taskFilterUtil.buildCountBaseDepartmentAggregation(body, permissionCheck);
                return MongoDBProvider.loadAggregate_onOffice(dbPrefix, 'task', aggregation);
            })
            .then((result) => {
                dfd.resolve(result);
            })
            .catch((error) => {
                dfd.reject(error);
            });
        return dfd.promise;
    }

    ganttChartBaseDepartment(dbPrefix, body, permissionCheck) {
        const dfd = q.defer();
        q.fcall(() => {
            if (!Array.isArray(body.employee) || body.employee.length === 0) {
                return exports.UserService.loadEmployeeByDepartmentId(dbPrefix, body.department);
            } else {
                return q.resolve(body.employee);
            }
        })
            .then((employees) => {
                Object.assign(body, { employee: employees.map((e) => e.username) });
                const aggregation = taskFilterUtil.buildGanttChartForDepartmentAggregation(body, permissionCheck);
                return q.all([
                    MongoDBProvider.loadAggregate_onOffice(dbPrefix, "task", aggregation.parentTaskAggregation),
                    MongoDBProvider.loadAggregate_onOffice(dbPrefix, "task", aggregation.childTaskAggregation),
                ]);
            })
            .then(([parentTasks, childTasks]) => {
                dfd.resolve(
                    parentTasks.map((parentTask) => {
                        parentTask.childTask = childTasks.filter(
                            (task) => task.head_task_id === String(parentTask._id)
                        );
                        return parentTask;
                    })
                );
            })
            .catch((error) => {
                dfd.reject(error);
            });
        return dfd.promise;
    }

    statisticDepartmentCount(dbPrefix, body) {
        const dfd = q.defer();
        q.fcall(() => {
            if (!Array.isArray(body.employee) || body.employee.length === 0) {
                return exports.UserService.loadEmployeeByDepartmentId(dbPrefix, body.department);
            } else {
                return q.resolve(body.employee);
            }
        })
            .then((employees) => {
                Object.assign(body, { employee: employees.map((e) => e.username) });
                const aggregationGroup = taskFilterUtil.buildStatisticDepartmentCountAggregation(body);
                return MongoDBProvider.loadAggregate_onOffice(dbPrefix, "task", aggregationGroup);
            })
            .then((result) => {
                if (Array.isArray(result) && result.length > 0) {
                    dfd.resolve(result[0]);
                } else {
                    dfd.resolve(STATISTIC_COUNT_DEFAULT_VAL);
                }
            })
            .catch((error) => {
                dfd.reject(error);
            });
        return dfd.promise;
    }

    statisticDepartmentGrowth(dbPrefix, body) {
        const dfd = q.defer();
        q.fcall(() => {
            if (!Array.isArray(body.employee) || body.employee.length === 0) {
                return exports.UserService.loadEmployeeByDepartmentId(dbPrefix, body.department);
            } else {
                return q.resolve(body.employee);
            }
        })
            .then((employees) => {
                Object.assign(body, { employee: employees.map((e) => e.username) });
                const aggregationGroup = taskFilterUtil.buildStatisticDepartmentGrowthAggregation(body);
                return MongoDBProvider.loadAggregate_onOffice(dbPrefix, "task", aggregationGroup);
            })
            .then((result) => {
                if (Array.isArray(result) && result.length > 0) {
                    dfd.resolve(result[0]);
                } else {
                    dfd.resolve(STATISTIC_GROW_DEFAULT_VAL);
                }
            })
            .catch((error) => {
                dfd.reject(error);
            });
        return dfd.promise;
    }

    loadBaseProject(dbPrefix, body, check) {
        const loadBaseProjectAgg = taskFilterUtil.buildLoadBaseProjectAggregation(body, check);
        return MongoDBProvider.loadAggregate_onOffice(dbPrefix, "task", loadBaseProjectAgg);
    }

    countBaseProject(dbPrefix, body, check) {
        const countBaseProjectAgg = taskFilterUtil.buildCountBaseProjectAggregation(body, check);
        return MongoDBProvider.loadAggregate_onOffice(dbPrefix, "task", countBaseProjectAgg);
    }

    ganttChartBaseProject(dbPrefix, body, permissionCheck) {
        const dfd = q.defer();
        q.fcall(() => {
            const aggregation = taskFilterUtil.buildGanttChartForProjectAggregation(body, permissionCheck);
            return q.all([
                MongoDBProvider.loadAggregate_onOffice(dbPrefix, "task", aggregation.parentTaskAggregation),
                MongoDBProvider.loadAggregate_onOffice(dbPrefix, "task", aggregation.childTaskAggregation),
            ]);
        })
            .then(([parentTasks, childTasks]) => {
                dfd.resolve(
                    parentTasks.map((parentTask) => {
                        parentTask.childTask = childTasks.filter(
                            (task) => task.head_task_id === String(parentTask._id),
                        );
                        return parentTask;
                    }),
                );
            })
            .catch((error) => {
                dfd.reject(error);
            });
        return dfd.promise;
    }

    statisticProjectCount(dbPrefix, body) {
        const dfd = q.defer();
        q.fcall(() => {
            const aggregationGroup = taskFilterUtil.buildStatisticProjectCountAggregation(body);
            return MongoDBProvider.loadAggregate_onOffice(dbPrefix, "task", aggregationGroup);
        })
            .then((result) => {
                if (Array.isArray(result) && result.length > 0) {
                    dfd.resolve(result[0]);
                } else {
                    dfd.resolve(STATISTIC_COUNT_DEFAULT_VAL);
                }
            })
            .catch((error) => {
                dfd.reject(error);
            });
        return dfd.promise;
    }

    statisticProjectGrowth(dbPrefix, body) {
        const dfd = q.defer();
        q.fcall(() => {
            const aggregationGroup = taskFilterUtil.buildStatisticProjectGrowthAggregation(body);
            return MongoDBProvider.loadAggregate_onOffice(dbPrefix, "task", aggregationGroup);
        })
            .then((result) => {
                if (Array.isArray(result) && result.length > 0) {
                    dfd.resolve(result[0]);
                } else {
                    dfd.resolve(STATISTIC_GROW_DEFAULT_VAL);
                }
            })
            .catch((error) => {
                dfd.reject(error);
            });
        return dfd.promise;
    }

    loadBasePersonal(dbPrefix, body) {
        const aggregation = taskFilterUtil.buildLoadBasePersonalAggregation(body);
        return MongoDBProvider.loadAggregate_onOffice(dbPrefix, "task", aggregation);
    }

    countBasePersonal(dbPrefix, body) {
        const aggregation = taskFilterUtil.buildCountBasePersonalAggregation(body);
        return MongoDBProvider.loadAggregate_onOffice(dbPrefix, "task", aggregation);
    }

    statisticPersonalCount(dbPrefix, body) {
        const dfd = q.defer();
        const aggregation = taskFilterUtil.buildStatisticPersonalCountAggregation(body);
        MongoDBProvider.loadAggregate_onOffice(dbPrefix, "task", aggregation)
            .then((result) => {
                if (Array.isArray(result) && result.length > 0) {
                    dfd.resolve(result[0]);
                } else {
                    dfd.resolve(STATISTIC_COUNT_DEFAULT_VAL);
                }
            })
            .catch((error) => {
                dfd.reject(error);
            });
        return dfd.promise;
    }

    statisticPersonalGrowth(dbPrefix, body) {
        const dfd = q.defer();
        const aggregation = taskFilterUtil.buildStatisticPersonalGrowthAggregation(body);
        MongoDBProvider.loadAggregate_onOffice(dbPrefix, "task", aggregation)
            .then((result) => {
                if (Array.isArray(result) && result.length > 0) {
                    dfd.resolve(result[0]);
                } else {
                    dfd.resolve(STATISTIC_GROW_DEFAULT_VAL);
                }
            })
            .catch((error) => {
                dfd.reject(error);
            });
        return dfd.promise;
    }

    countProject(dbname_prefix, filter) {
        return MongoDBProvider.count_onOffice(dbname_prefix, "project", filter);
    }

    loadEmployeeDepartment(dbname_prefix, departmentId) {
        let dfd = q.defer();
        MongoDBProvider.load_onManagement(dbname_prefix, 'user',
            { department: { $eq: departmentId } }
        ).then(function (data) {
            dfd.resolve(data);
            data = undefined;
            temp = undefined;
        }, function (err) {
            dfd.reject(err);
            err = undefined;
        })
        return dfd.promise;
    }

    loadRelateQuickActionPerson(dbname_prefix, filter) {
        let dfd = q.defer();

        MongoDBProvider.load_onManagement(dbname_prefix, 'user',
            filter
        ).then(function (data) {
            let temp = [];
            for (var i in data) {
                temp.push(data[i]);
            }
            dfd.resolve(temp);
            data = undefined;
            temp = undefined;
        }, function (err) {
            dfd.reject(err);
            err = undefined;
        })
        return dfd.promise;
    }

    loadEmployee(dbname_prefix, departmentId, competenceKey, employeeId, rule) {
        let dfd = q.defer();
        if (rule.filter(e => e.rule === "Office.Task.AuthorizationToAssignWorkToSuperiors")[0]) {
            MongoDBProvider.load_onOffice(dbname_prefix, "employee",
                { department: { $eq: departmentId } }
            ).then(function (data2) {
                let temp = [];
                for (var i in data2) {
                    // if (data2[i]._id.toString() !== employeeId) {
                    temp.push(data2[i]);
                    // }
                }
                dfd.resolve(temp);
                data2 = undefined;
                temp = undefined;
            }, function (err) {
                dfd.reject(err);
                err = undefined;
            });
        } else {
            let dfdAr = [];
            dfdAr.push(MongoDBProvider.load_onManagement(dbname_prefix, "directory", { master_key: { $eq: "competence" } }));
            q.all(dfdAr).then(function (data) {

                let competence_items = data[0];
                let myCompetence = {};
                for (var i in competence_items) {
                    if (competence_items[i].value === competenceKey) {
                        myCompetence = competence_items[i];
                        break;
                    }
                }
                let competence = [];
                for (var i in competence_items) {
                    if (myCompetence.level <= competence_items[i].level
                    ) {
                        competence.push(competence_items[i].value);
                    }
                }
                MongoDBProvider.load_onOffice(dbname_prefix, "employee",
                    {
                        $and: [
                            { competence: { $in: competence } },
                            { department: { $eq: departmentId } }
                        ]
                    }
                ).then(function (data2) {
                    let temp = [];
                    for (var i in data2) {
                        if (data2[i]._id.toString() !== employeeId) {
                            temp.push(data2[i]);
                        }
                    }
                    dfd.resolve(temp);
                    data = undefined;
                    data2 = undefined;
                    temp = undefined;
                }, function (err) {
                    dfd.reject(err);
                    err = undefined;
                });
                myCompetence = undefined;
                competence = undefined;

            }, function (err) {
                dfd.reject(err);
                err = undefined;
            });
        }
        return dfd.promise;
    }

    loadDetails(dbname_prefix, id, code) {
        let dfd = q.defer();
        let filter = {};
        if (id) {
            filter = { _id: { $eq: new mongodb.ObjectId(id) } };
        } else {
            code = decodeURIComponent(code);
            filter = { code: new RegExp("^" + code + "$", "i") };
        }

        MongoDBProvider.load_onOffice(dbname_prefix, "task", filter).then(
            function (data) {
                if (data[0]) {
                    dfd.resolve(data[0]);
                } else {
                    dfd.reject(BaseError.notFound("TaskService.loadDetails.DataIsNull", "ShowPageNotFound"));
                }
                data = undefined;
            },
            function (err) {
                dfd.reject(err);
                err = undefined;
            },
        );
        return dfd.promise;
    }

    loadList(dbname_prefix, filter, top, offset, keys) {
        return MongoDBProvider.load_onOffice(dbname_prefix, "task", filter,
            top, offset, { status_priority: 1, priority: 1, to_date: 1 }, keys);
    }

    load_quickhandle(dbname_prefix, filter) {
        return MongoDBProvider.loadAggregate_onOffice(dbname_prefix, "task", filter);
    }

    count_quickhandle(dbname_prefix, filter) {
        return MongoDBProvider.loadAggregate_onOffice(dbname_prefix, "task", filter);
    }

    loadListForExport(dbname_prefix, filter) {
        return MongoDBProvider.load_onOffice(dbname_prefix, "task", filter,
            5000, 0,
            { from_date: 1 },
            {
                title: true, main_person: true, participant: true,
                observer: true, _id: true, from_date: true,
                to_date: true, username: true, status: true,
                project: true, department: true, in_project: true, in_department: true,
                priority: true, progress: true
            });
    }

    countList(dbname_prefix, filter) {
        return MongoDBProvider.count_onOffice(dbname_prefix, "task", filter);
    }

    count_created(dbname_prefix, username) {
        return MongoDBProvider.count_onOffice(dbname_prefix, "task", { $and: [{ username: { $eq: username } }, { status: { $ne: 'Completed' } }] });
    }

    count_assigned(dbname_prefix, username) {
        return MongoDBProvider.count_onOffice(dbname_prefix, "task",
            {
                $and: [
                    {
                        $or: [
                            { main_person: { $eq: username } },
                            { participant: { $eq: username } },
                            { observer: { $eq: username } }
                        ]
                    },
                    { status: { $ne: 'Completed' } }
                ]
            }

        );
    }

    loadDepartment_statistic(dbname_prefix, department_id) {
        let dfd = q.defer();
        MongoDBProvider.load_onOffice(dbname_prefix, "organization", { id: { $eq: department_id } }).then(function (department_details) {
            if (department_details[0]) {
                MongoDBProvider.load_onOffice(
                    dbname_prefix, "organization",
                    {
                        $and: [
                            { type: { $eq: "department" } },
                            { level: { $eq: department_details[0].level + 1 } },
                            { parent: { $eq: department_id } }
                        ]
                    }

                ).then(function (data) {
                    dfd.resolve(data);
                    data = undefined;
                    department_details = undefined;
                }, function (err) {
                    dfd.reject(err);
                    err = undefined;
                    department_details = undefined;
                });
            } else {
                dfd.reject({ path: "TaskService.loadDepartment_statistic.DataIsNull", mes: "DataIsNull" });
            }
        }, function (err) {
            dfd.reject(err);
            err = undefined;
        });
        return dfd.promise;
    }


    insertChild(dbname_prefix, username, priority, department, title,to_department, content, task_list, main_person, participant, observer, attachment, from_date, to_date, object, has_time, hours, parentID, task_type, project, goals, date) {
        let dfd = q.defer();
        let item = {
            username, title, content,to_department, task_list, main_person, participant, task_type,
            observer, attachment, from_date, to_date, status: "NotStartedYet",
            event: [{ username, time: date.getTime(), action: "Created" }],
            object, comment: [], has_time, hours, project, goals, progress: 0, title_search: removeUnicode(title),
            date_created: date.getFullYear() + "/" + NumberToStringForDate((date.getMonth() + 1)) + "/" + NumberToStringForDate(date.getDate()),
            month_created: date.getFullYear() + "/" + NumberToStringForDate((date.getMonth() + 1)),
            year_created: date.getFullYear(), status_priority: 2, priority
        };
        if (!project) {
            item.department = department;
            item.in_department = true;
        } else {
            item.in_project = true;
        }
        MongoDBProvider.insert_onOffice(
            dbname_prefix,
            'task',
            username,
            item,
        ).then(
            function (e) {
                let event = {
                    username,
                    time: date.getTime(),
                    action: 'CreatedChildTask',
                };
                MongoDBProvider.update_onOffice(
                    dbname_prefix,
                    'task',
                    username,
                    { _id: { $eq: new require('mongodb').ObjectID(parentID) } },
                    {
                        $push: { event, childs: e.ops[0]._id.toString() },
                    },
                ).then(
                    function (e) {
                        dfd.resolve(e);
                        date = undefined;
                    },
                    function (err) {
                        dfd.reject(err);
                        date = undefined;
                    },
                );
            },
            function (err) {
                dfd.reject(err);
            },
        );
        return dfd.promise;
    }

    insert(
        dbname_prefix,
        username,
        estimate,
        priority,
        department,
        title,
        to_department,
        content,
        task_list,
        main_person,
        participant,
        observer,
        attachment,
        from_date,
        to_date,
        object,
        has_time,
        hours,
        task_type,
        project,
        goals,
        date,
        level,
        head_task_id,
        references,
        label,
        task_template_id,
        origin = HEAD_TASK_ORIGIN.INTER_DEPARTMENT,
        parents,
        dispatch_arrived_id,
        is_draft,
        from_department,
        has_repetitive,
        per,
        cycle,
        has_expired,
        expired_date,
        child_work_percent,
        receive_transfer_ticket,
        label_from_da,
    ) {
        let dfd = q.defer();
        const d = new Date();
        let item = {
            username,
            title,
            to_department,
            content,
            task_list,
            main_person,
            participant,
            observer,
            task_type: Number(task_type) ? Number(task_type) : 1,
            code: null,
            attachment,
            from_date,
            to_date,
            status: is_draft ? TASK_STATUS.WAITING_FOR_APPROVAL : TASK_STATUS.NOT_SEEN,
            event: [
                {
                    username,
                    time: d.getTime(),
                    action: TASK_EVENT.CREATED,
                },
            ],
            object,
            comment: [],
            has_time,
            hours,
            project,
            goals,
            progress: 0,
            title_search: removeUnicode(title),
            date_created: moment(d).format("YYYY/MM/DD"),
            month_created: moment(d).format("YYYY/MM"),
            year_created: moment(d).format("YYYY"),
            status_priority: 2,
            priority,
            level: level || TASK_LEVEL.TASK,
            head_task_id,
            references,
            label: [],
            task_template_id,
            parents,
            dispatch_arrived_id,
            from_department,
            source_id: origin,
            has_repetitive,
            per,
            cycle,
            has_expired,
            expired_date,
            child_work_percent,
            receive_transfer_ticket,
            label_from_da,
            estimate
        };
            if (parents && parents.length > 0) {
                item.parent = {
                    object: parents[parents.length - 1].object,
                    value: parents[parents.length - 1].id
                }
            }
        
        

        if (Array.isArray(label) && label.length > 0) {
            const validLabels = label.filter((item) => {
                try {
                    new mongodb.ObjectId(item);
                    return true;
                } catch (error) {
                    return false;
                }
            });
            item.label = [...new Set(validLabels)];
        }

        if (!project) {
            item.department = department;
            item.in_department = true;
        } else {
            item.in_project = true;
        }

        if (main_person.length > 0) {
            item.event.push({
                username,
                time: d.getTime(),
                action: TASK_EVENT.ASSIGNMENT,
                main_person: item.main_person,
                estimate: item.estimate
            });
        }
        
        q.fcall(function () {
            return generateTaskCode(dbname_prefix, item, origin); // bug
        }).then(code => {
            item.code = code;
            return MongoDBProvider.insert_onOffice(
                dbname_prefix,
                'task',
                username,
                item,
            );
        })
            .then(function (e) {
                dfd.resolve(e.ops[0]);
                for (var i in main_person) {
                    SocketProvider.IOEmitToRoom(
                        main_person[i],
                        'justPushNotification',
                        {
                            title: 'YouHaveBeenAssignedATask',
                            body: title,
                            url: '/task-details?' + e.ops[0]._id.toString(),
                        },
                    );
                }

                for (var i in participant) {
                    SocketProvider.IOEmitToRoom(
                        participant[i],
                        'justPushNotification',
                        {
                            title: 'YouHaveBeenAssignedATask',
                            body: title,
                            url: '/task-details?' + e.ops[0]._id.toString(),
                        },
                    );
                }

                for (var i in observer) {
                    SocketProvider.IOEmitToRoom(
                        observer[i],
                        'justPushNotification',
                        {
                            title: 'GotANewTaskToKeepTrackOf',
                            body: title,
                            url: '/task-details?' + e.ops[0]._id.toString(),
                        },
                    );
                }
                e = undefined;
            })
            .catch(function (err) {
                dfd.reject({
                    path: `TaskService.insert`,
                    mes: 'ProcessFailed',
                });
            });

        return dfd.promise;
    }

    insert_head_task(
        dbname_prefix,
        username,
        priority,
        estimate,
        department,
        title,
        to_department,
        content,
        task_list,
        main_person,
        participant,
        observer,
        attachment,
        from_date,
        to_date,
        object,
        has_time,
        hours,
        task_type,
        project,
        goals,
        date,
        level,
        head_task_id,
        references,
        label,
        task_template_id,
        origin = HEAD_TASK_ORIGIN.OTHER,
        parents,
        dispatch_arrived_id,
        is_draft,
        from_department,
        has_repetitive,
        per,
        cycle,
        has_expired,
        expired_date,
        child_work_percent,
        receive_transfer_ticket,
        label_from_da,
    ) {
        let dfd = q.defer();
        const d = new Date();
        let item = {
            username,
            title,
            to_department,
            content,
            task_list,
            main_person,
            participant,
            observer,
            task_type: Number(task_type) ? Number(task_type) : 1,
            code: null,
            attachment,
            from_date,
            to_date,
            status: is_draft ? TASK_STATUS.WAITING_FOR_APPROVAL : TASK_STATUS.NOT_SEEN,
            event: [
                {
                    username,
                    time: d.getTime(),
                    action: TASK_EVENT.CREATED,
                },
            ],
            object,
            comment: [],
            has_time,
            hours,
            project,
            goals,
            progress: 0,
            title_search: removeUnicode(title),
            date_created: moment(d).format("YYYY/MM/DD"),
            month_created: moment(d).format("YYYY/MM"),
            year_created: moment(d).format("YYYY"),
            status_priority: 2,
            priority,
            level: level || TASK_LEVEL.TASK,
            head_task_id,
            references,
            label: [],
            task_template_id,
            parents,
            dispatch_arrived_id,
            from_department,
            source_id: origin,
            has_repetitive,
            per,
            cycle,
            has_expired,
            expired_date,
            child_work_percent,
            receive_transfer_ticket,
            label_from_da,
            estimate
        };

        if (parents && parents.length > 0) {
            item.parent = {
                object: parents[parents.length - 1].object,
                value: parents[parents.length - 1].id
            }
        }
        
        

        if (Array.isArray(label) && label.length > 0) {
            const validLabels = label.filter((item) => {
                try {
                    new mongodb.ObjectId(item);
                    return true;
                } catch (error) {
                    return false;
                }
            });
            item.label = [...new Set(validLabels)];
        }

        if (!project) {
            item.department = department;
            item.in_department = true;
        } else {
            item.in_project = true;
        }
        
        q.fcall(function () {
            return generateTaskCode(dbname_prefix, item, origin);
        }).then(code => {
            item.code = code;

            return MongoDBProvider.insert_onOffice(
                dbname_prefix,
                'task',
                username,
                item,
            );
        })
            .then(function (e) {
                dfd.resolve(e.ops[0]);
                for (var i in main_person) {
                    SocketProvider.IOEmitToRoom(
                        main_person[i],
                        'justPushNotification',
                        {
                            title: 'YouHaveBeenAssignedATask',
                            body: title,
                            url: '/task-details?' + e.ops[0]._id.toString(),
                        },
                    );
                }

                for (var i in participant) {
                    SocketProvider.IOEmitToRoom(
                        participant[i],
                        'justPushNotification',
                        {
                            title: 'YouHaveBeenAssignedATask',
                            body: title,
                            url: '/task-details?' + e.ops[0]._id.toString(),
                        },
                    );
                }

                for (var i in observer) {
                    SocketProvider.IOEmitToRoom(
                        observer[i],
                        'justPushNotification',
                        {
                            title: 'GotANewTaskToKeepTrackOf',
                            body: title,
                            url: '/task-details?' + e.ops[0]._id.toString(),
                        },
                    );
                }
                e = undefined;
            })
            .catch(function (err) {
                dfd.reject({
                    path: `TaskService.insert`,
                    mes: 'ProcessFailed',
                });
            });

        return dfd.promise;
    }

    insert_work_item(dbname_prefix, username, department,
        main_person, participant, observer,
        title, to_department, content, task_list, attachment, from_date, to_date, priority,
        has_time, hours,
        task_type, date,
        level = 'Task',
        head_task_id,
        department_assign_id,
        transfer_ticket_info,
        parents, parent, source_id
    ) {
        let dfd = q.defer();
        let item = {
            username, department, in_department: true,
            title, to_department, content, task_list, main_person, participant, observer, task_type, code: null,
            comment: [], has_time, hours,
            priority, level, head_task_id,
            attachment, from_date, to_date,
            event: [{ username, time: date.getTime(), action: "Created" }],
            title_search: removeUnicode(title),
            date_created: date.getFullYear() + "/" + NumberToStringForDate((date.getMonth() + 1)) + "/" + NumberToStringForDate(date.getDate()),
            month_created: date.getFullYear() + "/" + NumberToStringForDate((date.getMonth() + 1)),
            year_created: date.getFullYear(),
            status_priority: 2, progress: 0,
            parents, parent
        };

        if (level == 'TransferTicket') {
            item.department_assign_id = department_assign_id;
            item.transfer_ticket_info = transfer_ticket_info;
            item.status = "PendingApproval";
        } else {
            item.status = "NotStartedYet";
        }

        q.fcall(function () {
            return generateTaskCode(dbname_prefix, item, source_id);
        })
            .then(function (taskCode) {
                item.code = taskCode;
                return MongoDBProvider.insert_onOffice(
                    dbname_prefix,
                    'task',
                    username,
                    item,
                );
            })
            .then(function (e) {
                dfd.resolve(e.ops[0]);
                e = undefined;
            })
            .catch(function (err) {
                dfd.reject({
                    path: `TaskService.insert`,
                    mes: 'ProcessFailed',
                });
            });

        return dfd.promise;
    }

    done(dbname_prefix, username, id, date, content) {
        let dfd = q.defer();
        MongoDBProvider.load_onOffice(dbname_prefix, "task",
            {
                $and: [
                    { _id: { $eq: new require('mongodb').ObjectID(id) } },
                    { status: { $eq: "Processing" } }
                ]
            }
        ).then(function (data) {
            if (data[0]) {
                let event = { username, time: date.getTime(), action: "Done", message: content };
                let item = { status: "WaitingForApproval", progress: 100, status_priority: 3 };
                MongoDBProvider.update_onOffice(dbname_prefix, "task", username,
                    { _id: { $eq: new require('mongodb').ObjectID(id) } }
                    , { $set: item, $push: { event } }
                ).then(function () {
                    dfd.resolve(data[0]);
                }, function (err) {
                    dfd.reject(err);
                    err = undefined;
                });
            } else {
                dfd.reject({ path: "TaskService.done.YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists", mes: "YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists" });
            }
        }, function (err) {
            dfd.reject(err);
            err = undefined;
        });
        return dfd.promise;
    }

    complete(dbname_prefix, username, id, content, attachment, date) {
        let dfd = q.defer();
        const now = moment(date);
        const filter = {
            $and: [
                { _id: { $eq: new require('mongodb').ObjectID(id) } },
                { status: { $in: [TASK_STATUS.WAITING_FOR_APPROVAL, TASK_STATUS.DONE, TASK_STATUS.PROCESSING] } },
            ],
        };
        MongoDBProvider.load_onOffice(dbname_prefix, 'task', filter).then(
            function (data) {
                if (data[0]) {
                    // if (
                    //     (!data[0].comment || !data[0].comment.length) &&
                    //     (!data[0].proof || !data[0].proof.length) &&
                    //     data[0].task_type != 2
                    // ) {
                    //     return dfd.reject({
                    //         path: "TaskService.complete.ProofOrCommentIsRequiredForTheTask",
                    //         mes: "ProofOrCommentIsRequiredForTheTask",
                    //     });
                    // }

                    let event = { username, time: date.getTime(), action: TASK_EVENT.COMPLETED, message: content ,files:  attachment};
                    let item = {
                        status: TASK_STATUS.COMPLETED,
                        status_priority: 4,
                        date_completed: now.format('YYYY/MM/DD'),
                        month_completed: now.format('YYYY/MM'),
                        year_completed: now.format('YYYY'),
                        time_completed: date
                    };
                    MongoDBProvider.update_onOffice(dbname_prefix, 'task', username,
                        { _id: { $eq: new require('mongodb').ObjectID(id) } }
                        ,
                        {
                            $set: item, $push: { event },
                        },
                    ).then(
                        function () {
                            dfd.resolve(data[0]);
                            let users = [data[0].username];
                            users = users.concat(data[0].main_person.filter(e => users.indexOf(e) == -1));
                            users = users.concat(data[0].participant.filter(e => users.indexOf(e) == -1));
                            users = users.concat(data[0].observer.filter(e => users.indexOf(e) == -1));
                            for (var i in users) {
                                SocketProvider.IOEmitToRoom(users[i], 'justPushNotification', {
                                    title: 'TheTaskIsCompleted',
                                    body: data[0].title,
                                    url: '/task-details?' + id,
                                });
                            }
                        },
                        function (err) {
                            dfd.reject(err);
                            err = undefined;
                        },
                    );
                } else {
                    dfd.reject({
                        path: 'TaskService.complete.YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists',
                        mes: 'YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists',
                    });
                }
            },
            function (err) {
                dfd.reject(err);
                err = undefined;
            },
        );
        return dfd.promise;
    }

    refune(dbname_prefix, username, taskId, content,  attachment, date, progress) {
        let dfd = q.defer();
        const filter = {
            $and: [
                { _id: { $eq: new require('mongodb').ObjectID(taskId) } },
                { observer: { $eq: username } }
                
            ]
        };
        MongoDBProvider.load_onOffice(dbname_prefix, "task", filter).then(
            function (data) {
                if (data[0]) {
                    let item = {
                        status: TASK_STATUS.PROCESSING,
                        progress: parseInt(progress),
                        status_priority: 2,
                    };
                    MongoDBProvider.update_onOffice(
                        dbname_prefix,
                        "task",
                        username,
                        { _id: { $eq: new require("mongodb").ObjectID(taskId) } },
                        {
                            $set: item,
                            $push: {
                                event: { 
                                    username, time: date.getTime(), 
                                    action: TASK_STATUS.REFUNED, 
                                    message: content, 
                                    files: attachment,
                                    progress: progress 
                                },                               
                            },
                        },
                    ).then(
                        function (res) {
                            dfd.resolve(data[0]);
                            let users = [data[0].username];
                            users = users.concat(data[0].main_person.filter((e) => users.indexOf(e) == -1));
                            users = users.concat(data[0].participant.filter((e) => users.indexOf(e) == -1));
                            users = users.concat(data[0].observer.filter((e) => users.indexOf(e) == -1));
                            for (var i in users) {
                                SocketProvider.IOEmitToRoom(users[i], "justPushNotification", {
                                    title: "TheTaskIsRefunedForApproval",
                                    body: data[0].title,
                                    url: "/task-details?" + taskId,
                                });
                            }
                        },
                        function (err) {
                            dfd.reject(err);
                            err = undefined;
                        },
                    );
                } else {
                    dfd.reject({
                        path: "TaskService.refused.YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists",
                        mes: "YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists",
                    });
                }
            },
            function (err) {
                dfd.reject(err);
                err = undefined;
            },
        );
        return dfd.promise;
    }

    cancel(dbPrefix, username, id, comment) {
        const dfd = q.defer();
        const now = moment();
        const filter = {
            _id: new require("mongodb").ObjectId(id),
        };

        MongoDBProvider.load_onOffice(dbPrefix, "task", filter)
            .then((result) => {
                if (!Array.isArray(result) || result.length === 0) {
                    dfd.reject({
                        path: "TaskService.cancel.loadTask",
                        mes: "NotFoundTask",
                    });
                    return;
                }

                const task = result[0];
                let childTaskPromise;
                if (task.level === TASK_LEVEL.HEAD_TASK) {
                    childTaskPromise = loadChildTaskByHeadTaskId(dbPrefix, task._id);
                } else {
                    childTaskPromise = q.resolve(null);
                }
                return q.all([task.level, task, childTaskPromise]);
            })
            .then(([level, task, childTasks]) => {
                let ids = [task._id];
                if (level === TASK_LEVEL.HEAD_TASK) {
                    ids = ids.concat(childTasks.map((childTask) => childTask._id));
                }
                const filter = {
                    _id: {
                        $in: ids,
                    },
                };
                const updatedData = {
                    $set: {
                        status: TASK_STATUS.CANCELLED,
                        status_priority: TASK_PRIORITY.LOW,
                        date_cancelled: now.format("YYYY/MM/DD"),
                        month_cancelled: now.format("YYYY/MM"),
                        year_cancelled: now.format("YYYY"),
                    },
                    $push: {
                        event: {
                            username,
                            time: now.valueOf(),
                            action: TASK_EVENT.CANCELLED,
                        },
                        comment: {
                            username,
                            time: now.valueOf(),
                            content: comment,
                            type: TASK_COMMENT_TYPE.CANCELLED,
                        },
                    },
                };
                return MongoDBProvider.update_onOffice(dbPrefix, "task", username, filter, updatedData);
            })
            .then((result) => {
                dfd.resolve(true);
            })
            .catch((err) => {
                LogProvider.error(
                    `Cannot process cancelled task with reason: ${err.message}`,
                    "TaskService.cancel.err"
                );
                dfd.reject({
                    path: "TaskService.cancel.err",
                    mes: "ProcessCancelTaskFailed",
                });
            });

        return dfd.promise;
    }

    start(dbname_prefix, username, id, date) {
        let dfd = q.defer();
        MongoDBProvider.load_onOffice(dbname_prefix, "task",
            {
                $and: [
                    { _id: { $eq: new require('mongodb').ObjectID(id) } },
                    { status: { $eq: "NotSeen" } }
                ]
            }
        ).then(function (data) {
            if (data[0]) {
                let event = { username, time: date.getTime(), action: "StartDoing" };
                let item = { status: "Processing", status_priority: 1 };
                MongoDBProvider.update_onOffice(dbname_prefix, "task", username,
                    { _id: { $eq: new require('mongodb').ObjectID(id) } }
                    , { $set: item, $push: { event } }
                ).then(function () {
                    dfd.resolve(data[0]);
                }, function (err) {
                    dfd.reject(err);
                    err = undefined;
                });
            } else {
                dfd.reject({ path: "TaskService.start.YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists", mes: "YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists" });
            }
        }, function (err) {
            dfd.reject(err);
            err = undefined;
        });
        return dfd.promise;
    }

    getById(dbname_prefix, id) {
        let dfd = q.defer();
        MongoDBProvider.load_onOffice(dbname_prefix, "task",
            {
                $and: [
                    { _id: { $eq: new require('mongodb').ObjectID(id) } },
                ]
            }
        ).then(data => {
            if (data[0]) {
                dfd.resolve(data[0]);
            } else {
                dfd.reject({ path: "TaskService.update.YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists", mes: "YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists" });
            }
        }).catch(err => {
            dfd.reject(err);
            err = undefined;
        });
        return dfd.promise;
    }

    update(dbname_prefix, username, estimate, priority, id, title, content, task_list, main_person, participant, observer, from_date, to_date, status, object, task_type, workflowPlay_id, has_time, hours, date, label = [], reference = [], attachment = [], department = null, parent = null, has_repetitive, per, cycle, has_expired, expired_date, action_access, child_work_percent) {
        let dfd = q.defer();

        let item = {
            estimate,
            title,
            title_search: removeUnicode(title),
            content,
            task_list,
            main_person,
            participant,
            observer,
            from_date,
            to_date,
            status,
            object,
            has_time,
            hours,
            priority,
            task_type: Number(task_type) ? Number(task_type) : 1,
            label: [],
            reference,
            attachment,
            parent,
            has_repetitive,
            per,
            cycle,
            has_expired,
            expired_date,
            child_work_percent
        };

        if (department) {
            item.department = department;
        }

        buildParentFieldForTask(item);
        if (Array.isArray(label) || label.length > 0) {
            const validLabels = label.filter((item) => {
                try {
                    new mongodb.ObjectId(item);
                    return true;
                } catch (error) {
                    return false;
                }
            });
            item.label = [...new Set(validLabels)];
        }

        switch (status) {
            case "Completed":
                item.status_priority = 4;
                item.date_completed = date.getFullYear() + "/" + NumberToStringForDate((date.getMonth() + 1)) + "/" + NumberToStringForDate(date.getDate());
                item.month_completed = date.getFullYear() + "/" + NumberToStringForDate((date.getMonth() + 1));
                item.year_completed = date.getFullYear();
                break;
            case "Done":
                item.status_priority = 3;
                break;
            case "Processing":
                item.status_priority = 1;
                break;
            case "NotSeen":
                item.status_priority = 2;
                break;
        }

        const event = {
            username,
            time: date.getTime(),
            action: action_access,
            ...(action_access === TASK_EVENT.ASSIGNMENT && {
                main_person: item.main_person,
                estimate: item.estimate,
            }),
        };
        
        const updateEvent = {
            $set: item,
            $push: { event },
        };

        MongoDBProvider.update_onOffice(
            dbname_prefix,
            "task",
            username,
            { _id: { $eq: new require("mongodb").ObjectID(id) } },
            updateEvent
        )
            .then(function () {
                return MongoDBProvider.getOne_onOffice(dbname_prefix, "task", { _id: new require("mongodb").ObjectID(id) });
            })
            .then(function (data) {
                dfd.resolve(data);
            })
            .catch(function (err) {
                dfd.reject(err);
                err = undefined;
            });

        return dfd.promise;
    }

    delete(dbname_prefix, username, id) {
        let dfd = q.defer();
        MongoDBProvider.load_onOffice(dbname_prefix, "task", {
            _id: { $eq: new require('mongodb').ObjectID(id) }
        }).then(function (data) {
            if (data[0]) {
                MongoDBProvider.delete_onOffice(dbname_prefix, "task", username, {
                    _id: { $eq: new require('mongodb').ObjectID(id) }
                }).then(function () {
                    dfd.resolve(true);
                }, function (err) {
                    dfd.reject(err);
                    err = undefined;
                });
            } else {
                dfd.reject({ path: "TaskService.delete.YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists", mes: "YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists" });
            }
        }, function (err) {
            dfd.reject(err);
            err = undefined;
        });
        return dfd.promise;
    }

    comment(dbname_prefix, username, id, content, attachment, date, taskDetails,type,challenge_id) {
        let dfd = q.defer();
        MongoDBProvider.update_onOffice(dbname_prefix, "task", username,
            { _id: { $eq: new require('mongodb').ObjectID(id) } },
            {
                $push: {
                    comment:
                    {
                       id:uuidv4(), username, time: date.getTime(), content, attachment, type,challenge_id
                    },
                    event: {
                        username,
                        time: date.getTime(),
                        action: "addComment",
                    }

                }
            }
        ).then(function () {
            dfd.resolve(taskDetails);
        }, function (err) {
            dfd.reject(err);
            err = undefined;
        });
        return dfd.promise;
    }

    updateComment(dbname_prefix, username, task_id, comment_id, content, attachment, date, taskDetails, type, challenge_id) {
        let dfd = q.defer();

        MongoDBProvider.update_onOffice(dbname_prefix, "task", username,
            {
                _id: new require('mongodb').ObjectID(task_id),
                "comment.id": comment_id
            },
            {
                $push: {
                    event: {
                        username,
                        time: date.getTime(),
                        action: "updateComment",
                    },
                },
                $addToSet: {
                    "comment.$.attachment": { $each: attachment }
                },
                $set: {
                    "comment.$.content": content,
                    "comment.$.time": date.getTime(),
                    "comment.$.type": type,
                    "comment.$.challenge_id": challenge_id
                }
            }
        ).then(function () {
            dfd.resolve(taskDetails);
        }, function (err) {
            dfd.reject(err);
            err = undefined;
        });

        return dfd.promise;
    }


    resolveChallenge(dbname_prefix, username, id, taskDetails, type, challenge_id) {
        let dfd = q.defer();
        MongoDBProvider.update_onOffice(dbname_prefix, "task", username,
            { _id: { $eq: new require('mongodb').ObjectID(id) } , "comment.id": { $eq: challenge_id }},
            {
                $set: {"comment.$.type": type}
            }
        ).then(function () {
            dfd.resolve(taskDetails);
        }, function (err) {
            dfd.reject(err);
            err = undefined;
        });
        return dfd.promise;
    }

    statistic_personal_count(dbname_prefix, filter) {
        let dfd = q.defer();
        let dfdAr = [];
        dfdAr.push(MongoDBProvider.count_onOffice(dbname_prefix, "task", filter.completed));
        dfdAr.push(MongoDBProvider.count_onOffice(dbname_prefix, "task", filter.done));
        dfdAr.push(MongoDBProvider.count_onOffice(dbname_prefix, "task", filter.process));
        dfdAr.push(MongoDBProvider.count_onOffice(dbname_prefix, "task", filter.notstart));
        dfdAr.push(MongoDBProvider.count_onOffice(dbname_prefix, "task", filter.all));
        q.all(dfdAr).then(function (data) {
            dfd.resolve({
                completed: data[0],
                done: data[1],
                process: data[2],
                notstart: data[3],
                all: data[4]
            });
        }, function (err) {
            dfd.reject(err);
        });
        return dfd.promise;
    }

    statistic_personal_growth(dbname_prefix, filter) {
        let dfd = q.defer();
        let dfdAr = [];
        dfdAr.push(MongoDBProvider.loadAggregate_onOffice(dbname_prefix, "task", [
            { $match: filter.created },
            { "$group": { _id: "$date_created", count: { $sum: 1 } } }
        ]));
        dfdAr.push(MongoDBProvider.loadAggregate_onOffice(dbname_prefix, "task", [
            { $match: filter.completed },
            { "$group": { _id: "$date_completed", count: { $sum: 1 } } }
        ]));
        q.all(dfdAr).then(function (res) {
            dfd.resolve({
                created: res[0],
                completed: res[1]
            });
        }, function (err) { dfd.reject(err); });
        return dfd.promise;
    }

    pushFile(dbname_prefix, username, id, file) {
        let dfd = q.defer();
        MongoDBProvider.load_onOffice(dbname_prefix, "task",
            {
                $and: [
                    { _id: { $eq: new require('mongodb').ObjectID(id) } },
                    {
                        $or: [
                            {
                                username: { $eq: username }
                            },
                            { main_person: { $eq: username } },
                            { participant: { $eq: username } },
                            { observer: { $eq: username } }
                        ]
                    }
                ]
            }
        ).then(function (data) {
            if (data[0]) {
                const updateData = data[0].attachment ? {
                    $addToSet: { attachment: file }
                } : {
                    $set: { attachment: [file] }
                };
                MongoDBProvider.update_onOffice(dbname_prefix, "task", username
                    , { _id: { $eq: new require('mongodb').ObjectID(id) } },
                    updateData).then(function () {
                        dfd.resolve(data[0]);
                    }, function (err) {
                        dfd.reject(err);
                        err = undefined;
                    })
                return dfd.promise;
            } else {
                dfd.reject({ path: "TaskService.pushFile.YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists", mes: "YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists" });
            }
        }, function (err) { dfd.reject(err); err = undefined; })
        return dfd.promise;
    }

    removeFile(dbname_prefix, username, id, filename, recoverRecord) {
        let dfd = q.defer();
        MongoDBProvider.load_onOffice(dbname_prefix, "task",
            {
                $and: [
                    { _id: { $eq: new require('mongodb').ObjectID(id) } },
                    {
                        $or: [
                            {
                                username: { $eq: username }
                            },
                            { main_person: { $eq: username } },
                            { participant: { $eq: username } },
                            { observer: { $eq: username } }
                        ]
                    }
                ]
            }
        ).then(function (data) {
            if (data[0]) {
                MongoDBProvider.update_onOffice(dbname_prefix, "task", username,
                    { _id: { $eq: new require('mongodb').ObjectID(id) } },
                    {
                        $pull: { attachment: { name: filename } },
                        $push: { [StoreConst.recoverFound]: recoverRecord }
                    }).then(function () {
                        dfd.resolve(data[0]);
                    }, function (err) {
                        dfd.reject(err);
                        err = undefined;
                    })
            } else {
                dfd.reject({ path: "TaskService.removeFile.YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists", mes: "YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists" });
            }
        }, function (err) { dfd.reject(err); err = undefined; })
        return dfd.promise;
    }

    update_task_list_status(dbname_prefix, username, id, task_list_id, value, date) {
        let dfd = q.defer();
        MongoDBProvider.load_onOffice(dbname_prefix, "task",
            {
                $and: [
                    {
                        $or: [

                            { username: { $eq: username } },
                            { main_person: { $eq: username } },
                            { participant: { $eq: username } },
                            { observer: { $eq: username } }

                        ]
                    },
                    { _id: { $eq: new require('mongodb').ObjectID(id) } }
                ]
            }).then(function (data) {
                if (data[0]) {

                    MongoDBProvider.update_onOffice(dbname_prefix,
                        "task", username,
                        {
                            $and: [
                                { _id: { $eq: new require('mongodb').ObjectID(id) } },
                                { "task_list.id": { $eq: task_list_id } }
                            ]
                        },
                        {
                            $set: {
                                "task_list.$.status": value
                            },
                            $push: {
                                event: { username, time: date.getTime(), action: "UpdatedInformation" }
                            }
                        }
                    ).then(function () { dfd.resolve(data[0]) }, function (err) { dfd.reject(err) });
                } else {
                    dfd.reject({ path: "TaskService.update_task_list_status.YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists", mes: "YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists" });
                }
            }, function (err) {
                dfd.reject(err);
            });
        return dfd.promise;
    }

    update_task_list(dbname_prefix, username, id, task_list, date) {
        let dfd = q.defer();
        MongoDBProvider.load_onOffice(dbname_prefix, "task",
            {
                $and: [
                    {
                        $or: [

                            { username: { $eq: username } },
                            { main_person: { $eq: username } },
                            { participant: { $eq: username } },
                            { observer: { $eq: username } }

                        ]
                    },
                    { _id: { $eq: new require('mongodb').ObjectID(id) } }
                ]
            }).then(function (data) {
                if (data[0]) {
                    MongoDBProvider.update_onOffice(dbname_prefix,
                        "task", username,
                        { _id: { $eq: new require('mongodb').ObjectID(id) } },
                        {
                            $set: { task_list },
                            $push: {
                                event: { username, time: date.getTime(), action: "UpdatedInformation" }
                            }
                        }
                    ).then(function () { dfd.resolve(data[0]) }, function (err) { dfd.reject(err) });
                } else {
                    dfd.reject({ path: "TaskService.update_task_list.YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists", mes: "YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists" });
                }
            }, function (err) {
                dfd.reject(err);
            });
        return dfd.promise;
    }

    link_workflow_play(dbname_prefix, username, id, workflowPlay_id, date) {
        let dfd = q.defer();
        q.fcall(() => {
            return q.all([
                WFPService.loadDetails(dbname_prefix, username, workflowPlay_id),
                WFPService.loadWorkflowPlayByTaskId(dbname_prefix, username, id),
            ]);
        })
            .then(([workflowPlayNeedToLink, linkedWorkflowPlay]) => {
                if (linkedWorkflowPlay) {
                    throw new BaseError("TaskService.link_workflow_play", "TaskAlreadyLinkedToWorkflowPlay");
                }

                if (workflowPlayNeedToLink["parent"]) {
                    throw new BaseError("TaskService.link_workflow_play", "WorkflowPlayCannotBeLinkedToTask");
                }

                return WFPService.linkTaskIntoWorkflowPlay(dbname_prefix, username, id, workflowPlay_id);
            })
            .then(() => {
                return MongoDBProvider.update_onOffice(
                    dbname_prefix,
                    "task",
                    username,
                    { _id: { $eq: new mongodb.ObjectID(id) } },
                    {
                        $push: {
                            event: {
                                username,
                                time: date.getTime(),
                                action: "UpdatedInformation",
                            },
                        },
                        $set: {
                            workflowPlay_id: workflowPlay_id
                        }
                    },
                );
            })
            .then(() => {
                dfd.resolve()
            })
            .catch((error) => {
                dfd.reject(
                    error instanceof BaseError
                        ? error
                        : new BaseError("TaskService.link_workflow_play", "LinkWorkflowPlayFailed"),
                );
            })
        return dfd.promise;
    };

    update_progress(dbname_prefix, username, id, progress, event) {
        let dfd = q.defer();
        MongoDBProvider.load_onOffice(dbname_prefix, "task",
            {
                _id: { $eq: new require('mongodb').ObjectID(id) }
            }).then(function (data) {
                if (data[0]) {
                    let d = new Date();

                    MongoDBProvider.update_onOffice(dbname_prefix, "task", username,
                        { _id: { $eq: new require('mongodb').ObjectID(id) } },
                        {
                            $set: { progress },
                            $push: {
                                event: event
                            }
                        }
                    ).then(function (e) {
                        dfd.resolve(data[0]);
                    }, function (err) {
                        dfd.reject(err);
                    });
                } else {
                    dfd.reject({ path: "TaskService.update_progress.YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists", mes: "YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists" });
                }
            }, function (err) {
                dfd.reject(err);
            });
        return dfd.promise;
    }

    loadGanttChartData(dbname_prefix, filter) {
        let dfd = q.defer();
        let dfdAr = [];

        dfdAr.push(MongoDBProvider.load_onOffice(dbname_prefix, "task", filter.parentTask));
        dfdAr.push(MongoDBProvider.load_onOffice(dbname_prefix, "task", filter.childTask));

        q.all(dfdAr).then(function (res) {
            dfd.resolve({
                parentTasks: res[0],
                childTasks: res[1]
            });
        }, function (err) { dfd.reject(err); });

        return dfd.promise;
    }

    loadProjectById(dbname_prefix, body) {
        let dfd = q.defer();
        MongoDBProvider.load_onOffice(dbname_prefix, "project",
            {
                _id: { $eq: new require('mongodb').ObjectID(body.id) }
            }).then(function (data) {
                if (data[0]) {
                    dfd.resolve(data[0]);
                } else {
                    dfd.reject(err);
                }
            }, function (err) {
                dfd.reject(err);
            });
        return dfd.promise;
    }

    checkRuleToLoadDetails(user, task) {
        if (task.username === user.username
            && user.department === task.department
        ) {
            return true;
        }
        if (task.main_person.indexOf(user.username) !== -1
            || task.participant.indexOf(user.username) !== -1
            || task.observer.indexOf(user.username) !== -1) {
            return true;
        }
        const editTaskDepartmentRule = user.rule.find(rule => rule.rule === 'Office.Task.View_Task_Department');

        if (editTaskDepartmentRule) {
            switch (editTaskDepartmentRule.details.type) {
                case "All":
                    return true;
                case "NotAllow":
                    return false;
                case "Specific":
                    return editTaskDepartmentRule.details.department.indexOf(task.department) !== -1
                case "Working":
                    return task.department === user.department
                default:
                    return false;
            }
        } else {
            return false;
        }

    }

    checkRuleToEditProgress(user, task) {
        const { username: creator, main_person, participant, observer, status } = task;
        if (status !== 'Processing') {
            return false;
        }

        if ([TASK_LEVEL.HEAD_TASK, TASK_LEVEL.TRANSFER_TICKET].includes(task.level) && task.workItems && task.workItems.length > 0) {
            return false;
        }

        if (creator === user.username) {
            return true;
        }
        if (main_person && main_person.length > 0 && main_person.includes(user.username)) {
            return true;
        }
        if (participant && participant.length > 0 && participant.includes(user.username)) {
            return true;
        }
        if (observer && observer.length > 0 && observer.includes(user.username)) {
            return true;
        }

        if (task.in_department === true) {
            const { department: department_id } = task;
            const ruleItem = user.rule.filter(e => e.rule === 'Office.Task.Edit_Task_Department')[0];
            if (ruleItem) {
                switch (ruleItem.details.type) {
                    case "All":
                        return true;
                    case "NotAllow":
                        return false;
                    case "Specific":
                        return ruleItem.details.department.indexOf(department_id) !== -1
                    case "Working":
                        return department_id === user.employee_details.department
                    default:
                        return false;
                }
            } else {
                return false;
            }
        } else if (task.in_project === true) {
            const { participant: project_joiner } = task.reference_project;
            const projects_creator = task.reference_project.entity.his[0].createdby;
            const ruleItem = user.rule.filter(e => e.rule === rule)[0];
            if (ruleItem) {
                switch (ruleItem.details.type) {
                    case "All":
                        return true;
                    case "NotAllow":
                        return false;
                    case "Specific":
                        return ruleItem.details.project.indexOf(project_id) !== -1;
                    case "Self":
                        return projects_creator === user.username;
                    case "Join":
                        return project_joiner.indexOf(user.username) !== -1;
                    default:
                        return false;
                }
            } else {
                return false;
            }
        } else {
            return false;
        }
    }

    insert_for_multiple_projects(dbNamePrefix, currentUser, tasks, sync) {
        sync = sync || false;
        const date = new Date();
        const dfd = q.defer();
        const promises = [];
        for (const task of tasks) {
            const promise = this.insert(
                dbNamePrefix,
                currentUser.username,
                task.priority,
                null,
                task.title,
                task.content,
                task.task_list,
                [],
                [],
                [],
                [],
                task.from_date,
                task.to_date,
                null,
                task.has_time,
                task.hours,
                task.task_type,
                task.project,
                null,
                date,
                TASK_LEVEL.HEAD_TASK,
                null,
                [],
                false,
                [],
                [],
                HEAD_TASK_ORIGIN.SCHOOL_OFFICE
            )
                .then(function (res) {
                    dfd.resolve(true);
                    RingBellItemService.insert(
                        dbNamePrefix,
                        currentUser.username,
                        'task_assigned',
                        { taskCode: res.code, title: task.title, username_create_task: currentUser.username },
                        [],
                        [],
                        'createTask',
                        date.getTime(),
                    );
                })
                .catch(function (err) {
                    LogProvider.error(`Can not insert task with title ${task.title}`);
                });
            promises.push(promise);
        }
        if (sync) {
            q.all(promises).then(
                function (data) {
                    dfd.resolve(data);
                },
                function (err) {
                    dfd.reject(err);
                },
            );
        } else {
            dfd.resolve(true);
        }
        return dfd.promise;
    }

    addProof(dbname_prefix, username, taskId, content,  attachment, date, worktimes) {
        let dfd = q.defer();
        MongoDBProvider.load_onOffice(dbname_prefix, "task", {
            $and: [
                { _id: { $eq: new require("mongodb").ObjectID(taskId) } },
                {
                    $or: [
                        { username: { $eq: username } },
                        { main_person: { $eq: username } },
                        { participant: { $eq: username } },
                        { observer: { $eq: username } },
                    ],
                },
                // { task_type: 1 },
            ],
        }).then(
            function (data) {
                if (data[0]) {
                    let fromDateUpdate = data[0].from_date || date.getTime();
                    let item = {
                        status: "WaitingForApproval",
                        progress: 100,
                        status_priority: 3,
                        worktimes: parseInt(worktimes),
                        from_date: fromDateUpdate
                    };
                    MongoDBProvider.update_onOffice(
                        dbname_prefix,
                        "task",
                        username,
                        { _id: { $eq: new require("mongodb").ObjectID(taskId) } },
                        {
                            $set: item,
                            $push: {
                                event: { username, time: date.getTime(), action: TASK_STATUS.DONE, message: content, files: attachment, worktimes },
                                proof: {
                                    username,
                                    id: date.getTime().toString(),
                                    time: date.getTime(),
                                    content,
                                    attachment,
                                },
                            },
                        },
                    ).then(
                        function (res) {
                            dfd.resolve(data[0]);
                            let users = [data[0].username];
                            users = users.concat(data[0].main_person.filter((e) => users.indexOf(e) == -1));
                            users = users.concat(data[0].participant.filter((e) => users.indexOf(e) == -1));
                            users = users.concat(data[0].observer.filter((e) => users.indexOf(e) == -1));
                            for (var i in users) {
                                SocketProvider.IOEmitToRoom(users[i], "justPushNotification", {
                                    title: "There is a new proof",
                                    body: data[0].title,
                                    url: "/task-details?" + res.ops[0]._id.toString(),
                                });
                            }
                        },
                        function (err) {
                            dfd.reject(err);
                            err = undefined;
                        },
                    );
                } else {
                    dfd.reject({
                        path: "TaskService.addProof.YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists",
                        mes: "YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists",
                    });
                }
            },
            function (err) {
                dfd.reject(err);
                err = undefined;
            },
        );
        return dfd.promise;
    }

    removeProof(dbname_prefix, username, id, proofId, date) {
        let dfd = q.defer();
        MongoDBProvider.load_onOffice(dbname_prefix, "task", {
            $and: [
                { _id: { $eq: new require("mongodb").ObjectID(id) } },
                {
                    $or: [
                        { username: { $eq: username } },
                        { main_person: { $eq: username } },
                        { participant: { $eq: username } },
                        { observer: { $eq: username } },
                    ],
                },
            ],
        }).then(
            function (data) {
                if (data[0]) {
                    let removedProof = data[0].proof.find((proof) => proof.id === proofId);
                    if (!removedProof) {
                        dfd.reject({ path: "TaskService.removeProof.DataIsNotExists", mes: "DataIsNotExists" });
                    }
                    MongoDBProvider.update_onOffice(
                        dbname_prefix,
                        "task",
                        username,
                        { _id: { $eq: new require("mongodb").ObjectID(id) } },
                        {
                            $pull: { proof: { id: proofId } },
                            $push: {
                                event: {
                                    username,
                                    time: date.getTime(),
                                    action: "RemoveProof",
                                    files: removedProof.attachment,
                                },
                            },
                        },
                    ).then(
                        function () {
                            dfd.resolve(data[0]);
                        },
                        function (err) {
                            dfd.reject(err);
                            err = undefined;
                        },
                    );
                } else {
                    dfd.reject({
                        path: "TaskService.removeProof.YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists",
                        mes: "YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists",
                    });
                }
            },
            function (err) {
                dfd.reject(err);
                err = undefined;
            },
        );
        return dfd.promise;
    }

    loadAggregationList(dbname_prefix, filter, top, offset) {
        // Pagination
        filter.push({ $skip: top * offset });
        filter.push({ $limit: top });

        return MongoDBProvider.loadAggregate_onOffice(dbname_prefix, "task", filter);
    }

    countAggregationList(dbname_prefix, filter) {
        filter.push({ $count: "count" });
        return MongoDBProvider.loadAggregate_onOffice(dbname_prefix, "task", filter);
    }

    notifyOverdueTasks(dbname_prefix) {
        let dfd = q.defer();
        const date = new Date();
        const overdueTaskFilter = [
            {
                $addFields: {
                    dateToAdd: {
                        $switch: {
                            branches: [
                                {
                                    case: {
                                        $eq: [
                                            { $dayOfWeek: { date: { $toDate: "$to_date", }, timezone: "+07", }, },
                                            7,
                                        ]
                                    },
                                    then: 1,
                                },
                                {
                                    case: {
                                        $eq: [
                                            { $dayOfWeek: { date: { $toDate: "$to_date", }, timezone: "+07", }, },
                                            6,
                                        ],
                                    },
                                    then: 2,
                                },
                            ],
                            default: 0,
                        },
                    },
                },
            },
            {
                $addFields: {
                    targetToDate: {
                        $toDouble: {
                            $dateSubtract: {
                                startDate: { $dateTrunc: { date: date, unit: "day", timezone: "+07" } },
                                unit: "second",
                                amount: 1,
                                timezone: "+07",
                            }
                        }
                    },
                    expectToDate: {
                        $toDouble: {
                            $dateAdd: {
                                startDate: { $toDate: "$to_date" },
                                unit: "day",
                                amount: "$dateToAdd",
                                timezone: "+07",
                            },
                        },
                    },
                },
            },
            {
                $match: { status: { $ne: "Completed" }, $expr: { $eq: ["$expectToDate", "$targetToDate"], }, },
            },
        ]

        MongoDBProvider.loadAggregate_onOffice(dbname_prefix, "task", overdueTaskFilter)
            .then((tasks) => {
                for (var i in tasks) {
                    let usernameToNotify = [];
                    usernameToNotify = usernameToNotify.concat(tasks[i].observer);
                    usernameToNotify = usernameToNotify.concat(tasks[i].main_person);
                    usernameToNotify = usernameToNotify.concat(tasks[i].participant);
                    RingBellItemService.insert(
                        dbname_prefix,
                        tasks[i].username,
                        'task_overdue_notify',
                        { taskCode: tasks[i].code.toString(), title: tasks[i].title, from_date: tasks[i].from_date, to_date: tasks[i].to_date },
                        usernameToNotify,
                        [],
                        'notifyOverdueTasks',
                        date.getTime(),
                    );
                }
                dfd.resolve(tasks.length);
            })
            .catch(err => {
                LogProvider.error("TaskService.notifyOverdueTasks error:" + err.mes || err.message, err);
                dfd.reject(err);
            });

        return dfd.promise;
    }

    notifyUpcomingDeadlineTasksDaily(dbname_prefix) {
        let dfd = q.defer();
        const date = new Date();
        const overdueTaskFilter = [
            {
                $addFields: {
                    targetEndDate: {
                        $toDouble: {
                            $dateAdd: {
                                startDate: {
                                    $dateSubtract: {
                                        startDate: {
                                            $dateTrunc: { date: date, unit: "day", timezone: "+07", },
                                        },
                                        unit: "second",
                                        amount: 1,
                                    },
                                },
                                unit: "day",
                                amount: 2,
                            },
                        },
                    },
                },
            },
            {
                $match: {
                    $and: [
                        { status: { $ne: "Completed" } },
                        { $expr: { $eq: ["$to_date", "$targetEndDate"], } },
                    ]
                },
            },
        ]

        MongoDBProvider.loadAggregate_onOffice(dbname_prefix, "task", overdueTaskFilter)
            .then((tasks) => {
                for (var i in tasks) {
                    let usernameToNotify = [];
                    usernameToNotify = usernameToNotify.concat(tasks[i].observer);
                    usernameToNotify = usernameToNotify.concat(tasks[i].main_person);
                    usernameToNotify = usernameToNotify.concat(tasks[i].participant);
                    RingBellItemService.insert(
                        dbname_prefix,
                        tasks[i].username,
                        'task_upcoming_deadline_daily',
                        { taskCode: tasks[i].code.toString(), title: tasks[i].title, from_date: tasks[i].from_date, to_date: tasks[i].to_date },
                        usernameToNotify,
                        [],
                        'notifyUpcomingDeadlineTasksDaily',
                        date.getTime(),
                    );
                }

                dfd.resolve(tasks.length);
            })
            .catch(err => {
                LogProvider.error("TaskService.notifyUpcomingDeadlineTasksDaily error:" + err.mes || err.message, err);
                dfd.reject(err);
            });

        return dfd.promise;
    }

    notifyUpcomingDeadlineTasksWeekly(dbname_prefix) {
        let dfd = q.defer();
        const date = new Date();
        const overdueTaskFilter = [
            {
                $addFields: {
                    targetFromDate: {
                        $toDouble: {
                            $dateTrunc: { date: date, unit: "day", timezone: "+07", },
                        },
                    },
                    targetToDate: {
                        $toDouble: {
                            $dateAdd: {
                                startDate: { $dateTrunc: { date: date, unit: "day", timezone: "+07", }, },
                                unit: "day",
                                amount: 7,
                            },
                        },
                    },
                },
            },
            {
                $match: {
                    $and: [
                        { status: { $ne: "Completed" } },
                        { $expr: { $gte: ["$to_date", "$targetFromDate"], }, },
                        { $expr: { $lte: ["$to_date", "$targetToDate"], }, },
                    ],
                },
            },
        ]

        MongoDBProvider.loadAggregate_onOffice(dbname_prefix, "task", overdueTaskFilter)
            .then((tasks) => {
                let groupNotifications = [];
                for (var i in tasks) {
                    let usernameToNotify = [];
                    usernameToNotify = usernameToNotify.concat(tasks[i].observer);
                    usernameToNotify = usernameToNotify.concat(tasks[i].main_person);
                    usernameToNotify = usernameToNotify.concat(tasks[i].participant);
                    usernameToNotify = _.uniq(usernameToNotify);

                    for (var j in usernameToNotify) {
                        let group = groupNotifications.find(pre => pre.usernameToNotify === usernameToNotify[j]);
                        if (group) {
                            group.tasks.push({
                                title: tasks[i].title,
                                from_date: tasks[i].from_date,
                                to_date: tasks[i].to_date
                            });
                        } else {
                            groupNotifications.push(
                                {
                                    usernameToNotify: usernameToNotify[j],
                                    tasks: [{
                                        title: tasks[i].title,
                                        from_date: tasks[i].from_date,
                                        to_date: tasks[i].to_date
                                    }]
                                }
                            );
                        }
                    }
                }

                for (var i in groupNotifications) {
                    RingBellItemService.insert(
                        dbname_prefix,
                        tasks[i].username,
                        'task_upcoming_deadline_weekly',
                        groupNotifications[i].tasks,
                        [groupNotifications[i].usernameToNotify],
                        [],
                        'notifyUpcomingDeadlineTasksWeekly',
                        date.getTime(),
                    );
                }
                dfd.resolve(groupNotifications.length);
            })
            .catch(err => {
                LogProvider.error("TaskService.notifyUpcomingDeadlineTasksWeekly error:" + err.mes || err.message, err);
                dfd.reject(err);
            });

        return dfd.promise;
    }

    insert_transferTicketTask(
        dbname_prefix,
        username,
        item
    ) {
        let dfd = q.defer();
        const d = new Date();
        item.in_department = true;
        q.fcall(function () {
            return generateTaskCode(dbname_prefix, item, item.source_id);
        }).then(code => {
            item.code = code;
            MongoDBProvider.insert_onOffice(
                dbname_prefix,
                'task',
                username,
                item,
            ).then(function (res) {
                dfd.resolve(res.ops[0]);
            }, function (err) {
                dfd.reject(err);
            });
        }, function(err){
            console.log(err)
        })

        return dfd.promise;
    }

    receive_task(dbname_prefix, username, code, event, status, note_receive) {
        return MongoDBProvider.update_onOffice(dbname_prefix, 'task', username,
            { code: { $eq: code } }
            ,
            {
                $set: { 
                    status: status,
                    note_receive: note_receive,
                    main_person: [username],
                }, 
                $push: { event },
            },
        )
    }

    approval_receive_task(dbname_prefix, username, code, event, status, note_receive) {
        return MongoDBProvider.update_onOffice(dbname_prefix, 'task', username,
            { code: { $eq: code } },
            {
                $set: { 
                    status: status,
                    note_receive: note_receive,
                    observer: [username],
                }, 
                $push: { event },
            },
        )
    }

    reject_receive_task(dbname_prefix, username, code, event, status, note_receive) {
        return MongoDBProvider.update_onOffice(dbname_prefix, 'task', username,
            { code: { $eq: code } }
            ,
            {
                $set: { status: status, note_receive: note_receive }, $push: { event },
            },
        )
    }

    reject_approval_receive_task(dbname_prefix, username, code, event, status, note_receive) {
        return MongoDBProvider.update_onOffice(dbname_prefix, 'task', username,
            { code: { $eq: code } }
            ,
            {
                $set: { status: status, note_receive: note_receive }, $push: { event },
            },
        )
    }

    loadAggregate_onOffice(dbname_prefix, filter) {
        return MongoDBProvider.loadAggregate_onOffice(dbname_prefix, "task", filter);
    }

    update_head_task(dbname_prefix, username, dataUpdate) {
        const {
            code,
            event,
            title,
            estimate,
            department,
            content,
            to_date,
            from_date,
            priority,
            label,
            attachment,
            observer,
            main_person,
            participant
        } = dataUpdate;
        return MongoDBProvider.update_onOffice(dbname_prefix, "task", username,
            { code: { $eq: code } },
            { 
                $set: {
                    title: title,
                    estimate: estimate,
                    department: department,
                    content: content,
                    to_date: to_date,
                    from_date: from_date,
                    priority: priority,
                    label: label,
                    attachment: attachment,
                    observer: observer,
                    main_person: main_person,
                    participant: participant,
                },
                $push: { event } 
            }
        );
    }

}

class UserService {
    constructor() {
        this.collection = 'user';
    }

    loadUsers(dbname_prefix, usernameArray) {
        return MongoDBProvider.load_onManagement(dbname_prefix, this.collection, {
            username: { $in: usernameArray }
        }, 0, 0, {}, { username: true, title: true });
    }

    loadEmployeeByDepartmentId(dbPrefix, departmentId) {
        const dfd = q.defer();
        MongoDBProvider.load_onManagement(dbPrefix, this.collection, {
            department: departmentId,
        }, 0, 0, {}, { username: true, title: true })
            .then(dfd.resolve)
            .catch(dfd.reject);
        return dfd.promise;
    }

    loadDetails(dbname_prefix, employeeId) {
        let dfd = q.defer();
        let dfdAr = [];
        dfdAr.push(MongoDBProvider.load_onManagement(dbname_prefix, 'user',
            { 'employee': { $eq: employeeId } }, undefined, undefined, undefined,
            { _id: true, username: true, title: true, avatar: true },
        ));
        dfdAr.push(MongoDBProvider.load_onOffice(dbname_prefix, 'employee',
            { '_id': new ObjectId(employeeId)},
            undefined, undefined, undefined,
            {
                signature: true,
                fullname: true,
                lastname: true,
                midname: true,
                firstname: true,
                department: true,
                competence: true,
            },
        ));
        let dfdArray = [];
        q.all(dfdAr).then(
            function (data) {
                const userDetail = data[0][0];
                const employeeDetail = data[1][0];
                if (userDetail && employeeDetail) {
                    if (userDetail && userDetail.avatar) {
                        const filePath = '/management/user/avatar/' + userDetail.username + '/' + userDetail.avatar.name;
                        if (FileConst.modeProduction === 'development') {
                            userDetail.avatar.url =
                                FileConst.tenantDomain + '/files/' + dbname_prefix + filePath;
                        } else {
                            dfdArray.push(
                                gcpProvider.getSignedUrl(dbname_prefix + filePath).then(
                                    (imgUrl) => {
                                        userDetail.avatar.url = imgUrl;
                                    },
                                    (err) => {
                                        userDetail.avatar.url =
                                            settings.adminDomain + '/datasources/images/default/avatar_default.png';
                                    },
                                ),
                            );
                        }
                    } else {
                        userDetail.avatar = {
                            url: settings.adminDomain + '/datasources/images/default/avatar_default.png',
                        };
                    }
                    employeeDetail.userInfo = userDetail;
                    if (dfdArray.length > 0) {
                        q.all(dfdArray).then(
                            () => {
                                dfd.resolve(employeeDetail);
                            },
                            () => {
                                dfd.resolve(employeeDetail);
                            },
                        );
                    } else {
                        dfd.resolve(employeeDetail);
                    }
                } else {
                    dfd.resolve(null)
                }
            },
            function (err) {
                dfd.reject(err);
            },
        );
        return dfd.promise;
    }

    loadAggregateUser(dbname_prefix, filter) {
        return MongoDBProvider.loadAggregate_onManagement(dbname_prefix, "user", filter);
    }

    loadEmployeeNoTask(dbname_prefix, filter) {
        let dfd = q.defer();
        MongoDBProvider.loadAggregate_onManagement(dbname_prefix, 'user', filter).then(
            function (data) {
                dfd.resolve(data);
            },
            function (err) {
                dfd.reject(err);
                err = undefined;
            }
        );
        return dfd.promise;
    }

    countEmployeeNoTask(dbname_prefix, filter) {
        let dfd = q.defer();
        MongoDBProvider.loadAggregate_onManagement(dbname_prefix, 'user', filter).then(
            function (data) {
                dfd.resolve(data[0]);
            },
            function (err) {
                dfd.reject(err);
                err = undefined;
            }
        );
        return dfd.promise;
    }
}

class ProjectService {

    constructor() { }

    getProjects(dbname_prefix, projectIdArrays = [], fields = []) {
        let projectIdObjectArray = projectIdArrays.map(e => new require('mongodb').ObjectID(e));
        const filter = {};
        if (Array.isArray(projectIdObjectArray) && projectIdObjectArray.length > 0) {
            filter._id = { $in: projectIdObjectArray };
        }
        return MongoDBProvider.load_onOffice(dbname_prefix, "project", filter, 0, 0, {}, { _id: true, title: true, code: true, department: true, abbreviation: true, })
    }

    getProjectByCode(dbname_prefix, code) {
        const dfd = q.defer();
        MongoDBProvider.load_onOffice(dbname_prefix, 'project', { code })
            .then(function (projects) {
                if (!Array.isArray(projects) || projects.length === 0) {
                    dfd.resolve(null);
                } else {
                    dfd.resolve(projects[0]);
                }
            })
            .catch(function (error) {
                dfd.reject(error);
            });
        return dfd.promise;
    }

    getProjectById(dbname_prefix, projectId) {
        return MongoDBProvider.getOne_onOffice(
            dbname_prefix,
            'project',
            { _id: new require('mongodb').ObjectId(projectId) }
        )
    }

    loadProjectByReference(dbPrefix, task) {
        const dfd = q.defer();
        const filter = {
            reference: {
                $elemMatch: {
                    object: 'Task',
                    id: task._id.toString(),
                },
            },
        };
        MongoDBProvider.load_onOffice(dbPrefix, 'project', filter)
            .then(function (data) {
                if (!Array.isArray(data) || data.length === 0) {
                    return q.resolve(null);
                } else {
                    return q.resolve(data[0]);
                }
            })
            .then(function (project) {
                if (project) {
                    Object.assign(task, { reference_project: project });
                }
                dfd.resolve(task);
            })
            .catch(function (err) {
                dfd.reject(err);
            });
        return dfd.promise;
    }

}

class DepartmentService {
    constructor() { }

    getDepartments(dbname_prefix, departmentIdArrays) {
        return MongoDBProvider.load_onOffice(dbname_prefix, "organization", { id: { $in: departmentIdArrays } }, 0, 0, {}, { id: true, title: true })
    }

    getDepartmentById(dbname_prefix, departmentId) {
        const dfd = q.defer();
        MongoDBProvider.load_onOffice(dbname_prefix, 'organization', {
            id: departmentId,
        })
            .then(function (departments) {
                if (departments.length > 0) {
                    dfd.resolve(departments[0]);
                } else {
                    dfd.resolve(null);
                }
            })
            .catch(function (err) {
                dfd.reject(err);
            });
        return dfd.promise;
    }

    load_department(dbname_prefix, body, check = {}) {
        const dfd = q.defer();

        q.fcall(() => {
            return exports.DirectoryService.loadByMasterKey(dbname_prefix, 'competence');
        })
            .then((directories) => {
                const competences = directories.map(directory => ({
                    value: directory.value,
                    ordernumber: directory.ordernumber,
                }));
                const filter = generateStatisticDepartmnetAggeration({
                    check,
                    body,
                    competences,
                });

                return MongoDBProvider.loadAggregate_onOffice(dbname_prefix, 'organization', filter);
            })
            .then((result) => {
                const promises = result.map(item => loadLeaderDetail(dbname_prefix, item));
                return q.all(promises);
            })
            .then((result) => {
                dfd.resolve(result);
            })
            .catch(error => {
                dfd.reject(error);
            })
        return dfd.promise;
    }

    load_department_by_id(dbname_prefix, id) {
        return MongoDBProvider.load_onOffice(dbname_prefix, 'organization', {
          id: { $eq: id },
        });
    }
}

class TaskManagementService {
    constructor() { }
    getGeneralInChiefOfDepartment(dbname_prefix, departmentId) {
        let dfd = q.defer();
        MongoDBProvider.load_onManagement(dbname_prefix, 'user',
            {
                $and: [
                    { department: { $eq: departmentId } },
                    { competence: { $eq: 'Generalinchief' } }
                ]
            }
        ).then(function (data) {
            // A department will have only one person is General-In-Chief
            dfd.resolve(data.shift());
        }, function (err) {
            dfd.reject(err);
            err = undefined;
        })
        return dfd.promise;
    }
}

class WorkflowPlayService {
    constructor() { }
    getWorkFlowDetailsById(dbname_prefix, workflowPlayId) {
        let dfd = q.defer();
        MongoDBProvider.load_onOffice(
            dbname_prefix,
            "workflow_play",
            { _id: { $eq: new require('mongodb').ObjectID(workflowPlayId) } },
            0,
            0,
            {},
            { _id: true, code: true, title: true, username: true, department: true, status: true, attachment: true, customTemplate: true, event: true })
            .then(data => {
                dfd.resolve(data[0]);
            }, err => {
                dfd.reject(err);
            });
        return dfd.promise;
    }

    loadTransferTicketByReference(dbname_prefix, task) {
        let dfd = q.defer();
        MongoDBProvider.load_onOffice(
            dbname_prefix,
            "workflow_play",
            { 'parents.code':  task.code },
            0,
            0,
            {},
            {}
        )
            .then(data => {
                Object.assign(task, { transfer_tickets: data })
                dfd.resolve(task);
            }, err => {
                dfd.reject(err);
            });
        return dfd.promise;
    }
}

class WorkItemService {
    constructor() { }
    genTransferTicketTemplateTags(dbname_prefix, department_assign_id, department_receive_id, creatorTitle, tagValues, isPreview) {
        const dfd = q.defer();
        const object = {
            'ngay': { type: CUSTOM_TEMPLATE_TAG_TYPE.NUMBER },
            'thang': { type: CUSTOM_TEMPLATE_TAG_TYPE.NUMBER },
            'nam': { type: CUSTOM_TEMPLATE_TAG_TYPE.NUMBER },
            'tieude': { type: CUSTOM_TEMPLATE_TAG_TYPE.TEXT },
            'noidung': { type: CUSTOM_TEMPLATE_TAG_TYPE.TEXT },
            'tendonvi': { type: CUSTOM_TEMPLATE_TAG_TYPE.TEXT },
            'cancu': { type: CUSTOM_TEMPLATE_TAG_TYPE.TEXT },
            'thuchien': { type: CUSTOM_TEMPLATE_TAG_TYPE.TEXT },
            'tenvtdonvi': { type: CUSTOM_TEMPLATE_TAG_TYPE.TEXT },
            'noinhan': { type: CUSTOM_TEMPLATE_TAG_TYPE.TEXT },
            'tendonvinhan': { type: CUSTOM_TEMPLATE_TAG_TYPE.TEXT },
            'sopc': { type: CUSTOM_TEMPLATE_TAG_TYPE.NUMBER },
        };
        const promises = [];
        q.fcall(() => {
            const date = new Date();
            promises.push(
                templateUtil.resolveTextValue(
                    object,
                    'ngay',
                    date.getDate(),
                ));
            promises.push(
                templateUtil.resolveTextValue(
                    object,
                    'thang',
                    date.getMonth() + 1,
                ));
            promises.push(
                templateUtil.resolveTextValue(
                    object,
                    'nam',
                    date.getFullYear(),
                ));

            promises.push(
                templateUtil.resolveTextValue(
                    object,
                    'tieude',
                    tagValues['title'],
                ));

            promises.push(
                templateUtil.resolveTextValue(
                    object,
                    'noidung',
                    tagValues['content'],
                ));
            promises.push(
                templateUtil.resolveTextValue(
                    object,
                    'cancu',
                    tagValues['base'],
                ));
            promises.push(
                templateUtil.resolveTextValue(
                    object,
                    'thuchien',
                    tagValues['perform'],
                ));
            promises.push(
                templateUtil.resolveTextValue(
                    object,
                    'noinhan',
                    tagValues['recipient'],
                ));


            const servicePromises = [];
            if (isPreview) {
                servicePromises.push(MongoDBProvider.getOne_onManagement(
                    dbname_prefix,
                    'sequenceid',
                    { name: { $eq: WORK_ITEM_SEQUENCE_NUMBER_KEY() } }
                ).then(ticketSequence => {
                    promises.push(
                        templateUtil.resolveTextValue(
                            object,
                            'sopc',
                            ticketSequence.value + 1,
                        ));
                }).catch(error => {
                    promises.push(
                        templateUtil.resolveTextValue(
                            object,
                            'sopc',
                            1,
                        ));
                }));
            } else {
                servicePromises.push(MongoDBProvider.getAutoIncrementNumber_onManagement(
                    dbname_prefix,
                    WORK_ITEM_SEQUENCE_NUMBER_KEY(),
                ).then(number => {
                    promises.push(
                        templateUtil.resolveTextValue(
                            object,
                            'sopc',
                            number,
                        ));
                }));
            }

            const departmentService = new DepartmentService();
            servicePromises.push(departmentService.getDepartmentById(dbname_prefix, department_assign_id).then(department => {
                promises.push(
                    templateUtil.resolveTextValue(
                        object,
                        'tendonvi',
                        department['title']['vi-VN'],
                    ));
                promises.push(
                    templateUtil.resolveTextValue(
                        object,
                        'tenvtdonvi',
                        department['abbreviation'],
                    ));
            }));

            servicePromises.push(departmentService.getDepartmentById(dbname_prefix, department_receive_id).then(department => {
                promises.push(
                    templateUtil.resolveTextValue(
                        object,
                        'tendonvinhan',
                        department['title']['vi-VN'],
                    ));
            }));

            return q.all(servicePromises);
        }).then(() => {
            return q.all(promises);
        }).then(() => {
            dfd.resolve(object);
        }).catch((err) => {
            dfd.reject(err);
        });
        return dfd.promise;
    }

    getHeadTaskWorkItems(dbname_prefix, head_task_id) {
        const filter = {
            "parent.object": OBJECT_NAME.TASK,
            "parent.value": head_task_id,
        };
        return MongoDBProvider.load_onOffice(dbname_prefix, "task", filter);
    }

    getHeadTask(dbname_prefix, head_task_id) {
        const filter = {
            _id: new require('mongodb').ObjectID(head_task_id),
        };
        return MongoDBProvider.load_onOffice(dbname_prefix, "task", filter);
    }

    processTransferTicket(dbPrefix, department_assign_id, department_receive_id, creator, tagValues) {
        const dfd = q.defer();
        let templateDocument;
        const username = creator.username;
        q.fcall(() => {
            const templatePath = path.join(
                TRANSFER_TICKET_TEMPLATE_CONFIG.folder || '',
                TRANSFER_TICKET_TEMPLATE_CONFIG.name,
            );

            return q.all([
                this.genTransferTicketTemplateTags(dbPrefix, department_assign_id, department_receive_id, creator.title, tagValues, false),
                FileProvider.downloadBuffer(templatePath),
            ]);
        })
            .then(([documentTags, buffer]) => {
                templateDocument = new DocumentTemplate(buffer);
                templateDocument.processTagsValue(documentTags);
                const bufferResult = templateDocument.getAsBuffer();
                return q.all([
                    FileProvider.uploadByBuffer(
                        dbPrefix,
                        bufferResult,
                        'transfer-ticket',
                        username,
                        `pc_${new Date().getTime()}.docx`,
                        undefined,
                        'office',),
                    documentTags['sopc'].value]);
            })
            .then(([fileInfo, ticketNumber]) => {
                const storageFolder = path.join(
                    dbPrefix,
                    'office',
                    'transfer-ticket',
                    username,
                );
                dfd.resolve({
                    nameLib: fileInfo.nameLib,
                    display: `Phiếu chuyển số ${ticketNumber}.docx`,
                    name: fileInfo.named,
                    type: fileInfo.type,
                    folder: storageFolder,
                    signature: {
                        isSigned: false
                    },
                    tagValues
                });
            })
            .catch((error) => {
                dfd.reject({
                    path: 'WorkItemService.processTransferTicket',
                    mes: 'Unexpected error occur when processing template',
                    err: error,
                });
            });
        return dfd.promise;
    }

    processPreviewTransferTicket(dbPrefix, department_assign_id, department_receive_id, creator, tagValues) {
        const dfd = q.defer();
        let templateDocument;
        q.fcall(() => {
            const templatePath = path.join(
                TRANSFER_TICKET_TEMPLATE_CONFIG.folder || '',
                TRANSFER_TICKET_TEMPLATE_CONFIG.name,
            );

            return q.all([
                this.genTransferTicketTemplateTags(dbPrefix, department_assign_id, department_receive_id, creator.title, tagValues, true),
                FileProvider.downloadBuffer(templatePath),
            ]);
        })
            .then(([documentTags, fileBuffer]) => {
                templateDocument = new DocumentTemplate(fileBuffer, {
                    dbPrefix,
                });
                templateDocument.processTagsValue(documentTags);
                const buffer = templateDocument.getAsBuffer();
                return FileProvider.uploadByBuffer(
                    dbPrefix,
                    buffer,
                    'transfer-ticket',
                    '',
                    `tmp_${new Date().getTime()}.docx`,
                    'custom-template',
                    'temp',
                );
            })
            .then(function (fileInfo) {
                const filePath = `${dbPrefix}/temp/custom-template/transfer-ticket/${fileInfo.named}`;
                return FileProvider.makeFilePublic(filePath);
            })
            .then((data) => {
                dfd.resolve({
                    url: data,
                });
            })
            .catch(function (error) {
                dfd.reject({
                    path: 'WorkItemService.processPreviewTransferTicket',
                    mes: 'Unexpected error occur when processing template',
                    err: error,
                });
            });
        return dfd.promise;
    }

    genTransferTicketSignatureTags(dbPrefix, signer) {
        const dfd = q.defer();

        const signerTags = {
            'tenlanhdao': { type: CUSTOM_TEMPLATE_TAG_TYPE.TEXT },
            'chuky': { type: CUSTOM_TEMPLATE_TAG_TYPE.SIGNATURE }
        }

        q.fcall(() => {
            const promises = [];

            promises.push(
                templateUtil.resolveTextValue(
                    signerTags,
                    'tenlanhdao',
                    signer.fullname,
                ));

            promises.push(
                templateUtil.resolveSignature(
                    signerTags,
                    'chuky',
                    dbPrefix,
                    signer
                ));

            return q.all(promises);
        }).then(() => {
            dfd.resolve(signerTags)
        }).catch(error => {
            dfd.reject({
                path: 'WorkItemService.genTransferTicketSignatureTags.err',
                mes: 'Process generate signature tags error',
                err: error,
            });
        });

        return dfd.promise;
    }

    processSignTransferTicket(dbPrefix, transferTicket, currentActor) {
        const dfd = q.defer();
        let templateDocument;

        let transferTicketInfo = transferTicket.transfer_ticket_info;
        q.fcall(() => {
            const filePath = path.join(
                transferTicketInfo.folder || '',
                transferTicketInfo.name,
            );

            return q.all([
                FileProvider.downloadBuffer(filePath),
                this.genTransferTicketSignatureTags(dbPrefix, currentActor.employee_details)
            ]);
        }).then(([buffer, documentTags]) => {
            templateDocument = new DocumentTemplate(buffer);
            templateDocument.processTagsValue(documentTags);
            const bufferResult = templateDocument.getAsBuffer();

            return FileProvider.uploadByBuffer(
                dbPrefix,
                bufferResult,
                'transfer-ticket',
                transferTicket.username,
                `pc_${new Date().getTime()}.docx`,
                undefined,
                'office',
            );
        }).then((fileInfo) => {
            const storageFolder = path.join(
                dbPrefix,
                'office',
                'transfer-ticket',
                currentActor.username,
            );
            dfd.resolve({
                nameLib: fileInfo.nameLib,
                display: transferTicketInfo.display,
                name: fileInfo.named,
                type: fileInfo.type,
                folder: storageFolder,
            });
        }).catch((error) => {
            dfd.reject({
                path: 'WorkItemService.processSignTransferTicket.err',
                mes: 'Process sign transfer ticket error',
                err: error,
            });
        });

        return dfd.promise;
    }

    updateProcessTransferTicket(
        dbname_prefix,
        username,
        id,
        transferTicketInfo,
        event
    ) {
        return MongoDBProvider.update_onOffice(
            dbname_prefix,
            'task',
            username,
            {
                $and: [{ _id: { $eq: new require('mongodb').ObjectID(id) } }],
            },
            {
                $push: {
                    event,
                },
                $set: {
                    transfer_ticket_info: transferTicketInfo,
                    status: 'NotSeen'
                },
            },
        );
    }

    checkUserHaveRuleToCreateWorkItem(user, workItemDepartmentId) {
        let isHaveAddRule = false;
        const createTaskDepartmentRule = user.rule.find(rule => rule.rule === 'Office.Task.Create_Task_Department');
        if (createTaskDepartmentRule) {
            switch (createTaskDepartmentRule.details.type) {
                case "Working":
                    isHaveAddRule = user.department === workItemDepartmentId;
                    break;
                case "All":
                    isHaveAddRule = true;
                    break;
                case "Specific":
                    isHaveAddRule = createTaskDepartmentRule.details.department.includes(workItemDepartmentId);
                    break;
            }
        }
        return isHaveAddRule;
    }

    checkUserHaveRuleToCreateTaskFromHeadTask(dbNamePrefix, user, task) {
        const dfd = q.defer();
        q.fcall(function () {
            if (!isValidValue(task.level) || task.level === TASK_LEVEL.TASK) {
                return dfd.resolve(false);
            }
            if (task.project) {
                return exports.ProjectService.getProjectById(dbNamePrefix, task.project);
            }
            return q.resolve(null);
        })
            .then(function (project) {
                if (task.project) {
                    return checkPermissionForTaskOfProject(user, project);
                } else {
                    return checkPermissionForTaskOfDepartment(user, task.department);
                }
            })
            .then(function (isHaveAddRule) {
                return dfd.resolve(isHaveAddRule);
            })
            .catch(function (err) {
                return dfd.reject(err);
            });
        return dfd.promise;
    }

}

class DispatchArrivedService {

    constructor() { }

    getDetailById(dbPrefix, id) {
        const dfd = q.defer();
        MongoDBProvider.load_onOffice(dbPrefix, 'dispatch_arrived', { _id: new require('mongodb').ObjectId(id) })
            .then(function (data) {
                if (data[0]) {
                    return dfd.resolve(data[0]);
                }
                return dfd.resolve(null);
            })
            .catch(function (err) {
                LogProvider.error('Can not find dispatch arrived with reason: ' + err.mes || err.message);
                return dfd.reject({
                    path: 'DispatchArrivedService.getDetailById.err',
                    mes: 'CanNotFindDispatchArrived',
                    err: err,
                });
            });
        return dfd.promise;
    }

}

class NotifyService {
    constructor() { }

    loadNotifyByReference(dbPrefix, task) {
        const dfd = q.defer();
        const filter = {
            reference: {
                $elemMatch: { object: 'task', id: task._id.toString() },
            },
        };
        MongoDBProvider.load_onOffice(dbPrefix, 'notify', filter)
            .then(function (result) {
                if (Array.isArray(result) && result.length > 0) {
                    Object.assign(task, { notify_detail: result[0] });
                }
                dfd.resolve();
            })
            .catch(function (error) {
                dfd.reject(error);
            });
        return dfd.promise;
    }
}

class LabelService {
    constructor() {
        this.collection = 'label';
    }

    loadLabelReference(dbPrefix, task) {
        const dfd = q.defer();
        const collectionName = this.collection;
        const fieldName = 'label_details';
        q.fcall(function () {
            if (!Array.isArray(task.label) || task.label.length === 0) {
                Object.assign(task, { [fieldName]: [] });
                return dfd.resolve();
            }
            const filter = {
                _id: {
                    $in: task.label.map(item => new mongodb.ObjectId(item)),
                },
            };
            return q.resolve(filter);
        })
            .then(function (filter) {
                return MongoDBProvider.load_onOffice(dbPrefix, "label", filter);
            })
            .then(function (data) {
                Object.assign(task, {
                    [fieldName]: data,
                });
                dfd.resolve();
            })
            .catch(function (error) {
                dfd.reject(error);
            });
        return dfd.promise;
    }

}

class DirectoryService {
    constructor() {
        this.collection = 'directory';
    }

    loadByMasterKey(dbPrefix, masterKey) {
        const fiter = {
            master_key: masterKey
        }
        return MongoDBProvider.load_onManagement(
            dbPrefix,
            this.collection,
            fiter,
        );
    }

}

exports.ProjectService = new ProjectService();
exports.DepartmentService = new DepartmentService();
exports.TaskService = new TaskService();
exports.UserService = new UserService();
exports.TaskManagementService = new TaskManagementService();
exports.WorkflowPlayService = new WorkflowPlayService();
exports.WorkItemService = new WorkItemService();
exports.DispatchArrivedService = new DispatchArrivedService();
exports.NotifyService = new NotifyService();
exports.LabelService = new LabelService();
exports.UserService = new UserService();
exports.DirectoryService = new DirectoryService();
