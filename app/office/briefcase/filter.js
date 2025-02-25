const { BRIEFCASE_STATE } = require("../../../utils/constant");
const commonUtils = require("../../../utils/util");
const { ARCHIVE_STATUS } = require("./const");

function prepareData(aggregationSteps = []) {
    aggregationSteps.push({
        $addFields: {
            current_date: {
                $toLong: "$$NOW",
            },
            created_date: {
                $first: "$entity.his.created",
            },
        },
    });
    aggregationSteps.push({
        $addFields: {
            end_date: {
                $toLong: {
                    $dateAdd: {
                        startDate: {
                            $toDate: "$created_date",
                        },
                        unit: "$maintenance_time.unit",
                        amount: "$maintenance_time.amount",
                    },
                },
            },
        },
    });
}

function prepareStateInfo(aggregationSteps = []) {
    aggregationSteps.push({
        $addFields: {
            state: {
                $switch: {
                    branches: [
                        {
                            case: {
                                $and: [
                                    { $eq: [{ $type: "$canceled_date" }, "string"] },
                                    { $not: { $eq: ["$canceled_date", ""] } },
                                ],
                            },
                            then: BRIEFCASE_STATE.CANCELLED,
                        },
                        {
                            case: {
                                $gt: ["$current_date", "$end_date"],
                            },
                            then: BRIEFCASE_STATE.EXPIRED,
                        },
                    ],
                    default: BRIEFCASE_STATE.ON_SCHEDULE,
                },
            },
        },
    });
}

function buildTextSearch(aggregationSteps = [], filter = {}) {
    if (filter.search) {
        aggregationSteps.push({
            $match: {
                $text: {
                    $search: `"${filter.search}"`,
                },
            },
        });
    }
}

function buildPagination(aggregationSteps = [], filter = {}) {
    if (typeof filter.top === "number" && filter.top > 0) {
        aggregationSteps.push({
            $limit: filter.top,
        });
    }

    if (typeof filter.offset === "number" && filter.offset >= 0) {
        aggregationSteps.push({
            $skip: filter.offset,
        });
    }
}

function buildSearchFilter(aggregationSteps = [], filter = {}) {
    const conditions = [];
    if (commonUtils.isValidValue(filter.dispatch_arrived_id)) {
        conditions.push({
            "reference": {
                $elemMatch: {
                    type: "DispatchArrived",
                    id: filter.dispatch_arrived_id,
                },
            },
        });
    }

    if (commonUtils.isValidValue(filter.outgoing_dispatch_id)) {
        conditions.push({
            "reference": {
                $elemMatch: {
                    type: "OutgoingDispatch",
                    id: filter.outgoing_dispatch_id,
                },
            },
        });
    }

    if (commonUtils.isValidValue(filter.from_date)) {
        conditions.push({
            start_date: {
                $gte: filter.from_date,
            },
        });
    }

    if (commonUtils.isValidValue(filter.to_date)) {
        conditions.push({
            start_date: {
                $lt: filter.to_date,
            },
        });
    }

    if (commonUtils.isValidValue(filter.state)) {
        conditions.push({
            state: {
                $eq: filter.state,
            },
        });
    }
    conditions.push({status:{$eq: ARCHIVE_STATUS.ARCHIVED}})

    if (conditions.length > 0) {
        aggregationSteps.push({
            $match: {
                $and: conditions,
            },
        });
    }
}

exports.generateSearchAggregation = function (filter) {
    const aggregationsSteps = [];
    buildTextSearch(aggregationsSteps, filter);
    prepareData(aggregationsSteps);
    prepareStateInfo(aggregationsSteps);
    buildSearchFilter(aggregationsSteps, filter);
    buildPagination(aggregationsSteps, filter);
    return aggregationsSteps;
};
