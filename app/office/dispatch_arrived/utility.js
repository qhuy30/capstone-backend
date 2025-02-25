const q = require("q");

const { APPROVE_LEVEL_1_RULE, CONFIRM_RULE, MANAGE_DISPATCHARRIVED_RULE, DISPATCH_ARRIVED_STATUS, LEAD_RULE, CHECKS_ON_UI, DISPATCH_STATUS, RULE_DISPATCH, ACTION } = require('./const');
const { convertToStartOfDay, convertToEndOfDay } = require("@utils/util");

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
}

function doFilter(aggregationSteps = [], queryCriteria) {
    const dateStart = convertToStartOfDay(queryCriteria.date_start);
    const dateEnd = convertToEndOfDay(queryCriteria.date_end);
    const conditions = [];
    
    if (queryCriteria.incoming_number) {
        conditions.push({
            incoming_number: { $eq: queryCriteria.incoming_number }
        });
    }
    if (queryCriteria.urgency_level) {
        conditions.push({
            urgency_level: { $eq: queryCriteria.urgency_level }
        });
    }
    if (queryCriteria.type) {
        conditions.push({
            type: { $eq: queryCriteria.type }
        });
    }
    if (dateStart) {
        conditions.push({ time: { $gte: dateStart } });
    }
    if (dateEnd) {
        conditions.push({ time: { $lte: dateEnd } });
    }
    if(queryCriteria.year) {
        conditions.push({ year: { $eq: queryCriteria.year } });
    }
    if (conditions.length > 0) {
        aggregationSteps.push({ $match: { $and: conditions } });
    }
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

function generateAggerationCondition_Created(username) {
    const conditions = [];
    conditions.push({
        $and: [
            { username: { $eq: username } }
        ]
    });
    return conditions;
}

function generateAggerationCondition_Handle(username, _department, rule) {
    const conditions = [];

    if (rule.filter(e => e.rule === RULE_DISPATCH.LEAD_DEPARTMENT)[0]) {
        conditions.push({
            $and: [{ 
                status: { 
                    $in: [
                        DISPATCH_STATUS.WAITING_LEAD_DERPARTMENT_APPROVE
                    ] 
                } 
            }]
        });
    }

    if (rule.filter(e => e.rule === RULE_DISPATCH.LEAD_EXTERNAL)[0]) {
        conditions.push({
            $and: [{ 
                status: { 
                    $in: [
                        DISPATCH_STATUS.WAITING_LEAD_EXTERNAL_APPROVE
                    ] 
                } 
            }]
        });
    }

    const ruleConfirmDepartmentLevel = rule.filter(e => e.rule === RULE_DISPATCH.LEAD_CONFIRM)[0];
    if (ruleConfirmDepartmentLevel && ruleConfirmDepartmentLevel.details) {
        switch (ruleConfirmDepartmentLevel.details.type) {
            case "All":
                conditions.push({
                    $and: [
                        { status: { $in: [DISPATCH_STATUS.LEAD_TRANSFER_DEPARTMENT] } },
                    ]

                });
                break;
            case "Specific":
                conditions.push({
                    $and: [
                        {
                            status: { $in: [DISPATCH_STATUS.LEAD_TRANSFER_DEPARTMENT] }
                        },
                        {
                            department_execute: { $in: ruleConfirmDepartmentLevel.details.department }
                        }
                    ]

                });
                break;
            case "Working":
                conditions.push({
                    $and: [
                        {
                            status: { $in: [DISPATCH_STATUS.LEAD_TRANSFER_DEPARTMENT] }
                        },
                        {
                            department_execute: { $eq: _department }
                        }
                    ]

                });
                break;
        }
    }

    if (rule.filter(e => e.rule === RULE_DISPATCH.FOLLOW)[0]) {
        conditions.push({
            $and: [
                { status: { $in: [DISPATCH_STATUS.APPROVED, DISPATCH_STATUS.LEAD_TRANSFER_DEPARTMENT] } },
                { department_receiver: 
                    { 
                        $elemMatch: {
                            department: { $eq: _department },
                            seen: {  $ne: true }
                        } 
                    } 
                }
            ]

        });
    }

    return conditions
}

function generateAggerationCondition_Handled(username, department, rule) {
    const listActionHandled = [
        ACTION.SEND_LEAD_DEPARTMENT,
        ACTION.SEND_LEAD_DEPARTMENT_AND_UPDATE,
        ACTION.REJECTED_DEPARTMENT,
        ACTION.SEND_LEAD_EXTERNAL,
        ACTION.SEND_LEAD_EXTERNAL_AND_UPDATE,
        ACTION. RETURN_LEAD_DEPARTMENT,
        ACTION.RETURN_LEAD_DEPARTMENT_AND_UPDATE,
        ACTION.TRANSFER_DEPARTMENT,
        ACTION.TRANSFER_DEPARTMENT_AND_UPDATE,
        ACTION.TRANSFER_DEPARTMENT_APPROVE,
        ACTION.DEPARTMENT_SEEN,
        ACTION.DEPARTMENT_RECEIVED
    ];
    const NUM_YEAR = 1;
    const maxTimeShow = new Date();
    maxTimeShow.setFullYear(maxTimeShow.getFullYear() - NUM_YEAR);
    const conditions = [];
    conditions.push({
        $and: [
            {
                events: {
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

function generateAggerationCondition_PendingReceipt(username, _department, rule) {
    const conditions = [];

    if (rule.filter(e => e.rule === RULE_DISPATCH.FOLLOW)[0]) {
        conditions.push({
            $and: [
                { status: { $in: [DISPATCH_STATUS.PENDING_RECEIPT] } },
                { department_receiver: 
                    { 
                        $elemMatch: {
                            department: { $eq: _department }
                        } 
                    } 
                }
            ]

        });
    }

    return conditions;
}

class BuildFilterAggregate {
    constructor() { }

    generateUIFilterAggregate_load(aggregationSteps = [], queryCriteria) {
        doFilter(aggregationSteps, queryCriteria);
        doSort(aggregationSteps, queryCriteria);
        doPagination(aggregationSteps, queryCriteria);
        return aggregationSteps;
    }

    generatePermissionAggregate_ManageUI(username, department, rule, checks, aggregationSteps = []) {
        let conditions = [];

        if (checks.includes(CHECKS_ON_UI.CREATED)) {
            const createdConditions = generateAggerationCondition_Created(username);
            conditions = conditions.concat(createdConditions);
        }

        if (checks.includes(CHECKS_ON_UI.NEED_HANDLE)) {
            const needHandleConditions = generateAggerationCondition_Handle(username, department, rule);
            conditions = conditions.concat(needHandleConditions);
        }

        if (checks.includes(CHECKS_ON_UI.HANDLE)) {
            const handledConditions = generateAggerationCondition_Handled(username, department, rule);
            conditions = conditions.concat(handledConditions);
        }

        if (checks.includes(CHECKS_ON_UI.PENDING_RECEIPT)) {
            const pendingReceiptConditions = generateAggerationCondition_PendingReceipt(username, department, rule);
            conditions = conditions.concat(pendingReceiptConditions);
        }

        if (checks.includes(CHECKS_ON_UI.GONNA_LATE)) {
            // const needHandleConditions = generateAggerationCondition_Handle(username, department, rule);
            // conditions = conditions.concat(needHandleConditions);
        }

        if (conditions.length > 0) {
            aggregationSteps.push({ $match: { $or: conditions } });
        } else {
            aggregationSteps.push({ $match: { _id: { $eq: false } } });
        }

        return aggregationSteps;
    }

    generatePermissionAggregate_QuickHandle(department, rule, aggregationSteps = []) {

        const conditions = [];

        if (rule.filter(e => e.rule === MANAGE_DISPATCHARRIVED_RULE)[0]) {
            conditions.push({
                status: { $eq: DISPATCH_ARRIVED_STATUS.CREATED }
            });
        }

        if (rule.filter(e => e.rule === LEAD_RULE)[0]) {
            conditions.push({
                status: { $eq: DISPATCH_ARRIVED_STATUS.WAITING_FOR_APPROVAL }
            });
        }

        const ruleConfirm = rule.filter(e => e.rule === CONFIRM_RULE)[0];
        if (ruleConfirm && ruleConfirm.details) {
            switch (ruleConfirm.details.type) {
                case "All":
                    conditions.push({
                        status: { $eq: DISPATCH_ARRIVED_STATUS.WAITING_FOR_ACCEPT }
                    });
                    break;
                case "Specific":
                    conditions.push({
                        $and: [
                            {
                                status: { $eq: DISPATCH_ARRIVED_STATUS.WAITING_FOR_ACCEPT }
                            },
                            {
                                "tasks.department.id": { $in: ruleConfirm.details.department }
                            }
                        ]

                    });
                    break;
                case "Working":
                    conditions.push({
                        $and: [
                            {
                                status: { $eq: DISPATCH_ARRIVED_STATUS.WAITING_FOR_ACCEPT }
                            },
                            {
                                "tasks.department.id": { $eq: department }
                            }
                        ]

                    });
                    break;
            }
        }

        if (rule.filter(e => e.rule === APPROVE_LEVEL_1_RULE)[0]) {
            conditions.push({
                status: { $eq: DISPATCH_ARRIVED_STATUS.WAITING_FOR_REVIEW }
            });
        }

        if (conditions.length > 0) {
            aggregationSteps.push({ $match: { $or: conditions } });
        } else {
            aggregationSteps.push({ $match: { _id: { $eq: false } } });
        }

        return aggregationSteps


    }

    generateUIFilterAggregate_count(aggregationSteps = [], queryCriteria) {
        if (queryCriteria) {
            doFilter(aggregationSteps, queryCriteria);
        }
        doCount(aggregationSteps);
        return aggregationSteps;
    }

    generateUIFilterAggregate_search(aggregationSteps = [], queryCriteria) {
        doSearchFilter(aggregationSteps, queryCriteria);
        return aggregationSteps;
    }
}

exports.BuildFilterAggregate = new BuildFilterAggregate();
