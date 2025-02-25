
const {adminDomain} = require('./../../../utils/setting');
const maps=[ 
    {   
        key:"GroupManagement",
        path:"group",
        js:["/modules/management/group/group.service.js","/modules/management/group/group.controller.js"],
        html:"/modules/management/group/views/group.html",
        rule:["Management.Group.Use"],
        icon:'<i class="fas fa-users"></i>',
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