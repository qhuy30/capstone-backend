const {adminDomain} = require('../../../utils/setting');
const maps=[
    {
        key:"WorkflowPlay",
        path:"signing",
        js:["/modules/office/workflow_play/service.js", "/modules/office/workflow_play/controller.js", "/modules/office/workflow_play/filter.js", "/modules/office/workflow_play/directive.js"],
        html:"/modules/office/workflow_play/views/workflow_play.html",
        rule:["Office.Signing.Use"],
        icon:'<i class="fas fa-pen-nib"></i>',
        canStick:true
    },
    {
        key:"SignDetails",
        path:"signing-details",
        js:["/modules/office/workflow_play/details/service.js","/modules/office/workflow_play/details/controller.js", "/modules/office/workflow_play/filter.js"],
        html:"/modules/office/workflow_play/details/views/details.html",
        rule:["Authorized"],
        icon:'<i class="cui-graph"></i>'
    },
    {
        key:"SignDetailsByCode",
        path:"signing/:code",
        js:["/modules/office/workflow_play/details/service.js","/modules/office/workflow_play/details/controller.js", "/modules/office/workflow_play/filter.js"],
        html:"/modules/office/workflow_play/details/views/details.html",
        rule:["Authorized"],
        icon:'<i class="cui-graph"></i>'
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
