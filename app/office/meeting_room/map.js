const {adminDomain} = require('../../../utils/setting');
const maps=[ 
    {   
        key:"MeetingRoom",
        path:"meeting-room",
        js:["/modules/office/meeting_room/service.js","/modules/office/meeting_room/controller.js"],
        html:"/modules/office/meeting_room/views/index.html",
        rule:["Office.MeetingRoomSchedule.Use"],
        icon:'<i class="far fa-clipboard"></i>',
        canStick:true
    },
    {
        key: "MeetingRoomDetails",
        path: "meeting-room-details",
        js:[
            "/modules/office/meeting_room/details/service.js",
            "/modules/office/meeting_room/details/controller.js",
            "/modules/office/meeting_room/service.js",
            "/modules/office/meeting_room/controller.js"
        ],
        html:"/modules/office/meeting_room/details/views/index.html",
        rule:["Office.MeetingRoomSchedule.Use"],
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