const department = require("@shared/setup/items/office/department");
const { TASK_GROUP_FILTER, TAB_FILTER, TASK_LEVEL, TASK_STATUS, TASK_EVENT, TASK_PRIORITY, TASK_STATE, ROLE_FILTER, TASK_RULE } = require("./constant");
const { checkRuleCheckBox } = require("./ruleUtils");

const INVALID_DATA = [undefined, null, "", "null", "undefined"];
const TASK_STATE_MILE_STONE = 75;

function prepareTaskState(aggregationSteps = []) {
    aggregationSteps.push({
        $addFields: {
            all_username: {
                $concatArrays: ["$main_person", "$participant", "$observer", ["$username"]],
            },
            total_duration: {
                $subtract: ["$to_date", "$from_date"],
            },
            last_updated_time: {
                $switch: {
                    branches: [
                        {
                            case: { $and: [{ $eq: ["$status", TASK_STATUS.COMPLETED] }] },
                            then: {
                                $toLong: {
                                    $ifNull: [
                                        {
                                            $arrayElemAt: [
                                                "$event.time",
                                                {
                                                    $indexOfArray: [
                                                        "$event.action",
                                                        TASK_EVENT.COMPLETED
                                                    ]
                                                }
                                            ]
                                        },
                                        {
                                            $toLong: "$$NOW",
                                        },
                                    ],
                                },
                            },
                        },
                    ],
                    default: {
                        $toLong: "$$NOW",
                    },
                },
            },
        },
    });
    aggregationSteps.push({
        $addFields: {
            elapsed_percent: {
                $cond: [
                    { $eq: ["$total_duration", 0] },
                    100,
                    {
                        $round: [
                            {
                                $divide: [
                                    {
                                        $multiply: [
                                            {
                                                $subtract: ["$last_updated_time", "$from_date"],
                                            },
                                            100,
                                        ],
                                    },
                                    "$total_duration",
                                ],
                            },
                            0,
                        ],
                    },
                ],
            },
        },
    });
    aggregationSteps.push({
        $addFields: {
            state: {
                $switch: {
                    branches: [
                        {
                            case: { $eq: ["$status", TASK_STATUS.CANCELLED] },
                            then: TASK_STATUS.CANCELLED,
                        },
                        {
                            case: { $eq: ["$status", TASK_STATUS.COMPLETED] },
                            then: {
                                $switch: {
                                    branches: [
                                        {
                                            case: { $gt: ["$last_updated_time", "$to_date"] },
                                            then: TASK_STATE.LATE,
                                        },
                                        {
                                            case: { $gte: ["$elapsed_percent", TASK_STATE_MILE_STONE] },
                                            then: TASK_STATE.ON_SCHEDULE,
                                        },
                                    ],
                                    default: TASK_STATE.EARLY,
                                },
                            },
                        },
                        {
                            case: { $ne: ["$status", TASK_STATUS.COMPLETED] },
                            then: {
                                $switch: {
                                    branches: [
                                        {
                                            case: { $gt: ["$last_updated_time", "$to_date"] },
                                            then: TASK_STATE.OVERDUE,
                                        },
                                        {
                                            case: { $gte: ["$elapsed_percent", TASK_STATE_MILE_STONE] },
                                            then: TASK_STATE.GONNA_LATE,
                                        },
                                    ],
                                    default: TASK_STATE.OPEN,
                                },
                            },
                        },
                    ],
                    default: null,
                },
            },
        },
    });
}

function prepareTaskProgress(aggregationSteps = []) {
    aggregationSteps.push({
        $addFields: { task_id: { $toString: "$_id" } }
    });

    aggregationSteps.push({
        $lookup: {
            from: "task",
            localField: "task_id",
            foreignField: "head_task_id",
            as: "workItems",
        }
    });

    aggregationSteps.push({
        $addFields: {
            workItemsLength: {
                $size: "$workItems",
            },
            completedWorkItemsCount: {
                $size: {
                    $filter: {
                        input: "$workItems",
                        cond: {
                            $eq: ["$$this.status", TASK_STATUS.COMPLETED],
                        }
                    }
                }
            }
        }
    });

    aggregationSteps.push({
        $addFields: {
            progress: {
                $switch: {
                    branches: [
                        {
                            case: {
                                $gt: ["$workItemsLength", 0]
                            },
                            then: {
                                $floor: {
                                    $multiply: [
                                        {
                                            $divide: [
                                                "$completedWorkItemsCount",
                                                "$workItemsLength"
                                            ]
                                        },
                                        100
                                    ]
                                }
                            }
                        }
                    ],
                    default: "$progress"
                }
            }
        }
    })
}

function prepareTaskDefaultFields(aggregationSteps = []) {
    aggregationSteps.push({
        $addFields: {
            attachment: {
                $ifNull: ["$attachment", []],
            },
        },
    });
}

function prepareTaskDepartmentFilter(aggregationSteps = [], { body, check }) {
    const conditions = [];
    exports.generateTabFilterForDepartment(conditions, body.tab, {
        isGeneralInChief: check.isManager,
        // department: body.department,
        employees: body.employee,
    });
    if (Array.isArray(body.employee) && body.employee.length > 0) {
        exports.generateEmployeeFilter(conditions, body.employee);
    } else {
        exports.generateDepartmentEmployeesFilter(conditions, body.department, body.departmentEmployees);
    }
    exports.generateTaskWaitingReceiveFilter(conditions, body.status, body.session);

    exports.generateStatusFilter(conditions, body.status, body);
    exports.generateDateRangeFilter(conditions, body.from_date, body.to_date);
    exports.generatePriorityFilter(conditions, body.priority);
    exports.generateStateFilter(conditions, body.state);
    exports.generateTaskTypeFilter(conditions, body.task_type);
    exports.generateLabelFilter(conditions, body.label);
    exports.generateTaskGroupFilter(conditions, body.task_group);
    exports.generateProjectsFilter(conditions, body.projects);

    aggregationSteps.push({ $match: { $and: conditions } });
}

function prepareParentTaskFilterForDepartment(aggregationSteps = [], { body, check }) {
    const conditions = [];
    conditions.push({
        $and: [
            {
                $or: [
                    { department: { $eq: body.department } },
                    {
                        department: { $in: INVALID_DATA },
                        $or: [
                            { main_person: { $in: body.employee } },
                            { participant: { $in: body.employee } },
                            { observer: { $in: body.employee } },
                            { username: { $in: body.employee } },
                        ],
                    },
                ],
            },
            {
                $or: [
                    {
                        head_task_id: { $in: INVALID_DATA },
                        level: { $in: [TASK_LEVEL.TASK, TASK_LEVEL.HEAD_TASK] },
                    },
                    {
                        level: { $eq: TASK_LEVEL.TRANSFER_TICKET },
                        status: { $nin: [TASK_STATUS.PENDING_APPROVAL] },
                    },
                ],
            },
        ],
    });
    exports.generateDateRangeFilter(conditions, body.from_date, body.to_date);
    exports.generateStatusFilter(conditions, body.status, body);
    exports.generateStateFilter(conditions, body.state);
    exports.generatePriorityFilter(conditions, body.priority);
    exports.generateTaskTypeFilter(conditions, body.task_type);
    exports.generateLabelFilter(conditions, body.label);
    exports.generateTaskGroupFilter(conditions, body.task_group);
    exports.generateProjectsFilter(conditions, body.projects);
    aggregationSteps.push({
        $match: {
            $and: conditions,
        },
    });
}

function prepareChildTaskFilterForDepartment(aggregationSteps = [], { body, check }) {
    const conditions = [];
    const childTaskConditions = {
        $and: [
            {
                $or: [
                    { department: { $eq: body.department } },
                    {
                        department: { $in: INVALID_DATA },
                        $or: [
                            { main_person: { $in: body.employee } },
                            { participant: { $in: body.employee } },
                            { observer: { $in: body.employee } },
                            { username: { $in: body.employee } },
                        ],
                    },
                ],
            },
            {
                $or: [{ level: { $eq: TASK_LEVEL.TASK } }, { level: { $exists: false } }],
            },
        ],
    }
    if (check.isManager) {
        conditions.push({
            $and: [
                { head_task_id: { $nin: INVALID_DATA } },
                {
                    $or: [
                        childTaskConditions,
                        {
                            department_assign_id: { $eq: body.department },
                            level: { $eq: TASK_LEVEL.TRANSFER_TICKET },
                        }
                    ]
                }
            ]
        });
    } else {
        conditions.push({
            $and: [
                { head_task_id: { $nin: INVALID_DATA } },
                childTaskConditions
            ]
        });
    }

    exports.generateDateRangeFilter(conditions, body.from_date, body.to_date);
    exports.generateStatusFilter(conditions, body.status, body);
    exports.generateStateFilter(conditions, body.state);
    exports.generatePriorityFilter(conditions, body.priority);
    exports.generateTaskTypeFilter(conditions, body.task_type);
    exports.generateLabelFilter(conditions, body.label);
    exports.generateTaskGroupFilter(conditions, body.task_group);
    exports.generateProjectsFilter(conditions, body.projects);

    aggregationSteps.push({
        $match: {
            $and: conditions,
        },
    });
}

function prepareStatisticCountDepartmentFilter(aggregationSteps = [], { body }) {
    const conditions = [];
    const departmentOrEmployeeFilter = {
        $or: [
            // { department: body.department },
            { all_username: { $in: body.employee } },
        ],
    };
    conditions.push(departmentOrEmployeeFilter);
    exports.generateDateRangeFilter(conditions, body.from_date, body.to_date);
    exports.generatePriorityFilter(conditions, body.priority);
    exports.generateStatusFilter(conditions, body.status, body);
    exports.generateTaskTypeFilter(conditions, body.task_type);
    exports.generateLabelFilter(conditions, body.label);
    exports.generateTaskGroupFilter(conditions, body.task_group);
    exports.generateProjectsFilter(conditions, body.projects);
    aggregationSteps.push({
        $match: {
            $and: conditions,
        },
    });
}

function prepareTaskProjectFilter(aggregationSteps = [], { body, check }) {
    const conditions = [];
    exports.generateDateRangeFilter(conditions, body.from_date, body.to_date);
    exports.generateTabFilterForProject(conditions, body.tab, { project: body.project });
    exports.generateEmployeeFilter(conditions, body.participant);
    exports.generatePriorityFilter(conditions, body.priority);
    exports.generateStatusFilter(conditions, body.status, body);
    exports.generateStateFilter(conditions, body.state);
    exports.generateTaskTypeFilter(conditions, body.task_type);
    exports.generateLabelFilter(conditions, body.label);
    aggregationSteps.push({ $match: { $and: conditions } });
}

function prepareParentTaskFilterForProject(aggregationSteps = [], { body, check }) {
    const conditions = [
        { project: { $eq: body.project } },
        { head_task_id: { $in: INVALID_DATA } },
    ];
    exports.generateDateRangeFilter(conditions, body.from_date, body.to_date);
    exports.generateTaskEmployeeFilter(conditions, body.participant);
    exports.generatePriorityFilter(conditions, body.priority);
    exports.generateStatusFilter(conditions, body.status, body);
    exports.generateStateFilter(conditions, body.state);
    exports.generateTaskTypeFilter(conditions, body.task_type);
    exports.generateLabelFilter(conditions, body.label);
    aggregationSteps.push({
        $match: {
            $and: conditions,
        },
    });
}

function prepareChildTaskFilterForProject(aggregationSteps = [], { body, check }) {
    const conditions = [
        { project: { $eq: body.project } },
        { head_task_id: { $nin: INVALID_DATA } },
    ];
    exports.generateDateRangeFilter(conditions, body.from_date, body.to_date);
    exports.generateTaskEmployeeFilter(conditions, body.participant);
    exports.generatePriorityFilter(conditions, body.priority);
    exports.generateStatusFilter(conditions, body.status, body);
    exports.generateStateFilter(conditions, body.state);
    exports.generateTaskTypeFilter(conditions, body.task_type);
    exports.generateLabelFilter(conditions, body.label);
    aggregationSteps.push({
        $match: {
            $and: conditions,
        },
    });
}

function prepareStatisticCountProjectFilter(aggregationSteps = [], { body }) {
    const conditions = [];
    conditions.push({ project: { $eq: body.project } });
    exports.generateDateRangeFilter(conditions, body.from_date, body.to_date);
    exports.generateTaskEmployeeFilter(conditions, body.participant);
    exports.generatePriorityFilter(conditions, body.priority);
    exports.generateStatusFilter(conditions, body.status, body);
    exports.generateStateFilter(conditions, body.state);
    exports.generateTaskTypeFilter(conditions, body.task_type);
    exports.generateLabelFilter(conditions, body.label);
    aggregationSteps.push({
        $match: {
            $and: conditions,
        },
    });
}

function prepareTaskPersonalFilter(aggregationSteps = [], { body }) {
    const conditions = [];
    exports.generateTabFilterForPersonal(conditions, body.tab, { username: body.username });
    exports.generateDateRangeFilter(conditions, body.from_date, body.to_date);
    exports.generatePriorityFilter(conditions, body.priority);
    exports.generateStatusFilter(conditions, body.status, body);
    exports.generateStateFilter(conditions, body.state);
    exports.generateTaskTypeFilter(conditions, body.task_type);
    exports.generateLabelFilter(conditions, body.label);
    exports.generateTaskGroupFilter(conditions, body.task_group);
    exports.generateProjectsFilter(conditions, body.projects);
    aggregationSteps.push({ $match: { $and: conditions } });
}

function prepareStatisticPersonalTabFilter(aggregationSteps = [], { body }) {
    switch (body.tab) {
        case TAB_FILTER.CREATED:
            aggregationSteps.push({
                $match: { username: { $eq: body.username } },
            });
            break;

        case TAB_FILTER.ASSIGNED:
            aggregationSteps.push({
                $or: [
                    { main_person: { $eq: body.username } },
                    { participant: { $eq: body.username } },
                    { observer: { $eq: body.username } },
                ],
            });
            break;
    }
}

function prepareSearch(aggregationSteps = [], { body }) {
    if (body.search) {
        aggregationSteps.push({
            $match:
            {
                $text: {
                    $search: `"${body.search}"`
                }
            }
        });
    }
}

function prepareStateSort(aggregationSteps = []) {
    aggregationSteps.push({
        $addFields: {
            stateOrder: {
                $switch: {
                    branches: [
                        {
                            case: { $eq: ["$state", TASK_STATE.OVERDUE] },
                            then: 1
                        },
                        {
                            case: { $eq: ["$state", TASK_STATE.GONNA_LATE] },
                            then: 2
                        },
                        {
                            case: { $eq: ["$state", TASK_STATE.OPEN] },
                            then: 3
                        },
                        {
                            case: { $eq: ["$state", TASK_STATE.LATE] },
                            then: 4
                        },
                        {
                            case: { $eq: ["$state", TASK_STATE.ON_SCHEDULE] },
                            then: 5
                        },
                        {
                            case: { $eq: ["$state", TASK_STATE.EARLY] },
                            then: 6
                        }
                    ],
                    default: 7,
                },
            },
        },
    })
    aggregationSteps.push({
        $sort: {
            "stateOrder": 1,
        },
    });

}

function prepareStatisticCount(aggregationSteps = []) {
    aggregationSteps.push({
        $group: {
            _id: "statistic",
            completed: {
                $sum: {
                    $cond: [{ $eq: ["$status", TASK_STATUS.COMPLETED] }, 1, 0],
                },
            },
            done: {
                $sum: {
                    $cond: [{ $eq: ["$status", TASK_STATUS.DONE] }, 1, 0],
                },
            },
            process: {
                $sum: {
                    $cond: [{ $eq: ["$status", TASK_STATUS.PROCESSING] }, 1, 0],
                },
            },
            not_start: {
                $sum: {
                    $cond: [{ $eq: ["$status", TASK_STATUS.NOT_STARTED_YET] }, 1, 0],
                },
            },
            cancelled: {
                $sum: {
                    $cond: [{ $eq: ["$status", TASK_STATUS.CANCELLED] }, 1, 0],
                },
            },
            pending_approval: {
                $sum: {
                    $cond: [{ $eq: ["$status", TASK_STATUS.PENDING_APPROVAL] }, 1, 0],
                },
            },
            waitting: {
                $sum: {
                    $cond: [{ $eq: ["$status", TASK_STATUS.WAITING_FOR_APPROVAL] }, 1, 0],
                },
            },
            
            not_seen: {
                $sum: {
                    $cond: [{ $eq: ["$status", TASK_STATUS.NOT_SEEN] }, 1, 0],
                },
            },
            waiting_receive: {
                $sum: {
                    $cond: [{ $eq: ["$status", TASK_STATUS.WAITING_RECEIVE] }, 1, 0],
                },
            },
            all: {
                $sum: 1,
            },
        },
    });
    aggregationSteps.push({
        $unset: ["_id"]
    });
}

function prepareStatisticGrowth(aggregationSteps = []) {
    aggregationSteps.push({
        $facet: {
            created: [
                { $match: { date_created: { $exists: true, $type: "string" } } },
                { $group: { _id: "$date_created", count: { $sum: 1 } } },
            ],
            completed: [
                { $match: { date_completed: { $exists: true, $type: "string" } } },
                { $group: { _id: "$date_completed", count: { $sum: 1 } } },
            ],
            cancelled: [
                { $match: { date_cancelled: { $exists: true, $type: "string" } } },
                { $group: { _id: "$date_cancelled", count: { $sum: 1 } } },
            ]
        },
    });
}

function preparePagination(aggregationSteps = [], { body }) {
    if (parseInt(body.offset)) {
        aggregationSteps.push({
            $skip: parseInt(body.offset),
        });
    }
    if (parseInt(body.top)) {
        aggregationSteps.push({
            $limit: parseInt(body.top),
        });
    }

}

function prepareCount(aggregationSteps = []) {
    aggregationSteps.push({
        $count: "count",
    });
}

exports.generateTabFilterForDepartment = function (
    conditions = [],
    tab,
    { department, isGeneralInChief, employees = [] },
) {
    let filter;
    const filterTaskLevels = [TASK_LEVEL.HEAD_TASK];
    if (isGeneralInChief) {
        filterTaskLevels.push(TASK_LEVEL.TRANSFER_TICKET);
    }

    switch (tab) {
        case TAB_FILTER.HEAD_TASK:
            filter = {
                $and: [
                    { level: { $in: filterTaskLevels } },
                    { status: { $nin: [TASK_STATUS.PENDING_APPROVAL] } },
                ],
            };
            conditions.push(filter);
            break;

        case TAB_FILTER.TASK:
            filter = {
                $or: [
                    {
                        $and: [
                            { $or: [{ level: { $eq: "Task" } }, { level: { $exists: false } }] },
                        ],
                    },
                ],
            };
            if (isGeneralInChief) {
                filter.$or.push({
                    department_assign_id: { $eq: department },
                    level: { $eq: TASK_LEVEL.TRANSFER_TICKET },
                });
            }
            conditions.push(filter);
            break;
    }
};

exports.generateTabFilterForProject = function (conditions = [], tab, { project }) {
    switch (tab) {
        case TAB_FILTER.HEAD_TASK:
            conditions.push({
                $and: [
                    { project: { $eq: project } },
                    { level: { $in: [TASK_LEVEL.HEAD_TASK, TASK_LEVEL.TRANSFER_TICKET] } },
                    { status: { $nin: [TASK_STATUS.PENDING_APPROVAL] } },
                ],
            });
            break;
        case TAB_FILTER.TASK:
            conditions.push({
                $and: [
                    { project: { $eq: project } },
                    { $or: [{ level: { $eq: TASK_LEVEL.TASK } }, { level: { $exists: false } }] },
                ],
            });
            break;
    }
};


exports.generateTabFilterForPersonal = function (conditions = [], tab, { username }) {
    switch (tab) {
        case TAB_FILTER.CREATED:
            conditions.push({ username: { $eq: username } });
            break;
        case TAB_FILTER.ASSIGNED:
            conditions.push({
                $or: [
                    { main_person: { $eq: username } },
                    { participant: { $eq: username } },
                    { observer: { $eq: username } }
                ]
            });
            break;
        case TAB_FILTER.RESPONSIBLE:
            conditions.push({ main_person: { $eq: username } });
            break;
        case TAB_FILTER.SUPPORT:
            conditions.push({ participant: { $eq: username } });
            break;
        case TAB_FILTER.SUPERVISION:
            conditions.push({ observer: { $eq: username } });
            break;
    }
};

exports.generateSearchFilter = function (condition = [], val) {
    if (!val) {
        return;
    }
    condition.push({ $text: { $search: `"${val}"` } });
};

exports.generateTaskWaitingReceiveFilter = function (condition = [], val, user) {


    
};

exports.generateStatusFilter = function (condition = [], val, body) {

    let status = [];
    const conditionStatus = [];
    
    const department = body.department ? body.department : body.session.department;
    condition.push({
        status: {
            $nin: [TASK_STATUS.WAITING_FOR_ACCEPT, TASK_STATUS.REJECTED],
        },
    });
    // if(checkRuleCheckBox(TASK_RULE.RECEIVE_TASK,user)){
    //     condition.push({  });
    // }
    if(!Array.isArray(val) && typeof val === "string"){
        status = [val];
    }

    if (Array.isArray(val) && val.length > 0) {
        status = val;
    }

    // if(status.includes(TASK_STATUS.WAITING_LEAD_DEPARTMENT_APPROVE_RECEIVE)){
    //     conditionStatus.push({
    //         $and: [
    //             { status: { $eq: TASK_STATUS.WAITING_LEAD_DEPARTMENT_APPROVE_RECEIVE } },
    //             { from_department: { $eq: user.department } }
    //         ]
    //     });
    //     status = status.filter(item => item !== TASK_STATUS.WAITING_LEAD_DEPARTMENT_APPROVE_RECEIVE);
    // }

    // if(status.includes(TASK_STATUS.WAITING_RECEIVE)){
    //     conditionStatus.push({
    //         $and: [
    //             { status: { $eq: TASK_STATUS.WAITING_RECEIVE } },
    //             { department: { $eq: user.department } }
    //         ]
    //     });
    //     status = status.filter(item => item !== TASK_STATUS.WAITING_RECEIVE);
    // }
    // console.log({conditionStatus})
    // if (status.length > 0) {
    //     conditionStatus.push({
    //         $and: [
    //             { status: { $in: status, } },
    //             { department: { $eq: user.department } },
    //         ]
    //     });
    // }else{
    //     conditionStatus.push({
    //         department: { $eq: user.department, }
    //     });
    // }

    status.forEach(item => {
        switch(item){
            // case TASK_STATUS.WAITING_RECEIVE:
            //     conditionStatus.push({
            //         $and: [
            //             { status: { $eq: item } },
            //             { department: { $eq: user.department } }
            //         ]
            //     });
            //     break;
            case TASK_STATUS.WAITING_LEAD_DEPARTMENT_APPROVE_RECEIVE:
                conditionStatus.push({
                    $and: [
                        { status: { $eq: item } },
                        { from_department: { $eq: department } }
                    ]
                });
                break;
            default: 
                conditionStatus.push({
                    $and: [
                        { status: { $eq: item } },
                        { department: { $eq: department } }
                    ]
                });
        }
    });

    if(conditionStatus.length > 0){
        condition.push({
            $or: [
                ...conditionStatus
            ]
        })
    }else{
        condition.push({
            department: { $eq: department }
        })
    }
    
};

exports.generateDateRangeFilter = function (condition = [], fromDate, toDate) {
    if (fromDate && toDate) {
        condition.push({
            $or: [
                {
                    $and: [{ from_date: { $lte: fromDate } }, { to_date: { $gte: fromDate } }],
                },
                {
                    $and: [{ from_date: { $lte: toDate } }, { to_date: { $gte: toDate } }],
                },
                {
                    $and: [{ from_date: { $gte: fromDate } }, { to_date: { $lte: toDate } }],
                },
                {
                    $and: [{ from_date: { $lte: fromDate } }, { to_date: { $gte: toDate } }],
                },
            ],
        });
    }
};

exports.generateEmployeeFilter = function (condition = [], val = []) {
    if (!Array.isArray(val) || val.length === 0) {
        return;
    }
    condition.push({
        all_username: {
            $in: val,
        },
    });
};



exports.generateDepartmentEmployeesFilter = function (condition = [], department, employees = []) {
    condition.push({
        $or: [
            { department: { $eq: department } },
            {
                $or: [
                    { main_person: { $in: employees } },
                    { participant: { $in: employees } },
                    { observer: { $in: employees } },
                ],
            },
        ],
    });
};

exports.generatePriorityFilter = function (condition = [], val = []) {
    if (!Array.isArray(val) || val.length === 0) {
        return;
    }
    condition.push({
        priority: { $in: val },
    });
};

exports.generateStateFilter = function (conditions = [], val = []) {
    if (!Array.isArray(val) || val.length === 0) {
        return;
    }
    conditions.push({
        state: {
            $in: val,
        },
    });
};

exports.generateTaskTypeFilter = function (conditions = [], val = []) {
    if (!Array.isArray(val) || val.length === 0) {
        return;
    }
    conditions.push({
        task_type: { $in: val },
    });
};

exports.generateLabelFilter = function (conditions = [], val = []) {
    if (!Array.isArray(val) || val.length === 0) {
        return null;
    }
    conditions.push({
        label: {
            $in: val,
        },
    });
};

exports.generateTaskGroupFilter = function (conditions = [], val = []) {
    if (!Array.isArray(val) || val.length === 0) {
        return;
    }

    const filter = {
        $or: [],
    };

    for (const valElement of val) {
        switch (valElement) {
            case TASK_GROUP_FILTER.DEPARTMENT:
                filter.$or.push({
                    department: {
                        $exists: true,
                        $ne: null,
                    },
                });
                break;

            case TASK_GROUP_FILTER.PROJECT:
                filter.$or.push({
                    project: {
                        $exists: true,
                        $ne: null,
                    },
                });
                break;
        }
    }
    if (filter.$or.length > 0) {
        conditions.push(filter);
    }
};

exports.generateTaskEmployeeFilter = function (conditions = [], val) {
    if (!Array.isArray(val) || val.length === 0) {
        return;
    }
    conditions.push({
        $or: [
            { username: { $in: val } },
            { main_person: { $in: val } },
            { participant: { $in: val } },
            { observer: { $in: val } },
        ],
    });
};

exports.generateProjectsFilter = function (conditions = [], val = []) {
    if (!Array.isArray(val) || val.length === 0) {
        return;
    }
    conditions.push({
        project: {
            $in: val,
        },
    });
};

exports.generateRoleFilter = function (conditions = [], val = []) {
    if (!Array.isArray(val) || val.length === 0) {
        return;
    }
    conditions.push({
        project: {
            $in: val,
        },
    });
};

function prepareCombinedSort(aggregationSteps = []) {
    aggregationSteps.push({
        $addFields: {
            stateOrder: {
                $switch: {
                    branches: [
                        { case: { $eq: ["$state", TASK_STATE.OVERDUE] }, then: 1 },
                        { case: { $eq: ["$state", TASK_STATE.GONNA_LATE] }, then: 2 },
                        { case: { $eq: ["$state", TASK_STATE.OPEN] }, then: 3 },
                        { case: { $eq: ["$state", TASK_STATE.LATE] }, then: 4 },
                        { case: { $eq: ["$state", TASK_STATE.ON_SCHEDULE] }, then: 5 },
                        { case: { $eq: ["$state", TASK_STATE.EARLY] }, then: 6 }
                    ],
                    default: 7,
                },
            },
            statusOrder: {
                $switch: {
                    branches: [
                        { case: { $eq: ["$status", TASK_STATUS.NOT_SEEN] }, then: 1 },
                        { case: { $eq: ["$status", TASK_STATUS.PENDING_APPROVAL] }, then: 2 },
                        { case: { $eq: ["$status", TASK_STATUS.PROCESSING] }, then: 3 },
                        { case: { $eq: ["$status", TASK_STATUS.WAITING_FOR_APPROVAL] }, then: 4 },
                        { case: { $eq: ["$status", TASK_STATUS.COMPLETED] }, then: 5 },
                        { case: { $eq: ["$status", TASK_STATUS.CANCELLED] }, then: 6 }
                    ],
                    default: 7,
                },
            },
        },
    });
    aggregationSteps.push({
        $sort: { "stateOrder": 1, "statusOrder": 1 },
    });
}

function prepareDoSort(aggregationSteps = [], queryCriteria) {
    if (queryCriteria.sort) {
        aggregationSteps.push({ $sort: queryCriteria.sort });
    }
}

function addDepartmentFields(aggregationSteps = []) {
    // Xử lý department
    aggregationSteps.push({
        $lookup: {
            from: "organization",
            localField: "userInfo.department",
            foreignField: "id",
            as: "department_info"
        }
    });

    aggregationSteps.push({
        $addFields: {
            department_title: {
                $ifNull: [{ $arrayElemAt: ["$department_info.title", 0] }, false]
            }
        }
    });

    aggregationSteps.push({
        $lookup: {
            from: "organization",
            localField: "to_department",
            foreignField: "id",
            as: "to_department_info"
        }
    });

    aggregationSteps.push({
        $addFields: {
            to_department_title: {
                $ifNull: [{ $arrayElemAt: ["$to_department_info.title", 0] }, false]
            }
        }
    });

    // Xử lý to_department
    // aggregationSteps.push({
    //     $addFields: {
    //         to_department_ids: {
    //             $map: {
    //                 input: "$to_department",
    //                 as: "dept",
    //                 in: { $toString: "$$dept" }
    //             }
    //         }
    //     }
    // });

    // aggregationSteps.push({
    //     $lookup: {
    //         from: "organization",
    //         localField: "to_department_ids",
    //         foreignField: "id",
    //         as: "to_department_info"
    //     }
    // });

    // aggregationSteps.push({
    //     $addFields: {
    //         to_department_titles: {
    //             $map: {
    //                 input: "$to_department_ids",
    //                 as: "dept_id",
    //                 in: {
    //                     $let: {
    //                         vars: {
    //                             matched_dept: {
    //                                 $arrayElemAt: [
    //                                     {
    //                                         $filter: {
    //                                             input: "$to_department_info",
    //                                             cond: { $eq: ["$$this.id", "$$dept_id"] }
    //                                         }
    //                                     },
    //                                     0
    //                                 ]
    //                             }
    //                         },
    //                         in: { $ifNull: ["$$matched_dept.title", false] }
    //                     }
    //                 }
    //             }
    //         }
    //     }
    // });

    // Loại bỏ các trường tạm thời
    aggregationSteps.push({
        $project: {
            department_info: 0,
            to_department_info: 0,
            to_department_ids: 0
        }
    });
}

function prepareAddFieldCount(conditions = []){
    conditions.push({
        $addFields: {
            participants: {
                $reduce: {
                    input: [
                        { field: "$main_person", role: "main_person" },
                        { field: "$participant", role: "participant" },
                        { field: "$observer", role: "observer" }
                    ],
                    initialValue: [],
                    in: {
                        $concatArrays: [
                            "$$value",
                            {
                                $cond: {
                                    if: {
                                        $and: [
                                            { $ne: ["$$this.field", null] },
                                            { $ne: ["$$this.field", []] },
                                            { $ne: ["$$this.field", ""] }
                                        ]
                                    },
                                    then: {
                                        $cond: {
                                            if: { $isArray: "$$this.field" },
                                            then: {
                                                $map: {
                                                    input: "$$this.field",
                                                    as: "user",
                                                    in: { username: "$$user", role: "$$this.role" }
                                                }
                                            },
                                            else: [{ username: "$$this.field", role: "$$this.role" }]
                                        }
                                    },
                                    else: []
                                }
                            }
                        ]
                    }
                }
            }
        }
    });

    conditions.push({ $unwind: "$participants" });
    
    conditions.push({
        $group: {
            _id: { taskId: "$_id", username: "$participants.username" },
            roles: { $addToSet: "$participants.role" },
            taskData: { $first: "$$ROOT" }
        }
    });

    conditions.push({
        $replaceRoot: {
            newRoot: {
                $mergeObjects: [
                    "$taskData",
                    {
                        participants: {
                            username: "$_id.username",
                            role: "$roles"
                        }
                    }
                ]
            }
        }
    });

    conditions.push({
        $lookup: {
            from: "user",
            localField: "participants.username",
            foreignField: "username",
            as: "userInfo"
        }
    });

    conditions.push({
        $addFields: {
            userInfo: { $arrayElemAt: ["$userInfo", 0] }
        }
    });

    return conditions;
}

function prepareSelect(conditions = []){
    conditions.push({
        $project: {
            title: 1,
            code: 1,
            titleName: "$userInfo.title",
            username: "$participants.username",
            roles: "$participants.role",
            department: "$userInfo.department",
            projectTitle: "$projectInfo.title",
            labelTitles: "$labels",
            from_date: 1,
            to_date: 1,
            estimate: 1,
            worktimes: 1,
            date_completed: 1,
            state: 1,
            status: 1,
            to_department_titles: 1,
            department_title: 1,
        }
    });
    return conditions;
}

function prepareStatisticTaskPerson(aggregationSteps = [], username) {
    
    aggregationSteps.push({
        $addFields: {
            main_person: {
                $cond: [
                    { $isArray: "$main_person" },
                    "$main_person",
                    { $ifNull: [["$main_person"], []] }
                ],
            },
            participant: {
                $cond: [
                    { $isArray: "$participant" },
                    "$participant",
                    { $ifNull: [["$participant"], []] }
                ],
            },
            observer: {
                $cond: [
                    { $isArray: "$observer" },
                    "$observer",
                    { $ifNull: [["$observer"], []] }
                ],
            },
        },
    });

    aggregationSteps.push({
        $match: {
            $or: [
                { "main_person": username },
                { "participant": username },
                { "observer": username }
            ],
            status: { $ne: TASK_STATUS.CANCELLED },
        },
    });

    aggregationSteps.push({
        $project: {
            role_data: {
                main_person: "$main_person",
                participant: "$participant",
                observer: "$observer",
                estimate: {
                    $cond: [
                        { $or: [{ $eq: ["$estimate", null] }, { $eq: ["$estimate", NaN] }] },
                        0,        
                        "$estimate"
                    ],
                },
                worktimes: {
                    $cond: [
                        { $or: [{ $eq: ["$worktimes", null] }, { $eq: ["$worktimes", NaN] }] },
                        0,        
                        "$worktimes"
                    ],
            },
                status: "$status",
                from_date: "$from_date",
            },
        },
    });

    aggregationSteps.push({
        $group: {
            _id: null,
            total_main_tasks: {
                $sum: {
                    $cond: [
                        { $in: [username, "$role_data.main_person"] },
                        1,
                        0,
                    ],
                },
            },
            completed_main_tasks: {
                $sum: {
                    $cond: [
                        {
                            $and: [
                                { $in: [username, "$role_data.main_person"] },
                                { $eq: ["$role_data.status", TASK_STATUS.COMPLETED] },
                            ],
                        },
                        1,
                        0,
                    ],
                },
            },
            not_completed_main_tasks: {
                $sum: {
                    $cond: [
                        {
                            $and: [
                                { $in: [username, "$role_data.main_person"] },
                                { $ne: ["$role_data.status", TASK_STATUS.COMPLETED] },
                            ],
                        },
                        1,
                        0,
                    ],
                },
            },
            processing_main_tasks: {
                $sum: {
                    $cond: [
                        {
                            $and: [
                                { $in: [username, "$role_data.main_person"] },
                                { $eq: ["$role_data.status", TASK_STATUS.PROCESSING] },
                                { $ne: ["$role_data.from_date", null] },
                            ],
                        },
                        1,
                        0,
                    ],
                },
            },
            total_main_estimate: {
                $sum: {
                    $cond: [
                        { $in: [username, "$role_data.main_person"] },
                        "$role_data.estimate",
                        0,
                    ],
                },
            },
            total_main_worktimes: {
                $sum: {
                    $cond: [
                        { $in: [username, "$role_data.main_person"] },
                        "$role_data.worktimes",
                        0,
                    ],
                },
            },

            total_participant_tasks: {
                $sum: {
                    $cond: [
                        { $in: [username, "$role_data.participant"] },
                        1,
                        0,
                    ],
                },
            },
            completed_participant_tasks: {
                $sum: {
                    $cond: [
                        {
                            $and: [
                                { $in: [username, "$role_data.participant"] },
                                { $eq: ["$role_data.status", TASK_STATUS.COMPLETED] },
                            ],
                        },
                        1,
                        0,
                    ],
                },
            },
            not_completed_participant_tasks: {
                $sum: {
                    $cond: [
                        {
                            $and: [
                                { $in: [username, "$role_data.participant"] },
                                { $ne: ["$role_data.status", TASK_STATUS.COMPLETED] },
                            ],
                        },
                        1,
                        0,
                    ],
                },
            },
            processing_participant_tasks: {
                $sum: {
                    $cond: [
                        {
                            $and: [
                                { $in: [username, "$role_data.participant"] },
                                { $eq: ["$role_data.status", TASK_STATUS.PROCESSING] },
                                { $ne: ["$role_data.from_date", null] },
                            ],
                        },
                        1,
                        0,
                    ],
                },
            },
            total_participant_estimate: {
                $sum: {
                    $cond: [
                        { $in: [username, "$role_data.participant"] },
                        "$role_data.estimate",
                        0,
                    ],
                },
            },
            total_participant_worktimes: {
                $sum: {
                    $cond: [
                        { $in: [username, "$role_data.participant"] },
                        "$role_data.worktimes",
                        0,
                    ],
                },
            },

            total_observer_tasks: {
                $sum: {
                    $cond: [
                        { $in: [username, "$role_data.observer"] },
                        1,
                        0,
                    ],
                },
            },
            completed_observer_tasks: {
                $sum: {
                    $cond: [
                        {
                            $and: [
                                { $in: [username, "$role_data.observer"] },
                                { $eq: ["$role_data.status", TASK_STATUS.COMPLETED] },
                            ],
                        },
                        1,
                        0,
                    ],
                },
            },
            not_completed_observer_tasks: {
                $sum: {
                    $cond: [
                        {
                            $and: [
                                { $in: [username, "$role_data.observer"] },
                                { $ne: ["$role_data.status", TASK_STATUS.COMPLETED] },
                            ],
                        },
                        1,
                        0,
                    ],
                },
            },
            processing_observer_tasks: {
                $sum: {
                    $cond: [
                        {
                            $and: [
                                { $in: [username, "$role_data.observer"] },
                                { $eq: ["$role_data.status", TASK_STATUS.PROCESSING] },
                                { $ne: ["$role_data.from_date", null] },
                            ],
                        },
                        1,
                        0,
                    ],
                },
            },
            total_observer_estimate: {
                $sum: {
                    $cond: [
                        { $in: [username, "$role_data.observer"] },
                        "$role_data.estimate",
                        0,
                    ],
                },
            },
            total_observer_worktimes: {
                $sum: {
                    $cond: [
                        { $in: [username, "$role_data.observer"] },
                        "$role_data.worktimes",
                        0,
                    ],
                },
            },
        },
    });

    aggregationSteps.push({
        $project: {
            result: [
                {
                    key: "main_person",
                    totalTasks: "$total_main_tasks",
                    completedTasks: "$completed_main_tasks",
                    notCompletedTasks: "$not_completed_main_tasks",
                    processingTasks: "$processing_main_tasks",
                    totalEstimate: "$total_main_estimate",
                    totalWorktimes: "$total_main_worktimes",
                },
                {
                    key: "participant",
                    totalTasks: "$total_participant_tasks",
                    completedTasks: "$completed_participant_tasks",
                    notCompletedTasks: "$not_completed_participant_tasks",
                    processingTasks: "$processing_participant_tasks",
                    totalEstimate: "$total_participant_estimate",
                    totalWorktimes: "$total_participant_worktimes",
                },
                {
                    key: "observer",
                    totalTasks: "$total_observer_tasks",
                    completedTasks: "$completed_observer_tasks",
                    notCompletedTasks: "$not_completed_observer_tasks",
                    processingTasks: "$processing_observer_tasks",
                    totalEstimate: "$total_observer_estimate",
                    totalWorktimes: "$total_observer_worktimes",
                },
            ],
        },
    });

    aggregationSteps.push({
        $unset: ["_id"],
    });

}

function prepareAddField(conditions = []) {
    conditions.push({
        $addFields: {
            participants: {
                $reduce: {
                    input: [
                        { field: "$main_person", role: "main_person" },
                        { field: "$participant", role: "participant" },
                        { field: "$observer", role: "observer" }
                    ],
                    initialValue: [],
                    in: {
                        $concatArrays: [
                            "$$value",
                            {
                                $cond: {
                                    if: {
                                        $and: [
                                            { $ne: ["$$this.field", null] },
                                            { $ne: ["$$this.field", []] },
                                            { $ne: ["$$this.field", ""] }
                                        ]
                                    },
                                    then: {
                                        $cond: {
                                            if: { $isArray: "$$this.field" },
                                            then: {
                                                $map: {
                                                    input: "$$this.field",
                                                    as: "user",
                                                    in: { username: "$$user", role: "$$this.role" }
                                                }
                                            },
                                            else: [{ username: "$$this.field", role: "$$this.role" }]
                                        }
                                    },
                                    else: []
                                }
                            }
                        ]
                    }
                }
            }
        }
    });

    conditions.push({ $unwind: "$participants" });

    conditions.push({
        $group: {
            _id: { taskId: "$_id", username: "$participants.username" },
            roles: { $addToSet: "$participants.role" },
            taskData: { $first: "$$ROOT" }
        }
    });

    conditions.push({
        $replaceRoot: {
            newRoot: {
                $mergeObjects: [
                    "$taskData",
                    {
                        participants: {
                            username: "$_id.username",
                            role: "$roles"
                        }
                    }
                ]
            }
        }
    });

    conditions.push({
        $lookup: {
            from: "user",
            localField: "participants.username",
            foreignField: "username",
            as: "userInfo"
        }
    });

    conditions.push({
        $addFields: {
            userInfo: { $arrayElemAt: ["$userInfo", 0] }
        }
    });

    conditions.push({
        $addFields: {
            projectObjectId: { $toObjectId: "$project" }
        }
    });

    conditions.push({
        $lookup: {
            from: "project",
            localField: "projectObjectId",
            foreignField: "_id",
            as: "projectInfo"
        }
    });

    conditions.push({
        $addFields: {
            projectInfo: { $arrayElemAt: ["$projectInfo", 0] }
        }
    });

    conditions.push({
        $addFields: {
            labelIds: {
                $map: {
                    input: "$label",
                    as: "labelJ",
                    in: { $toObjectId: "$$labelJ" }
                }
            }
        }
    });

    conditions.push({
        $lookup: {
            from: "label",
            localField: "labelIds",
            foreignField: "_id",
            as: "labels"
        }
    });

    conditions.push({
        $sort: {
            "participants.username": 1, 
            "participants.role": 1,
            "from_date": 1
        }
    });

    return conditions;
}

function prepareStatisticTaskCompletedFilter(aggregationSteps = [], { body }) {
    const conditions = [];
    exports.generateFromDateRangeFilter(conditions, body.from_date, body.to_date);
    exports.generateFilterStatisticTaskCompleted(conditions, body.employee, body.department);
    exports.generateStatusFilterForStatisticTaskCompleted(conditions);
    aggregationSteps.push({ $match: { $and: conditions } });
}

function prepareStatisticTaskUncompletedFilter(aggregationSteps = [], { body }) {
    const conditions = [];
    exports.generateFromDateRangeFilter(conditions, body.from_date, body.to_date);
    exports.generateFilterStatisticTaskCompleted(conditions, body.employee, body.department);
    exports.generateStatusFilterForStatisticTaskUncompleted(conditions);
    aggregationSteps.push({ $match: { $and: conditions } });
}

exports.generateFromDateRangeFilter = function (condition = [], fromDate, toDate) {
    if (fromDate && toDate) {
        condition.push({
            $or: [
                { from_date: { $gte: fromDate, $lte: toDate } },
                { from_date: null }
            ]
        });
    }
};

exports.generateFilterStatisticTaskCompleted = function (conditions = [], employee, department) {
    if(Array.isArray(department) && department.length > 0) {
        conditions.push({
            "userInfo.department": { $in: department }
        });
    }
    if(Array.isArray(employee) && employee.length > 0) {
        conditions.push({
            "participants.username": { $in: employee }
    });
    }
};

exports.generateStatusFilterForStatisticTaskCompleted = function (conditions = []) {
    conditions.push({
        status: TASK_STATUS.COMPLETED
    });
};

exports.generateStatusFilterForStatisticTaskUncompleted = function (conditions = []) {
    conditions.push({
        status: { $nin: [TASK_STATUS.COMPLETED, TASK_STATUS.CANCELLED] }
    });
};

exports.buildLoadBaseDepartmentAggregation = function (body, check) {
    const aggregationSteps = [];
    prepareSearch(aggregationSteps, { body });
    prepareTaskState(aggregationSteps);
    // prepareTaskProgress(aggregationSteps);
    prepareTaskDefaultFields(aggregationSteps);
    prepareTaskDepartmentFilter(aggregationSteps, { body, check });
    prepareCombinedSort(aggregationSteps);
    prepareDoSort(aggregationSteps, body);
    preparePagination(aggregationSteps, { body });

    return aggregationSteps;
};

exports.buildCountBaseDepartmentAggregation = function (body, check) {
    const aggregationSteps = [];

    prepareSearch(aggregationSteps, { body });
    prepareTaskState(aggregationSteps);
    // prepareTaskProgress(aggregationSteps);
    prepareTaskDepartmentFilter(aggregationSteps, { body, check });
    prepareCount(aggregationSteps);

    return aggregationSteps;
};

exports.buildGanttChartForDepartmentAggregation = function (body, check) {
    const parentTaskAggregation = [];
    const childTaskAggregation = [];

    prepareSearch(parentTaskAggregation, { body });
    prepareSearch(childTaskAggregation, { body });

    prepareTaskState(parentTaskAggregation);
    prepareTaskState(childTaskAggregation);

    prepareParentTaskFilterForDepartment(parentTaskAggregation, { body, check });
    prepareChildTaskFilterForDepartment(childTaskAggregation, { body, check });

    prepareStateSort(parentTaskAggregation);
    prepareStateSort(childTaskAggregation)

    return {
        parentTaskAggregation,
        childTaskAggregation,
    };
};

exports.buildStatisticDepartmentCountAggregation = function (body) {
    const aggregationSteps = [];
    prepareSearch(aggregationSteps, { body });
    prepareTaskState(aggregationSteps);
    // prepareTaskProgress(aggregationSteps);
    prepareStatisticCountDepartmentFilter(aggregationSteps, { body });
    prepareStatisticCount(aggregationSteps);
    return aggregationSteps;
};

exports.buildStatisticDepartmentGrowthAggregation = function (body) {
    const aggregationSteps = [];
    prepareSearch(aggregationSteps, { body });
    prepareTaskState(aggregationSteps);
    // prepareTaskProgress(aggregationSteps);
    prepareStatisticCountDepartmentFilter(aggregationSteps, { body });
    prepareStatisticGrowth(aggregationSteps);
    return aggregationSteps;
};

exports.buildLoadBaseProjectAggregation = function (body, check) {
    const aggregationSteps = [];

    prepareSearch(aggregationSteps, { body });
    prepareTaskState(aggregationSteps);
    // prepareTaskProgress(aggregationSteps);
    prepareTaskDefaultFields(aggregationSteps);
    prepareTaskProjectFilter(aggregationSteps, { body, check });
    preparePagination(aggregationSteps, { body });

    return aggregationSteps;
}

exports.buildCountBaseProjectAggregation = function (body, check) {
    const aggregationSteps = [];

    prepareSearch(aggregationSteps, { body });
    prepareTaskState(aggregationSteps);
    // prepareTaskProgress(aggregationSteps);
    prepareTaskProjectFilter(aggregationSteps, { body, check });
    prepareCount(aggregationSteps);

    return aggregationSteps;
}

exports.buildGanttChartForProjectAggregation = function (body, check) {
    const parentTaskAggregation = [];
    const childTaskAggregation = [];

    prepareSearch(parentTaskAggregation, { body });
    prepareSearch(childTaskAggregation, { body });

    prepareTaskState(parentTaskAggregation);
    prepareTaskState(childTaskAggregation);

    prepareParentTaskFilterForProject(parentTaskAggregation, { body, check });
    prepareChildTaskFilterForProject(childTaskAggregation, { body, check });

    prepareStateSort(parentTaskAggregation);
    prepareStateSort(childTaskAggregation);

    return {
        parentTaskAggregation,
        childTaskAggregation,
    };
};

exports.buildStatisticProjectCountAggregation = function (body) {
    const aggregationSteps = [];

    prepareSearch(aggregationSteps, { body })
    prepareTaskState(aggregationSteps);
    // prepareTaskProgress(aggregationSteps);
    prepareStatisticCountProjectFilter(aggregationSteps, { body });
    prepareStatisticCount(aggregationSteps);
    return aggregationSteps;
};

exports.buildStatisticProjectGrowthAggregation = function (body) {
    const aggregationSteps = [];

    prepareSearch(aggregationSteps, { body });
    prepareTaskState(aggregationSteps);
    // prepareTaskProgress(aggregationSteps);
    prepareStatisticCountProjectFilter(aggregationSteps, { body });
    prepareStatisticGrowth(aggregationSteps);
    return aggregationSteps;
};

exports.buildLoadBasePersonalAggregation = function (body) {
    const aggregationSteps = [];

    prepareSearch(aggregationSteps, { body })

    prepareTaskState(aggregationSteps);
    // prepareTaskProgress(aggregationSteps);
    prepareTaskDefaultFields(aggregationSteps);
    prepareTaskPersonalFilter(aggregationSteps, { body });
    preparePagination(aggregationSteps, { body });

    return aggregationSteps;
};

exports.buildCountBasePersonalAggregation = function (body) {
    const aggregationSteps = [];

    prepareSearch(aggregationSteps, { body })
    prepareTaskState(aggregationSteps);
    // prepareTaskProgress(aggregationSteps);
    prepareTaskPersonalFilter(aggregationSteps, { body });
    prepareCount(aggregationSteps);

    return aggregationSteps;
};

exports.buildStatisticPersonalCountAggregation = function (body) {
    const aggregationSteps = [];
    prepareSearch(aggregationSteps, { body })
    prepareTaskState(aggregationSteps);
    // prepareTaskProgress(aggregationSteps);
    prepareTaskPersonalFilter(aggregationSteps, { body });
    prepareStatisticPersonalTabFilter(aggregationSteps, { body });
    prepareStatisticCount(aggregationSteps);
    return aggregationSteps;
};

exports.buildStatisticPersonalGrowthAggregation = function (body) {
    const aggregationSteps = [];
    prepareSearch(aggregationSteps, { body });
    prepareTaskState(aggregationSteps);
    // prepareTaskProgress(aggregationSteps);
    prepareTaskPersonalFilter(aggregationSteps, { body });
    prepareStatisticPersonalTabFilter(aggregationSteps, { body });
    prepareStatisticGrowth(aggregationSteps);
    return aggregationSteps;
};

exports.buildStatisticTasksPersonalAggregation = function (body) {
    const aggregationSteps = [];
    // prepareStatisticTaskPersonFilter(aggregationSteps, {body});
    prepareStatisticTaskPerson(aggregationSteps, body.username);
    return aggregationSteps;
};

exports.buildLoadStatisticTaskCompleted = function (body) {
    const aggregationSteps = [];
    prepareSearch(aggregationSteps, { body }); 
    prepareTaskState(aggregationSteps);
    prepareAddField(aggregationSteps);
    prepareStatisticTaskCompletedFilter(aggregationSteps, { body });
    prepareSelect(aggregationSteps);
    preparePagination(aggregationSteps, { body });
    return aggregationSteps;
};

exports.buildCountStatisticTaskCompleted = function (body) {
    const aggregationSteps = [];
    prepareAddFieldCount(aggregationSteps);
    prepareStatisticTaskCompletedFilter(aggregationSteps, { body });
    prepareCount(aggregationSteps);
    return aggregationSteps;
};

exports.buildLoadStatisticTaskUncompleted = function (body) {
    const aggregationSteps = [];
    prepareSearch(aggregationSteps, { body }); 
    prepareTaskState(aggregationSteps);
    prepareAddField(aggregationSteps);
    addDepartmentFields(aggregationSteps);
    prepareStatisticTaskUncompletedFilter(aggregationSteps, { body });
    prepareSelect(aggregationSteps);
    preparePagination(aggregationSteps, { body });
    return aggregationSteps;
};

exports.buildCountStatisticTaskUncompleted = function (body) {
    const aggregationSteps = [];
    prepareAddFieldCount(aggregationSteps);
    prepareStatisticTaskUncompletedFilter(aggregationSteps, { body });
    prepareCount(aggregationSteps);
    return aggregationSteps;
};

exports.buildExportStatisticTaskCompleted = function (body) {
    const aggregationSteps = [];
    prepareSearch(aggregationSteps, { body }); 
    prepareTaskState(aggregationSteps);
    prepareAddField(aggregationSteps);
    addDepartmentFields(aggregationSteps);
    prepareStatisticTaskCompletedFilter(aggregationSteps, { body });
    prepareSelect(aggregationSteps);
    preparePagination(aggregationSteps, { body });
    return aggregationSteps;
};
