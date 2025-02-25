const { adminDomain } = require('../../../utils/setting');
const maps = [
    {
        key: "Task",
        path: "task",
        js: [
            "/modules/office/notify/directive.js",
            "/modules/office/notify/service.js",
            "/modules/office/task/controller.js",
            "/modules/office/task/controller_department.js",
            "/modules/office/task/controller_personal.js",
            "/modules/office/task/controller_project.js",
            "/modules/office/task/controller_quick_handle.js",
            "/modules/office/task/controller_statistic.js",
            "/modules/office/task/controller_task_management.js",
            "/modules/office/task/controller_my_calendar.js",
            "/modules/office/task/controller_task_external.js",
            "/modules/office/task/directive.js",
            "/modules/office/task/filter.js",
            "/modules/office/task/service.js",
            "/modules/office/workflow_play/directive.js",
            "/modules/office/workflow_play/service.js",
            "/modules/office/dispatch_arrived/details/service.js",
        ],
        html: "/modules/office/task/views/task.html",
        rule: ["Office.Task.Use"],
        icon: '<i class="fas fa-briefcase"></i>',
        canStick: true
    },
    {
        key: "TaskDetails",
        path: "task-details",
        js: [
            "/modules/office/workflow_play/service.js",
            "/modules/office/workflow_play/directive.js",
            "/modules/office/task/service.js",
            "/modules/office/task/filter.js",
            "/modules/office/task/directive.js",
            "/modules/office/task/details/service.js",
            "/modules/office/task/details/controller.js",
            "/modules/office/notify/directive.js",
            "/modules/office/notify/service.js",
            "/modules/office/task/service.js",
        ],
        html: "/modules/office/task/details/views/details.html",
        rule: ["Office.Task.Use"],
        icon: '<i class="cui-graph"></i>'
    },
    {
        key: "TaskDetailsByCode",
        path: "task/:code",
        js: ["/modules/office/workflow_play/service.js", "/modules/office/workflow_play/directive.js",
            "/modules/office/task/service.js", "/modules/office/task/directive.js", "/modules/office/task/details/service.js", "/modules/office/task/details/controller.js",
            "/modules/office/notify/directive.js",
            "/modules/office/notify/service.js"],
        html: "/modules/office/task/details/views/details.html",
        rule: ["Office.Task.Use"],
        icon: '<i class="cui-graph"></i>'
    },
    {
        key: "WikiDetails",
        path: "wiki-details",
        js: ["/modules/office/task/wiki_details/service.js", "/modules/office/task/wiki_details/controller.js"],
        html: "/modules/office/task/wiki_details/index.html",
        rule: ["Authorized"],
        icon: '<i class="cui-graph"></i>'
    },
    {
        key: "DepartmentTaskDetails",
        path: "task-department-details",
        js: [
            "/modules/office/task/filter.js",
            "/modules/office/task/service.js",
            "/modules/office/notify/service.js",
            "/modules/office/workflow_play/directive.js",
            "/modules/office/workflow_play/service.js",
            "/modules/office/task/directive.js",
            "/modules/office/notify/directive.js",
            "/modules/office/task/wiki_details/service.js",
            "/modules/office/task/controller_department_details.js"],
        html: "/modules/office/task/views/department_view.html",
        rule: ["Authorized"],
        icon: '<i class="cui-graph"></i>'
    },
    {
        key: "AddTaskWithTemplate",
        path: "add-task-with-template",
        js: [
            "/modules/office/task/service.js",
            "/modules/office/task/filter.js",
            "/modules/office/task/controller_task_external.js"
        ],
        html: "/modules/office/task/views/add_task_with_template.html",
        rule: ["Office.Task.Use"],
        icon: '<i class="cui-graph"></i>'
    },

];

module.exports = (function () {
    var temp = [];
    for (let i in maps) {
        for (let j in maps[i].js) {
            maps[i].js[j] = adminDomain + maps[i].js[j];
        }
        maps[i].html = adminDomain + maps[i].html;
        if (maps[i].toolbar) {
            for (let j in maps[i].toolbar.js) {
                maps[i].toolbar.js[j] = adminDomain + maps[i].toolbar.js[j];
            }
            maps[i].toolbar.html = adminDomain + maps[i].toolbar.html;
        }
        temp.push(maps[i]);
    }
    return temp;
})()
