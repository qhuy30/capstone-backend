const q = require("q");

const { APPROVE_LEVEL_1_RULE, CONFIRM_RULE, MANAGE_DISPATCHARRIVED_RULE, DISPATCH_ARRIVED_STATUS, LEAD_RULE, CHECKS_ON_UI, DISPATCH_STATUS, RULE_DISPATCH } = require('./const');
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
    
    if (queryCriteria.symbol_number) {
        conditions.push({
            symbol_number: { $eq: queryCriteria.symbol_number }
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
        conditions.push({ date_sign: { $gte: dateStart } });
    }
    if (dateEnd) {
        conditions.push({ date_sign: { $lte: dateEnd } });
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
            { username: { $eq: username } },
        ]
    });
    return conditions;
}

function generateAggerationCondition_Handle(username, department, rule) {
    const conditions = [];

    if (rule.filter(e => e.rule === RULE_DISPATCH.LEAD_DEPARTMENT)[0]) {
        conditions.push({
            $and: [
                { status: { $eq: DISPATCH_STATUS.WAITING_LEAD_DERPARTMENT_APPROVE } }
            ]

        });
    }

    if (rule.filter(e => e.rule === RULE_DISPATCH.LEAD_EXTERNAL)[0]) {
        conditions.push({
            $and: [
                { status: { $eq: DISPATCH_STATUS.WAITING_LEAD_EXTERNAL_APPROVE } }
            ]
        });
    }

    const ruleConfirmDepartmentLevel = rule.filter(e => e.rule === RULE_DISPATCH.LEAD_CONFIRM)[0];
    if (ruleConfirmDepartmentLevel && ruleConfirmDepartmentLevel.details) {
        switch (ruleConfirmDepartmentLevel.details.type) {
            case "All":
                conditions.push({
                    $and: [
                        { status: { $eq: DISPATCH_STATUS.LEAD_TRANSFER_DEPARTMENT } }
                    ]

                });
                break;
            case "Specific":
                conditions.push({
                    $and: [
                        {
                            status: { $eq: DISPATCH_STATUS.LEAD_TRANSFER_DEPARTMENT }
                        },
                        {
                            department: { $in: ruleConfirmDepartmentLevel.details.department }
                        }
                    ]

                });
                break;
            case "Working":
                conditions.push({
                    $and: [
                        {
                            status: { $eq: DISPATCH_STATUS.LEAD_TRANSFER_DEPARTMENT }
                        },
                        {
                            department: { $eq: department }
                        }
                    ]

                });
                break;
        }
    }

    return conditions
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

        if (checks.indexOf(CHECKS_ON_UI.CREATED) !== -1) {
            const createdConditions = generateAggerationCondition_Created(username);
            conditions = conditions.concat(createdConditions);
        }

        if (checks.indexOf(CHECKS_ON_UI.NEED_HANDLE) !== -1) {
            const needHandleConditions = generateAggerationCondition_Handle(username, department, rule);
            conditions = conditions.concat(needHandleConditions);
        }

        if (conditions.length > 0) {
            aggregationSteps.push({ $match: { $or: conditions } });
        } 
        // else {
        //     aggregationSteps.push({ $match: { _id: { $eq: false } } });
        // }

        return aggregationSteps;
    }

    generatePermissionAggregate_archive(username, department, rule, checks, aggregationSteps = []) {
        let conditions = [];

        
        aggregationSteps.push({ $match: { status: { $eq: DISPATCH_STATUS.WAITING_FOR_SRORAGE } } });

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
