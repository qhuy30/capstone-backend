const { TASK_GROUP_FILTER, TAB_FILTER, TASK_LEVEL, TASK_STATUS, TASK_EVENT, TASK_PRIORITY, TASK_STATE, ROLE_FILTER, TASK_RULE, HEAD_TASK_ORIGIN } = require("../../../utils/constant");
const q = require("q");
const { MongoDBProvider } = require("../../../shared/mongodb/db.provider");
const TASK_STATE_MILE_STONE = 75;
const {checkRuleCheckBox, checkRuleRadioDepartment} = require('../../../utils/ruleUtils');
const { TASK_ROLE } = require("./const");

function doSearchFilter(aggregationSteps = [], queryCriteria) {
    if (queryCriteria.search) {
        aggregationSteps.push({
            $match:
            {
                $text: {
                    $search: `"${queryCriteria.search}"`,
                },
            }
        });
    }
}

function generateMarkCompleteConditions(ruleDetails, department) {
    const conditions = [];
    if (ruleDetails && ruleDetails.rule == TASK_RULE.DEPARTMENT_LEADER_MANAGE &&  ruleDetails.details ) {
        switch (ruleDetails.details.type) {
            case "All":
                conditions.push({
                    $and: [
                        { progress: 100 },
                        { status: { $in: [TASK_STATUS.WAITING_FOR_APPROVAL, TASK_STATUS.PROCESSING] } },
                        { source_id: { $nin: [HEAD_TASK_ORIGIN.SCHOOL_OFFICE] } }
                    ]
                });
                break;
            case "Working":
                conditions.push({
                    $and: [
                        { progress: 100 },
                        { status: { $in: [TASK_STATUS.WAITING_FOR_APPROVAL, TASK_STATUS.PROCESSING] } },
                        {
                            $or: [
                                {
                                    department: department,
                                },
                                {department_assign_id: department}
                            ],
                        },
                        { level: { $in: [TASK_LEVEL.HEAD_TASK, TASK_LEVEL.TRANSFER_TICKET] } },
                    ],
                });
                break;
            case "Specific":
                conditions.push({
                    $and: [
                        { progress: 100},
                        { status: { $in: [TASK_STATUS.WAITING_FOR_APPROVAL, TASK_STATUS.PROCESSING] } },
                        { source_id: { $nin: [HEAD_TASK_ORIGIN.SCHOOL_OFFICE] } },
                        { department: { $in: ruleDetails.details.department } },
                    ]
                });
                break;
        }
    }
    else if (ruleDetails && ruleDetails.details ){
        switch (ruleDetails.details.type) {
            case "All":
                conditions.push({
                    $and: [
                        { status: { $in: [TASK_STATUS.WAITING_FOR_APPROVAL] } },
                        { source_id: { $nin: [HEAD_TASK_ORIGIN.SCHOOL_OFFICE] } }
                    ]
                });
                break;
            case "Working":
                conditions.push({
                    $and: [
                        { status: { $in: [TASK_STATUS.WAITING_FOR_APPROVAL] } },
                        { department: { $eq: department } },
                        { level: { $eq: TASK_LEVEL.HEAD_TASK } }
                    ]
                });
                break;
            case "Specific":
                conditions.push({
                    $and: [
                        { status: { $in: [TASK_STATUS.WAITING_FOR_APPROVAL] } },
                        { source_id: { $nin: [HEAD_TASK_ORIGIN.SCHOOL_OFFICE] } },
                        { department: { $in: ruleDetails.details.department } },
                    ]
                });
                break;
        }
    }
    return conditions;
}


function addTaskStateFields(aggregationSteps = []) {
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
                                        }
                                    ]
                                }
                            }
                        }
                    ],
                    default: {
                        $toLong: "$$NOW",
                    }
                }
            }
        }
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
                                        ]
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
                                        }
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
                                        }
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

function doStateSort(aggregationSteps = []) {
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
    // aggregationSteps.push({
    //     $sort: {
    //         "stateOrder": 1,
    //     },
    // });

}

function addTaskProgressFields(aggregationSteps = []) {
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

function addDepartmentFields(aggregationSteps = []) {
    // Chuyển đổi trường department thành chuỗi để đảm bảo khớp với id trong collection organization
    aggregationSteps.push({
        $addFields: {
            department_id: { $toString: "$department" }
        }
    });

    // Lookup để lấy thông tin từ collection organization
    aggregationSteps.push({
        $lookup: {
            from: "organization",
            localField: "department_id",
            foreignField: "id",
            as: "organization_info"
        }
    });

    // Unwind kết quả lookup
    aggregationSteps.push({
        $unwind: {
            path: "$organization_info",
            preserveNullAndEmptyArrays: true
        }
    });

    // Thêm trường title từ organization vào task
    aggregationSteps.push({
        $addFields: {
            department_title: {
                $ifNull: ["$organization_info.title", false]
            }
        }
    });

    // Loại bỏ trường organization_info tạm thời
    aggregationSteps.push({
        $project: {
            organization_info: 0
        }
    });

}

function addProjectFields(aggregationSteps = []) {
    // Chuyển đổi trường project thành ObjectId để đảm bảo khớp với _id trong collection project
    aggregationSteps.push({
        $addFields: {
            project_id: { $toObjectId: "$project" }
        }
    });

    // Lookup để lấy thông tin từ collection project
    aggregationSteps.push({
        $lookup: {
            from: "project",
            localField: "project_id",
            foreignField: "_id",
            as: "project_info"
        }
    });

    // Unwind kết quả lookup
    aggregationSteps.push({
        $unwind: {
            path: "$project_info",
            preserveNullAndEmptyArrays: true
        }
    });

    // Thêm các trường từ project vào task
    aggregationSteps.push({
        $addFields: {
            project_name: {
                $ifNull: ["$project_info.title", false]
            },

            // Thêm các trường khác từ project nếu cần
        }
    });

    // Loại bỏ trường project_info tạm thời
    aggregationSteps.push({
        $project: {
            project_info: 0,
            project_id: 0 // Loại bỏ trường project_id tạm thời nếu không cần thiết
        }
    });
}

function doFilter(aggregationSteps = [], queryCriteria, rule) {

    const conditions = [];
    //TAB
    if (queryCriteria.tab) {
        switch (queryCriteria.tab) {
            case TAB_FILTER.CREATED:
                conditions.push({ username: { $eq: queryCriteria.username } });
                break;
            case TAB_FILTER.ASSIGNED:
                conditions.push({
                    $or: [
                        { main_person: { $eq: queryCriteria.username } },
                        { participant: { $eq: queryCriteria.username } },
                        { observer: { $eq: queryCriteria.username } }
                    ]
                });
                break;
            case TAB_FILTER.RESPONSIBLE:
                conditions.push({ main_person: { $eq: queryCriteria.username } });
                break;
            case TAB_FILTER.SUPPORT:
                conditions.push({ participant: { $eq: queryCriteria.username } });
                break;
            case TAB_FILTER.SUPERVISION:
                conditions.push({ observer: { $eq: queryCriteria.username } });
                break;
        }
    }

    //FROM DATE - TO DATE
    if (queryCriteria.from_date && queryCriteria.to_date) {
        conditions.push({
            $or: [
                {
                    $and: [{ from_date: { $lte: queryCriteria.from_date } }, { to_date: { $gte: queryCriteria.from_date } }],
                },
                {
                    $and: [{ from_date: { $lte: queryCriteria.to_date } }, { to_date: { $gte: queryCriteria.to_date } }],
                },
                {
                    $and: [{ from_date: { $gte: queryCriteria.from_date } }, { to_date: { $lte: queryCriteria.to_date } }],
                },
                {
                    $and: [{ from_date: { $lte: queryCriteria.from_date } }, { to_date: { $gte: queryCriteria.to_date } }],
                },
            ],
        });
    }

    //PRIORITY
    if (Array.isArray(queryCriteria.priority) && queryCriteria.priority.length > 0) {
        conditions.push({
            priority: { $in: queryCriteria.priority }
        });
    }

    //STATUS
    if (Array.isArray(queryCriteria.conditions) && queryCriteria.conditions.length) {
        conditions.push({
            status: { $in: queryCriteria.status }
        });
    }

    if (queryCriteria.status) {
        if (Array.isArray(queryCriteria.status) && queryCriteria.status.length > 0) {
            conditions.push({
                status: {
                    $in: queryCriteria.status
                },
            });
        }
        if (!Array.isArray(queryCriteria.status) && typeof queryCriteria.status === "string") {
            conditions.push({
                status: {
                    $eq: queryCriteria.status
                }
            });
        }
    }

    //STATE
    if (Array.isArray(queryCriteria.state) && queryCriteria.state.length > 0) {
        conditions.push({
            state: {
                $in: queryCriteria.state
            }
        });
    }

    //TASK TYPE
    if (Array.isArray(queryCriteria.task_type) && queryCriteria.task_type.length > 0) {
        conditions.push({
            task_type: { $in: queryCriteria.task_type }
        });
    }

    //LABEL
    if (Array.isArray(queryCriteria.label) && queryCriteria.label.length > 0) {
        conditions.push({
            label: { $in: queryCriteria.label }
        });
    }

    //TASK GROUP
    if (Array.isArray(queryCriteria.task_group) && queryCriteria.task_group.length > 0) {
        const filter = {
            $or: [],
        };

        for (const valElement of queryCriteria.task_group) {
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
    }

    //EMPLOYEE
    if (Array.isArray(queryCriteria.employee) && queryCriteria.employee.length > 0) {
        conditions.push({
            $or: [
                { username: { $in: queryCriteria.employee } },
                { main_person: { $in: queryCriteria.employee } },
                { participant: { $in: queryCriteria.employee } },
                { observer: { $in: queryCriteria.employee } },
            ]
        });
    }

    //DEPARTMENT
    if (Array.isArray(queryCriteria.departments) && queryCriteria.departments.length > 0) {
        conditions.push({
            department: { $in: queryCriteria.departments }
        });
    }

    //PROJECT
    if (Array.isArray(queryCriteria.projects) && queryCriteria.projects.length > 0) {
        conditions.push({
            project: { $in: queryCriteria.projects }
        });
    }
    //Task from dispatch arived
    if (queryCriteria.is_dispatch_arrived === true) {
        conditions.push({ dispatch_arrived_id: { $ne: null} });
    }

    //Task receiver
    if (queryCriteria.is_receiver_task === true) {
        conditions.push({ 
            $and:[
                { parent_code: { $ne: null }},
                { status: {$eq: TASK_STATUS.WAITING_RECEIVE }},
                { department: {$eq: queryCriteria.session.department }},
            ]
        });
    }

    //Task receiver need approval
    if (queryCriteria.is_approval_task === true) {
        if (rule.some(e => e.rule === TASK_RULE.RECEIVE_TASK)) {
            conditions.push({ 
                $and:[
                    { from_department: { $eq: queryCriteria.session.department }},
                    { status: {$eq: TASK_STATUS.WAITING_LEAD_DEPARTMENT_APPROVE_RECEIVE }}  
                ]
            });
        }
        conditions.push({ 
            $and:[
                { observer: { $eq: queryCriteria.username }},
                { status: {$eq: TASK_STATUS.WAITING_FOR_APPROVAL }}
            ]
        });
    }

    if (conditions.length === 0) {
        conditions.push({ _id: { $eq: null } });
    }

    if (conditions.length > 0) {
        aggregationSteps.push({ $match: { $or: conditions } });
    }
}

function doFilter_load_task_external(aggregationSteps = [], queryCriteria, username) {

    const conditions = [];
    //TAB
    if (queryCriteria.tab) {
        switch (queryCriteria.tab) {
            case TAB_FILTER.CREATED:
                conditions.push({ username: { $eq: queryCriteria.username } });
                break;
            case TAB_FILTER.ASSIGNED:
                conditions.push({
                    $or: [
                        { main_person: { $eq: queryCriteria.username } },
                        { participant: { $eq: queryCriteria.username } },
                        { observer: { $eq: queryCriteria.username } }
                    ]
                });
                break;
            case TAB_FILTER.RESPONSIBLE:
                conditions.push({ main_person: { $eq: queryCriteria.username } });
                break;
            case TAB_FILTER.SUPPORT:
                conditions.push({ participant: { $eq: queryCriteria.username } });
                break;
            case TAB_FILTER.SUPERVISION:
                conditions.push({ observer: { $eq: queryCriteria.username } });
                break;
        }
    }

    //FROM DATE - TO DATE
    if (queryCriteria.from_date && queryCriteria.to_date) {
        conditions.push({
            $or: [
                {
                    $and: [{ from_date: { $lte: queryCriteria.from_date } }, { to_date: { $gte: queryCriteria.from_date } }],
                },
                {
                    $and: [{ from_date: { $lte: queryCriteria.to_date } }, { to_date: { $gte: queryCriteria.to_date } }],
                },
                {
                    $and: [{ from_date: { $gte: queryCriteria.from_date } }, { to_date: { $lte: queryCriteria.to_date } }],
                },
                {
                    $and: [{ from_date: { $lte: queryCriteria.from_date } }, { to_date: { $gte: queryCriteria.to_date } }],
                },
            ],
        });
    }

    //PRIORITY
    if (Array.isArray(queryCriteria.priority) && queryCriteria.priority.length > 0) {
        conditions.push({
            priority: { $in: queryCriteria.priority }
        });
    }

    //STATUS
    if (Array.isArray(queryCriteria.conditions) && queryCriteria.conditions.length) {
        conditions.push({
            status: { $in: queryCriteria.status }
        });
    }

    if (queryCriteria.status) {
        if (Array.isArray(queryCriteria.status) && queryCriteria.status.length > 0) {
            conditions.push({
                status: {
                    $in: queryCriteria.status
                },
            });
        }
        if (!Array.isArray(queryCriteria.status) && typeof queryCriteria.status === "string") {
            conditions.push({
                status: {
                    $eq: queryCriteria.status
                }
            });
        }
    }

    //STATE
    if (Array.isArray(queryCriteria.state) && queryCriteria.state.length > 0) {
        conditions.push({
            state: {
                $in: queryCriteria.state
            }
        });
    }

    //LABEL
    if (Array.isArray(queryCriteria.label) && queryCriteria.label.length > 0) {
        conditions.push({
            label: { $in: queryCriteria.label }
        });
    }

    //DEPARTMENT
    if (Array.isArray(queryCriteria.departments) && queryCriteria.departments.length > 0) {
        conditions.push({
            department: { $in: queryCriteria.departments }
        });
    }

    //Role
    if(Array.isArray(queryCriteria.roles) && queryCriteria.roles.length > 0){
        if(queryCriteria.roles.includes(TASK_ROLE.OBSERVER)){
            conditions.push({
                observer: { $eq: username }
            });
        }

        if(queryCriteria.roles.includes(TASK_ROLE.CREATOR)){
            conditions.push({
                username: { $eq: username }
            });
        }
    }

    if (conditions.length === 0) {
        conditions.push({ _id: { $eq: null } });
    }

    if (conditions.length > 0) {
        conditions.push(
            {
                source_id: { $eq: "1" }
            }
        )
        aggregationSteps.push({ $match: { $and: conditions } });
    }
}

function doPagination(aggregationSteps = [], queryCriteria) {
    if (parseInt(queryCriteria.offset)) {
        aggregationSteps.push({
            $skip: parseInt(queryCriteria.offset)
        });
    }
    if (parseInt(queryCriteria.top)) {
        aggregationSteps.push({
            $limit: parseInt(queryCriteria.top)
        });
    }

}

function doSort(aggregationSteps = [], queryCriteria) {
    if (queryCriteria.sort) {
        aggregationSteps.push({ $sort: queryCriteria.sort });
    }
}



function addTaskDefaultFields(aggregationSteps = []) {
    aggregationSteps.push({
        $addFields: {
            attachment: {
                $ifNull: ["$attachment", []],
            },
        },
    });
}


function doCount(aggregationSteps = []) {
    aggregationSteps.push({
        $count: "count",
    });
}

function generatePermissionAggregate_all(dbname, aggregationSteps, conditions, isGetAll, username) {
    let dfd = q.defer();
    if (isGetAll) {
        const topLevelFilter = {
            source_id: { $eq: HEAD_TASK_ORIGIN.SCHOOL_OFFICE }
        }
        conditions.push(topLevelFilter);
        aggregationSteps.push({ $match: { $or: conditions } });
        dfd.resolve(aggregationSteps);
    } else {
        let dfdAr = [];
        dfdAr.push(MongoDBProvider.load_onOffice(dbname, "organization", { leader: { $eq: username } }));
        dfdAr.push(MongoDBProvider.load_onOffice(dbname, "organization", { departmentLeader: { $eq: username } }));
        q.all(dfdAr).then(function ([departmentList, departmentLeaderList]) {
            if (departmentList
                && departmentList.length > 0
                && departmentLeaderList
                && departmentLeaderList.length > 0) {
                conditions.push({
                    $or: [
                        {
                            $and: [
                                { source_id: { $eq: HEAD_TASK_ORIGIN.SCHOOL_OFFICE } },
                                { department: { $in: departmentList.map(obj => obj.id) } }
                            ]
                        }, {
                            $and: [
                                { department: { $in: departmentLeaderList.map(obj => obj.id) } },
                                { level: { $eq: TASK_LEVEL.HEAD_TASK } }
                            ]
                        }
                    ]
                });
            } else {
                if (departmentList
                    && departmentList.length > 0) {
                    conditions.push({
                        $and: [
                            { source_id: { $eq: HEAD_TASK_ORIGIN.SCHOOL_OFFICE } },
                            { department: { $in: departmentList.map(obj => obj.id) } }
                        ]
                    });
                }
                if (departmentLeaderList
                    && departmentLeaderList.length > 0) {
                    conditions.push({
                        $and: [
                            { department: { $in: departmentLeaderList.map(obj => obj.id) } },
                            { level: { $eq: TASK_LEVEL.HEAD_TASK } }
                        ]
                    });
                }
            }
            aggregationSteps.push({ $match: { $or: conditions } });

            dfd.resolve(aggregationSteps);

        }, function (err) {
            dfd.reject({ path: "BuildFilterAggregate.generatePermissionAggregate_all.loadDeparmentFailed", err });
        });
    }
    return dfd.promise;
}

function generatePermissionAggregate_specific(dbname, aggregationSteps, conditions, username, departments) {
    let dfd = q.defer();
    MongoDBProvider.load_onOffice(dbname, "organization", { departmentLeader: { $eq: username } }).then(function (departmentLeaderList) {
        const departmentLeaderIdList = departmentLeaderList.map(obj => obj.id);
        if (departmentLeaderIdList.length > 0) {
            conditions.push({
                $or: [
                    {
                        $and: [
                            { source_id: { $eq: HEAD_TASK_ORIGIN.SCHOOL_OFFICE } },
                            { department: { $in: departments } }
                        ]
                    },
                    {
                        $and: [
                            { department: { $in: departmentLeaderIdList } },
                            { level: { $eq: TASK_LEVEL.HEAD_TASK } }
                        ]
                    }
                ]
            });
        } else {
            conditions.push({
                $and: [
                    { source_id: { $eq: HEAD_TASK_ORIGIN.SCHOOL_OFFICE } },
                    { department: { $in: departments } }
                ]
            });
        }
        aggregationSteps.push({ $match: { $or: conditions } });
        dfd.resolve(aggregationSteps);
    }, function (err) {
        dfd.reject({ path: "BuildFilterAggregate.generatePermissionAggregate_specific.loadDeparmentFailed", err });
    })
    return dfd.promise;
}

class BuildFilterAggregate {
    constructor() { }

    generateUIFilterAggregate_load(aggregationSteps = [], queryCriteria, rule) {
        addTaskStateFields(aggregationSteps);
        addTaskProgressFields(aggregationSteps);
        addTaskDefaultFields(aggregationSteps);
        addDepartmentFields(aggregationSteps);
        addProjectFields(aggregationSteps);
        doStateSort(aggregationSteps);
        doFilter(aggregationSteps, queryCriteria, rule);
        doPagination(aggregationSteps, queryCriteria);
        return aggregationSteps;
    }

    generateUIFilterAggregate_load_task_external(aggregationSteps = [], queryCriteria, username) {
        addTaskStateFields(aggregationSteps);
        addTaskProgressFields(aggregationSteps);
        addTaskDefaultFields(aggregationSteps);
        addDepartmentFields(aggregationSteps);
        // addProjectFields(aggregationSteps);
        doStateSort(aggregationSteps);
        doFilter_load_task_external(aggregationSteps, queryCriteria, username);
        doSort(aggregationSteps, queryCriteria)
        doPagination(aggregationSteps, queryCriteria);
        return aggregationSteps;
    }

    generateUIFilterAggregate_count_task_external(aggregationSteps = [], queryCriteria, username) {
        addTaskStateFields(aggregationSteps);
        addTaskProgressFields(aggregationSteps);
        addTaskDefaultFields(aggregationSteps);
        addDepartmentFields(aggregationSteps);
        // addProjectFields(aggregationSteps);
        doStateSort(aggregationSteps);
        doFilter_load_task_external(aggregationSteps, queryCriteria, username);
        doCount(aggregationSteps);
        return aggregationSteps;
    }

    generatePermissionAggregate_QuickHandle(dbname, username, department, rule, isGetAll, aggregationSteps = [],) {
        let dfd = q.defer();
        const conditions = [];
        //TASK RELATED TO
        const relatedFilter = {
            $or: [
                { main_person: { $eq: username } },
                { participant: { $eq: username } },
                { observer: { $eq: username } }
            ]
        };
        conditions.push(relatedFilter);


        let ruleFollow_department = rule.filter(e => e.rule === TASK_RULE.FOLLOW_DEPARTMENT)[0];
        let ruleManage_leader_department = rule.filter(e => e.rule === TASK_RULE.DEPARTMENT_LEADER_MANAGE)[0]
        let ruleManage_leader = rule.filter(e => e.rule === TASK_RULE.LEADER_MANAGE)[0]

        let ruleManage_director = checkRuleCheckBox(TASK_RULE.DIRECTOR_MANAGE, {rule});

        if (ruleManage_leader_department) {
            conditions.push(...generateMarkCompleteConditions(ruleManage_leader_department, department));
        }
        if (ruleManage_leader) {
            conditions.push(...generateMarkCompleteConditions(ruleManage_leader, department));
        }
        if (ruleManage_director) {
            conditions.push({
                $and: [
                    { status: { $in: [TASK_STATUS.WAITING_FOR_APPROVAL] } },
                    { source_id: { $in: [HEAD_TASK_ORIGIN.SCHOOL_OFFICE] } }
                ]
            });
        }
        if (ruleFollow_department && ruleFollow_department.details) {
            switch (ruleFollow_department.details.type) {
                case "All":
                    return generatePermissionAggregate_all(dbname, aggregationSteps, conditions, isGetAll, username);
                    break;
                case "Working":
                    const workingFilter = {
                        $and: [
                            { department: { $eq: department } },
                            { level: { $eq: TASK_LEVEL.HEAD_TASK } }
                        ]
                    };
                    conditions.push(workingFilter);
                    break;
                case "Specific":
                    return generatePermissionAggregate_specific(dbname, aggregationSteps, conditions, username, ruleFollow_department.details.department);
                    break;
            }

        }

        aggregationSteps.push({ $match: { $or: conditions } });
        dfd.resolve(aggregationSteps);

        return dfd.promise;
    }

    generateUIFilterAggregate_count(aggregationSteps = [], queryCriteria) {
        addTaskStateFields(aggregationSteps);
        addTaskProgressFields(aggregationSteps);
        addTaskDefaultFields(aggregationSteps);
        doStateSort(aggregationSteps);
        doFilter(aggregationSteps, queryCriteria);
        doCount(aggregationSteps);
        return aggregationSteps;
    }

    generateUIFilterAggregate_search(aggregationSteps = [], queryCriteria) {
        doSearchFilter(aggregationSteps, queryCriteria);
        return aggregationSteps;
    }
}

exports.BuildFilterAggregate = new BuildFilterAggregate();
