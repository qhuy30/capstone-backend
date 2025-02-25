const {adminDomain} = require('../../../utils/setting');
const maps=[ 
    {   
        key:"LeaveForm",
        path:"leaveform",
        js:["/modules/office/leave_form/service.js","/modules/office/leave_form/controller.js"],
        html:"/modules/office/leave_form/views/leave_form.html",
        rule:["Office.LeaveForm.Use"],
        icon:'<i class="fas fa-file-alt"></i>',
        canStick:true
    },
    {   
        key:"LeaveFormDetails",
        path:"leaveform-details",
        js:["/modules/office/leave_form/details/service.js","/modules/office/leave_form/details/controller.js"],
        html:"/modules/office/leave_form/details/views/details.html",
        rule:["Authorized"],
        icon:'<i class="cui-graph"></i>' 
    }
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