const { WORKFLOW_PLAY_STATUS, WORKFLOW_PLAY_NODE_STATE } = require("../../../utils/constant");
const CommonFilter = require("../../../utils/commonFilter");
const { WORKFLOW_PLAY_RULE, CHECKS_ON_UI } = require("./const");

const DURATION_DAY_IN_UNIX = 24 * 60 * 60 * 1000;

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
    // const dateStart = convertToStartOfDay(queryCriteria.date_start);
    // const dateEnd = convertToEndOfDay(queryCriteria.date_end);
    // const conditions = [];
    
    // if (queryCriteria.incoming_number) {
    //     conditions.push({
    //         incoming_number: { $eq: queryCriteria.incoming_number }
    //     });
    // }
    // if (queryCriteria.urgency_level) {
    //     conditions.push({
    //         urgency_level: { $eq: queryCriteria.urgency_level }
    //     });
    // }
    // if (queryCriteria.type) {
    //     conditions.push({
    //         type: { $eq: queryCriteria.type }
    //     });
    // }
    // if (dateStart) {
    //     conditions.push({ time: { $gte: dateStart } });
    // }
    // if (dateEnd) {
    //     conditions.push({ time: { $lte: dateEnd } });
    // }
    // if(queryCriteria.year) {
    //     conditions.push({ year: { $eq: queryCriteria.year } });
    // }
    // if (conditions.length > 0) {
    //     aggregationSteps.push({ $match: { $and: conditions } });
    // }
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

function generateAggerationCondition_NeedHandle(username) {
    const conditions = [];
    conditions.push({
        play_now: {
            $elemMatch: {
                username: { $eq: username }
            }
        }
    });
    return conditions;
}


function generateAggerationCondition_Handled(username) {
    const NUM_YEAR = 1;
    const maxTimeShow = new Date();
    maxTimeShow.setFullYear(maxTimeShow.getFullYear() - NUM_YEAR);
    const conditions = [];
    conditions.push({
        $and: [
            {
                event: {
                    $elemMatch: {
                        username: username,
                        action: { $ne: 'Created' },
                        time: { $gte: maxTimeShow.getTime() },
                    },
                },
            },
        ],
    });
    return conditions;
}


class BuildFilterAggregate {
    prepareCommonData(aggregationSteps = []) {
        aggregationSteps.push({
            $addFields: {
                current_date: { $toLong: "$$NOW" },
                is_processing_flow: { $eq: ["$status", WORKFLOW_PLAY_STATUS.PENDING] },
            },
        });
        aggregationSteps.push({
            $addFields: {
                current_node: {
                    $cond: [
                        "$is_processing_flow",
                        {
                            $arrayElemAt: ["$flow", { $subtract: ["$node", 1] }],
                        },
                        false,
                    ],
                },
            },
        });
    }

    prepareStateField(aggregationSteps = []) {
        aggregationSteps.push({
            $addFields: {
                percent_used: {
                    $cond: [
                        { $not: "$is_processing_flow" },
                        null,
                        {
                            $floor: {
                                $multiply: [
                                    100,
                                    {
                                        $divide: [
                                            { $subtract: ["$current_date", "$current_node.start_at"] },
                                            { $subtract: ["$current_node.expected_complete_at", "$current_node.start_at"] },
                                        ],
                                    },
                                ],
                            },
                        },
                    ],
                },
            },
        });
        aggregationSteps.push({
            $addFields: {
                current_node_state: {
                    $switch: {
                        branches: [
                            {
                                case: { $gte: ["$percent_used", 80] },
                                then: WORKFLOW_PLAY_NODE_STATE.LATE,
                            },
                            {
                                case: { $gte: ["$percent_used", 60] },
                                then: WORKFLOW_PLAY_NODE_STATE.GONNA_LATE,
                            },
                            {
                                case: { $gte: ["$percent_used", 0] },
                                then: WORKFLOW_PLAY_NODE_STATE.ON_SCHEDULE,
                            },
                        ],
                        default: null,
                    },
                },
            },
        });
    }

    prepareRemainingDayField(aggregationSteps = []) {
        aggregationSteps.push({
            $addFields: {
                remaining_day: {
                    $cond: [
                        { $not: "$is_processing_flow" },
                        null,
                        {
                            $floor: {
                                $divide: [
                                    { $subtract: ["$current_node.expected_complete_at", "$current_date"] },
                                    DURATION_DAY_IN_UNIX,
                                ],
                            },
                        },
                    ],
                },
            },
        });
    }

    addSortStage(aggregationSteps, sort) {
        aggregationSteps.push({
            $sort: sort,
        });
    }

    generateLoadFilter(aggregationSteps = [], body) {
        const username = body.username;

        this.buildSearchFilter(aggregationSteps, body);
        this.buildCheckboxFilter(aggregationSteps, body.session.department, body, body.session.rule, username);
        this.buildStatusFilter(aggregationSteps, body);
        body.document_type && aggregationSteps.push({document_type: { $eq: document_type }});
        body.is_personal && aggregationSteps.push({ is_personal: true });
        body.is_department && aggregationSteps.push({ is_department: true });

        return aggregationSteps;
    }

    buildCheckboxFilter(condition = [], department, { checks = [] }, rule, username) {
        const checkboxConditions = [];
        const ruleConditions = [];
        let ruleManage_leader_department = rule.filter((e) => e.rule === WORKFLOW_PLAY_RULE.DEPARTMENT_LEADER_MANAGE)[0];
        if (ruleManage_leader_department && ruleManage_leader_department.details) {
            switch (ruleManage_leader_department.details.type) {
                case "All":
                    ruleConditions.push({
                        "flow_info.title.en-US": "Transfer Ticket",
                        status: { $in: [WORKFLOW_PLAY_STATUS.PENDING] },
                    });
                    break;
                case "Specific":
                    ruleConditions.push({
                        $and: [
                            { "flow_info.title.en-US": "Transfer Ticket" },
                            {
                                status: { $in: [WORKFLOW_PLAY_STATUS.PENDING] },
                            },
                            {
                                $or: [
                                    {to_department: { $in: ruleManage_leader.details.department } , node: { $ne: 1 } },
                                    {department: { $in: ruleManage_leader.details.department }, node: 1 },
                                ],
                            },
                        ],
                    });
                    break;
                case "Working":
                    ruleConditions.push({
                        $and: [
                            { "flow_info.title.en-US": "Transfer Ticket" },
                            {
                                status: { $in: [WORKFLOW_PLAY_STATUS.PENDING] },
                            },
                            {
                                $or: [
                                    { to_department: department, node: { $ne: 1 } },
                                    { department: department, node: 1 },
                                ],
                            },
                        ],
                    });
                    break;
            }
        }

        let ruleManage_leader = rule.filter((e) => e.rule === WORKFLOW_PLAY_RULE.LEADER_MANAGE)[0];
        if (ruleManage_leader && ruleManage_leader.details) {
            switch (ruleManage_leader.details.type) {
                case "All":
                    ruleConditions.push({
                        "flow_info.title.en-US": "Transfer Ticket",
                        status: { $in: [WORKFLOW_PLAY_STATUS.PENDING] },
                    });
                    break;
                case "Specific":
                    ruleConditions.push({
                        $and: [
                            { "flow_info.title.en-US": "Transfer Ticket" },
                            {
                                status: { $in: [WORKFLOW_PLAY_STATUS.PENDING] },
                            },

                            {
                                $or: [
                                    {to_department: { $in: ruleManage_leader.details.department } , node: { $ne: 1 } },
                                    {department: { $in: ruleManage_leader.details.department }, node: 1 },
                                ],
                            },
                        ],
                    });
                    break;
                case "Working":
                    ruleConditions.push({
                        $and: [
                            { "flow_info.title.en-US": "Transfer Ticket" },
                            {
                                status: { $in: [WORKFLOW_PLAY_STATUS.PENDING] },
                            },
                            {
                                $or: [
                                    { to_department: department, node: { $ne: 1 } },
                                    { department: department, node: 1 },
                                ],
                            },
                        ],
                    });
                    break;
            }
        }

        const conditionsMap = {
            Created: {
                username: { $eq: username },
            },
            Approved: {
                $or: [
                    {
                        username: { $eq: username },
                        status: { $in: ["Approved", "SaveODB"] },
                    },
                    {
                        event: {
                            $elemMatch: {
                                username: username,
                                action: { $in: ["Approved", "SaveODB"] },
                            },
                        },
                    },
                ],
            },
            Rejected: {
                event: {
                    $elemMatch: {
                        username: username,
                        action: "Rejected",
                    },
                },
            },
            NeedToHandle: {

                     $and: ruleConditions
            },
            Returned: {
                event: {
                    $elemMatch: {
                        username: username,
                        action: "Returned",
                    },
                },
            },
        };

        checks.forEach(checkbox => {
            if (conditionsMap[checkbox]) {
                checkboxConditions.push(conditionsMap[checkbox]);
            }
        });

        if (checkboxConditions.length) {
            condition.push({ $match: { $or: checkboxConditions } });
        }

        return condition;
    }

    buildSearchFilter(condition = [], { search }) {
        if (search) {
            condition.push({
                $match: {
                    $text: {
                        $search: `"${search}"`,
                    },
                },
            });
        }
        return condition;
    }

    buildStatusFilter(condition = [], { status, statuses }) {
        if (status) {
            condition.push({
                status: { $eq: status },
            });
        } else if (Array.isArray(statuses) && statuses.length > 0) {
            condition.push({
                status: { $in: statuses },
            });
        }
        return condition;
    }

    buildDocumentTypeFilter(condition = [], { document_type }) {
        if (document_type) {
            condition.push({
                document_type: { $eq: document_type },
            });
        }
        return condition;
    }

    doCount(aggregationSteps = []) {
        aggregationSteps.push({
            $count: "count",
        });
    }
    unsetUnnecessaryFields(aggregateSteps) {
        aggregateSteps.push({
            $unset: ["current_date", "is_processing_flow", "current_node", "percent_used"],
        });
    }


    buildLoadAggregation(body) {
        const aggregationSteps = [];
        this.generateLoadFilter(aggregationSteps, body);
        this.prepareCommonData(aggregationSteps);
        this.prepareStateField(aggregationSteps);
        CommonFilter.preparePagination(aggregationSteps, { body });
        this.unsetUnnecessaryFields(aggregationSteps);
        return aggregationSteps;
    }

    buildCountAggregation(body) {
        const aggregationSteps = [];
        this.generateLoadFilter(aggregationSteps, body);
        this.doCount(aggregationSteps);
        return aggregationSteps;
    }

    buildCountPending(body) {
        const aggregationSteps = [];
        body.status = WORKFLOW_PLAY_STATUS.PENDING;
        this.generateLoadFilter(aggregationSteps, body);
        this.doCount(aggregationSteps);
        return aggregationSteps;
    }

    buildJobLoadAggregation(remainingDay) {
        const aggregationSteps = [];
        this.prepareCommonData(aggregationSteps);
        this.prepareStateField(aggregationSteps);
        this.prepareRemainingDayField(aggregationSteps);
        aggregationSteps.push({
            $match: {
                remaining_day: {
                    $eq: remainingDay,
                },
            },
        });
        return aggregationSteps;
    }

    generateUIFilterAggregate_search(aggregationSteps = [], queryCriteria) {
        doSearchFilter(aggregationSteps, queryCriteria);
        return aggregationSteps;
    }

    generateUIFilterAggregate_load(aggregationSteps = [], queryCriteria) {
        doFilter(aggregationSteps, queryCriteria);
        doSort(aggregationSteps, queryCriteria);
        doPagination(aggregationSteps, queryCriteria);
        return aggregationSteps;
    }

    generateUIFilterAggregate_count(aggregationSteps = [], queryCriteria) {
        if (queryCriteria) {
            doFilter(aggregationSteps, queryCriteria);
        }
        doCount(aggregationSteps);
        return aggregationSteps;
    }

    generatePermissionAggregate_ManageUI(username, department, rule, checks, aggregationSteps = []) {
        let conditions = [];

        if (checks.indexOf(CHECKS_ON_UI.CREATED) !== -1) {
            const createdConditions = generateAggerationCondition_Created(username);
            conditions = conditions.concat(createdConditions);
        }

        if (checks.indexOf(CHECKS_ON_UI.NEED_HANDLE) !== -1) {
            const needHandleConditions = generateAggerationCondition_NeedHandle(username);
            conditions = conditions.concat(needHandleConditions);
        }

        if (checks.indexOf(CHECKS_ON_UI.HANDLED) !== -1) {
            const handledConditions = generateAggerationCondition_Handled(username);
            conditions = conditions.concat(handledConditions);
        }

        if (conditions.length > 0) {
            aggregationSteps.push({ $match: { $or: conditions } });
        } else {
            aggregationSteps.push({ $match: { _id: { $eq: false } } });
        }

        return aggregationSteps;
    }
}

exports.BuildFilterAggregate = new BuildFilterAggregate();
