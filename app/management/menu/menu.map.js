const {adminDomain} = require('./../../../utils/setting');
const maps=[ 
    {   
        key:"MenuManagement",
        path:"menu",
        js:["/modules/management/menu/menu.service.js","/modules/management/menu/menu.controller.js"],
        html:"/modules/management/menu/views/menu.html",
        rule:["Management.Menu.Use"],
        icon:'<i class="fab fa-elementor"></i>',
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