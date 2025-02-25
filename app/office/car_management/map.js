const {adminDomain} = require('../../../utils/setting');
const maps=[
    {
        key:"CarManagement",
        path:"car_management",
        js:[
            "/modules/office/car_management/service.js",
            "/modules/office/car_management/controller.js"
        ],
        html:"/modules/office/car_management/views/index.html",
        rule:["Office.CarManagement.Use"],
        icon:'<i class="fas fa-clipboard-list"></i>',
        canStick:true
    },
    {
        key:"CarManagementDetails",
        path:"car-registration-details",
        js:[
            "/modules/office/car_management/service.js",
            "/modules/office/car_management/details/service.js",
            "/modules/office/car_management/details/controller.js"
        ],
        html:"/modules/office/car_management/details/views/index.html",
        rule:["Office.CarManagement.Use"],
        icon:'<i class="fas fa-clipboard-list"></i>',
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
