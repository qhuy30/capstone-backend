const { TASK_LEVEL } = require("@utils/constant");
const { isValidValue, getValidValue, praseStringToObject, generateParent } = require("@utils/util");
const q = require('q');


const genData = function (fields) {
    try{

        let result = {};
        result.estimate = parseInt(fields.estimate);
        result.parent_id = fields.parent_id;
        result.title = fields.title;
        result.to_department = fields.to_department;
        result.content = fields.content;
        result.has_time = fields.has_time === 'true' ? true : false;
        result.hours = parseFloat(fields.hours);
        result.task_list = JSON.parse(fields.task_list || '[]');
        result.main_person = JSON.parse(fields.main_person || '[]') || [];
        result.participant = JSON.parse(fields.participant || '[]');
        result.observer = JSON.parse(fields.observer || '[]');
        result.from_date = parseInt(fields.from_date);
        result.to_date = parseInt(fields.to_date);
        result.project = fields.project;
        result.object = [];
        result.goals = parseInt(fields.goals);
        result.priority = parseInt(fields.priority);
        result.task_type = fields.task_type ? parseInt(fields.task_type) : null;
        result.department = fields.department === 'null' ? null : fields.department;
        result.head_task_id = isValidValue(fields.head_task_id) ? fields.head_task_id : null;
        result.level = getValidValue(fields.level, TASK_LEVEL.TASK);
        result.dispatch_arrived_id = isValidValue(fields.dispatch_arrived_id) ? fields.dispatch_arrived_id : null;
        result.reference = [];
        result.label = praseStringToObject(fields.label, []);
        result.is_draft = getValidValue(fields.is_draft) === "true";
        result.parent = fields.parent ? JSON.parse(fields.parent) : {};
        result.parents = generateParent(fields.parents ? JSON.parse(fields.parents) : [], result.parent);
        result.source_id = fields.source_id ? fields.source_id : "0";
        result.has_repetitive = fields.has_repetitive === 'true' ? true : false;
        result.per = fields.per ? parseInt(fields.per) : 0;
        result.cycle = fields.cycle;
        result.has_expired = fields.has_expired === 'true' ? true : false;
        result.expired_date = parseInt(fields.expired_date);
        result.child_work_percent = parseInt(fields.child_work_percent);
        result.progress = 0;
        result.estimate = fields.estimate ? parseInt(fields.estimate) : null;
        return result;
    }catch (e) {
        console.error(e)
    }
}

function getUsernameDepartmentToNotify(users, department) {
    let usernameToNotify = [];
    users.forEach((user) => {
        const notifyTaskDepartmentRule = user.rule.find(rule => rule.rule === 'Office.Task.Notify_Task_Department');
        if (notifyTaskDepartmentRule) {
            const details = notifyTaskDepartmentRule.details;
            if (details.type === "All" || details.type === "Working") {
                usernameToNotify = usernameToNotify.concat(user.username);
            } else if (details.type === "Specific" && details.department && details.department.indexOf(department) !== -1) {
                usernameToNotify = usernameToNotify.concat(user.username);
            }
        }
    });
    return usernameToNotify;
}

exports.genData = genData;
exports.getUsernameDepartmentToNotify = getUsernameDepartmentToNotify;
