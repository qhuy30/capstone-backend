exports.NAME_LIB = "workflow_play";
exports.PARENT_FOLDER = "office";
exports.FOLDER_ARRAY = ["office"];

exports.WORKFLOW_PLAY_RULE = {
    DEPARTMENT_LEADER_MANAGE: "Office.Signing.Department_Leader_Manage",
    LEADER_MANAGE: "Office.Signing.Leader_Manage",
    USE: "Office.Signing.Use"
};

exports.TASK_RULE = {
    DEPARTMENT_LEADER_MANAGE: "Office.Task.Department_Leader_Manage"
}

exports.ARCHIVE_RULE = {
    MANGEMENT: "Office.Storage.Use",
};

exports.WORKFLOW_PLAY_STATUS = {
    PENDING: "Pending",
    REJECTED: "Rejected",
    SAVED_ODB: "SaveODB",
    APPROVED: "Approved",
    RETURNED: "Returned",
    COMPLETED: "Completed",
    WAITING_ADDITIONAL_DOCUMENT: "Waiting_Additional_Documents",
};

exports.CHECKS_ON_UI = {
    CREATED : "created",
    NEED_HANDLE: "need_handle",
    HANDLED: "handled"
}