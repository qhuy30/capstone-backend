const {adminDomain} = require('../../../utils/setting');
const maps=[ 
    {   
        key:"TaskWorkflow",
        path:"task-workflow",
        js:[ "/modules/office/task_workflow/service.js",
        "/modules/office/task_workflow/directive.js",
        "/modules/office/task_workflow/controller.js"],
        html:"/modules/office/task_workflow/views/task_workflow.html",
        rule:["Office.TaskWorkflow.Use"],
        icon:'<i class="fas fa-signature"></i>',
        canStick:true
    },
    {   
        key:"TaskWorkflowDetails",
        path:"task-workflow-details",
        js:["/modules/office/task_workflow/details/service.js","/modules/office/task_workflow/details/controller.js"],
        html:"/modules/office/task_workflow/details/views/details.html",
        rule:["Office.TaskWorkflow.Use"],
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