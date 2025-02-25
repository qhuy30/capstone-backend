

exports.ROOM_RULE={
    USE_ROOM:"Office.MeetingRoomSchedule.Use",
    REGISTERED_ROOM:"Office.MeetingRoomSchedule.register",
    APPROVE_LEVEL_DEPARTMENT: "Office.RoomSchedule.ApprovalDepartment", // duyệt của trưởng đơn vị 

    NOTIFY_DEPARTMENT:"Office.MeetingRoom.NotifyDepartment", // nhận thông báo thuộc về phòng ban
    
    CLASS_ROOM_APPROVE_LEAD: "Office.LectureHallClassroom.Approval",
    CLASS_ROOM_CONFIRM: "Office.LectureHallClassroom.Confirm",
    MEETING_ROOM_APPROVE_LEAD:"Office.MeetingRoomSchedule.Approval", // phê duyệt cấp lãnh đạo
    MEETING_ROOM_CONFIRM:"Office.MeetingRoomSchedule.Confirm", // quyền của người quản lý phòng
    MANAGE_INFORMATION:"Office.RoomSchedule.Manange",
    REQUEST_CANCEL:"Office.RoomSchedule.RequestCancel",
    RECEIVE_INFORMATION:"Office.RoomSchedule.ReceiveInformarion",

    BUTLER_CLASS_ROOM:"Office.LectureHallClassroom.Butler",
    BUTLER_MEETING_ROOM:"Office.MeetingRoomSchedule.Butler",
}   
exports.ROOM_TYPE ={
    MEETING:"MeetingRoom",
    CLASS:"LectureHallClassroom"
}

exports.MEETING_ROOM_SCHEDULE_STATUS = {
    REGISTERED: "Registered",
    APPROVED: "Approved", // CVP duyệt
    DEPARTMENT_APPROVED: "DepartmentApproved", // trưởng đơn vị duyệt
    CONFIRMED: "Confirmed", // quản lý phòng duyệt
    REQUEST_CANCEL: "RequestCancel",
    CANCELLED: "Cancelled",
    REJECTED: "Rejected"
};

exports.MEETING_ROOM_CHECKLIST_ON_MANAGE_TAB ={
    RESPOSIBILITY_DEPARTMENT: "Responsibility",
    CREATED: "Created",
    NEED_HANDLE: "NeedToHandle",
    HANDLED: "Handled",
    REJECTED: "Rejected",
    MY_CALENDAR: "MyCalendar",
    APPROVED: "Approved",
    ALL: "All",
    HOST: "Host",
    PARTICIPANTS: "Participants",
    TO_DEPARTMENT: "ToDepartment"
};

exports.MEETING_ROOM_TAB ={
    MANAGEMENT: "Management",
    CALENDAR: "Calendar"
};

exports.MEETING_ROOM_HOST_SCOPE ={
    INTERNAL: "internal",
    EXTERNAL: "external"
};

exports.MEETING_ROOM_FROM_ACTION = {
    CREATE: 'Created',
    APPROVE_DEPARTMENT: 'DepartmentApproved',
    APPROVE_DEPARTMENT_AND_CHANGE: 'DepartmentApprovedAndChange',
    REJECT_DEPARTMENT: 'DepartmentRejected',
    APPROVE_MANAGEMENT: 'ManagementApproved',
    REJECT_MANAGEMENT: 'ManagementRejected',
    APPROVE_LEAD: 'ApprovedLead',
    REJECT_LEAD: 'RejectedLead',
    REQUEST_CANCEL: 'RequestCancel',

    APPROVE_RECALL_DEPARTMENT: 'DepartmentApprovedRecall',
    APPROVE_RECALL_DEPARTMENT_AND_CHANGE: 'DepartmentApprovedRecallAndChange',
    REJECT_RECALL_DEPARTMENT: 'DepartmentRejectedRecall',
    APPROVE_RECALL_MANAGEMENT: 'ManagementApprovedRecall',
    REJECT_RECALL_MANAGEMENT: 'ManagementRejectedRecall',
    APPROVE_RECALL_LEAD: 'ApprovedRecallLead',
    REJECT_RECALL_LEAD: 'RejectedRecallLead',
}

exports.MEETING_ROOM_ACTION_NAME = {
    APPROVE: 'registration_room_approve',
    APPROVE_RECALL: 'registration_room_approve_recall',
    REJECT: 'registration_room_reject',
    REJECT_RECALL: 'registration_room_reject_recall',
    REQUEST_CANCEL: 'registration_room_request_cancel',
    UPDATE: 'registration_room_update',
    CREATE: 'registration_room_create',
}

exports.MEETING_ROOM_SCHEDULE_FLOW ={
    APPROVE:"approve",
    CANCEL:"cancel"
}

exports.SCHEDULE_MEETING_ROOM_FEATURE_NAME = "room";