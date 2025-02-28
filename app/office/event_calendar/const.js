exports.RULE_EVENT_CALENDAR = {
    NOTIFY_DEPARTMENT:"Office.EventCalendar.NotifyDepartment",
    APPROVE_DEPARTMENT: "Office.EventCalendar.ApprovalDepartment", // TP duyệt
    CONFIRM: "Office.EventCalendar.OtherApproval",               // Quản lý lịch công tác duyệt
    APPROVE_LEAD: "Office.EventCalendar.FinalApproval",         // Lãnh đạo đơn vị duyệt
    CREATE: "Office.EventCalendar.Create",                         // Tạo mới lịch công tác
    EDIT: "Office.EventCalendar.Edit",                             // Chỉnh sửa lịch công tác
    USE: "Office.EventCalendar.Use",                               // Sử dụng lịch công tác
    DELETE: "Office.EventCalendar.Delete",                         // Xóa lịch công tác
    MANAGE: "Office.EventCalendar.Manage"                          // Quản lý lịch công tác
};

exports.LEVEl_CALENDAR = {
    LEVEL_1: "Level_1",
    LEVEL_2: "Level_2",
}

exports.STATUS_EVENT_CALENDAR = {
    CREATED: "Registered",                            // Đăng ký mới
    LEADER_DEPARTMENT_APPROVED: "DepartmentApproved", // TP duyệt
    // CONFIRMER_APPROVED:"ManagerApproved",             // Quản lý lịch công tác duyệt
    LEAD_APPROVED: "OrganizationApproved",            // Lãnh đạo cấp tổ chức duyệt
    REQUEST_CANCEL: "RequestCancel",                  // Yêu cầu hủy (người dùng)
    CANCELLED: "Cancelled",                           // Đã hủy
    REJECTED: "Rejected",                           // Bị từ chối
};

exports.EVENT_CALENDAR_TYPE = {
    ONLINE: "Online",                   // Lịch công tác trực tuyến
    OFFLINE_ONSITE: "OfflineOnSite",    // Lịch công tác tại trường
    OFFLINE_OFFSITE: "OfflineOffSite",  // Lịch công tác ngoài trường
    OTHER: "Other"                      // Lịch công tác ngoài trường
};

exports.FLOW_STATUS = {
    APPROVE: "Approve",
    CANCEL: "Cancel",
    EDIT: "Edit",
}

exports.EVENT_CALENDAR_ACTION = {
    NEED_APPROVE: "event_calendar_need_approve",
    NEED_APPROVE_RECALL: "event_calendar_need_approve_recall",
    APPROVE_RECALL: "event_calendar_need_approve_recall",
    REJECT: "event_calendar_reject",
    REJECT_RECALl: "event_calendar_reject_recall",
    APPROVE: "event_calendar_approve",
    CANCEL: "event_calendar_cancel",
    APPROVE_RECALL: "event_calendar_approve_recall",
}

exports.EVENT_CALENDAR_UI_CHECK = {
    DEPARTMENT: "ResponsibleUnit",
    CREATED: "Created",
    PERSONALLY_INVOLVED: "PersonallyInvolved",
    DEPARTMENT_INVOLVED: "DepartmentInvolved",
    NEEDTOHANDLE: "NeedToHandle",
    HANDLED:"Handled",
    REJECTED:"Rejected",
    MANAGE:"Manage",
}

exports.EVENT_CALENDAR_FROM_ACTION = {
    CREATED: "Created",
    CREATOR_UPDATE: "CreatorUpdate",
    APPROVE_DEPARTMENT: "ApprovedDepartment",
    APPROVE_RECALL_DEPARTMENT: "ApprovedRecallDepartment",
    REJECTED_DEPARTMENT: "RejectedDepartment",
    APPROVE_HOST: "ApprovedHost",
    REJECTED_HOST: "RejectedHost",
    REQUEST_CANCEL: "RequestCanceled",
    CANCELED: "Canceled",
    REJECT_RECALL_DEPARTMENT: "RejectRecallDepartment",
    APPROVE_RECALL_HOST: "ApprovedRecallHost",
    REJECT_RECALL_HOST: "RejectedRecallHost",
}

exports.EVENT_CALENDAR_UI_TAB = {
    MANAGEMENT: "Management",
    CALENDAR: "Calendar"
}

exports.EVENT_CALENDAR_UI_CHILD_TAB = {
    MY_CALENDAR: "my_calendars",
    MY_DEPARTMENT_CALENDAR: "my_department_calendar",
    MY_DIRECTOR_CALENDAR: "my_director_calendar",
    MY_EMPLOYEE_CALENDAR: "my_employee",
    WHOLE_SCHOOL_CALENDAR: "whole_school",
}

exports.EVENT_FEATURE_NAME = "event_calendar";