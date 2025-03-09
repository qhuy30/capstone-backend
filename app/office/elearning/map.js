const {adminDomain} = require('../../../utils/setting');
const maps=[ 
    {   
        key:"Elearning",
        path:"elearning",
        js:["/modules/office/elearning/directive.js","/modules/office/elearning/service.js","/modules/office/elearning/controller.js"],
        html:"/modules/office/elearning/views/elearning.html",
        rule:["Management.DesignWorkflow.Use"],
        icon:'<i class="fas fa-book"></i>',
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