const {adminDomain} = require('../../../utils/setting');
const maps=[ 

    {   
        key:"LaborContractDetails",
        path:"human-larbor-contract-details",
        js:["/modules/office/human/labor_contract/details/service.js","/modules/office/human/labor_contract/details/controller.js"],
        html:"/modules/office/human/labor_contract/details/views/details.html",
        rule:["Authorized"],
        icon:'<i class="cui-graph"></i>'
    },
    {   
        key:"LaborContract",
        path:"human-larbor-contract",
        js:["/modules/office/human/labor_contract/service.js","/modules/office/human/labor_contract/controller.js"],
        html:"/modules/office/human/labor_contract/views/labor_contract.html",
        rule:["Office.LaborContract.Use"],
        icon:'<i class="fas fa-id-card"></i>',
        canStick:true
    },
    {   
        key:"EmployeeList",
        path:"employee",
        js:["/modules/office/human/employee/service.js","/modules/office/human/employee/controller.js"],
        html:"/modules/office/human/employee/views/employee.html",
        rule:["Office.HumanResourceManagement.Use"],
        icon:'<i class="fas fa-user"></i>',
        canStick:true
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