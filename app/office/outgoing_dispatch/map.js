const {adminDomain} = require('../../../utils/setting');
const maps = [
    {
        key: "DispatchOutgoing",
        path: "odb",
        js: [
            "/modules/office/dispatch_arrived/filter.js",
            "/modules/office/dispatch_arrived/service.js",
            "/modules/office/dispatch_arrived/controller.js"
        ],
        html: "/modules/office/dispatch_arrived/views/outgoing_dispatch.html",
        rule: ["Office.DispatchOutgoing.Use"],
        icon: '<i class="fas fa-signature"></i>',
        canStick: true,
    },
    {
        key: "ODBDetails",
        path: "odb-details",
        js: [
            "/modules/office/dispatch_arrived/directive.js",
            "/modules/office/dispatch_arrived/details/service.js",
            "/modules/office/dispatch_arrived/details/controller.js",
        ],
        html: "/modules/office/dispatch_arrived/details/views/details_DO.html",
        rule: ["Authorized"],
        icon: '<i class="cui-graph"></i>',
    },
    {
        key: "ODBDetailsByCode",
        path: "odb/:code",
        js: [
            "/modules/office/dispatch_arrived/directive.js",
            "/modules/office/dispatch_arrived/details/service.js",
            "/modules/office/dispatch_arrived/details/controller.js",
        ],
        html: "/modules/office/dispatch_arrived/details/views/details_DO.html",
        rule: ["Authorized"],
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
