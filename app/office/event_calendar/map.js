const {adminDomain} = require('../../../utils/setting');
const maps=[
    {
        key:"EventCalendar",
        path:"event-calendar",
        js:[
            "/modules/office/event_calendar/service.js",
            "/modules/office/event_calendar/controller.js"
        ],
        html:"/modules/office/event_calendar/views/index.html",
        rule:[
            "Office.EventCalendar.Use",
            "Office.EventCalendar.Manage",
        ],
        icon:'<i class="fa fa-calendar"></i>',
        canStick:true
    },
    {
        key: "EventCalendarDetails",
        path: "event-calendar-details",
        js:[
            "/modules/office/event_calendar/details/service.js",
            "/modules/office/event_calendar/details/controller.js",
            "/modules/office/event_calendar/service.js",
            "/modules/office/event_calendar/controller.js"
        ],
        html:"/modules/office/event_calendar/details/views/index.html",
        rule:[
            "Office.EventCalendar.Use",
            "Office.EventCalendar.Manage",
        ],
        icon: '<i class="cui-graph"></i>'
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
