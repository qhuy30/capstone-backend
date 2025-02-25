const {adminDomain} = require('../../../utils/setting');
const maps=[ 
    {   
        key:"Directory",
        path:"directory",
        js:["/modules/management/directory/service.js","/modules/management/directory/controller.js"],
        html:"/modules/management/directory/views/index.html",
        rule:["Management.Directory.Use"],
        icon:'<i class="far fa-clipboard"></i>',
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