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
