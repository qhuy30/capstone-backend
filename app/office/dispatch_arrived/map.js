const {adminDomain} = require('../../../utils/setting');
const maps=[
    {
        key:"DispatchArrived",
        path:"dispatch",
        js:[
            "/modules/office/task/service.js",
            "/modules/office/task/directive.js",
            "/modules/office/dispatch_arrived/filter.js",
            "/modules/office/dispatch_arrived/service.js",
            "/modules/office/dispatch_arrived/controller.js",
            "/modules/office/dispatch_arrived/details/service.js"
        ],
        html:"/modules/office/dispatch_arrived/views/index.html",
        rule:["Office.DispatchArrived.Use"],
        icon:'<i class="fa fa-envelope-open"></i>',
        canStick:true
    },
    {
        key:"DADetails",
        path:"da-details",
        js:[
            "/modules/office/task/service.js",
            "/modules/office/task/directive.js",
            "/modules/office/dispatch_arrived/service.js",
            "/modules/office/dispatch_arrived/directive.js",
            "/modules/office/dispatch_arrived/details/service.js",
            "/modules/office/dispatch_arrived/details/controller.js",
        ],
        html:"/modules/office/dispatch_arrived/details/views/details_DA.html",
        rule:["Authorized"],
        icon:'<i class="cui-graph"></i>'
    },
    {
        key:"DADetailsByCode",
        path:"da/:code",
        js:[
            "/modules/office/task/service.js",
            "/modules/office/task/directive.js",
            "/modules/office/dispatch_arrived/service.js",
            "/modules/office/dispatch_arrived/directive.js",
            "/modules/office/dispatch_arrived/details/service.js",
            "/modules/office/dispatch_arrived/details/controller.js",
        ],
        html:"/modules/office/dispatch_arrived/details/views/details.html",
        rule:["Authorized"],
        icon:'<i class="cui-graph"></i>'
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
