const mongodb = require("mongodb");

const { TASK_TEMPLATE_STATUS } = require("../../../utils/constant");

function generatePagination(aggregationSteps = [], filter = {}) {
    if (Number.parseInt(filter.top)) {
        aggregationSteps.push({
            $limit: Number.parseInt(filter.top),
        });
    }

    if (Number.parseInt(filter.offset) >= 0) {
        aggregationSteps.push({
            $skip: Number.parseInt(filter.top),
        });
    }

    if (filter.sort) {
        aggregationSteps.push({
            $sort: filter.sort,
        });
    }
}

function generateCount(aggregationSteps = []) {
    aggregationSteps.push({
        $count: "total",
    });
}

function generateSearchFilter(aggregationSteps = [], filter) {
    if (filter.search) {
        aggregationSteps.push({
            $match: {
                $text: {
                    $search: `${filter.search}`,
                },
            },
        });
    }
    return aggregationSteps;
}

function generateLoadDetailFilter(aggregationSteps = [], username, filter = {}) {
    if (filter.id) {
        aggregationSteps.push({
            $match: {
                _id: new mongodb.ObjectId(filter.id),
            },
        });
    }
}

function generateCommonFilter(aggregationSteps = [], filter = {}) {
    const conditions = [];
    if (filter.repetitive_cycle) {
        conditions.push({
            "repetitive.cycle": {
                $eq: filter.repetitive_cycle,
            },
        });
    }

    if (filter.priority) {
        conditions.push({
            priority: {
                $eq: filter.priority,
            },
        });
    }

    if (filter.status) {
        conditions.push({
            status: {
                $eq: filter.status,
            },
        });
    }

    if (filter.series) {
        conditions.push({
            _id: {
                $eq: new mongodb.ObjectId(filter.series),
            },
        });
    }

    if (filter.task_type) {
        conditions.push({
            task_type: {
                $eq: filter.task_type,
            },
        });
    }

    if (filter.from_date) {
        conditions.push({
            from_date: {
                $gte: filter.from_date,
            },
        });
    }

    if (filter.to_date) {
        conditions.push({
            to_date: {
                $lte: filter.to_date,
            },
        });
    }

    if (conditions.length > 0) {
        aggregationSteps.push({
            $match: {
                $and: conditions,
            },
        });
    }

    return aggregationSteps;
}

function processTemplateStatus(aggregationSteps = []) {
    aggregationSteps.push(
        {
            $addFields: {
                isExpired: {
                    $lte: [
                        "$to_date",
                        {
                            $toLong: "$$NOW",
                        },
                    ],
                },
            },
        },
        {
            $addFields: {
                tmp_status: {
                    $switch: {
                        branches: [
                            {
                                case: {
                                    $in: ["$status", [TASK_TEMPLATE_STATUS.ACTIVE, TASK_TEMPLATE_STATUS.PAUSE]],
                                },
                                then: {
                                    $cond: ["$isExpired", TASK_TEMPLATE_STATUS.END, "$status"],
                                },
                            },
                        ],
                        default: "$status",
                    },
                },
            },
        },
        {
            $set: {
                status: "$tmp_status",
            },
        },
        {
            $unset: ["tmp_status", "isExpired"],
        }
    );
    return aggregationSteps;
}

function processChildSeries(aggregationSteps = []) {
    aggregationSteps.push({
        $addFields: {
            list_task_ids: {
                $reduce: {
                    input: "$department",
                    initialValue: [],
                    in: {
                        $concatArrays: [
                            "$$value",
                            {
                                $map: {
                                    input: "$$this.tasks",
                                    as: "task_item",
                                    in: {
                                        status: "$$task_item.status",
                                        task_id: {
                                            $toObjectId: "$$task_item.id",
                                        },
                                    },
                                },
                            },
                        ],
                    },
                },
            },
        },
    });
    aggregationSteps.push({
        $lookup: {
            from: "task",
            let: {
                list_task: "$list_task_ids",
            },
            as: "child_series",
            pipeline: [
                {
                    $match: {
                        $expr: {
                            $in: ["$_id", "$$list_task.task_id"],
                        },
                    },
                },
                {
                    $addFields: {
                        job_status: {
                            $getField: {
                                input: {
                                    $first: {
                                        $filter: {
                                            input: "$$list_task",
                                            as: "task_item",
                                            cond: {
                                                $eq: ["$$task_item.task_id", "$_id"],
                                            },
                                        },
                                    },
                                },
                                field: "status",
                            },
                        },
                    },
                },
            ],
        },
    });
    aggregationSteps.push({
        $unset: ["list_task_ids"],
    });
}

exports.buildLoadAggregation = function (aggregationSteps = [], username, filter = {}) {
    generateSearchFilter(aggregationSteps, filter);
    processTemplateStatus(aggregationSteps);
    generateCommonFilter(aggregationSteps, filter);
    processChildSeries(aggregationSteps);
    generatePagination(aggregationSteps, filter);
    return aggregationSteps;
};

exports.buildCountAggregation = function (aggregationSteps = [], username, filter = {}) {
    generateSearchFilter(aggregationSteps, filter);
    processTemplateStatus(aggregationSteps);
    generateCommonFilter(aggregationSteps, filter);
    processChildSeries(aggregationSteps);
    generateCount(aggregationSteps);
    return aggregationSteps;
};

exports.buildLoadDetailAggregation = function (aggregationSteps = [], username, filter = {}) {
    generateLoadDetailFilter(aggregationSteps, username, filter);
    processTemplateStatus(aggregationSteps);
    processChildSeries(aggregationSteps);
    return aggregationSteps;
};
