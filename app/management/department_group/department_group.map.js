
const {adminDomain} = require('./../../../utils/setting');
const maps=[
    {
        key:"DepartmentGroupManagement",
        path:"department_group",
        js:["/modules/management/department_group/department_group.service.js","/modules/management/department_group/department_group.controller.js"],
        html:"/modules/management/department_group/views/department_group.html",
        rule:["Management.DepartmentGroup.Use"],
        icon:'<i class="far fa-object-group"></i>',
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
