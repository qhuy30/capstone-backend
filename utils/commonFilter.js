function preparePagination(aggregationSteps = [], { body }) {
    if (parseInt(body.offset)) {
        aggregationSteps.push({
            $skip: parseInt(body.offset),
        });
    }
    if (parseInt(body.top)) {
        aggregationSteps.push({
            $limit: parseInt(body.top),
        });
    }
}

function prepareCount(aggregationSteps = []) {
    aggregationSteps.push({
        $count: "count",
    });
}

module.exports = {
    preparePagination,
    prepareCount,
};
