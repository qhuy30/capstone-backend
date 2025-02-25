const { adminDomain } = require('../../../utils/setting');
const maps = [
    {
        key: 'TrainingPoint',
        path: 'training-point',
        js: [
            '/modules/education/training_point/service.js',
            '/modules/education/training_point/controller.js',
            '/modules/education/training_point/controller_event.js',
            '/modules/education/training_point/controller_student.js',
        ],
        html: '/modules/education/training_point/views/training_point.html',
        rule: ['Education.TrainingPoint.Use'],
        icon: '<i class="fas fa-calendar-alt"></i>',
        canStick: true,
    },
    {
        key: 'TrainingPointDetails',
        path: 'training-point-details',
        js: [
            '/modules/education/training_point/details/service.js',
            '/modules/education/training_point/details/controller.js',
        ],
        html: '/modules/education/training_point/details/views/details.html',
        rule: ['Education.TrainingPoint.Use'],
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
