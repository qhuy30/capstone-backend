const q = require("q");
const { 
    RULE_EVENT_CALENDAR, 
    STATUS_EVENT_CALENDAR, 
    EVENT_FEATURE_NAME, 
    EVENT_CALENDAR_UI_CHECK, 
    EVENT_CALENDAR_UI_TAB, 
    LEVEl_CALENDAR,
    EVENT_CALENDAR_ACTION_NAME,
    EVENT_CALENDAR_FROM_ACTION,
    EVENT_CALENDAR_UI_CHILD_TAB
} = require('./const');
const { convertToStartOfDay, convertToEndOfDay } = require("@utils/util");

function doSearchFilter(aggregationSteps = [], queryCriteria) {
    if (queryCriteria.search) {
        aggregationSteps.push({
            $match: {
                $text: { $search: `"${queryCriteria.search}"` },
            },
        });
    }
    return aggregationSteps;
}

function doFilter(aggregationSteps = [], queryCriteria, tab = EVENT_CALENDAR_UI_TAB.MANAGEMENT) {
    queryCriteria.from_date = convertToStartOfDay(queryCriteria.from_date);
    queryCriteria.to_date = convertToEndOfDay(queryCriteria.to_date);
    
    aggregationSteps.push({
        $match: { feature: EVENT_FEATURE_NAME },
    });

    if (queryCriteria.status) {
        aggregationSteps.push({
            $match: { status: { $in: queryCriteria.status } },
        });
    }

    if (queryCriteria.from_date && queryCriteria.to_date) {
        aggregationSteps.push({
            $match: {
                $or:[{
                        // ngày bắt đầu nằm giữa ngày filter
                        $and: [      
                            { start_date: { $gte: queryCriteria.from_date } },
                            { start_date: { $lte: queryCriteria.to_date } },
                        ]
                    },
                    // {
                    //     // ngày kết thúc nằm giữa ngày filter
                    //     $and: [
                    //         { end_date: { $gte: queryCriteria.from_date } },
                    //         { end_date: { $lte: queryCriteria.to_date } },
                    //     ]
                    // },
                    // {
                    //     // ngày filter nằm trong ngày bắt đầu và kết thúc
                    //     $and: [
                    //         { start_date: { $lte: queryCriteria.from_date } },
                    //         { end_date: { $gte: queryCriteria.to_date } },
                    //     ]
                    // }
                ]
            }
        });
    }

    if (queryCriteria.department) {
        aggregationSteps.push({
            $match: { department: queryCriteria.department },
        });
    }

    if (queryCriteria.participating) {
        aggregationSteps.push({
            $match: { participant: { $in: [queryCriteria.participating] } },
        });
    }

    if (queryCriteria.created_by) {
        aggregationSteps.push({
            $match: { username: queryCriteria.created_by },
        });
    }

    if(tab === EVENT_CALENDAR_UI_TAB.CALENDAR){
        aggregationSteps.push({
            // $match: { status: STATUS_EVENT_CALENDAR.LEAD_APPROVED },
            $match: {
                $or:[
                    { $and: [
                            { status: STATUS_EVENT_CALENDAR.LEAD_APPROVED },
                            { level: LEVEl_CALENDAR.LEVEL_1 }
                        ] 
                    },
                    {
                        $and:[
                            { status: STATUS_EVENT_CALENDAR.LEADER_DEPARTMENT_APPROVED },
                            { level: LEVEl_CALENDAR.LEVEL_2 }
                        ]
                    }
                ]
            },
        });
    }

    if(queryCriteria.levels && queryCriteria.levels.length > 0){
        aggregationSteps.push({
            $match: { level: { $in: queryCriteria.levels } },
        });
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
                    input: "$departments",
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

function addMeetingRoomFields(aggregationSteps = []){
    aggregationSteps.push({
        $addFields: {
            meeting_room_id: {
                $cond: {
                    if: { $and: [
                        { $ne: ["$room_booking_id", ""] },
                        { $ne: ["$room_booking_id", null] },
                        { $ne: [{ $type: "$room_booking_id" }, "missing"] }
                    ]},
                    then: { $toObjectId: "$room_booking_id" },
                    else: null
                }
            }
        }
    });

    aggregationSteps.push({
        $lookup: {
            from: "registration",
            localField: "meeting_room_id",
            foreignField: "_id",
            as: "meeting_room_info"
        }
    });

    aggregationSteps.push({
        $unwind: {
            path: "$meeting_room_info",
            preserveNullAndEmptyArrays: true
        }
    });

    aggregationSteps.push({
        $addFields: {
            meeting_room_registration:{
                $ifNull: ["$meeting_room_info", {}]
            }
        }
    });

    aggregationSteps.push({
        $project: {
            meeting_room_info: 0,
            meeting_room_id: 0
        }
    });
}

function addCarFields(aggregationSteps = []){
    aggregationSteps.push({
        $addFields: {
            vehicle_id: {
                $cond: {
                    if: { $and: [
                        { $ne: ["$vehicle_booking_id", ""] },
                        { $ne: ["$vehicle_booking_id", null] },
                        { $ne: [{ $type: "$vehicle_booking_id" }, "missing"] }
                    ]},
                    then: { $toObjectId: "$vehicle_booking_id" },
                    else: null
                }
            }
        }
    });

    aggregationSteps.push({
        $lookup: {
            from: "registration",
            localField: "vehicle_id",
            foreignField: "_id",
            as: "vehicle_info"
        }
    });

    aggregationSteps.push({
        $unwind: {
            path: "$vehicle_info",
            preserveNullAndEmptyArrays: true
        }
    });

    aggregationSteps.push({
        $addFields: {
            vehicle_registration:{
                $ifNull: ["$vehicle_info", {}]
            }
        }
    });

    aggregationSteps.push({
        $project: {
            vehicle_id: 0,
            vehicle_info: 0
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
        aggregationSteps.push({ $skip: parseInt(queryCriteria.offset) });
    }
    if (parseInt(queryCriteria.top)) {
        aggregationSteps.push({ $limit: parseInt(queryCriteria.top) });
    }
}

function doCount(aggregationSteps = []) {
    aggregationSteps.push({
        $count: "count",
    });
}

function generateAggregationCondition_event(department, rule, username) {
    const conditions = [];
    const ruleApproveDepartmentLevel = rule.filter(e => 
        e.rule === RULE_EVENT_CALENDAR.APPROVE_DEPARTMENT
    )[0];
    
    if (ruleApproveDepartmentLevel && ruleApproveDepartmentLevel.details) {
        switch (ruleApproveDepartmentLevel.details.type) {
            case "All":
                conditions.push({
                   $and: [
                    { feature: { $eq: EVENT_FEATURE_NAME }},
                    { status:  { $eq: STATUS_EVENT_CALENDAR.CREATED }}
                   ]
                });
                break;
            case "Specific":
                conditions.push({
                    $and: [
                        { feature:  { $eq: EVENT_FEATURE_NAME }},
                        { status:  { $eq:  STATUS_EVENT_CALENDAR.CREATED}},
                        { department: { $in: ruleApproveDepartmentLevel.details.department }, }
                    ]
                });
                break;
            case "Working":
                conditions.push({
                    $and: [
                        { feature: { $eq: EVENT_FEATURE_NAME}},
                        { status: { $eq: STATUS_EVENT_CALENDAR.CREATED}},
                        { department: { $eq: department } }
                    ]
                });
                break;
        }
    }

    // Người chủ trì
    conditions.push({
        $and:[
            { feature: { $eq: EVENT_FEATURE_NAME} },
            { status: { $eq: STATUS_EVENT_CALENDAR.LEADER_DEPARTMENT_APPROVED}},
            { main_person: { $eq: username } },
            { level: { $eq: LEVEl_CALENDAR.LEVEL_1 } }
        ]
    });
    if (conditions.length > 0) {
        return {
            $and:[
                { end_date: { $gte: new Date().getTime() } },
                { $or: [
                    ...conditions,
                ] 
                }
            ]
        };
    } else {
        return [{ _id: { $eq: false } }];
    }
}

function generateAggregationCondition_DepartmentResponsibility(department, rule) {
    const conditions = [];
    const ruleManageInformation = rule.filter(e => e.rule === RULE_EVENT_CALENDAR.MANAGE)[0];
    const ruleLeadDeparment = rule.filter(e => e.rule === RULE_EVENT_CALENDAR.APPROVE_DEPARTMENT)[0];
    if (ruleManageInformation) {
        conditions.push(
            {
                $and: [
                    { feature: { $eq: EVENT_FEATURE_NAME } },
                    { departments: { $eq: department } },
                ]
            }
        )
        // switch (ruleManageInformation.details.type) {
        //     case "All":
        //         conditions.push({ feature: { $eq: EVENT_FEATURE_NAME } });
        //         break;
        //     case "Specific":
        //         conditions.push({
        //             $and: [
        //                 { feature: { $eq:  EVENT_FEATURE_NAME } },
        //                 {
        //                     department: { $in: ruleManageInformation.details.department }
        //                 }
        //             ]
        //         });
        //         break;
        //     case "Working":
        //         conditions.push({
        //             $and: [
        //                 { feature: { $eq: EVENT_FEATURE_NAME } },
        //                 {
        //                     department: { $eq: department }
        //                 }
        //             ]
        //         });
        //         break;
        // }
    }

    if (ruleLeadDeparment && ruleLeadDeparment.details) {
        switch (ruleLeadDeparment.details.type) {
            case "All":
                conditions.push({ feature: { $eq: EVENT_FEATURE_NAME } });
                break;
            case "Specific":
                conditions.push({
                    $and: [
                        { feature: { $eq:  EVENT_FEATURE_NAME } },
                        {
                            $or: [
                               { department: { $in: ruleManageInformation.details.department } },
                               { departments: { $in: ruleManageInformation.details.department } },
                            ]
                        }
                    ]
                });
                break;
            case "Working":
                conditions.push({
                    $and: [
                        { feature: { $eq: EVENT_FEATURE_NAME } },
                        { departments: { $eq: department } },
                    ]
                });
                break;
        }
    }

    //Lãnh đạo thấy những đơn đã hoàn thành hoặc hủy
    if(rule.find(e => e.rule === RULE_EVENT_CALENDAR.APPROVE_LEAD)){
        conditions.push({
            $and: [
                { feature: { $eq:  EVENT_FEATURE_NAME } },
                {
                    status: { $in: [ STATUS_EVENT_CALENDAR.LEAD_APPROVED, STATUS_EVENT_CALENDAR.CANCELLED ] }
                }
            ]
        });
    }

    return conditions;
}

function generateAggregationCondition_Manage(rule) {
    const conditions = [];
    const ruleManageInformation = rule.filter(e => e.rule === RULE_EVENT_CALENDAR.MANAGE)[0];
    if (ruleManageInformation) {
        conditions.push({
            $and: [
                { feature: { $eq: EVENT_FEATURE_NAME } },
                { level: LEVEl_CALENDAR.LEVEL_1 }
            ]
        });
    }
    return conditions;
}

function generateAggregationCondition_Created(username) {
    const conditions = [];
    conditions.push({
        $and: [
            { feature: { $eq:  EVENT_FEATURE_NAME }},
            { username: { $eq: username } },
            { 
                $or: [
                    {
                        $and: [
                            { status: { $in: [
                                STATUS_EVENT_CALENDAR.LEAD_APPROVED,
                                STATUS_EVENT_CALENDAR.REJECTED,
                                STATUS_EVENT_CALENDAR.CANCELLED,
                            ]}},
                            { end_date: { $gte: new Date().getTime() } }
                        ]
                    }, 
                    { status: { $nin: [
                        STATUS_EVENT_CALENDAR.LEAD_APPROVED,
                        STATUS_EVENT_CALENDAR.REJECTED,
                        STATUS_EVENT_CALENDAR.CANCELLED,
                    ]}}
                ]
            }
        ]
    });

    return conditions;
}

function generateAggregationCondition_Handle(department, rule, username = '') {
    return generateAggregationCondition_event(department, rule, username);
}

function generateAggregationCondition_Handled(username) {
    const listActionHandled = [
        EVENT_CALENDAR_FROM_ACTION.APPROVE_DEPARTMENT,
        EVENT_CALENDAR_FROM_ACTION.REJECTED_DEPARTMENT,
        EVENT_CALENDAR_FROM_ACTION.APPROVE_HOST,
        EVENT_CALENDAR_FROM_ACTION.REJECTED_HOST,
        EVENT_CALENDAR_FROM_ACTION.APPROVE_RECALL_HOST,
        EVENT_CALENDAR_FROM_ACTION.REJECT_RECALL_HOST,
        EVENT_CALENDAR_FROM_ACTION.APPROVE_RECALL_DEPARTMENT,
        EVENT_CALENDAR_FROM_ACTION.REJECT_RECALL_DEPARTMENT,
    ];
    const NUM_YEAR = 1;
    const maxTimeShow = new Date();
    maxTimeShow.setFullYear(maxTimeShow.getFullYear() - NUM_YEAR);
    const conditions = [];
    conditions.push({
        $and: [
            { feature: { $eq: EVENT_FEATURE_NAME } },
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

function generateAggregationCondition_Rejected(username) {
    const listActionHandled = [
        EVENT_CALENDAR_FROM_ACTION.REJECTED_DEPARTMENT,
        EVENT_CALENDAR_FROM_ACTION.REJECTED_HOST,
        EVENT_CALENDAR_FROM_ACTION.REJECT_RECALL_HOST,
        EVENT_CALENDAR_FROM_ACTION.REJECT_RECALL_DEPARTMENT,
    ];
    const NUM_YEAR = 1;
    const maxTimeShow = new Date();
    maxTimeShow.setFullYear(maxTimeShow.getFullYear() - NUM_YEAR);
    const conditions = [];
    conditions.push({
        $and: [
            { feature: { $eq: EVENT_FEATURE_NAME } },
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

class BuildFilterAggregateEventCalendar {
    constructor() {}

    generateUIFilterAggregate_load(aggregationSteps = [], queryCriteria, tab = EVENT_CALENDAR_UI_TAB.MANAGEMENT) {
        doFilter(aggregationSteps, queryCriteria, tab);
        addDepartmentFields(aggregationSteps);
        addMeetingRoomFields(aggregationSteps);
        addCarFields(aggregationSteps);
        doSort(aggregationSteps, queryCriteria);
        doPagination(aggregationSteps, queryCriteria);
        return aggregationSteps;
    }

    generatePermissionAggregate_ManageUI(username, department, rule, tab, checks, tab_child, filter_employee, aggregationSteps = []) {
        let conditions = [];
        switch (tab) {
            case EVENT_CALENDAR_UI_TAB.MANAGEMENT:
                if (checks.includes(EVENT_CALENDAR_UI_CHECK.DEPARTMENT)) {
                    const responsibilityConditions = generateAggregationCondition_DepartmentResponsibility(department, rule);
                    conditions = conditions.concat(responsibilityConditions);
                }

                if (checks.includes(EVENT_CALENDAR_UI_CHECK.CREATED)) {
                    const createdConditions = generateAggregationCondition_Created(username);
                    conditions = conditions.concat(createdConditions);
                }

                //Người tham gia hoặc là người chủ trì
                if (checks.includes(EVENT_CALENDAR_UI_CHECK.PERSONALLY_INVOLVED)) {
                    const personallyInvolvedCondition = {
                        $or:[
                            { participants: { $eq: username } },
                            { main_person: { $eq: username } },
                        ]
                    }
                    conditions.push(personallyInvolvedCondition);
                }

                //Phòng ban
                // if (checks.includes(EVENT_CALENDAR_UI_CHECK.DEPARTMENT_INVOLVED)) {
                //     const personallyInvolvedCondition = { departments: { $eq: department } };
                //     conditions.push(personallyInvolvedCondition);
                // }

                //Đã xử lí
                if (checks.includes(EVENT_CALENDAR_UI_CHECK.HANDLED)) {
                    const handledConditions = generateAggregationCondition_Handled(username);
                    conditions = conditions.concat(handledConditions);
                }

                if (checks.includes(EVENT_CALENDAR_UI_CHECK.REJECTED)) {
                    const handledConditions = generateAggregationCondition_Rejected(username);
                    conditions = conditions.concat(handledConditions);
                }

                if (checks.includes(EVENT_CALENDAR_UI_CHECK.NEEDTOHANDLE)) {
                    const handleConditions = generateAggregationCondition_Handle(department, rule, username);
                    conditions = conditions.concat(handleConditions);
                }
                break;

            case EVENT_CALENDAR_UI_TAB.CALENDAR:
                if (checks.includes(EVENT_CALENDAR_UI_CHECK.DEPARTMENT)) {
                    const responsibilityConditions = generateAggregationCondition_DepartmentResponsibility(department, rule);
                    conditions = conditions.concat(responsibilityConditions);
                }

                if (checks.includes(EVENT_CALENDAR_UI_CHECK.CREATED)) {
                    const createdConditions = generateAggregationCondition_Created(username);
                    conditions = conditions.concat(createdConditions);
                }

                if (checks.includes(EVENT_CALENDAR_UI_CHECK.PERSONALLY_INVOLVED)) {
                    const personallyInvolvedCondition = {
                        $or:[
                            { participants: { $eq: username } },
                            { main_person: { $eq: username } },
                        ]
                    }
                    conditions.push(personallyInvolvedCondition);
                }

                if (checks.includes(EVENT_CALENDAR_UI_CHECK.MANAGE)) {
                    const manageConditions = generateAggregationCondition_Manage(rule);
                    conditions = conditions.concat(manageConditions);
                }

                //filter for child tab calendar
                    //my_calendar
                if (tab_child === EVENT_CALENDAR_UI_CHILD_TAB.MY_CALENDAR) {
                    const personallyInvolvedCondition = {
                        $or:[
                            { participants: { $eq: username } },
                            { main_person: { $eq: username } },
                        ]
                    }
                    conditions.push(personallyInvolvedCondition);
                }
                    //my_department
                if (tab_child === EVENT_CALENDAR_UI_CHILD_TAB.MY_DEPARTMENT_CALENDAR) {
                    const responsibilityConditions = generateAggregationCondition_DepartmentResponsibility(department, rule);
                    conditions = conditions.concat(responsibilityConditions);
                }
                    //my_director
                if (tab_child === EVENT_CALENDAR_UI_CHILD_TAB.MY_DIRECTOR_CALENDAR) {
                    conditions.push({
                        $and: [
                            { feature: { $eq: EVENT_FEATURE_NAME } },
                            { level: LEVEl_CALENDAR.LEVEL_1 }
                        ]
                    });
                }
                    //my_employee
                if (tab_child === EVENT_CALENDAR_UI_CHILD_TAB.MY_EMPLOYEE_CALENDAR) {
                    if (filter_employee && filter_employee.length > 0){
                        conditions.push({
                            $and: [
                                { "participants_info.username": {$in: filter_employee } },
                                {
                                    $or: [
                                        { "participants_info.department": { $eq: department } },
                                        { "main_person_info.department": { $eq: department } }
                                    ]
                                }
                            ]
                        })
                    }else{
                        conditions.push({
                            $or: [
                                { "participants_info.department": { $eq: department } },
                                { "main_person_info.department": { $eq: department } }
                            ]
                        })
                    }
                    
                }
                break;
        } 

        if (conditions.length > 0) {
            aggregationSteps.push({ $match: { $or: conditions } });
        } else {
            aggregationSteps.push({ $match: { _id: { $eq: false } } });
        }
        
        return aggregationSteps;
    }

    generateUIFilterAggregate_count(aggregationSteps = [], queryCriteria) {
        doFilter(aggregationSteps, queryCriteria);
        doCount(aggregationSteps);
        return aggregationSteps;
    }

    generateUIFilterAggregate_loadDetails(aggregationSteps = []) {
        addMeetingRoomFields(aggregationSteps);
        addCarFields(aggregationSteps);
        return aggregationSteps;
    }


    generateUIFilterAggregate_search(aggregationSteps = [], queryCriteria) {
        doSearchFilter(aggregationSteps, queryCriteria);
        return aggregationSteps;
    }
}

module.exports = new BuildFilterAggregateEventCalendar();
