const { adminDomain } = require('../../../utils/setting');
const maps = [
    {
        key: 'File',
        path: 'file',
        js: [
            '/modules/office/file/service.js',
            '/modules/office/file/filter.js',
            '/modules/office/file/directive.js',
            '/modules/office/file/controller.js',
            '/modules/office/file/controller_personal.js',
            '/modules/office/file/controller_share.js',
            '/modules/office/file/controller_general.js',
            '/modules/office/file/controller_department.js',
            '/modules/office/file/controller_project.js',
        ],
        html: '/modules/office/file/views/file.html',
        rule: ['Office.File.Use'],
        icon: '<i class="fas fa-folders"></i>',
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
