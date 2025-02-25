const {adminDomain} = require('../../../utils/setting');
const maps=[ 
    {   
        key:"Workflow",
        path:"workflow",
        js:["/modules/office/workflow/directive.js","/modules/office/workflow/service.js","/modules/office/workflow/controller.js"],
        html:"/modules/office/workflow/views/workflow.html",
        rule:["Management.DesignWorkflow.Use"],
        icon:'<i class="fas fa-sitemap"></i>',
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