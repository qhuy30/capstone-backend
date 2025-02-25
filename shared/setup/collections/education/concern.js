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
    require('./study_plan.const'),
    require('./exam_schedule'),
    require('./frequently_questions'),
    require('./question_and_answer'),
    require('./types_question'),
    require('./training_point'),
    require('./event_counter'),
];

module.exports = generateArrayValue(collectionArray);