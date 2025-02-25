const { adminDomain } = require('../../../utils/setting');
const maps = [
    {
        key: 'ExamSchedule',
        path: 'exam-schedule',
        js: [
            '/modules/education/exam_schedule/service.js',
            '/modules/education/exam_schedule/directive.js',
            '/modules/education/exam_schedule/controller.js',
        ],
        html: '/modules/education/exam_schedule/views/exam_schedule.html',
        rule: ['Education.ExamSchedule.Use'],
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
