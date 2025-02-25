exports.DEFAULT_TIMEZONE = "Asia/Ho_Chi_Minh";

exports.INVALID_VALUE = [undefined, null, "", "null", "undefined"];

exports.DISPATCH_ARRIVED_STATUS = {
    CREATED: "Created",
    WAITING_FOR_APPROVAL: "WaitingForApproval",
    WAITING_FOR_REVIEW: "WaitingForReview",
    TRANSFERRED: "Transferred",
    REJECTED: "Rejected",
};

exports.DISPATCH_ARRIVED_VIEW_STATUS = {
    WAITING_FOR_APPROVAL: "WaitingForApproval",
    READ: "Read",
    UNREAD: "Unread",
};

exports.DISPATCH_FORWARD_TO = {
    HEAD_OF_DEPARTMENT: "HeadOfDepartment",
    BOARD_OF_DIRECTORS: "BoardOfDirectors",
    DEPARTMENTS: "Departments",
};

exports.NOTIFY_STATUS = {
    PENDING: "Pending",

    APPROVED_BY_DEPARTMENT_LEADER: "ApprovedByDepartmentLeader",
    APPROVED: "Approved",
    REJECTED: "Rejected",

    PENDING_RECALLED: "PendingRecalled",
    APPROVED_RECALL_BY_DEPARTMENT_LEADER: "ApprovedRecallByDepartmentLeader",
    RECALLED: "Recalled",
};

exports.DISPATCH_RESPONSE_TYPE = {
    ACCEPT: "Accept",
    REJECT: "Reject",
    READ: "Read",
};

exports.CUSTOM_TEMPLATE_TAG_TYPE = {
    TEXT: "text",
    SIGNATURE: "signature",
    NUMBER: "number",
    DATE: "date",
    QUOTATION_MARK: "quotation_mark",
    DROP_DOWN: "dropdown",
    PICK: "pick",
    CREATOR_SIGNATURE: "creator_signature",
    CREATOR_QUOTATION_MARK: "creator_quotation_mark",
};

exports.TRANSFER_TICKET_TEMPLATE_CONFIG = {
    folder: "templates",
    name: "transfer-ticket-template-ver1.docx",
};

exports.WORKFLOW_FILE_TYPE = {
    CUSTOM_TEMPLATE: "custom_template",
    FILE_UPLOAD: "file_upload",
};

exports.WORKFLOW_DURATION_UNIT = {
    BUSINESS_DAY: "business_day",
    DAY: "day",
    HOUR: "hour",
    MINUTE: "minute",
};

exports.WORKFLOW_ORGANIZATION_SCOPE = {
    ALL: "all",
    SPECIFIC: "specific",
};

exports.WORKFLOW_PLAY_STATUS = {
    PENDING: "Pending",
    REJECTED: "Rejected",
    SAVED_ODB: "SaveODB",
    APPROVED: "Approved",
    RETURNED: "Returned",
    COMPLETED: "Completed",
    WAITING_ADDITIONAL_DOCUMENT: "Waiting_Additional_Documents"
};

exports.WORKFLOW_PLAY_NODE_STATE = {
    ON_SCHEDULE: "OnSchedule",
    GONNA_LATE: "GonnaLate",
    LATE: "Late",
};

exports.TASK_STATUS = {
    WAITING_FOR_APPROVAL: "WaitingForApproval",
    WAITING_FOR_ACCEPT: "WaitingForAccept",
    REJECTED: "Rejected",
    PENDING_APPROVAL: "PendingApproval",
    NOT_STARTED_YET: "NotStartedYet",
    PROCESSING: "Processing",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
    DONE: "Done",
    NOT_SEEN: "NotSeen",
    WAITING_RECEIVE: "WaitingReceive",
    WAITING_LEAD_DEPARTMENT_APPROVE_RECEIVE: "WaitingLeadDepartmentApproveReceive",
    REFUNED: "Refuned",
};

exports.TASK_STATE = {
    OPEN: "Open",               // Còn hạn
    GONNA_LATE: "GonnaLate",    // Sắp đến hạn
    OVERDUE: "Overdue",         // Trễ hạn
    ON_SCHEDULE: "OnSchedule",  // Hoàn thành đúng hạn
    EARLY: "Early",             // Hoàn thành sớm hạn
    LATE: "Late",               // Hoàn thành trễ hạn
    DISPATCH_ARRIVED_TASK: "DispatchArrivedTask"
};

exports.TASK_LEVEL = {
    HEAD_TASK: "HeadTask",
    TRANSFER_TICKET: "TransferTicket",
    TASK: "Task",
};

exports.TASK_GROUP_FILTER = {
    DEPARTMENT: "department",
    PROJECT: "project",
};

exports.TASK_EVENT = {
    ASSIGNMENT: "Assignment",
    CREATED: "Created",
    START_DOING: "StartDoing",
    UPDATED_INFORMATION: "UpdatedInformation",
    DONE: "Done",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
    RECEIVE: "Receive",
    RECEIVE_TASK: "ReceiveTask",
    APPROVAL_RECEIVE_TASK: "ApprovalReceiveTask",
    REJECT_RECEIVE_TASK: "RejectReceiveTask",
    REJECT_RECEIVE_TASK: "RejectApprovalReceiveTask",
};

exports.TASK_PRIORITY = {
    CRITICAL: 1,
    HIGH: 2,
    MEDIUM: 3,
    LOW: 4,
};

exports.TASK_COMMENT_TYPE = {
    COMMENT: "Comment",
    CANCELLED: "Cancelled",
    CHALLENGE:"Challenge",
    CHALLENGE_RESOLVER:"ChallengeResolver",
    REMIND:"Remind",
    GUIDE_TO_RESOLVE_CHALLENGE:"GuidToResolveChallenge"
};

exports.TAB_FILTER = {
    ALL: "all",
    HEAD_TASK: "head_task",
    CREATED: "created",
    ASSIGNED: "assigned",
    TASK: "task",
    MY_TASK: "mytask",
    SUPPORT: "support",
    SUPERVISION: "supervision",
    RESPONSIBLE: "responsible"
};

exports.ROLE_FILTER = {
    ALL: "all",
    SUPPORT: "support",
    SUPERVISION: "supervision",
    RESPONSIBLE: "responsible"
};

exports.LABEL_EVENT = {
    CREATED: "Created",
    UPDATED: "Updated",
};

exports.BRIEFCASE_STATE = {
    ON_SCHEDULE: "OnSchedule",      // Còn hạn
    CANCELLED: "Cancelled",         // Đã huỷ
    EXPIRED: "Expired",             // Hết hạn
};

exports.COMMON_EVENT = {
    CREATED: "created",
    UPDATED: "updated",
    DELETED: "deleted",
};

exports.TASK_TEMPLATE_STATUS = {
    ACTIVE: "Active",
    PAUSE: "Pause",
    EXPIRED: "Expired",
    CANCELLED: "Cancelled",
    END: "End",
};

exports.REPETITIVE_CYCLE = {
    DAY: "day",
    WEEK: "week",
    MONTH: "month",
    YEAR: "year",
};

exports.TASK_TEMPLATE_UPDATE_ACTION = {
    RESUME: "resume",
    PAUSE: "pause",
    CANCEL: "cancel",
};

exports.OBD_STATUS = {
    PENDING: 'Pending',
    NOT_PUBLIC_YET: "NotPublicYet",
    RELEASED: "Released",
    SAVE_BRIEFCASE: "SaveBriefCase",
    SEPARATE_DISPATCH: "Completed"
}

exports.BRIEFCASE_DURATION_UNIT = {
    DAY: "day",
    WEEK: "week",
    MONTH: "month",
    YEAR: "year",
};

exports.HEAD_TASK_ORIGIN = {
    SCHOOL_OFFICE: "1",
    PROJECT: "5",
    INTER_DEPARTMENT: "2",
    INTER_TEMPORARY_DEPARTMENT: "3",
    BOARD: "4"
};

exports.MEETING_ROOM_SCHEDULE_EVENT = {
    REGISTERED: "Registered",
    DEPARTMENT_APPROVED: "DepartmentApproved",
    APPROVED: "Approved",
    CONFIRMED: "Confirmed",
    REQUEST_CANCEL: "RequestCancel",
    CANCELLED: "Cancelled",
    REJECTED: "Rejected",
};

exports.MEETING_ROOM_TYPE = {
    MEETING_ROOM: "MeetingRoom",
    LECTURE_HALL_CLASSROOM: "LectureHallClassroom",
};
exports.TASK_RULE = {
    FOLLOW_DEPARTMENT:"Office.Task.Follow_Task_Department",
    IMPORT_DEPARTMENT:"Office.Task.Import_Task_Department",
    DELETE_DEPARTMENT:"Office.Task.Delete_Task_Department",
    DELETE_PROJECT:"Office.Task.Delete_Task_Project",
    COMPLETED_DEPARTMENT:"Office.Task.Complete_Task_Department",
    COMPLETED_PROJECT:"Office.Task.Complete_Task_Project",
    EDIT_DEPARTMENT:"Office.Task.Edit_Task_Department",
    EDIT_PROJECT:"Office.Task.Edit_Task_Project",
    NOTIFY_DEPARTMENT: "Office.Task.Notify_Task_Department",
    DIRECTOR_MANAGE: "Office.Task.Director_Manage",
    LEADER_MANAGE: "Office.Task.Leader_Mangage",
    DEPARTMENT_LEADER_MANAGE: "Office.Task.Department_Leader_Manage",
    RECEIVE_TASK: "Office.Task.Receive_task",
}
exports.TASK_REPETITIVE_CYCLE = {
    DAY: "day",
    WEEK: "week",
    MONTH: "month",
    YEAR: "year",
 }
