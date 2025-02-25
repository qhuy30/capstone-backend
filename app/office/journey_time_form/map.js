const {adminDomain} = require('../../../utils/setting');
const maps=[ 
    {   
        key:"JourneyTimeForm",
        path:"journey-time-form",
        js:["/modules/office/journey_time_form/service.js","/modules/office/journey_time_form/controller.js"],
        html:"/modules/office/journey_time_form/views/journey_time_form.html",
        rule:["Office.JourneyTimeForm.Use"],
        icon:'<i class="fa fa-file-contract"></i>',
        canStick:true
    },
    {   
        key:"JourneyTimeDetails",
        path:"journey-time-form-details",
        js:["/modules/office/journey_time_form/details/service.js","/modules/office/journey_time_form/details/controller.js"],
        html:"/modules/office/journey_time_form/details/views/details.html",
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