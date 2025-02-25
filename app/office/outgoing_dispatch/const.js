exports.NAME_LIB = "outgoing_dispatch";
exports.PARENT_FOLDER = "office";
exports.FOLDER_ARRAY = ["office"];

exports.ACTION = {
    CREATE: "Created",
    UPDATED: "Updated",
    WAITING_FOR_SRORAGE: "WaitingForStorage",
};

// New status
exports.DISPATCH_STATUS = {
    CREATED: "Created",
    WAITING_FOR_SRORAGE: "WaitingForStorage",
    SAVE_BRIEFCASE: "SaveBriefCase",
    WAITING_LEAD_DERPARTMENT_APPROVE: "WaitingLeadDepartmentApprove",
    WAITING_LEAD_EXTERNAL_APPROVE: "WaitingLeadExternalApprove",
    LEAD_TRANSFER_DEPARTMENT: "LeadTransferDepartment",
    APPROVED: "Approved"
}

exports.CHECKS_ON_UI = {
    CREATED: "created",
    NEED_HANDLE: "need_handle"
}

exports.RULE_DISPATCH = {
    USE: "Office.DispatchOutgoing.Use",
    MANAGER: "OfficeDG.Manager",
    RELEASE: "Office.DispatchOutgoing.Release",
    VIEW_ODB: "Office.DispatchOutgoing.ViewODB",
    EDIT_ODB: "Office.DispatchOutgoing.EditODB"
}
