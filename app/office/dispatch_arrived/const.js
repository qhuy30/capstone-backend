exports.NAME_LIB = "dispatch_arrived";
exports.PARENT_FOLDER = "/office";
exports.FOLDER_ARRAY = ["office"];
exports.OFFICE_DEPARTMENT_SETTING_KEY = "schoolOfficeDepartment";
exports.BOARD_OF_DIRECTORS_SETTING_KEY = "boardOfDirectorsDepartment";

exports.LEAD_RULE = "Office.DispatchArrived.Lead";
exports.APPROVE_LEVEL_1_RULE = "Office.DispatchArrived.ApproveLevel1";
exports.CONFIRM_RULE = "Office.DispatchArrived.Confirm";
exports.MANAGE_DISPATCHARRIVED_RULE = "Office.DispatchArrived.Manager";
exports.DISPATCH_ARRIVED_STATUS = {
    CREATED: "Created",
    WAITING_FOR_APPROVAL: "WaitingForApproval",
    WAITING_FOR_REVIEW: "WaitingForReview",
    WAITING_FOR_ACCEPT: "WaitingForAccept",
    TRANSFERRED: "Transferred",
    REJECTED: "Rejected",
};
exports.DISPATCH_FORWARD_TO = {
    HEAD_OF_DEPARTMENT: "HeadOfDepartment",
    BOARD_OF_DIRECTORS: "BoardOfDirectors",
    DEPARTMENTS: "Departments",
};

exports.DISPATCH_UI_TAB = {
    MANAGEMENT: "Management",
    CALENDAR: "OutGoingDispatch"
}

// New status
exports.DISPATCH_STATUS = {
    CREATED: "Created",
    WAITING_LEAD_DERPARTMENT_APPROVE: "WaitingLeadDepartmentApprove",
    WAITING_LEAD_EXTERNAL_APPROVE: "WaitingLeadExternalApprove",
    LEAD_TRANSFER_DEPARTMENT: "LeadTransferDepartment",
    APPROVED: "Approved",
    PENDING_RECEIPT: "PendingReceipt"
}

exports.ACTION = {
    CREATE: "Created",
    SEND_LEAD_DEPARTMENT: "SendToLeadDepartment",
    SEND_LEAD_DEPARTMENT_AND_UPDATE: "SendToLeadDepartment",
    REJECTED_DEPARTMENT: "RejectedDepartment",
    SEND_LEAD_EXTERNAL: "SendToLeadExternal",
    SEND_LEAD_EXTERNAL_AND_UPDATE: "SendToLeadExternalAndUpdate",
    RETURN_LEAD_DEPARTMENT: "ReturnLeadDepartment",
    RETURN_LEAD_DEPARTMENT_AND_UPDATE: "ReturnLeadDepartmentAndUpdate",
    TRANSFER_DEPARTMENT: "TransferDepartment",
    TRANSFER_DEPARTMENT_AND_UPDATE: "TransferDepartmentAndUpdate",
    TRANSFER_DEPARTMENT_APPROVE: "TransferDepartmentApprove",
    DEPARTMENT_SEEN: "DepartmentSeen",
    UPDATED: "Updated",
    DEPARTMENT_RECEIVED: "DepartmentReceived",
};

exports.CHECKS_ON_UI = {
    CREATED : "created",
    NEED_HANDLE: "need_handle",
    HANDLE: "handled",
    GONNA_LATE: "gonna_late",
    PENDING_RECEIPT: "pending_receipt"
}

exports.RULE_DISPATCH = {
    USE:"Office.DispatchArrived.Use",
    CREATE:"Office.DispatchArrived.Manager",
    LEAD_DEPARTMENT:"Office.DispatchArrived.Lead",
    LEAD_EXTERNAL:"Office.DispatchArrived.ApproveLevel1",
    FOLLOW:"Office.DispatchArrived.FollowDA",
    LEAD_CONFIRM:"Office.DispatchArrived.Confirm"
}

exports.DISPATCH_SCOPE = {
    INTERNAL: "internal",
    EXTERNAL: "external"
}