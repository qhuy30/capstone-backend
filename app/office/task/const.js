exports.TASK_RULE_NEW= {
    CREATE_TASK_DEPARTMENT: "Office.Task.Create_Task_Department", //Tạo công việc trong đơn vị
    CREATE_EXTERNAL: "Office.Task.CreateExternal", //Tạo công việc cấp 1
    OBSERVER_EXTERNAL: "Office.Task.observerExternal", // Giám sát công việc cấp 1
    RECEIVE_EXTERNAL: "Office.Task.ReceiveExternal", // Tiếp nhận công việc cấp 1
    RECEIVE_TASK: "Office.Task.Receive_task", // Tiếp nhận công việc từ phòng ban khác
} 

exports.TASK_ROLE = {
    CREATOR: 'creator',
    OBSERVER: 'observer',
}


exports.TASK_ACTION = {
    ASSIGNED_MAIN_PERSON: 'task_assigned_main_person',
    ASSIGNED_PARTICIPANT: 'task_assigned_participant',
    ASSIGNED_OBSERVER: 'task_assigned_observer',
    RECEVE_TO_KNOW: 'task_receive_to_know',
    TASK_UPDATED_PROGRESS: 'task_updated_progress',
    ADD_COMMENT: 'task_add_comment',
    ADD_CHALLENGE: 'task_add_challenge',
    ADD_CHALLENGE_RESOLVER: 'task_add_challenge_resolver',
    ADD_GUIDE_TO_CHALLENGE_RESOLVER: 'task_add_guide_to_resolve_challenge',
    ADD_REMIND: 'task_add_remind',
    NEED_APPROVE_DEPARTMENT_RECEIVE_TASK: 'need_approve_department_receive_task',
    TASK_UPDATE_STATUS: 'task_updated_status',
    REJECT_APPROVAL_RECEIVE_TASK: 'reject_approval_receive_task',
    NEED_APPROVAL_RECEIVE_TASK: 'need_approve_receive_task',
    REJECT_RECEIVE_TASK: 'reject_receive_task',
    RECEIVE_TASK: 'receive_task',
}

exports.TASK_FROM_ACTION = {
    CREATE: 'createTask',
    UPDATE_PROGRESS: 'updateProgress',
    COMMENT_TASK: 'commentTask',
    ADD_CHALLENGE_TASK: 'addChallengeTask',
    ADD_CHALLENGE_RESOLVER: 'addChallengeResolverTask',
    ADD_GUIDE_TO_CHALLENGE_RESOLVER: 'addGuideToResolveChallengeTask',
    ADD_REMIND: 'addRemindTask',
    NEED_APPROVE_DEPARTMENT_RECEIVE_TASK: 'need_approve_department_receive_task',
    DONE_TASK: 'doneTask',
    NOT_APPROVED: 'notApproved',
    COMPLETED_TASK: 'completedTask',
    REJECT_APPROVAL_RECEIVE_TASK: 'reject_approval_receive_task',
    NEED_APPROVAL_RECEIVE_TASK: 'need_approve_receive_task',
    REJECT_RECEIVE_TASK: 'reject_receive_task',
    RECEIVE_TASK: 'receive_task',
}
