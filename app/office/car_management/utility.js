const q = require("q");

const { CAR_FEATURE_NAME, STATUS_CAR, RULE_CAR, CHECKS_ON_UI, CAR_FROM_ACTION, CAR_TAB, STATUS_FLOW
} = require('./const');
const { convertToStartOfDay, convertToEndOfDay } = require("@utils/util");
const { FLOW_STATUS } = require("../event_calendar/const");

function doSearchFilter(aggregationSteps = [], queryCriteria) {
    if (queryCriteria.search) {
        aggregationSteps.push({
            $match:
            {
                $text: {
                    $search: `"${queryCriteria.search}"`,
                },
            }
            ,
        });
    }
    return aggregationSteps;
}

function doFilter(aggregationSteps = [], queryCriteria, tab) {
    const conditions = [];
    queryCriteria.from_date = convertToStartOfDay(queryCriteria.from_date);
    queryCriteria.to_date = convertToEndOfDay(queryCriteria.to_date);
    if (queryCriteria.from_date && queryCriteria.to_date) {
        conditions.push({
            $or:[{
                    // ngày bắt đầu nằm giữa ngày filter
                    $and: [      
                        { time_to_go: { $gte: queryCriteria.from_date.toString() } },
                        { time_to_go: { $lte: queryCriteria.to_date.toString() } },
                    ]
                },
                // {
                //     // ngày kết thúc nằm giữa ngày filter
                //     $and: [
                //         { pick_up_time: { $gte: queryCriteria.from_date.toString() } },
                //         { pick_up_time: { $lte: queryCriteria.to_date.toString() } },
                //     ]
                // },
                // {
                //     // ngày filter nằm trong ngày bắt đầu và kết thúc
                //     $and: [
                //         { time_to_go: { $lte: queryCriteria.from_date.toString() } },
                //         { pick_up_time: { $gte: queryCriteria.to_date.toString() } },
                //     ]
                // }
            ]
        });
    }

    if(queryCriteria.status && Array.isArray(queryCriteria.status)){
        conditions.push({
            $and: [
                { status: { $in: queryCriteria.status } },
            ]
        });
    }

    if(tab === CAR_TAB.CALENDAR){
        const statusShowCalendar = [
            STATUS_CAR.LEAD_EXTERNAL_APPROVED,
            STATUS_CAR.CREATOR_RECEIVED_CARD,
            STATUS_CAR.CREATOR_RETURNED_CARD,
            STATUS_CAR.MANAGER_RECEIVED_CARD,
        ]
        const statusRecallShowCalendar = [
            STATUS_CAR.CREATED,
            STATUS_CAR.LEADER_DEPARTMENT_APPROVED,
            STATUS_CAR.CONFIRMER_APPROVED,
        ]
        conditions.push({
            $or: [
                {
                    $and: [
                        { status: { $in: statusShowCalendar } },
                        { flow_status: STATUS_FLOW.REGISTER }
                    ]
                },
                {
                    $and: [
                        { status: { $in: statusRecallShowCalendar } },
                        { flow_status: STATUS_FLOW.RECALL }
                    ]
                },
            ]
            
        });
    }

    if (conditions.length > 0) {
        aggregationSteps.push({ $match: { $and: conditions } });
    }
}

function addDepartmentFields(aggregationSteps = []) {
    // Xử lý department
    aggregationSteps.push({
        $addFields: {
            department_id: { $toString: "$department" }
        }
    });

    aggregationSteps.push({
        $lookup: {
            from: "organization",
            localField: "department",
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

    // Xử lý to_department
    aggregationSteps.push({
        $addFields: {
            to_department_ids: {
                $map: {
                    input: "$to_department",
                    as: "dept",
                    in: { $toString: "$$dept" }
                }
            }
        }
    });

    aggregationSteps.push({
        $lookup: {
            from: "organization",
            localField: "to_department_ids",
            foreignField: "id",
            as: "to_department_info"
        }
    });

    aggregationSteps.push({
        $addFields: {
            to_department_titles: {
                $map: {
                    input: "$to_department_ids",
                    as: "dept_id",
                    in: {
                        $let: {
                            vars: {
                                matched_dept: {
                                    $arrayElemAt: [
                                        {
                                            $filter: {
                                                input: "$to_department_info",
                                                cond: { $eq: ["$$this.id", "$$dept_id"] }
                                            }
                                        },
                                        0
                                    ]
                                }
                            },
                            in: { $ifNull: ["$$matched_dept.title", false] }
                        }
                    }
                }
            }
        }
    });

    // Loại bỏ các trường tạm thời
    aggregationSteps.push({
        $project: {
            department_info: 0,
            to_department_info: 0,
            to_department_ids: 0
        }
    });
}

function addInfoPassengers(aggregationSteps = []) {
    aggregationSteps.push({
        $lookup: {
            from: "employee",
            localField: "contact_passenger", // Trường chứa danh sách các driver
            foreignField: "username",
            as: "passenger_info"
        }
    });
    
    // Bước $addFields để ánh xạ chi tiết cho từng driver trong danh sách drivers
    aggregationSteps.push({
        $addFields: {
            passengers_details: {
                $map: {
                    input: "$contact_passenger",
                    as: "contact_passenger",
                    in: {
                        $cond: {
                            if: { $and: [
                                { $ne: ["$$contact_passenger", null] },
                                { $ne: ["$$contact_passenger", ""] },
                                { $ne: [{ $type: "$$contact_passenger" }, "missing"] }
                            ]},
                            then: {
                                $ifNull: [
                                    { 
                                        $arrayElemAt: [
                                            {
                                                $filter: {
                                                    input: "$passenger_info",
                                                    as: "info",
                                                    cond: { $eq: ["$$info.username", "$$contact_passenger"] }
                                                }
                                            }, 
                                            0
                                        ]
                                    },
                                    {}
                                ]
                            },
                            else: null
                        }
                    }
                }
            }
        }
    });

    // Loại bỏ trường driver_info tạm thời
    aggregationSteps.push({
        $project: {
            passenger_info: 0
        }
    });
}

function addDriveFields(aggregationSteps = []) {
    
    aggregationSteps.push({
        $lookup: {
            from: "employee",
            localField: "driver",
            foreignField: "username",
            as: "driver_info"
        }
    });
    
    // Bước $addFields để lấy phần tử đầu tiên của mảng driver_info
    aggregationSteps.push({
        $addFields: {
            driver_detail: {
                $cond: {
                    if: { $and: [
                        { $ne: ["$driver", null] },
                        { $ne: ["$driver", ""] },
                        { $ne: [{ $type: "$driver" }, "missing"] }
                    ]},
                    then: { $ifNull: [{ $arrayElemAt: ["$driver_info", 0] }, {}] },
                    else: null
                }
            }
        }
    });
    
    // Loại bỏ trường driver_info tạm thời
    aggregationSteps.push({
        $project: {
            driver_info: 0
        }
    });
}

function overwriteAttachments(aggregationSteps = []) {
    aggregationSteps.push({
        $addFields: {
            attachments: {
                $filter: {
                    input: "$attachments",
                    as: "attachment",
                    cond: { $ne: ["$$attachment.is_deleted", true] }
                }
            }
        }
    });
}

function doSort(aggregationSteps = [], queryCriteria) {
    if (queryCriteria.sort) {
        aggregationSteps.push({ $sort: queryCriteria.sort });
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

function doCount(aggregationSteps = []) {
    aggregationSteps.push({
        $count: "count",
    });
}




function generateAggerationCondition_DepartmentReponsibility(department, rule) {
    const conditions = [];
    const ruleManageInformation = rule.filter(e => e.rule === RULE_CAR.APPROVE_DEPARTMENT)[0];
    if (ruleManageInformation && ruleManageInformation.details) {
        switch (ruleManageInformation.details.type) {
            case "All":
                conditions.push({ feature: { $eq: CAR_FEATURE_NAME } });
                break;
            case "Specific":
                conditions.push({
                    $and: [
                        { feature: { $eq: CAR_FEATURE_NAME } },
                        { 
                            $or: [
                                // { department: { $in: ruleManageInformation.details.department } },
                                { to_department: { $in: ruleManageInformation.details.department } }
                            ] 
                        }
                    ]

                });
                break;
            case "Working":
                conditions.push({
                    $and: [
                        { feature: { $eq: CAR_FEATURE_NAME } },
                        { 
                            $or: [
                                // { department: { $eq: department } },
                                { to_department: { $eq: department } },
                            ] 
                        }
                    ]

                });
                break;
        }
    }

    const ruleManageNotify = rule.filter(e => e.rule === RULE_CAR.NOTIFY_DEPARTMENT)[0];
    if (ruleManageNotify && ruleManageNotify.details) {
        switch (ruleManageNotify.details.type) {
            case "All":
                conditions.push({ feature: { $eq: CAR_FEATURE_NAME } });
                break;
            case "Specific":
                conditions.push({
                    $and: [
                        { feature: { $eq: CAR_FEATURE_NAME } },
                        { 
                            $or: [
                                // { department: { $in: ruleManageInformation.details.department } },
                                { to_department: { $in: ruleManageNotify.details.department } }
                            ] 
                        }
                    ]

                });
                break;
            case "Working":
                conditions.push({
                    $and: [
                        { feature: { $eq: CAR_FEATURE_NAME } },
                        { 
                            $or: [
                                // { department: { $eq: department } },
                                { to_department: { $eq: department } },
                            ] 
                        }
                    ]

                });
                break;
        }
    }
    return conditions;
}

function generateAggerationCondition_Created(username) {
    const conditions = [];
    conditions.push({
        $and: [
            { feature: { $eq: CAR_FEATURE_NAME } },
            { username: { $eq: username } },
            // {
            //     $or: [
            //         {
            //             $and: [
            //                 { assign_card: { $ne: true } },
            //                 {
            //                     status: { $in: [STATUS_CAR.LEAD_APPROVED_CAR, STATUS_CAR.REJECTED] }
            //                 },
            //                 { pick_up_time: { 
            //                     $lte: new Date(new Date().setMonth(new Date().getMonth() + 1)).getTime().toString()
            //                  } }
            //             ]
            //         },
            //         {
            //             $and: [
            //                 { assign_card: { $eq: true } },
            //                 {
            //                     status: { $in: [STATUS_CAR.MANAGER_RECEIVED_CARD, STATUS_CAR.REJECTED] }
            //                 },
            //                 { pick_up_time: { $lte: new Date(new Date().setMonth(new Date().getMonth() + 1)).getTime().toString() } }
            //             ]
            //         }, {
            //             $and: [
            //                 { assign_card: { $ne: true } },
            //                 {
            //                     status: { $nin: [STATUS_CAR.LEAD_APPROVED_CAR, STATUS_CAR.REJECTED] }
            //                 }
            //             ]
            //         },
            //         {
            //             $and: [
            //                 { assign_card: { $eq: true } },
            //                 {
            //                     status: { $nin: [STATUS_CAR.MANAGER_RECEIVED_CARD, STATUS_CAR.REJECTED] }
            //                 }
            //             ]
            //         }
            //     ]
            // }
        ]
    });

    return conditions;
}

function generateAggerationCondition_Handle(username, department, rule) {
    const conditions = [];
    conditions.push({
        $and: [
            { username: { $eq: username } },
            { assign_card: true },
            { status: { $in: [STATUS_CAR.LEAD_EXTERNAL_APPROVED, STATUS_CAR.CREATOR_RECEIVED_CARD] } },
            { feature: { $eq: CAR_FEATURE_NAME } }
        ]
    });

    const ruleApproveDepartmentLevel = rule.filter(e => e.rule === RULE_CAR.APPROVE_DEPARTMENT)[0];
    if (ruleApproveDepartmentLevel && ruleApproveDepartmentLevel.details) {
        switch (ruleApproveDepartmentLevel.details.type) {
            case "All":
                conditions.push({
                    $and: [
                        { feature: { $eq: CAR_FEATURE_NAME } },
                        { status: { $eq: STATUS_CAR.CREATED } }
                    ]

                });
                break;
            case "Specific":
                conditions.push({
                    $and: [
                        { feature: { $eq: CAR_FEATURE_NAME } },
                        {
                            status: { $eq: STATUS_CAR.CREATED }
                        },
                        {
                            department: { $in: ruleApproveDepartmentLevel.details.department }
                        }
                    ]

                });
                break;
            case "Working":
                conditions.push({
                    $and: [
                        { feature: { $eq: CAR_FEATURE_NAME } },
                        {
                            status: { $eq: STATUS_CAR.CREATED }
                        },
                        {
                            department: { $eq: department }
                        }
                    ]

                });
                break;
        }

    }
    if (rule.filter(e => e.rule === RULE_CAR.CONFIRM)[0]) {
        conditions.push({
            $and: [
                { feature: { $eq: CAR_FEATURE_NAME } },
                { status: { $in: [STATUS_CAR.LEADER_DEPARTMENT_APPROVED, STATUS_CAR.CREATOR_RETURNED_CARD] } }
            ]

        });
    }

    if (rule.filter(e => e.rule === RULE_CAR.APPROVE_LEAD)[0]) {
        conditions.push({
            $and: [
                { feature: { $eq: CAR_FEATURE_NAME } },
                { status: { $eq: STATUS_CAR.CONFIRMER_APPROVED } }
            ]

        });
    }

    if (rule.filter(e => e.rule === RULE_CAR.APPROVE_LEAD_EXTERNAL)[0]){
        conditions.push({
            $and: [
                { feature: { $eq: CAR_FEATURE_NAME } },
                { status: { $eq: STATUS_CAR.LEAD_APPROVED_CAR } }
            ]
        });
    }

    return conditions
}

function generateAggerationCondition_Handled(username, department, rule) {
    const listActionHandled = [
        CAR_FROM_ACTION.DEPARTMENT_APPROVED_AND_CHANGE,
        CAR_FROM_ACTION.DEPARTMENT_APPROVED,
        CAR_FROM_ACTION.DEPARTMENT_REJECTED,

        CAR_FROM_ACTION.MANAGEMENT_CAR_APPROVED,
        CAR_FROM_ACTION.MANAGEMENT_CAR_REJECTED,

        CAR_FROM_ACTION.LEAD_APPROVED_AND_CHANGE,
        CAR_FROM_ACTION.LEAD_APPROVED,
        CAR_FROM_ACTION.LEAD_REJECTED,

        CAR_FROM_ACTION.APPROVED,

        CAR_FROM_ACTION.LEAD_EXTERNAL_APPROVED,
        CAR_FROM_ACTION.LEAD_EXTERNAL_REJECTED,
        CAR_FROM_ACTION.REQUEST_CANCEL,
        CAR_FROM_ACTION.DEPARTMENT_APPROVE_RECALL,
        CAR_FROM_ACTION.MANAGEMENT_APPROVE_RECALL,
        CAR_FROM_ACTION.LEAD_APPROVE_RECALL,
        CAR_FROM_ACTION.REJECT_RECALL,
    ];
    const NUM_YEAR = 1;
    const maxTimeShow = new Date();
    maxTimeShow.setFullYear(maxTimeShow.getFullYear() - NUM_YEAR);
    const conditions = [];
    conditions.push({
        $and: [
            { feature: { $eq: CAR_FEATURE_NAME } },
            {
                event: {
                    $elemMatch: {
                        username: username,
                        action: { $in: listActionHandled },
                        time: { $gte: maxTimeShow.getTime() },
                    },
                },
            },
        ],
    });

    return conditions;
}

function generateAggerationCondition_Rejected(username, department, rule) {
    const listActionHandled = [
        CAR_FROM_ACTION.DEPARTMENT_REJECTED,
        CAR_FROM_ACTION.MANAGEMENT_CAR_REJECTED,
        CAR_FROM_ACTION.LEAD_REJECTED,
        CAR_FROM_ACTION.LEAD_EXTERNAL_REJECTED,
    ];
    const NUM_YEAR = 1;
    const maxTimeShow = new Date();
    maxTimeShow.setFullYear(maxTimeShow.getFullYear() - NUM_YEAR);
    const conditions = [];
    conditions.push({
        $and: [
            { feature: { $eq: CAR_FEATURE_NAME } },
            {
                event: {
                    $elemMatch: {
                        username: username,
                        action: { $in: listActionHandled },
                        time: { $gte: maxTimeShow.getTime() },
                    },
                },
            },
        ],
    });

    return conditions;
}

function generateAggerationCondition_NotReturnCard(username, department, rule) {
    const conditions = [];
    conditions.push({
        $and: [
            { feature: { $eq: CAR_FEATURE_NAME } },
            { username: { $eq: username } },
            { status: { $in: [STATUS_CAR.CREATOR_RECEIVED_CARD, STATUS_CAR.CREATOR_RETURNED_CARD] } }
        ]
    });

    if (rule.filter(e => e.rule === RULE_CAR.CONFIRM)[0]) {
        conditions.push({
            $and: [
                { feature: { $eq: CAR_FEATURE_NAME } },
                { status: { $in: [STATUS_CAR.CREATOR_RECEIVED_CARD, STATUS_CAR.CREATOR_RETURNED_CARD] } }
            ]
        });
    }

    const ruleManageInformation = rule.filter(e => e.rule === RULE_CAR.MANAGE_INFORMATION)[0];
    if (ruleManageInformation && ruleManageInformation.details) {
        switch (ruleManageInformation.details.type) {
            case "All":
                conditions.push({
                    $and: [
                        { feature: { $eq: CAR_FEATURE_NAME } },
                        { status: { $in: [STATUS_CAR.CREATOR_RECEIVED_CARD, STATUS_CAR.CREATOR_RETURNED_CARD] } }
                    ]
                });
                break;
            case "Specific":
                conditions.push({
                    $and: [
                        { feature: { $eq: CAR_FEATURE_NAME } },
                        { status: { $in: [STATUS_CAR.CREATOR_RECEIVED_CARD, STATUS_CAR.CREATOR_RETURNED_CARD] } },
                        {
                            department: { $in: ruleManageInformation.details.department }
                        }
                    ]

                });
                break;
            case "Working":
                conditions.push({
                    $and: [
                        { feature: { $eq: CAR_FEATURE_NAME } },
                        { status: { $in: [STATUS_CAR.CREATOR_RECEIVED_CARD, STATUS_CAR.CREATOR_RETURNED_CARD] } },
                        {
                            department: { $eq: department }
                        }
                    ]

                });
                break;
        }
    }

    return conditions;
}

function generateAggerationCondition_allDepartment(username, rule){
    const conditions = [];
    if(rule.some(e => e.rule === RULE_CAR.APPROVE_LEAD || RULE_CAR.CONFIRM)){
        conditions.push({feature: { $eq: CAR_FEATURE_NAME}});
    }
    return conditions;
}

function generateAggerationCondition_myCalendar(username, rule){
    const conditions = [];
    conditions.push({
        $and: [
            { feature: { $eq: CAR_FEATURE_NAME} },
            { 
                $or: [
                    { passenger: { $eq: username } },
                    { driver: { $eq: username } },
                ] 
            }
        ]
    });
    return conditions;
}

function generateAggerationCondition_allCalendar(username, rule){
    const conditions = [];

    

    // const listStatus = [
    //     STATUS_CAR.LEAD_EXTERNAL_APPROVED,
    //     STATUS_CAR.CREATOR_RECEIVED_CARD,
    //     STATUS_CAR.CREATOR_RETURNED_CARD,
    //     STATUS_CAR.MANAGER_RECEIVED_CARD,
    // ];
    // conditions.push({
    //     $and: [
    //         {feature: { $eq: CAR_FEATURE_NAME}},
    //         {status: { $in: listStatus }},
    //     ]
    // });

    const statusShowCalendar = [
        STATUS_CAR.LEAD_EXTERNAL_APPROVED,
        STATUS_CAR.CREATOR_RECEIVED_CARD,
        STATUS_CAR.CREATOR_RETURNED_CARD,
        STATUS_CAR.MANAGER_RECEIVED_CARD,
    ]
    const statusRecallShowCalendar = [
        STATUS_CAR.CREATED,
        STATUS_CAR.LEADER_DEPARTMENT_APPROVED,
        STATUS_CAR.CONFIRMER_APPROVED,
    ]
    conditions.push({
        $or: [
            {
                $and: [
                    { status: { $in: statusShowCalendar } },
                    { flow_status: STATUS_FLOW.REGISTER }
                ]
            },
            {
                $and: [
                    { status: { $in: statusRecallShowCalendar } },
                    { flow_status: STATUS_FLOW.RECALL }
                ]
            },
        ]
        
    });
    return conditions;
}

class BuildFilterAggregate {
    constructor() { }

    generateUIFilterAggregate_load(aggregationSteps = [], queryCriteria, tab) {
        doFilter(aggregationSteps, queryCriteria, tab);
        addDepartmentFields(aggregationSteps);
        addDriveFields(aggregationSteps);
        addInfoPassengers(aggregationSteps)
        overwriteAttachments(aggregationSteps);
        doSort(aggregationSteps, queryCriteria);
        doPagination(aggregationSteps, queryCriteria);
        return aggregationSteps;
    }

    generateUIFilterAggregate_export_excel(aggregationSteps = [], queryCriteria, tab) {
        doFilter(aggregationSteps, queryCriteria, tab);
        addDepartmentFields(aggregationSteps);
        addDriveFields(aggregationSteps);
        return aggregationSteps;
    }

    generateUIFilterAggregate_loadDetails(aggregationSteps = []) {
        addInfoPassengers(aggregationSteps)
        addDepartmentFields(aggregationSteps);
        addDriveFields(aggregationSteps);
        return aggregationSteps;
    }


    generateUIFilterAggregate_count(aggregationSteps = [], queryCriteria) {
        doFilter(aggregationSteps, queryCriteria);
        doCount(aggregationSteps);
        return aggregationSteps;
    }

    generateUIFilterAggregate_search(aggregationSteps = [], queryCriteria) {
        doSearchFilter(aggregationSteps, queryCriteria);
        return aggregationSteps;
    }

    generatePermissionAggregate_ManageUI(username, tab, department, rule, checks, aggregationSteps = []) {
        let conditions = [];
        switch (tab) {
            case CAR_TAB.MANAGEMENT:
                if (checks.indexOf(CHECKS_ON_UI.CREATED) !== -1) {
                    const createdConditions = generateAggerationCondition_Created(username);
                    conditions = conditions.concat(createdConditions);
                }
        
                if (checks.indexOf(CHECKS_ON_UI.NEED_HANDLE) !== -1) {
                    const needHandleConditions = generateAggerationCondition_Handle(username, department, rule);
                    conditions = conditions.concat(needHandleConditions);
                }
        
                if (checks.indexOf(CHECKS_ON_UI.HANDLED) !== -1) {
                    const needHandleConditions = generateAggerationCondition_Handled(username, department, rule);
                    conditions = conditions.concat(needHandleConditions);
                }

                if (checks.indexOf(CHECKS_ON_UI.REJECTED) !== -1) {
                    const needHandleConditions = generateAggerationCondition_Rejected(username, department, rule);
                    conditions = conditions.concat(needHandleConditions);
                }
        
                if (checks.indexOf(CHECKS_ON_UI.RESPOSIBILITY_DEPARTMENT) !== -1) {
                    const responsibilityConditions = generateAggerationCondition_DepartmentReponsibility(department, rule);
                    conditions = conditions.concat(responsibilityConditions);
                }
        
                if (checks.indexOf(CHECKS_ON_UI.CARD_NOT_RETURNED) !== -1) {
                    const responsibilityConditions = generateAggerationCondition_NotReturnCard(username, department, rule);
                    conditions = conditions.concat(responsibilityConditions);
                }
                break;
            case CAR_TAB.CALENDAR:
                if (checks.indexOf(CHECKS_ON_UI.CREATED) !== -1) {
                    const createdConditions = generateAggerationCondition_Created(username);
                    conditions = conditions.concat(createdConditions);
                }

                if (checks.indexOf(CHECKS_ON_UI.RESPOSIBILITY_DEPARTMENT) !== -1) {
                    const responsibilityConditions = generateAggerationCondition_DepartmentReponsibility(department, rule);
                    conditions = conditions.concat(responsibilityConditions);
                }

                if(checks.indexOf(CHECKS_ON_UI.ALL_DEPARTMENT) !== -1){
                    const allDepartmentConditions = generateAggerationCondition_allDepartment(username, rule);
                    conditions = conditions.concat(allDepartmentConditions);
                }

                if(checks.indexOf(CHECKS_ON_UI.MY_CALENDER) !== -1){
                    const allDepartmentConditions = generateAggerationCondition_myCalendar(username, rule);
                    conditions = conditions.concat(allDepartmentConditions);
                }

                if(checks.indexOf(CHECKS_ON_UI.ALL) !== -1){
                    const allConditions = generateAggerationCondition_allCalendar(username, rule);
                    conditions = conditions.concat(allConditions);
                }
                break;
        }

        if (conditions.length > 0) {
            aggregationSteps.push({ $match: { $or: conditions } });
        } else {
            aggregationSteps.push({ $match: { _id: { $eq: false } } });
        }

        return aggregationSteps
    }
}

exports.BuildFilterAggregate = new BuildFilterAggregate();