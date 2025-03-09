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
    require('./organization/organization.index'),
    require('./human/human.index'),
    require('./workflow_play/index'),
    require('./task/index'),
    require('./dispatch_arrived/index'),
    require('./leave_form/index'),
    require('./notify/notify.index'),
    require('./journey_time_form/index'),
    require('./strategic/index'),
    require('./workflow/index'),
    require('./project/project.index'),
    require('./task_workflow/index'),
    require('./file/index'),
    // require('./study_plan/index'),
    require('./outgoing_dispatch/index'),
    require('./label/index'),
    require('./sending_place/index'),
    require('./car_management/index'),
    require('./card_vehicle/index'),
    require('./meeting_room/index'),
    require('./event_calendar/index'),
    require('./advanced_search/index'),
    require('./elearning/index'),
];

module.exports = generateArrayValue(indexAr);
