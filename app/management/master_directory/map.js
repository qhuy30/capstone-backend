const {adminDomain} = require('../../../utils/setting');
const maps=[ 
    {   
        key:"MasterDirectory",
        path:"master_directory",
        js:["/modules/management/master_directory/service.js","/modules/management/master_directory/controller.js"],
        html:"/modules/management/master_directory/views/index.html",
        rule:["Management.MasterDirectory.Use"],
        icon:'<i class="fas fa-clipboard-list"></i>',
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