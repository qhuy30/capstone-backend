const {adminDomain} = require('../../../utils/setting');
const maps=[ 
    {   
        key:"OrganizationManagement",
        path:"organization",
        js:["/modules/office/organization/directive.js","/modules/office/organization/organization.service.js","/modules/office/organization/organization.controller.js"],
        html:"/modules/office/organization/views/organization.html",
        rule:["Management.Department.Use"],
        icon:'<i class="fa fa-building"></i>',
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