const {adminDomain} = require('../../../utils/setting');
const maps=[
    {
        key:"Setting",
        path:"setting",
        js:["/modules/management/setting/service.js","/modules/management/setting/controller.js"],
        html:"/modules/management/setting/views/setting.html",
        rule:["Management.Settings.Use"],
        icon:'<i class="fas fa-wrench"></i>',
        canStick:true
    },
    {
        key: "Feature",
        path: "feature",
        js: ["/modules/management/feature/controller.js", "/modules/management/feature/service.js"],
        html: "/modules/management/feature/views/feature.html",
        rule: ["Management.Settings.Use"],
        icon: '<i class="fas fa-wrench"></i>',
        canStick: true
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
