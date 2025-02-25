module.exports = {
    name: "group",
    items: [
        {
            id: 1,
            title_search: "lanh dao",
            "title": "Lãnh đạo",
            "isactive": true,
            "rule": [
                {
                    "rule": "Office.Task.Use"
                },
                {
                    "rule": "Office.Task.AuthorizationToAssignWorkToSuperiors"
                },
                {
                    "rule": "Office.Task.Show_DepartmentTab"
                },

                {
                    "rule": "Office.Task.Delete_Task_Department",
                    "details": {
                        "type": "All"
                    }
                },
                {
                    "rule": "Office.Task.Follow_Task_Department",
                    "details": {
                        "type": "All"
                    }
                },
                {
                    "rule": "Office.Task.Create_Task_Department",
                    "details": {
                        "type": "All"
                    }
                },
                {
                    "rule": "Office.Task.Edit_Task_Department",
                    "details": {
                        "type": "All"
                    }
                },
                {
                    "rule": "Office.Task.Notify_Task_Department",
                    "details": {
                        "type": "All"
                    }
                },
                {
                    "rule": "Office.Task.Show_ProjectTab"
                },
                {
                    "rule": "Office.Task.Create_Project"
                },
                {
                    "rule": "Office.Task.Follow_Project",
                    "details": {
                        "type": "All"
                    }
                },
                {
                    "rule": "Office.Task.Edit_Project",
                    "details": {
                        "type": "All"
                    }
                },
                {
                    "rule": "Office.Task.Follow_Object_Project",
                    "details": {
                        "type": "All"
                    }
                },
                {
                    "rule": "Office.Task.Create_Object_Project",
                    "details": {
                        "type": "All"
                    }
                },
                {
                    "rule": "Office.Task.Edit_Object_Project",
                    "details": {
                        "type": "All"
                    }
                },
                {
                    "rule": "Office.Task.Follow_Task_Project",
                    "details": {
                        "type": "All"
                    }
                },
                {
                    "rule": "Office.Task.Create_Task_Project",
                    "details": {
                        "type": "All"
                    }
                },
                {
                    "rule": "Office.Task.Edit_Task_Project",
                    "details": {
                        "type": "All"
                    }
                },
                {
                    "rule": "Office.Task.Show_StatisticTab"
                },
                {
                    "rule": "Office.LeaveForm.Use"
                },
                {
                    "rule": "Office.Notify.Use"
                },
                {
                    "rule": "Office.Notify.BoardOfDirectors"
                },
                {
                    "rule": "Office.Signing.Use"
                },
                {
                    "rule": "Office.DispatchArrived.Use"
                },
                {
                    "rule": "Office.JourneyTimeForm.Use"
                }
            ],
            "role": [],
            "user": [],
            "entity": {
                "his": [
                    {
                        "createdby": "system",
                        "created": 1629521242100.0,
                        "modifiedby": "system",
                        "modified": 1629521242100.0
                    }
                ]
            },
            root: true
        },
        {
            id: 2,
            title_search: "truong phong ban",
            "title": "Trưởng phòng ban",
            "isactive": true,
            "rule": [
                {
                    "rule": "Office.Task.Use"
                },
                {
                    "rule": "Office.Task.AuthorizationToAssignWorkToSuperiors"
                },
                {
                    "rule": "Office.Task.Show_DepartmentTab"
                },

                {
                    "rule": "Office.Task.Delete_Task_Department",
                    "details": {
                        "type": "Working"
                    }
                },
                {
                    "rule": "Office.Task.Follow_Task_Department",
                    "details": {
                        "type": "Working"
                    }
                },
                {
                    "rule": "Office.Task.Create_Task_Department",
                    "details": {
                        "type": "Working"
                    }
                },
                {
                    "rule": "Office.Task.Edit_Task_Department",
                    "details": {
                        "type": "Working"
                    }
                },
                {
                    "rule": "Office.Task.Notify_Task_Department",
                    "details": {
                        "type": "Working"
                    }
                },
                {
                    "rule": "Office.LeaveForm.Use"
                },
                {
                    "rule": "Office.Notify.Use"
                },
                {
                    "rule": "Office.Signing.Use"
                },
                {
                    "rule": "Office.DispatchArrived.Use"
                },
                {
                    "rule": "Office.JourneyTimeForm.Use"
                }
            ],
            "role": [],
            "user": [],
            "entity": {
                "his": [
                    {
                        "createdby": "system",
                        "created": 1629521389481.0,
                        "modifiedby": "system",
                        "modified": 1629521389481.0
                    }
                ]
            },
            root: true
        },
        {
            id: 3,
            title_search: "nhan vien",
            "title": "Nhân viên",
            "isactive": true,
            "rule": [
                {
                    "rule": "Office.Task.Use"
                },
                {
                    "rule": "Office.Task.AuthorizationToAssignWorkToSuperiors"
                },
                {
                    "rule": "Office.LeaveForm.Use"
                },
                {
                    "rule": "Office.Notify.Use"
                },
                {
                    "rule": "Office.Signing.Use"
                },
                {
                    "rule": "Office.DispatchArrived.Use"
                },
                {
                    "rule": "Office.JourneyTimeForm.Use"
                }
            ],
            "role": [],
            "user": [],
            "entity": {
                "his": [
                    {
                        "createdby": "system",
                        "created": 1629521325811.0,
                        "modifiedby": "system",
                        "modified": 1629521325811.0
                    }
                ]
            },
            root: true
        },
        {
            id: 4,
            title_search: "quan tri he thong",
            "title": "Quản trị hệ thống",
            "isactive": true,
            "rule": [
                {
                    "rule": "Management.User.Use"
                },
                {
                    "rule": "Management.User.AssignPermission"
                },
                {
                    "rule": "Management.User.DeleteUser"
                },
                {
                    "rule": "Management.Group.Use"
                },
                {
                    "rule": "Management.Group.AssignPermission"
                },
                {
                    "rule": "Management.Group.DeleteGroup"
                },
                {
                    "rule": "Management.Menu.Use"
                },
                {
                    "rule": "Management.Settings.Use"
                },
                {
                    "rule": "Management.MasterDirectory.Use"
                },
                {
                    "rule": "Management.Directory.Use"
                },
                {
                    "rule": "Management.Department.Use"
                },
                {
                    "rule": "Management.DesignWorkflow.Use"
                },
                {
                    "rule": "Management.RecycleBin.Use"
                }
            ],
            "role": [],
            "user": [],
            "entity": {
                "his": [
                    {
                        "createdby": "system",
                        "created": 1629521266981.0,
                        "modifiedby": "system",
                        "modified": 1629521266981.0
                    }
                ]
            },
            root: true
        },
        {
            id: 5,
            title_search: "trien khai ung dung",
            "title": "Triển khai ứng dụng",
            "isactive": true,
            "rule": [
                {
                    "rule": "Management.User.Use"
                },
                {
                    "rule": "Management.Group.Use"
                },
                {
                    "rule": "Management.Directory.Use"
                }
            ],
            "role": [],
            "user": [],
            "entity": {
                "his": [
                    {
                        "createdby": "system",
                        "created": 1629521277011.0,
                        "modifiedby": "system",
                        "modified": 1629521277011.0
                    }
                ]
            },
            root: true
        },
        {
            id: 6,
            title_search: "quan ly cong van",
            "title": "Quản lý công văn",
            "isactive": true,
            "rule": [
                {
                    "rule": "Office.DispatchArrived.Use"
                }
            ],
            "role": [],
            "user": [],
            "entity": {
                "his": [
                    {
                        "createdby": "system",
                        "created": 1629521292268.0,
                        "modifiedby": "system",
                        "modified": 1629521292268.0
                    }
                ]
            },
            root: true
        },
        {
            id: 7,
            title_search: "quan ly don nghi phep",
            "title": "Quán lý đơn nghỉ phép",
            "isactive": true,
            "rule": [
                {
                    "rule": "Office.LeaveForm.Use"
                },
                {
                    "rule": "Office.LeaveForm.Manager"
                },
                {
                    "rule": "Office.JourneyTimeForm.Use"
                },
                {
                    "rule": "Office.JourneyTimeForm.Approval"
                }
            ],
            "role": [],
            "user": [],
            "entity": {
                "his": [
                    {
                        "createdby": "system",
                        "created": 1629521305940.0,
                        "modifiedby": "system",
                        "modified": 1629521305940.0
                    }
                ]
            },
            root: true
        },

        {
            id: 8,
            title_search: "quan ly du an",
            "title": "Quản lý dự án",
            "isactive": true,
            "rule": [
                {
                    "rule": "Office.Task.Use"
                },
                {
                    "rule": "Office.Task.AuthorizationToAssignWorkToSuperiors"
                },
                {
                    "rule": "Office.Task.Show_ProjectTab"
                },
                {
                    "rule": "Office.Task.Follow_Project",
                    "details": {
                        "type": "All"
                    }
                },
                {
                    "rule": "Office.Task.Create_Project"
                },
                {
                    "rule": "Office.Task.Edit_Project",
                    "details": {
                        "type": "All"
                    }
                },
                {
                    "rule": "Office.Task.Follow_Object_Project",
                    "details": {
                        "type": "All"
                    }
                },
                {
                    "rule": "Office.Task.Create_Object_Project",
                    "details": {
                        "type": "All"
                    }
                },
                {
                    "rule": "Office.Task.Edit_Object_Project",
                    "details": {
                        "type": "All"
                    }
                },
                {
                    "rule": "Office.Task.Follow_Task_Project",
                    "details": {
                        "type": "All"
                    }
                },
                {
                    "rule": "Office.Task.Create_Task_Project",
                    "details": {
                        "type": "All"
                    }
                },
                {
                    "rule": "Office.Task.Edit_Task_Project",
                    "details": {
                        "type": "All"
                    }
                }
            ],
            "role": [],
            "user": [],
            "entity": {
                "his": [
                    {
                        "createdby": "system",
                        "created": 1629521361516.0,
                        "modifiedby": "system",
                        "modified": 1629521361516.0
                    }
                ]
            },
            root: true
        },



        {
            id: 9,
            title_search: "quan ly nhan su",
            "title": "Quản lý nhân sự",
            "isactive": true,
            "rule": [
                {
                    "rule": "Office.HumanResourceManagement.Use"
                },
                {
                    "rule": "Office.HumanResourceManagement.Education"
                },
                {
                    "rule": "Office.HumanResourceManagement.Mission"
                },
                {
                    "rule": "Office.HumanResourceManagement.Salary"
                },
                {
                    "rule": "Office.HumanResourceManagement.User"
                },
                {
                    "rule": "Office.LaborContract.Use"
                },
                {
                    "rule": "Office.LaborContract.Approval"
                }
            ],
            "role": [],
            "user": [],
            "entity": {
                "his": [
                    {
                        "createdby": "system",
                        "created": 1629521413589.0,
                        "modifiedby": "system",
                        "modified": 1629521413589.0
                    }
                ]
            },
            root: true
        },
        {
            id: 10,
            title_search: "quan ly thong bao",
            "title": "Quán lý thông báo",
            "isactive": true,
            "rule": [
                {
                    "rule": "Office.Notify.Use"
                },
                {
                    "rule": "Office.Notify.Approval"
                },
                {
                    "rule": "Office.Notify.Manager"
                }
            ],
            "role": [],
            "user": [],
            "entity": {
                "his": [
                    {
                        "createdby": "system",
                        "created": 1629522190170.0,
                        "modifiedby": "system",
                        "modified": 1629522190170.0
                    }
                ]
            },
            root: true
        },
        {
            id: 10,
            title_search: "quan ly thong bao",
            "title": "Quán lý thông báo",
            "isactive": true,
            "rule": [
                {
                    "rule": "Office.Notify.Use"
                },
                {
                    "rule": "Office.Notify.Approval"
                },
                {
                    "rule": "Office.Notify.Manager"
                }
            ],
            "role": [],
            "user": [],
            "entity": {
                "his": [
                    {
                        "createdby": "system",
                        "created": 1629522190170.0,
                        "modifiedby": "system",
                        "modified": 1629522190170.0
                    }
                ]
            },
            root: true
        },
        {
            id: 11,
            title_search: "quan ly cong viec",
            "title": "Quán lý công việc",
            "isactive": true,
            "rule": [
                {
                    "rule": "Office.Task.Use"
                },
                {
                    "rule": "Office.Task.Create_Task_Department",
                    "details": {
                        "type": "All"
                    }
                },
                {
                    "rule": "Office.Task.Show_TaskManagementTab"
                },
                {
                    "rule": "Office.Task.Import_Multiple_Departments"
                }
            ],
            "role": [],
            "user": [],
            "entity": {
                "his": [
                    {
                        "createdby": "system",
                        "created": 1629522190170.0,
                        "modifiedby": "system",
                        "modified": 1629522190170.0
                    }
                ]
            },
            root: true
        },
        {
            id: 12,
            title_search: "quan ly lich cong tac",
            "title": "Quản lý lịch công tác",
            "isactive": true,
            "rule": [
                {
                    "rule": "Office.EventCalendar.Use"
                },
                {
                    "rule": "Office.EventCalendar.ApprovalToCreate"
                },
                {
                    "rule": "Office.EventCalendar.OtherApproval"
                },
                {
                    "rule": "Office.EventCalendar.FinalApproval"
                },
                {
                    "rule": "Office.EventCalendar.Manage"
                },
            ],
            "role": [],
            "user": [],
            "entity": {
                "his": [
                    {
                        "createdby": "system",
                        "created": 1629522190170.0,
                        "modifiedby": "system",
                        "modified": 1629522190170.0
                    }
                ]
            },
            root: true
        },

    ]
}
