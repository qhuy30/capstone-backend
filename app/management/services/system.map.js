const {adminDomain} = require('./../../../utils/setting');
const maps=[ 
    {   
        key:"HomePage",
        path:"home",
        js:["/modules/management/system/style.css","/modules/management/system/home.service.js","/modules/management/system/home.controller.js"],
        html:"/modules/management/system/views/home.html",
        rule:["Authorized"],
        icon:'<i class="cui-home"></i>',
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