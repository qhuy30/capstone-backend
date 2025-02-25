const {adminDomain} = require('../../../utils/setting');
const maps = [
    {
        key: "Storage",
        path: "storage",
        js: [
            "/modules/office/storage/filter.js",
            "/modules/office/storage/service.js",
            "/modules/office/workflow_play/details/service.js",
            "/modules/office/dispatch_arrived/details/service.js",
            "/modules/office/task/details/service.js",
            "/modules/office/storage/controller.js",
            "/modules/office/waiting_storage/directive.js",
        ],
        html: "/modules/office/storage/views/storage.html",
        rule: ["Office.Storage.Use"],
        icon: '<i class="fas fa-archive"></i>',
        canStick: true,
    },
    {
        key: "WaitingStorage",
        path: "waiting-storage",
        js: [
            "/modules/office/waiting_storage/filter.js",
            "/modules/office/waiting_storage/service.js",
            "/modules/office/waiting_storage/controller.js",
            "/modules/office/waiting_storage/directive.js",
        ],
        html: "/modules/office/waiting_storage/views/waiting_storage.html",
        rule: ["Office.Storage.Use"],
        icon: '<i class="fa fa-inbox"></i>',
        canStick: true,
    },
    {
        key: "BriefCaseDetails",
        path: "briefcase-details",
        js: [
            "/modules/office/task/service.js",
            "/modules/office/task/details/service.js",
            "/modules/office/task/directive.js",
            "/modules/office/briefcase/directive.js",
            "/modules/office/dispatch_arrived/details/service.js",
            "/modules/office/dispatch_arrived/directive.js",
            "/modules/office/outgoing_dispatch/details/service.js",
            "/modules/office/outgoing_dispatch/directive.js",
            "/modules/office/storage/details/service.js",
            "/modules/office/storage/details/controller.js",
        ],
        html: "/modules/office/storage/details/views/details.html",
        rule: ["Office.Storage.Use"],
        icon: '<i class="cui-graph"></i>',
    },
    {
        key: "RecordAccess",
        path: "record_access",
        js: [
            "/modules/office/record_access/service.js",
            "/modules/office/record_access/controller.js",
        ],
        html: "/modules/office/record_access/views/record_access.html",
        rule: ["Office.Storage.Use"],
        icon: '<i class="fa fa-folder"></i>',
        canStick: true,
    },
    {
        key: "StorageDetailsByCode",
        path: "storage/:code",
        js: [
            "/modules/office/task/service.js",
            "/modules/office/task/directive.js",
            "/modules/office/task/details/service.js",
            "/modules/office/briefcase/directive.js",
            "/modules/office/dispatch_arrived/details/service.js",
            "/modules/office/dispatch_arrived/service.js",
            "/modules/office/dispatch_arrived/directive.js",
            "/modules/office/dispatch_arrived/details/controller.js",
            "/modules/office/storage/details/service.js",
            "/modules/office/storage/details/controller.js",
            "/modules/office/workflow_play/details/service.js",
            "/modules/office/notify/service.js",
            "/modules/office/workflow_play/directive.js",
            
        ],
        html: "/modules/office/storage/details/views/details.html",
        rule: ["Office.Storage.Use"],
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
