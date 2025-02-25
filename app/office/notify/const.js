exports.NOTIFY_STATUS = {
    PENDING: "Pending",
    //approved
    APPROVED_BY_DEPARTMENT_LEADER: "ApprovedByDepartmentLeader", // Truong Don Vi
    APPROVED: "Approved", // Lanh Dao VPT
    APPROVED_LEAD_EXTERNAL: "ApprovedLeadExternal", // Ban Giam Hieu 
    REJECTED: "Rejected",
  
    // recall
    PENDING_RECALLED: "PendingRecalled",
    APPROVED_RECALL_BY_DEPARTMENT_LEADER: "ApprovedRecallByDepartmentLeader",
    APPROVED_RECALL_BY_LEAD: "ApprovedRecallByLead",
    RECALLED: "Recalled"
};

exports.NOTIFY_RULE = {
    USE: "Office.Notify.Use",
    NOTIFY_DEPARTMENT:"Office.Notify.NotifyDepartment",
    APPROVE_DEPARTMENT: "Office.Notify.ApprovalLevel_2",
    APPROVE_LEAD: "Office.Notify.ApprovalLevel_1",
    APPROVE_LEAD_EXTERNAL: "Office.Notify.ApproveExternal",
    AUTHORIZED: "Authorized",
    MANAGER: "Office.Notify.Manager",
    CREATE: "Office.Notify.Create",
    DIRECTOR: 'Office.Notify.BoardOfDirectors'
};

exports.NOTIFY_SCOPE = {
    INTERNAL: "Internal",
    EXTERNAL: "External",
};

exports.NOTIFY_EVENT = {
    APPROVED: "Approved",
    REJECTED: "Rejected",
};

// exports.NOTIFY_TAB = [
//     "bookmark",
//     "home",
//     "created",
//     "notseen",
//     "seen",
//     "need_to_handle_level_2",
//     "need_to_handle_level_1",
//     "all",
//     "recyclebin",
// ];

exports.NOTIFY_TAB = {
    CREATED: "Created",
    NEEDTOHANDLE: "NeedToHandle",
    REJECTED: "Rejected",
    HANDLED: "Handled",
    MY_NOTIFY: "MyNotify",
    EXTERNAL: "External",
    INTERNAL: "Internal",

    REPONSIBILITY: "Responsibility",
    HOME: "Home",
    ALL_EXTERNAL: "AllExternal",
    BOOKMARK: "Bookmark",
    NOTSEEN: "NotSeen",
};

exports.NOTIFY_BELL_MODAL = {
    PENDING: "notify_need_approve",

    APPROVED_BY_DEPARTMENT_LEADER: "notify_need_approve",
    APPROVED_BY_EXTERNAL_LEAD: "notify_need_approve_external",
    APPROVED: `notify_approved`,
    APPROVED_TO_USER: `notify_approved_to_user`,
    REJECTED: "notify_rejected",

    PENDING_RECALLED: "notify_need_approve_recall",
    APPROVED_RECALL_BY_DEPARTMENT_LEADER: "notify_need_approve_recall",
    RECALLED: "notify_approved_recall",
};

exports.NOTIFY_TYPE = {
    WHOLESCHOOL: "WholeSchool",
    EMPLOYEE: "Employee",
    DEPARTMENT: "Department"
};