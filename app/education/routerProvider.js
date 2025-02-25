module.exports = [
    { path: "/education/study_plan", router: require('./study_plan/router') },
    { path: "/education/exam_schedule", router: require('./exam_schedule/router') },
    { path: "/education/question_answer", router: require('./question_answer/router') },
    { path: "/education/training_point", router: require('./training_point/router') },
    { path: "/education/event_counter", router: require('./event_counter/router') },
]