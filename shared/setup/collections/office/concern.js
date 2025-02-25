function generateArrayValue(ar) {
    let results = [];
    for (var i in ar) {
        for (var j in ar[i]) {
            results.push(ar[i][j]);
        }
    }
    return results;
}

collectionArray = [
    require('./human.const'),
    require('./task.const'),
    require('./file.const'),
    require('./dispatch.const'),
    require('./study_plan.const'),
];

module.exports = generateArrayValue(collectionArray);