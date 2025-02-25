const {adminDomain} = require('../../../utils/setting');
const maps=[
    {
        key:"AdvancedSearch",
        path:"advanced_search",
        js:[
            "/modules/office/advanced_search/service.js",
            "/modules/office/advanced_search/controller.js"
        ],
        html:"/modules/office/advanced_search/views/advanced_search.html",
        rule:["Office.AdvancedSearch.Use"],
        icon:'<i class="fas fa-search"></i>',
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
