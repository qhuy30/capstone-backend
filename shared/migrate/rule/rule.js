
module.exports = [
    {
        name: "Nhân viên",
        rules: [
            {
                rule: "Office.Notify.Use", //Sử dụng bản tin
            },
            {
                rule: "Office.CarManagement.Use", //Sử dụng xe
            },
            {
                rule: "Office.MeetingRoomSchedule.Use", //Sử dụng phòng
            },
            {
                rule: "Office.EventCalendar.Use", //Sử dụng lịch công tác
            },
        ]
    },

    {
        name: "Chuyên viên văn thư đơn vị cấp 2",
        rules: [
            //Bản tin
            {
                rule: "Office.Notify.Use", // Sử dụng bản tin
            },
            {
                rule: "Office.Notify.Create", // Tạo bản tin
            },
            {
                rule: "Office.Notify.Manager", // Quyền quản trị bản tin thuộc phạm vị đơn vị
                details: {
                    type: "Working",
                }
            },
            {
                rule: "Office.Notify.NotifyDepartment", // Quyền nhận thông báo
                details: {
                    type: "Working",
                }
            },

            //Xe
            {
                rule: "Office.CarManagement.Use", //Sử dụng xe
            }, 
            {
                rule: "Office.CarManagement.Create", //Đăng ký xe
            },
            {
                rule: "Office.CarManagement.NotifyDepartment", //Đăng ký xe
                details:{
                    type: "Working",
                }
            },  
            
            //Phòng
            {
                rule: "Office.MeetingRoomSchedule.Use", //Sử dụng phòng
            },
            {
                rule: "Office.MeetingRoomSchedule.register", //Sử dụng phòng
            },
            {
                rule: "Office.RoomSchedule.Manange", //Sử dụng phòng
                details:{
                    type: "Working",
                }
            },
            {
                rule: "Office.MeetingRoom.NotifyDepartment", //Thông báo
                details:{
                    type: "Working",
                }
            },

            //Lịch công tác
            {
                rule: "Office.EventCalendar.Use", //Sử dụng lịch công tác
            },
            {
                rule: "Office.EventCalendar.Create", //Sử dụng dk lịch công tác
            },
            {
                rule: "Office.EventCalendar.NotifyDepartment", //Nhận tb
                details:{
                    type: "Working",
                }
            },
        ]
    },

    {
        name: "Trưởng đơn vị cấp 2",
        rules: [
            //Bản tin
            {
                rule: "Office.Notify.Use", // Sử dụng bản tin
            },
            {
                rule: "Office.Notify.ApprovalLevel_2", // Duyệt đơn vị
                details: {
                    type: "Working",
                }
            },
            {
                rule: "Office.Notify.NotifyDepartment", // Tbao về phòng ban
                details: {
                    type: "Working",
                }
            },
            {
                rule: "Office.Notify.Manager", // Quyền quản trị bản tin thuộc phạm vị đơn vị:
                details: {
                    type: "Working",
                }
            },
            {
                rule: "Office.Notify.Cancel", // Quyền hủy bản tin thuộc phạm vi đơn vị:
                details: {
                    type: "Working",
                }
            },

            //Xe
            {
                rule: "Office.CarManagement.Use", //Sử dụng xe
            }, 
            {
                rule: "Office.CarManagement.Review", //Được quyền phê duyệt đơn đăng ký cấp đơn vị 
            }, 
            {
                rule: "Office.CarManagement.NotifyDepartment", //Nhận thông báo thuộc về phòng ban
            },
            
            //Phòng
            {
                rule: "Office.MeetingRoomSchedule.Use", //Sử dụng phòng
            },
            {
                rule: "Office.RoomSchedule.ApprovalDepartment", //Được phê duyệt yêu cầu cấp phòng họp cấp đơn vị 
                details: {
                    type: "Working",
                }
            },
            {
                rule: "Office.MeetingRoom.NotifyDepartment", //Nhận thông báo thuộc về phòng ban
                details:{
                    type: "Working",
                }
            },
            {
                rule: "Office.RoomSchedule.Manange", //Cho phép quản lý thông tin đăng ký lịch phòng của đơn vị (Ngoài những lịch phòng mà bản thân tham gia, thì có thể quản lý thông tin đăng ký của đơn vị dựa trên quyền này)
                details:{
                    type: "Working",
                }
            },

            //Lịch công tác
            {
                rule: "Office.EventCalendar.Use", //Sử dụng lịch công tác
            },
            {
                rule: "Office.EventCalendar.ApprovalDepartment", //Cho phép duyệt sự kiện ở cấp độ đơn vị
                details: {
                    type: "Working",
                }
            },
            {
                rule: "Office.EventCalendar.NotifyDepartment", //Nhận thông báo thuộc về phòng ban
                details: {
                    type: "Working",
                }
            },
        ]
    },

    {
        name: "Lãnh đạo VPT",
        rules: [
            {
                rule: "Office.Notify.Use", //Sử dụng bản tin
            },
            {
                rule: "Office.Notify.ApprovalLevel_1", //Cấp quyền duyệt bản tin cấp lãnh đạo VPT
            },



            {
                rule: "Office.CarManagement.Use", //Sử dụng xe
            },
            {
                rule: "Office.CarManagement.Approve", //Cấp quyền phê duyệt cấp lãnh đạo Văn phòng trường cấp xe/ thẻ xe
            },



            {
                rule: "Office.MeetingRoomSchedule.Use", //Sử dụng phòng
            },
            {
                rule: "Office.MeetingRoomSchedule.Approval", //Quyền phê duyệt cấp lãnh đạo cho phòng họp
            },


            {
                rule: "Office.EventCalendar.Use", //Sử dụng lịch công tác
            },
            {
                rule: "Office.EventCalendar.FinalApproval", //Cấp quyền phê duyệt cấp lãnh đạo trường (đây là quyền giành cho lãnh đạo, người chủ trì sự kiện đơn vị cấp 1)
            },
        ]
    },

    {
        name: "Phụ trách quản lí xe/thẻ",
        rules: [
            {
                rule: "Office.CarManagement.Use", //Sử dụng xe
            },
            {
                rule: "Office.CarManagement.Confirm", //Cấp quyền xác nhận xe/ thẻ xe
            },
        ]
    },

    {
        name: "Phụ trách quản lí phòng học",
        rules: [
            {
                rule: "Office.MeetingRoomSchedule.Use", //Sử dụng xe
            },
            {
                rule: "Office.MeetingRoom.Use", //Sử dụng xe
            },
            {
                rule: "Office.LectureHallClassroom.Confirm", //Quyền xác nhận cho giảng đường, phòng học
            },
        ]
    },

    {
        name: "Phụ trách quản lí phòng họp",
        rules: [
            {
                rule: "Office.MeetingRoomSchedule.Use", //Sử dụng xe
            },
            {
                rule: "Office.MeetingRoom.Use", //Sử dụng xe
            },
            {
                rule: "Office.MeetingRoomSchedule.Approval", //Quyền xác nhận cho phòng họp
            },
        ]
    },

    {
        name: "Lãnh đạo phòng học",
        rules: [
            {
                rule: "Office.MeetingRoomSchedule.Use", //Sử dụng xe
            },
            {
                rule: "Office.LectureHallClassroom.Approval", //Quyền xác nhận cho giảng đường, phòng học
            },
        ]
    },

    {
        name: "Lãnh đạo phòng họp",
        rules: [
            {
                rule: "Office.MeetingRoomSchedule.Use", //Sử dụng xe
            },
            {
                rule: "Office.MeetingRoomSchedule.Approval", //Quyền xác nhận cho giảng đường, phòng học
            },
        ]
    },

    {
        name: "Hiệu trưởng",
        rules: [
            {
                rule: "Office.Notify.Use", //Sử dụng bản tin
            },
            {
                rule: "Office.Notify.ApproveExternal", //Cấp quyền phê duyệt cấp lãnh đạo trường
            },

            {
                rule: "Office.Notify.BoardOfDirectors"
            },
            
            {
                rule: "Office.CarManagement.Use" //Sử dụng bản xe
            },
            {
                rule: "Office.CarManagement.ApproveExternal" //Cấp quyền phê duyệt cấp lãnh đạo trường
            },

            {
                rule: "Office.EventCalendar.Use" //Sử dụng bản xe
            },
            {
                rule: "Office.EventCalendar.FinalApproval" //Cấp quyền phê duyệt cấp lãnh đạo trường
            },
        ]
    },

    {
        name: "Lưu trữ Trường",
        rules: [
            {
                rule: "Office.Storage.Use"
            },
            
        ]
    }
]
