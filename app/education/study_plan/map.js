const { adminDomain } = require('../../../utils/setting');
const maps = [
    {
        key: 'StudyPlan',
        path: 'study-plan',
        js: [
            '/modules/education/study_plan/service.js',
            '/modules/education/study_plan/directive.js',
            '/modules/education/study_plan/controller.js',
        ],
        html: '/modules/education/study_plan/views/study_plan.html',
        rule: ['Education.StudyPlan.Use'],
        icon: '<i class="fas fa-calendar-alt"></i>',
        canStick: true,
    },
];

module.exports = (function () {
    var temp = [];
    for (let i in maps) {
        for (let j in maps[i].js) {
            maps[i].js[j] = adminDomain + maps[i].js[j];
        }
        maps[i].html = adminDomain + maps[i].html;
        if (maps[i].toolbar) {
            for (let j in maps[i].toolbar.js) {
                maps[i].toolbar.js[j] = adminDomain + maps[i].toolbar.js[j];
            }
            maps[i].toolbar.html = adminDomain + maps[i].toolbar.html;
        }
        temp.push(maps[i]);
    }
    return temp;
})();
