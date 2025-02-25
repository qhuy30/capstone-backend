const {adminDomain} = require('../../../utils/setting');
const maps = [
    {
        key: 'Notify',
        path: 'notify',
        js: [
            '/modules/office/notify/service.js',
            '/modules/office/notify/controller.js',
            '/modules/office/notify/directive.js',
        ],
        html: '/modules/office/notify/views/notify.html',
        rule: ['Office.Notify.Use'],
        icon: '<i class="fa fa-bell"></i>',
        canStick: true,
    },
    {
        key: 'NotifyDetails',
        path: 'notify-details',
        js: ['/modules/office/notify/details/service.js', '/modules/office/notify/details/controller.js'],
        html: '/modules/office/notify/details/views/details.html',
        rule: ['Authorized'],
        icon: '<i class="cui-graph"></i>',
    },
];

module.exports = (function() {
    var temp = [];
    for (let i in maps) {
        for (let j in maps[i].js) {
            maps[i].js[j] = adminDomain + maps[i].js[j];
        }
        maps[i].html = adminDomain + maps[i].html;
        if(maps[i].toolbar){
            for(let j in maps[i].toolbar.js){
                maps[i].toolbar.js[j] = adminDomain + maps[i].toolbar.js[j];
            }
            maps[i].toolbar.html = adminDomain + maps[i].toolbar.html;
        }
        temp.push(maps[i]);
    }
    return temp;
})()
