const CommonFilter = require("../../../utils/commonFilter");
const { WORKFLOW_PLAY_STATUS, WORKFLOW_PLAY_NODE_STATE } = require("../../../utils/constant");
const { WORKFLOW_PLAY_RULE } = require("./const");
const DURATION_DAY_IN_UNIX = 24 * 60 * 60 * 1000;

function generateLoadFilter(aggregateSteps = [], body) {
    const username = body.username
    let condition = [];
    body.is_personal && condition.push({ is_personal: true });
    body.is_department && condition.push({ is_department: true });

    condition = buildCheckboxFilter(condition, body.session.department, body, body.session.rule,  username)
    condition = buildSearchFilter(condition, body);
    condition = buildStatusFilter(condition, body);
    condition = buildDocumentTypeFilter(condition, body);
    if (condition.length) {
        aggregateSteps.push({
            $match: { $and: condition },
        });
    }
    return aggregateSteps;
}

function generateStateField(aggregateSteps = []) {
    prepareCommonData(aggregateSteps);
    prepareStateField(aggregateSteps);
}

function buildCheckboxFilter(condition = [], department, { checks = [] },rule, username ) {
    const checkboxConditions = [];
    const ruleConditions = []
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
                    status: {
                        $in: ["Approved", "SaveODB"],
                    },
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
            // $or: [
            //     {
            //         play_now: {
            //             $elemMatch: { username },
            //         },
            //     },
            //     {  },
            // ],
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

    if (checkboxConditions.length > 0) {
        condition.push({ $or: checkboxConditions });
    }

    return condition;
}
function buildSearchFilter(condition = [], { search }) {
    if (search) {
        condition.push({
            $text: {
                $search: `"${search}"`,
            },
        });
    }
    return condition;
}

function buildStatusFilter(condition = [], { status, statuses }) {
    if (status) {
        condition.push({
            status: { $eq: status },
        });
    } else if (statuses && statuses.length > 0) {
        condition.push({
            status: { $in: statuses },
        });
    }
    return condition;
}

function buildDocumentTypeFilter(condition = [], { document_type }) {
    if (document_type) {
        condition.push({
            document_type: { $eq: document_type },
        });
    }
    return condition;
}

function prepareCommonData(aggregateSteps = []) {
    aggregateSteps.push({
        $addFields: {
            current_date: { $toLong: "$$NOW" },
            is_processing_flow: { $eq: ["$status", WORKFLOW_PLAY_STATUS.PENDING] },
        },
    });
    aggregateSteps.push({
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

function prepareStateField(aggregateSteps = []) {
    aggregateSteps.push({
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
    aggregateSteps.push({
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

function prepareRemainingDayFiled(aggregateSteps = []) {
    aggregateSteps.push({
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

function unsetUnnecessaryFields(aggregateSteps) {
    aggregateSteps.push({
        $unset: ["current_date", "is_processing_flow", "current_node", "percent_used"],
    });
}

function addSortStage(aggregateSteps, sort) {
    aggregateSteps.push({
        $sort: sort,
    });
}

exports.buildLoadAggregate = function (body) {
    const aggregateSteps = [];
    generateLoadFilter(aggregateSteps, body);
    generateStateField(aggregateSteps);
    CommonFilter.preparePagination(aggregateSteps, { body });
    unsetUnnecessaryFields(aggregateSteps);
    addSortStage(aggregateSteps, body.sort);
    return aggregateSteps;
};

exports.buildJobLoadAggregate = function (remainingDay) {
    const aggregateSteps = [];
    prepareCommonData(aggregateSteps);
    prepareStateField(aggregateSteps);
    prepareRemainingDayFiled(aggregateSteps);
    aggregateSteps.push({
        $match: {
            remaining_day: {
                $eq: remainingDay,
            },
        },
    });
    return aggregateSteps;
};
