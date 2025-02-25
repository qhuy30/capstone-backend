function generateArrayValue(ar) {
    let results = [];
    for (var i in ar) {
        for (var j in ar[i]) {
            results.push(ar[i][j]);
        }
    }
    return results;
}

let indexAr = [
    require('./study_plan/index'),
    require('./exam_schedule/index'),
    require('./question_answer/index'),
    require('./training_point/index'),
    require('./event_counter/index'),
];

module.exports = generateArrayValue(indexAr);