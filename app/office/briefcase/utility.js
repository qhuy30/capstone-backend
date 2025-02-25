const q = require("q");

const { convertToStartOfDay, convertToEndOfDay } = require("@utils/util");
const { ARCHIVE_STATUS } = require("./const");

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

    
    generateUIFilterAggregate_loadArchive(aggregationSteps = [], queryCriteria) {
        doFilter(aggregationSteps, queryCriteria);
        doSort(aggregationSteps, queryCriteria);
        doPagination(aggregationSteps, queryCriteria);
        return aggregationSteps;
    }
   

    generatePermissionAggregate_archive(username, department, rule, checks, aggregationSteps = []) {
        let conditions = [];

        
        aggregationSteps.push({ $match: { status: { $eq: ARCHIVE_STATUS.WAITING_STORAGE } } });

        return aggregationSteps;
    }

    

    generateUIFilterAggregate_count(aggregationSteps = [], queryCriteria) {
        doFilter(aggregationSteps, queryCriteria);
        doCount(aggregationSteps);
        return aggregationSteps;
    }

    generateUIFilterAggregate_countArchive(aggregationSteps = [], queryCriteria) {
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
