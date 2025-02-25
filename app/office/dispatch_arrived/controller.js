const q = require("q");
const { BuildFilterAggregate } = require('./utility');

const BaseError = require("@shared/error/BaseError");
const { removeUnicode } = require('../../../utils/util');
const { FileProvider } = require("../../../shared/file/file.provider");
const { LogProvider } = require("@shared/log_nohierarchy/log.provider");

const { TaskController, loadTaskReferences } = require("@office/task/controller");

const { TaskService } = require("@office/task/service");
const { OrganizationService } = require("@office/organization/organization.service");
const { SettingService } = require("@management/setting/service");

const { RingBellItemService } = require("../../management/ringbell_item/service");

const { DAService, DepartmentService, EmployeeService, UserService, TaskService: TaskDAService, DirectoryService } = require("./service");
const { ODBService } = require("../outgoing_dispatch/service");

const CommonUtil = require("@utils/util");

const FileUtil = require("@utils/fileUtil");
const { ItemSetup } = require("../../../shared/setup/items.const");
const { NAME_LIB, OFFICE_DEPARTMENT_SETTING_KEY, BOARD_OF_DIRECTORS_SETTING_KEY, DISPATCH_FORWARD_TO, LEAD_RULE, CONFIRM_RULE, APPROVE_LEVEL_1_RULE, MANAGE_DISPATCHARRIVED_RULE, ACTION, DISPATCH_STATUS, RULE_DISPATCH, DISPATCH_SCOPE, CHECKS_ON_UI } = require("./const");

const { DISPATCH_ARRIVED_VIEW_STATUS, DISPATCH_ARRIVED_STATUS, TASK_STATUS, TASK_LEVEL, HEAD_TASK_ORIGIN, TASK_PRIORITY } = require("@utils/constant");
const { dbname_prefix } = require("@shared/multi_tenant/pnt-tenant");

const { validation } = require("./validation");
const nameLib = "dispatch_arrived";
const fieldSearchAr = ["search", "da_book", "priority", "receive_method", "type", "tab"];
const parentFolder = "/office";
const folderArray = ["office"];
const { v4: uuidv4 } = require('uuid');
const { getObjectDifferences, checkRuleRadioDepartment, checkRuleCheckBox } = require("@utils/ruleUtils");

const { genFilterGetUsersByRule, genFilterGetUsersByRuleAndDepartment } = require("@utils/util");

const { genData, getUsernameDepartmentToNotify } = require("../task/utils");
const department = require("@shared/setup/items/office/department");


const resolveHandlerForOfficeLeader = function (dbPrefix, currentUser) {
    let isHandler = false;
    const dfd = q.defer();
    UserService.loadLeadOfOffice(dbPrefix).then(function (departmentLeaders) {
        isHandler = departmentLeaders.some(leader => leader.username === currentUser.username);
        dfd.resolve(isHandler);
    }, function (err) {
        dfd.reject(err);
    });
    return dfd.promise;
};

const resolveHandlerForOBD = function (dbPrefix, currentUser) {
    let isHandler = false;
    const dfd = q.defer();
    UserService.loadLeadLevel1(dbPrefix).then(function (departmentLeaders) {
        isHandler = departmentLeaders.some(leader => leader.username === currentUser.username);
        dfd.resolve(isHandler);
    }, function (err) {
        dfd.reject(err);
    });
    return dfd.promise;
};

const resolveHandlerForCreator = function (dbPrefix, currentUser, dispatch) {
    if (dispatch.username === currentUser.username) {
        return q.resolve(true);
    } else {
        return q.resolve(false);
    }
};

const resolveHandlerForDepartmentLeaders = function (dbPrefix, currentUser, dispatch) {
    const dfd = q.defer();
    let listDepartment = [];
    q.fcall(() => {
        let promises = [dispatch.view_only_departments, []];
        if (!dispatch.tasks) {
            promises[1] = TaskService.loadByDispatchArrivedId(dbPrefix, dispatch._id.toString());
        } else {
            promises[1] = q.resolve(dispatch.tasks);
        }
        return q.all(promises);
    })
        .then(([viewOnlyDepartments, tasks]) => {
            viewOnlyDepartments.forEach((item) => {
                if (DISPATCH_ARRIVED_VIEW_STATUS.UNREAD === item.status) {
                    listDepartment.push(typeof item.department === "string" ? item.department : item.department.id);
                }
            });
            tasks.forEach((task) => {
                if (TASK_STATUS.WAITING_FOR_ACCEPT === task.status) {
                    listDepartment.push(typeof task.department === "string" ? task.department : task.department.id);
                }
            });
            return q.all(
                listDepartment.map((departmentId) =>
                    OrganizationService.loadLeaderInDepartment(dbPrefix, departmentId),
                ),
            );
        })
        .then((listLeaderInDepartments) => {
            let isHandler = listLeaderInDepartments.some((leaders) => {
                return leaders.some((leader) => leader.username === currentUser.username);
            });
            dfd.resolve(isHandler);
        })
        .catch((error) => {
            LogProvider.error("Load handler failed with error: " + JSON.stringify(error));
            dfd.resolve(false);
        });
    return dfd.promise;
};

const resolveHandler = function (dbPrefix, dispatch, currentUser) {
    const dfd = q.defer();
    const HANDLER_STRATEGY = {
        [DISPATCH_ARRIVED_STATUS.CREATED]: resolveHandlerForCreator,
        [DISPATCH_ARRIVED_STATUS.WAITING_FOR_REVIEW]: resolveHandlerForOBD,
        [DISPATCH_ARRIVED_STATUS.WAITING_FOR_APPROVAL]: resolveHandlerForOfficeLeader,
        [DISPATCH_ARRIVED_STATUS.TRANSFERRED]: resolveHandlerForDepartmentLeaders,
        [DISPATCH_ARRIVED_STATUS.REJECTED]: resolveHandlerForCreator,
    };
    q.fcall(() => {
        return HANDLER_STRATEGY[dispatch.status](dbPrefix, currentUser, dispatch);
    })
        .then((result) => {
            Object.assign(dispatch, { is_handler: result });
            dfd.resolve(dispatch);
        })
        .catch((error) => {
            LogProvider.error("Resolve handler failed with error: " + JSON.stringify(error));
            dfd.resolve(dispatch);
        });
    return dfd.promise;
};

function processForwardToHeadOfOffice(dbname_prefix, username, dispatch, note) {
    let dfd = q.defer();
    let dfdAr = [];
    dfdAr.push(UserService.loadLeadOfDepartment(dbname_prefix));
    dfdAr.push(DAService.dynamic_update(dbname_prefix, username, dispatch._id, {
        $set: {
            status: DISPATCH_ARRIVED_STATUS.WAITING_FOR_APPROVAL,
        },
        $push: {
            event: {
                username,
                time: new Date().getTime(),
                action: "ForwardToHeadOfOffice",
                note
            },
        }
    }));
    q.all(dfdAr).then(function ([leaders, res]) {
        dfd.resolve(true);
        TaskDAService.updateRejectedTaskToWaitingForApproval(dbPrefix, username, dispatch._id.toString());
        const usernames = leaders.map((leader) => leader.username);
        RingBellItemService.insert(
            dbPrefix,
            username,
            "da_forward_to_head_of_office",
            {
                code: dispatch.code,
                dispatch_id: dispatch._id.toString(),
                action_by: username,
                mes: "ForwardToHeadOfOffice",
            },
            usernames,
            [],
            "ForwardToHeadOfOffice",
            new Date().getTime(),
        );
    }, function (err) { dfd.reject(err); });
    return dfd.promise;
}

function processForwardBOD(dbname_prefix, username, dispatch, note) {
    let dfd = q.defer();
    let dfdAr = [];
    dfdAr.push(UserService.loadLeadLevel1(dbname_prefix));
    dfdAr.push(DAService.dynamic_update(dbname_prefix, username, dispatch._id, {
        $set: {
            status: DISPATCH_ARRIVED_STATUS.WAITING_FOR_REVIEW,
        },
        $push: {
            event: {
                username,
                time: new Date().getTime(),
                action: "ForwardToBOD",
                note
            },
        }
    }));
    q.all(dfdAr).then(function ([leaders, res]) {
        dfd.resolve(true);
        const usernames = leaders.map((leader) => leader.username);
        RingBellItemService.insert(
            dbPrefix,
            username,
            "da_forward_to_board_of_directors",
            {
                code: dispatch.code,
                dispatch_id: dispatch._id.toString(),
                action_by: username,
                mes: "ForwardToBoardOfDirectors",
            },
            usernames,
            [],
            "ForwardToToBoardOfDirectors",
            new Date().getTime(),
        );
    }, function (err) { dfd.reject(err); });
    return dfd.promise;

}

function processToDepartment(dbPrefix, username, dispatch, note) {
    let dfd = q.defer();
    let dfdAr = [];
    dfdAr.push(TaskDAService.updateRejectedTaskToWaitingForApproval(dbPrefix, username, dispatch._id.toString()));
    dfdAr.push(DAService.dynamic_update(dbname_prefix, username, dispatch._id, {
        $set: {
            status: DISPATCH_ARRIVED_STATUS.TRANSFERRED,
            "view_only_departments.$[ele].status": DISPATCH_ARRIVED_VIEW_STATUS.UNREAD,
        },
        $push: {
            event: {
                action: "ForwardToDepartments",
                username,
                time: new Date().getTime(),
                note,
            },
        }
    }));
    q.all(dfdAr).then(function ([leaders, res]) {
        dfd.resolve(true);
        DAService.sendNotificationForLeaderOfDepartments(dbPrefix, dispatch, username);
        DAService.sendNotificationForViewOnlyDepartments(dbPrefix, dispatch, username);
    }, function (err) { dfd.reject(err); });
    return dfd.promise;
}

function genDataInsert(res, username, body){

    const fields = res.Fields;
    const data = {};

    data.scope = fields.scope;
    data.year = fields.year * 1;
    data.code = fields.code;
    data.incoming_number = fields.incoming_number;
    data.incomming_date = fields.incomming_date * 1;
    data.symbol_number = fields.symbol_number;
    data.sending_place = fields.sending_place;
    data.type = fields.type;
    data.field = fields.field;
    data.security_level = fields.security_level;
    data.urgency_level = fields.urgency_level;
    data.date_sign = fields.date_sign * 1;
    data.expried = fields.expried * 1;
    data.content = fields.content;
    data.attachments = [];
    data.incoming_file = [];
    if(fields.task_label){
        data.task_label = JSON.parse(fields.task_label);
    }

    if(res.fileInfo.attachments){
        data.attachments = res.fileInfo.attachments.map(item => {
            return {
                id: uuidv4(),
                timePath: item.timePath,
                locate: item.type,
                display: item.filename,
                name: item.named,
                nameLib: nameLib,
                folderPath: item.folderPath,
                username: username
            }
        })
    }


    if(res.fileInfo.incoming_file){
        data.incoming_file = res.fileInfo.incoming_file.map(item => {
            return {
                id: uuidv4(),
                timePath: item.timePath,
                locate: item.type,
                display: item.filename,
                name: item.named,
                nameLib: nameLib,
                folderPath: item.folderPath,
                username: username
            }
        })
    }

    const event = {
        id: uuidv4(),
        action: ACTION.CREATE,
        time: new Date().getTime(),
        username: username,
        department: body.session.department,
    }
    data.events = [ event ];
    return data;
}

function genDataUpdate(res, username, daDetails, body){

    const fields = res.Fields;
    let data = {};

    data.year = fields.year * 1;
    data.code = fields.code;
    data.incoming_number = fields.incoming_number;
    data.incomming_date = fields.incomming_date * 1;
    data.symbol_number = fields.symbol_number;
    data.sending_place = fields.sending_place;
    data.type = fields.type;
    data.field = fields.field;
    data.expried = fields.expried * 1;
    data.security_level = fields.security_level;
    data.urgency_level = fields.urgency_level;
    data.date_sign = fields.date_sign * 1;
    data.content = fields.content;
    data.department_execute = fields.department_execute || null;
    data.department_receiver = JSON.parse(fields.department_receiver|| '[]').map(department => ({
        department
    }));
    // data.task = JSON.parse(fields.task);
    if(fields.task_label) {
        data.task_label = JSON.parse(fields.task_label);
    }
    data.attachments = [];
    data.incoming_file = [];

    if(res.fileInfo.attachments){
        data.attachments = res.fileInfo.attachments.map(item => {
            return {
                id: uuidv4(),
                timePath: item.timePath,
                locate: item.type,
                display: item.filename,
                name: item.named,
                nameLib: nameLib,
                folderPath: item.folderPath,
                username: username
            }
        })
    }

    if(res.fileInfo.incoming_file){
        data.incoming_file = res.fileInfo.incoming_file.map(item => {
            return {
                id: uuidv4(),
                timePath: item.timePath,
                locate: item.type,
                display: item.filename,
                name: item.named,
                nameLib: nameLib,
                folderPath: item.folderPath,
                username: username
            }
        })
    }

    const incoming_file_remove = JSON.parse(fields.incoming_file_remove || '[]');
    const attachments_remove = JSON.parse(fields.attachments_remove || '[]');

    const newAttachments = daDetails.attachments.filter(item => !attachments_remove.includes(item.id));
    const newIncoming_file = daDetails.incoming_file.filter(item => !incoming_file_remove.includes(item.id));
    data.attachments = newAttachments.concat(data.attachments);
    data.incoming_file = newIncoming_file.concat(data.incoming_file);
    data = CommonUtil.removeNullKeys(data);
    const dataChange = getObjectDifferences(data, daDetails)

    const event = {
        id: uuidv4(),
        action: ACTION.UPDATED,
        time: new Date().getTime(),
        username: username,
        department: body.session.department,
    }

    if(Object.keys(dataChange).length > 0){
        event.data_change = dataChange;
    }

    return {dataUpdate: data, event};
    
}

// Hàm chung để generate data cho các chức năng
function genCommonData(res, username, daDetails, actionType, body) {
    const fields = res.Fields;
    let data = {};

    // Các trường dữ liệu chung
    data.year = fields.year * 1;
    data.code = fields.code;
    data.incoming_number = fields.incoming_number;
    data.incomming_date = fields.incomming_date * 1;
    data.symbol_number = fields.symbol_number;
    data.sending_place = fields.sending_place;
    data.type = fields.type;
    data.field = fields.field;
    data.security_level = fields.security_level;
    data.urgency_level = fields.urgency_level;
    data.date_sign = fields.date_sign * 1;
    data.expried = fields.expried * 1;
    data.content = fields.content;
    data.department_execute = fields.department_execute || null;
    data.department_receiver = JSON.parse(fields.department_receiver || '[]').map(department => ({
        department
    }));
    
    if(fields.task_label) {
        data.task_label = JSON.parse(fields.task_label);
    }

    
    
    data.attachments = [];
    data.incoming_file = [];

    // Xử lý attachments
    if (res.fileInfo.attachments) {
        data.attachments = res.fileInfo.attachments.map(item => ({
            id: uuidv4(),
            timePath: item.timePath,
            locate: item.type,
            display: item.filename,
            name: item.named,
            nameLib: nameLib,
            folderPath: item.folderPath,
            username: username
        }));
    }

    // Xử lý incoming_file
    if (res.fileInfo.incoming_file) {
        data.incoming_file = res.fileInfo.incoming_file.map(item => ({
            id: uuidv4(),
            timePath: item.timePath,
            locate: item.type,
            display: item.filename,
            name: item.named,
            nameLib: nameLib,
            folderPath: item.folderPath,
            username: username
        }));
    }

    // Xử lý file remove
    const incoming_file_remove = JSON.parse(fields.incoming_file_remove || '[]');
    const attachments_remove = JSON.parse(fields.attachments_remove || '[]');

    const newAttachments = daDetails.attachments.filter(item => !attachments_remove.includes(item.id));
    const newIncoming_file = daDetails.incoming_file.filter(item => !incoming_file_remove.includes(item.id));
    
    data.attachments = newAttachments.concat(data.attachments);
    data.incoming_file = newIncoming_file.concat(data.incoming_file);
    
    data = CommonUtil.removeNullKeys(data);
    const dataChange = getObjectDifferences(data, daDetails);

    // Tạo event với action động
    const event = {
        id: uuidv4(),
        action: ACTION[actionType],
        time: new Date().getTime(), 
        username: username,
        note: fields.note,
        department:  body.session.department
    };

    if (Object.keys(dataChange).length > 0) {
        event.data_change = dataChange;
        event.action = ACTION[`${actionType}_AND_UPDATE`];
    }

    return { dataUpdate: data, event };
}

// Các hàm cụ thể sử dụng hàm chung
function genData_SendLeadDepartment(res, username, daDetails, body) {
    return genCommonData(res, username, daDetails, 'SEND_LEAD_DEPARTMENT', body);
}

function genData_SendLeadExternal(res, username, daDetails, body) {
    return genCommonData(res, username, daDetails, 'SEND_LEAD_EXTERNAL', body);
}

function genData_ReturnLeadDepartment(res, username, daDetails, body) {
    return genCommonData(res, username, daDetails, 'RETURN_LEAD_DEPARTMENT', body);
}

function genData_TransferDepartment(res, username, daDetails, body) {
    return genCommonData(res, username, daDetails, 'TRANSFER_DEPARTMENT', body);
}

function verify_Update(body, id){
    let dfd = q.defer();
    DAService.loadDetails(body._service[0].dbname_prefix, id).then(function(daDetails){
        dfd.resolve(daDetails);
    },function(err){
        dfd.reject(err);
    })
    return dfd.promise;
}

function verify_SendLeadDepartment(body, id){
    let dfd = q.defer();
    DAService.loadDetails(body._service[0].dbname_prefix, id).then(function(daDetails){
        if(daDetails.status === DISPATCH_STATUS.CREATED ){
            if(checkRuleCheckBox(
                RULE_DISPATCH.CREATE,
                body.session
            )){
                dfd.resolve(daDetails);
            }else{
                dfd.reject({path:"DAController.verify_SendLeadDepartment.NotPermission", mes:"NotPermission"});
            }
        }else{
            dfd.reject({path:"DAController.verify_SendLeadDepartment.StatusInvalid", mes:"StatusInvalid"});
        }
    },function(err){
        dfd.reject(err);
    })
    return dfd.promise;
}

function verify_SendLeadExternal(body, id){
    let dfd = q.defer();
    
    DAService.loadDetails(body._service[0].dbname_prefix, id).then(function(daDetails){
        if(daDetails.status === DISPATCH_STATUS.WAITING_LEAD_DERPARTMENT_APPROVE ){
            if(checkRuleCheckBox(
                RULE_DISPATCH.LEAD_DEPARTMENT,
                body.session
            )){
                dfd.resolve(daDetails);
            }else{
                dfd.reject({path:"DAController.verify_SendLeadExternal.NotPermission", mes:"NotPermission"});
            }
        }else{
            dfd.reject({path:"DAController.verify_SendLeadExternal.StatusInvalid", mes:"StatusInvalid"});
        }
    },function(err){
        dfd.reject(err);
    })
    return dfd.promise;
}

function verify_ApproveDepartment(body, id){
    let dfd = q.defer();
    DAService.loadDetails(body._service[0].dbname_prefix, id).then(function(daDetails){
        
        if(daDetails.status === DISPATCH_STATUS.WAITING_LEAD_DERPARTMENT_APPROVE){
            if(checkRuleCheckBox(
                RULE_DISPATCH.LEAD_DEPARTMENT,
                body.session
            )){
                dfd.resolve(daDetails);
            }else{
                dfd.reject({path:"DAController.verify_ApproveDepartment.NotPermission", mes:"NotPermission"});
            }
        }else{
            dfd.reject({path:"DAController.verify_ApproveDepartment.StatusInvalid", mes:"StatusInvalid"});
        }
        
    },function(err){
        dfd.reject(err);
    })
    return dfd.promise;
}


function verify_ReturnLeadDepartment(body, id){
    let dfd = q.defer();
    DAService.loadDetails(body._service[0].dbname_prefix, id).then(function(daDetails){
        if(daDetails.status === DISPATCH_STATUS.WAITING_LEAD_EXTERNAL_APPROVE ){
            if(checkRuleCheckBox(
                RULE_DISPATCH.LEAD_EXTERNAL,
                body.session
            )){
                dfd.resolve(daDetails);
            }else{
                dfd.reject({path:"DAController.verify_ReturnLeadDepartment.NotPermission", mes:"NotPermission"});
            }
        }else{
            dfd.reject({path:"DAController.verify_ReturnLeadDepartment.StatusInvalid", mes:"StatusInvalid"});
        }
    },function(err){
        dfd.reject(err);
    })
    return dfd.promise;
}

function verify_TransferDepartment(body, id){
    let dfd = q.defer();
    DAService.loadDetails(body._service[0].dbname_prefix, id).then(function(daDetails){
        if(daDetails.status === DISPATCH_STATUS.WAITING_LEAD_EXTERNAL_APPROVE || daDetails.status === DISPATCH_STATUS.WAITING_LEAD_DERPARTMENT_APPROVE ){
            if(
                checkRuleCheckBox(RULE_DISPATCH.LEAD_EXTERNAL ,body.session) ||
                checkRuleCheckBox(RULE_DISPATCH.LEAD_DEPARTMENT, body.session)
            ){
                dfd.resolve(daDetails);
            }else{
                dfd.reject({path:"DAController.verify_TransferDepartment.NotPermission", mes:"NotPermission"});
            }
        }else{
            dfd.reject({path:"DAController.verify_TransferDepartment.StatusInvalid", mes:"StatusInvalid"});
        }
    },function(err){
        dfd.reject(err);
    })
    return dfd.promise;
}

function verify_TransferDepartmentApprove(body, id){
    let dfd = q.defer();
    DAService.loadDetails(body._service[0].dbname_prefix, id).then(function(daDetails){
        if(daDetails.status === DISPATCH_STATUS.LEAD_TRANSFER_DEPARTMENT){
            if(checkRuleRadioDepartment(body.session.rule, daDetails.department_execute, body.session.department, RULE_DISPATCH.LEAD_CONFIRM)){
                dfd.resolve(daDetails);
            }else{
                dfd.reject({path:"DAController.verify_TransferDepartmentApprove.NotPermission", mes:"NotPermission"});
            }
        }else{
            dfd.reject({path:"DAController.verify_TransferDepartmentApprove.StatusInvalid", mes:"StatusInvalid"});
        }
    },function(err){
        dfd.reject(err);
    })
    return dfd.promise;
}

function verify_SeenWork(body, id){
    let dfd = q.defer();
    DAService.loadDetails(body._service[0].dbname_prefix, id).then(function(daDetails){
        if(daDetails.status === DISPATCH_STATUS.APPROVED || daDetails.status === DISPATCH_STATUS.LEAD_TRANSFER_DEPARTMENT){
            if(daDetails.department_receiver.find(item => item.department === body.session.department)){
                dfd.resolve(daDetails);
            }else{
                dfd.reject({path:"DAController.verify_SeenWork.NotPermission", mes:"NotPermission"});
            }
        }else{
            dfd.reject({path:"DAController.verify_SeenWork.StatusInvalid", mes:"StatusInvalid"});
        }
    },function(err){
        dfd.reject(err);
    })
    return dfd.promise;
}

function insertTask(req, daDetails){
    const dfd = q.defer();
    const dfdAr = [];
    dfdAr.push(DepartmentService.getDepartmentById(req.body._service[0].dbname_prefix, daDetails.department_execute));
    dfdAr.push(DirectoryService.loadDetail(req.body._service[0].dbname_prefix, 'document_type', daDetails.type));
    q.all(dfdAr).then(function([department, type]){
        const fields = {};
        const date = new Date();
        fields.dispatch_arrived_id = daDetails._id;
        fields.title = `${type.title['vi-VN']}-${daDetails.symbol_number}-${daDetails.content}`;
        fields.from_date = (new Date()).getTime();
        fields.to_date = daDetails.expried;
        fields.department = daDetails.department_execute;
        fields.level = TASK_LEVEL.HEAD_TASK;
        fields.observer = [];
        if(department.leader){
            fields.observer.push(department.leader);
        }
        if(department.departmentLeader){
            fields.observer.push(department.departmentLeader);
        }
        fields.observer = [... new Set(fields.observer)];
        fields.observer = JSON.stringify(fields.observer);
        fields.priority = TASK_PRIORITY.MEDIUM;
        fields.parent = JSON.stringify({
            ...daDetails,
            id: daDetails._id,
            object:'dispatch_arrived'
        });
        const taskInsert = genData(fields);
        taskInsert.label_from_da = daDetails.task_label;
    
        TaskService.insert(
            req.body._service[0].dbname_prefix,
            req.body.username,
            taskInsert.priority,
            taskInsert.department,
            taskInsert.title,
            taskInsert.to_department,
            taskInsert.content,
            taskInsert.task_list,
            taskInsert.main_person,
            taskInsert.participant,
            taskInsert.observer,
            null,
            taskInsert.from_date,
            taskInsert.to_date,
            taskInsert.object,
            taskInsert.has_time,
            taskInsert.hours,
            taskInsert.task_type,
            taskInsert.project,
            taskInsert.goals,
            date,
            taskInsert.level,
            taskInsert.head_task_id,
            taskInsert.reference,
            taskInsert.label,
            null,
            taskInsert.source_id,
            taskInsert.parents,
            taskInsert.dispatch_arrived_id,
            taskInsert.is_draft,
            req.body.session.employee_details.department,
            taskInsert.has_repetitive,
            taskInsert.per,
            taskInsert.cycle,
            taskInsert.has_expired,
            taskInsert.expired_date,
            taskInsert.child_work_percent,
            null,
            taskInsert.label_from_da,
        ).then(function (task) {
            return loadTaskReferences(req.body._service[0].dbname_prefix, task, null, { expands: ["department"] });
        })
        .then(function(task){
            dfd.resolve(task);
            taskInsert.code = task.code
    
            if (taskInsert.main_person && taskInsert.main_person.length > 0) {
                taskInsert.main_person.filter(username => username !== req.body.username)
                RingBellItemService.insert(
                    req.body._service[0].dbname_prefix,
                    req.body.username,
                    "task_assigned_main_person",
                    {
                        taskCode: task.code,
                        title: task.title,
                        username_create_task: req.body.username,
                    },
                    task.main_person,
                    [],
                    "createTask",
                    date.getTime()
                );
            }
    
    
            if (taskInsert.participant && taskInsert.participant.length > 0) {
                taskInsert.participant.filter(username => username !== req.body.username)
                RingBellItemService.insert(
                    req.body._service[0].dbname_prefix,
                    req.body.username,
                    "task_assigned_participant",
                    {
                        taskCode: taskInsert.code,
                        title: taskInsert.title,
                        username_create_task: req.body.username,
                    },
                    taskInsert.participant,
                    [],
                    "createTask",
                    date.getTime(),
                );
            }
    
            if (taskInsert.observer && taskInsert.observer.length > 0) {
                taskInsert.observer.filter(username => username !== req.body.username)
                RingBellItemService.insert(
                    req.body._service[0].dbname_prefix,
                    req.body.username,
                    "task_assigned_observer",
                    {
                        taskCode: taskInsert.code,
                        title: taskInsert.title,
                        username_create_task: req.body.username,
                    },
                    taskInsert.observer,
                    [],
                    "createTask",
                    date.getTime(),
                );
            }
    
            TaskService.loadEmployeeDepartment(req.body._service[0].dbname_prefix, data.department)
                .then(function (res) {
                    let usernameToNotifySet = new Set();
                    let usernameToReceive = getUsernameDepartmentToNotify(res, data.department);
                    usernameToReceive = usernameToReceive.filter(username => !usernameToNotifySet.has(username) && username != req.body.username);
                    if (usernameToReceive.length > 0) {
                        RingBellItemService.insert(
                            req.body._service[0].dbname_prefix,
                            req.body.username,
                            'task_receive_to_know',
                            {
                                taskCode: data.code,
                                title: data.title,
                                username_create_task: req.body.username,
                            },
                            usernameToReceive,
                            [],
                            "createTask",
                            date.getTime()
                        );
                    }
                })
        }, function(err){
            console.error(err);
        });
    }, function(err){
        dfd.reject(err);
    })
    
    return dfd.promise;
}

function getStateOfDispatchArrived(dispatch) {
    const today = Date.now();
    const { expried, incomming_date, status } = dispatch;

    if (status === DISPATCH_STATUS.APPROVED) {
        return 'OnSchedule';
    }

    const totalDuration = expried - incomming_date;
    const elapsedDuration = today - incomming_date;

    if (expried < today) {
        return 'Overdue';
    }

    if (elapsedDuration > totalDuration * 0.75) {
        return 'GonnaLate'; 
    }

    return 'OnSchedule';
}


class DAController {
    constructor() { }

    load_quick_handle(body) {
        const aggerationSearch = BuildFilterAggregate.generateUIFilterAggregate_search([], body);
        const aggerationSteps = BuildFilterAggregate.generatePermissionAggregate_ManageUI(body.username, body.session.employee_details.department, body.session.rule, body.checks, aggerationSearch);
        const queryCriteria = { ...body };
        const filter = BuildFilterAggregate.generateUIFilterAggregate_load(aggerationSteps, queryCriteria);
        return DAService.executeAggregate(body._service[0].dbname_prefix, filter).then((data) => {
            return data.map((item) => ({
                ...item,
                state: getStateOfDispatchArrived(item),
            }));
        });

    }

    count_quick_handle(body) {
        const aggerationSearch = BuildFilterAggregate.generateUIFilterAggregate_search([], body);
        const aggerationSteps = BuildFilterAggregate.generatePermissionAggregate_ManageUI(body.username, body.session.employee_details.department, body.session.rule, body.checks, aggerationSearch);
        const queryCriteria = { ...body };
        const filter = BuildFilterAggregate.generateUIFilterAggregate_count(aggerationSteps, queryCriteria);
        return DAService.executeAggregate(body._service[0].dbname_prefix, filter);
    }

    loadDetails(body) {
        return DAService.loadDetails(dbname_prefix, body.id, body.code)
    }

    load(body) {
        const aggerationScope = [{ $match: { scope: { $eq: body.scope } } }];
        const aggerationSearch = BuildFilterAggregate.generateUIFilterAggregate_search(aggerationScope, body);
        const aggerationSteps = BuildFilterAggregate.generatePermissionAggregate_ManageUI(body.username, body.session.employee_details.department, body.session.rule, body.checks, aggerationSearch);
        const queryCriteria = { ...body };
        const filter = BuildFilterAggregate.generateUIFilterAggregate_load(aggerationSteps, queryCriteria);
        return DAService.executeAggregate(body._service[0].dbname_prefix, filter);
    }

    countPending(body) {
        const scope = DISPATCH_SCOPE.EXTERNAL;
        const checks = [CHECKS_ON_UI.NEED_HANDLE];

        const aggerationScope = [{ $match: { scope: { $eq: scope } } }];
        const aggerationSteps = BuildFilterAggregate.generatePermissionAggregate_ManageUI(body.username, body.session.employee_details.department, body.session.rule, checks, aggerationScope);
        const filter = BuildFilterAggregate.generateUIFilterAggregate_count(aggerationSteps);
        return DAService.executeAggregate(body._service[0].dbname_prefix, filter);
    }

    count(body) {
        const aggerationScope = [{ $match: { scope: { $eq: body.scope } } }];
        const aggerationSearch = BuildFilterAggregate.generateUIFilterAggregate_search(aggerationScope, body);
        const aggerationSteps = BuildFilterAggregate.generatePermissionAggregate_ManageUI(body.username, body.session.employee_details.department, body.session.rule, body.checks, aggerationSearch);
        const queryCriteria = { ...body };
        const filter = BuildFilterAggregate.generateUIFilterAggregate_count(aggerationSteps, queryCriteria);
        return DAService.executeAggregate(body._service[0].dbname_prefix, filter);
    }

    getNumber(body) {
        return DAService.getNumber(body._service[0].dbname_prefix, body.da_book);
    }

    insert(req) {
        const dfd = q.defer();

        FileProvider.upload(req, nameLib, validation.insertFormData, undefined, parentFolder, req.body.username).then(function(res){
            const dataInsert = genDataInsert(res, req.body.username, req.body);
            dataInsert.department = req.body.session.department;
            dataInsert.status = DISPATCH_STATUS.CREATED;

            // if(dataInsert.department_execute){
            //     dataInsert.task = {
            //         username: req.body.username,
            //         department: req.body.session.department,
            //         from_department: dataInsert.department_execute
            //     }
            // }
            const dfdAr = [];
            dfdAr.push(DAService.insert(req.body._service[0].dbname_prefix, req.body.username, dataInsert));
            dfdAr.push(DirectoryService.addIncommingNumber(req.body._service[0].dbname_prefix, req.body.username, dataInsert.code, dataInsert.incoming_number * 1));

            q.all(dfdAr).then(function([result]){
                dfd.resolve(result.ops[0])
            }, function(err){ 
                console.error(err);
                dfd.reject(err) 
            });

            // dfd.resolve(true);
        }, function(err){
            console.error(err);
            dfd.reject(err);
        })

        return dfd.promise;
    }

    loadFileInfo(body) {
        let dfd = q.defer();
        let check = true;
        DAService.loadDetails(body._service[0].dbname_prefix, body.id, check).then(
            function (data) {
                let checkPermission = true;
                let checkFile = false;
                let fileInfo = {};

                for (let i in data.attachments) {
                    if (data.attachments[i].name === body.filename) {
                        fileInfo = data.attachments[i];
                        checkFile = true;
                        break;
                    }
                }
                if(!checkFile){
                    for (let i in data.incoming_file) {
                        if (data.incoming_file[i].name === body.filename) {
                            fileInfo = data.incoming_file[i];
                            checkFile = true;
                            break;
                        }
                    }
                }

                if (checkPermission) {
                    if (checkFile) {
                        FileProvider.loadFile(
                            body._service[0].dbname_prefix,
                            body.session,
                            fileInfo.nameLib,
                            fileInfo.name,
                            fileInfo.timePath,
                            fileInfo.locate,
                            folderArray,
                            data.username,
                        ).then(
                            function (fileinfo) {
                                fileinfo.display = fileInfo.display;
                                dfd.resolve(fileinfo);
                                fileinfo = undefined;
                            },
                            function (err) {
                                dfd.reject(err);
                                fileInfo = undefined;
                                err = undefined;
                            },
                        );
                    } else {
                        dfd.reject({
                            path: "DAController.loadFileInfo.FileIsNotExists",
                            mes: "FileIsNotExists",
                        });
                    }
                    body = undefined;
                    checkPermission = undefined;
                    checkFile = undefined;
                } else {
                    dfd.reject({
                        path: "DAController.loadFileInfo.NotPermission",
                        mes: "NotPermission",
                    });
                    body = undefined;
                    checkPermission = undefined;
                    checkFile = undefined;
                    fileInfo = undefined;
                }
            },
            function (err) {
                dfd.reject(err);
                body = undefined;
            },
        );

        return dfd.promise;
    }

    downloadfile(body) {
        let dfd = q.defer();
        let check = false;
        if (
            body.session.role.indexOf("Tenant.DA.Manager") != -1 ||
            body.session.role.indexOf("Office.DA.Use") != -1 ||
            body.session.role.indexOf("SystemManagement") != -1 ||
            body.session.role.indexOf("Office.Archives.Manager") != -1
        ) {
            check = true;
        }
        DAService.loadDetails(body._service[0].dbname_prefix, body.id, check).then(
            function (data) {
                let checkPermission = true;
                let checkFile = false;

                for (let i in data.attachment) {
                    if (data.attachment[i].name === body.filename) {
                        checkFile = true;
                        break;
                    }
                }

                if (checkPermission) {
                    if (checkFile) {
                        FileProvider.download(
                            body._service[0].dbname_prefix +
                            parentFolder +
                            "/" +
                            nameLib +
                            "/" +
                            data.username +
                            "/" +
                            body.filename,
                        ).then(
                            (url) => {
                                dfd.resolve(url);
                                url = undefined;
                            },
                            (error) => {
                                dfd.reject(error);
                                error = undefined;
                            },
                        );
                    } else {
                        dfd.reject({
                            path: "DAController.downloadfile.FileIsNotExists",
                            mes: "FileIsNotExists",
                        });
                    }
                    body = undefined;
                    checkPermission = undefined;
                    checkFile = undefined;
                } else {
                    dfd.reject({
                        path: "DAController.downloadfile.NotPermission",
                        mes: "NotPermission",
                    });
                    body = undefined;
                    checkPermission = undefined;
                    checkFile = undefined;
                }
            },
            function (err) {
                dfd.reject(err);
                body = undefined;
            },
        );

        return dfd.promise;
    }

    handling(body) {
        return DAService.handling(body._service[0].dbname_prefix, body.username, body.id, body.forward, body.comment);
    }

    delete(body) {
        return DAService.delete(body._service[0].dbname_prefix, body.username, body.id);
    }

    insertTask(body) {
        let dfd = q.defer();
        let date = new Date();
        DAService.loadDetails(body._service[0].dbname_prefix, body.id).then(
            function (details) {
                DAService.insertTask(
                    body._service[0].dbname_prefix,
                    body.username,
                    body.session.employee_details.department,
                    body.id,
                    body.title,
                    body.content,
                    [],
                    body.main_person,
                    body.participant,
                    body.observer,
                    details.attachment,
                    body.from_date,
                    body.to_date,
                    [],
                    body.priority,
                ).then(
                    function (taskDetail) {
                        dfd.resolve(true);
                        let usernameToNotify = [];
                        usernameToNotify = usernameToNotify.concat(body.main_person);
                        usernameToNotify = usernameToNotify.concat(body.participant);
                        usernameToNotify = usernameToNotify.concat(body.observer);
                        RingBellItemService.insert(
                            body._service[0].dbname_prefix,
                            body.username,
                            "task_assigned",
                            {
                                taskid: taskDetail.insertedId,
                                title: body.title,
                                username_create_task: body.username,
                            },
                            usernameToNotify,
                            [],
                            "createTask",
                            date.getTime(),
                        );
                        date = undefined;
                    },
                    function (err) {
                        dfd.reject(err);
                        err = undefined;
                    },
                );
            },
            function (err) {
                dfd.reject(err);
                err = undefined;
            },
        );
        return dfd.promise;
    }

    update(req) {
        const dfd = q.defer();

        FileProvider.upload(req, nameLib, validation.updateFormData, undefined, parentFolder, req.body.username).then(function(res){

            verify_Update(req.body, res.Fields.id).then(function(daDetails){
                const {dataUpdate, event} = genDataUpdate(res, req.body.username, daDetails, req.body);
                const dfdAr = [];

                if(!dataUpdate.code){
                    dataUpdate.code = daDetails.code;
                }

                if(!dataUpdate.incoming_number){
                    dataUpdate.incoming_number = daDetails.incoming_number;
                }

                dfdAr.push(
                    DirectoryService.removeIncommingNumber(req.body._service[0].dbname_prefix, req.body.username, daDetails.code, daDetails.incoming_number * 1).then(function(){
                        DirectoryService.addIncommingNumber(req.body._service[0].dbname_prefix, req.body.username, dataUpdate.code, dataUpdate.incoming_number * 1)
                    })
                );
                dfdAr.push(DAService.update(req.body._service[0].dbname_prefix, req.body.username, daDetails._id, dataUpdate, event ));
                q.all(dfdAr).then(function(){
                    dfd.resolve(true)
                }, function(err){ dfd.reject(err) });
            }, function(err){
                console.error(err);
                dfd.reject(err);
            })

        }, function(err){
            console.error(err);
            dfd.reject(err);
        })

        return dfd.promise;
    }

    send_lead_department(req) {
        const dfd = q.defer();
        const currentUser = req.body.session;
        const dbNamePrefix = req.body._service[0].dbname_prefix;
        const d = new Date();

        FileProvider.upload(req, nameLib, validation.send_lead_department, undefined, parentFolder, req.body.username).then(function(res){
            
            verify_SendLeadDepartment(req.body, res.Fields.id).then(function(daDetails){
                const {dataUpdate, event} = genData_SendLeadDepartment(res, req.body.username, daDetails, req.body);
                dataUpdate.status = DISPATCH_STATUS.WAITING_LEAD_DERPARTMENT_APPROVE;
                const dfdAr = [];

                if(!dataUpdate.code){
                    dataUpdate.code = daDetails.code;
                }

                if(!dataUpdate.incoming_number){
                    dataUpdate.incoming_number = daDetails.incoming_number;
                }

                dfdAr.push(
                    DirectoryService.removeIncommingNumber(req.body._service[0].dbname_prefix, req.body.username, daDetails.code, daDetails.incoming_number * 1).then(function(){
                        DirectoryService.addIncommingNumber(req.body._service[0].dbname_prefix, req.body.username, dataUpdate.code, dataUpdate.incoming_number * 1)
                    })
                );
                dfdAr.push(DAService.send_lead_department(dbNamePrefix, req.body.username, daDetails._id, dataUpdate, event));
                q.all(dfdAr).then(function(data){
                    dfd.resolve(true);

                    const currentActor = currentUser.username;

                    const filter = genFilterGetUsersByRule(RULE_DISPATCH.LEAD_DEPARTMENT);
                    UserService.loadUserAggregate(dbNamePrefix, filter).then(function (data) {
                        const leadersNeedToNotify = data.map(user => user.username);
                        RingBellItemService.insert(
                            dbNamePrefix,
                            currentActor,
                            'da_forward_to_head_of_office',
                            {
                                id: daDetails._id,
                                code: dataUpdate.symbol_number || daDetails.symbol_number
                            },
                            leadersNeedToNotify,
                            [],
                            'approveWorkflowPlay',
                            d.getTime()
                        ).then(function () {
                            console.log("Notification insert success.");
                        }).catch(function (err) {
                            console.error("Error during notification insert:", err);
                        });
                    }, function (err) {
                        console.log(err);
                    });

                }, function(err){ dfd.reject(err) });
            }, function(err){
                console.error(err);
                dfd.reject(err);
            })
           
        }, function(err){ 
            console.error(err);
            dfd.reject(err);
        })

        return dfd.promise;
    }

    send_lead_external(req) {
        const dfd = q.defer();
        const currentUser = req.body.session;
        const dbNamePrefix = req.body._service[0].dbname_prefix;
        const d = new Date();

        FileProvider.upload(req, nameLib, validation.send_lead_external, undefined, parentFolder, req.body.username).then(function(res){
            
            verify_SendLeadExternal(req.body, res.Fields.id).then(function(daDetails){
                const {dataUpdate, event} = genData_SendLeadExternal(res, req.body.username, daDetails, req.body);
                event.notifyAfterApproved = true;
                dataUpdate.status = DISPATCH_STATUS.WAITING_LEAD_EXTERNAL_APPROVE;

                const dfdAr = [];

                if(!dataUpdate.code){
                    dataUpdate.code = daDetails.code;
                }

                if(!dataUpdate.incoming_number){
                    dataUpdate.incoming_number = daDetails.incoming_number;
                }

                dfdAr.push(
                    DirectoryService.removeIncommingNumber(req.body._service[0].dbname_prefix, req.body.username, daDetails.code, daDetails.incoming_number * 1).then(function(){
                        DirectoryService.addIncommingNumber(req.body._service[0].dbname_prefix, req.body.username, dataUpdate.code, dataUpdate.incoming_number * 1)
                    })
                );
                dfdAr.push(DAService.send_lead_external(dbNamePrefix,req.body.username,daDetails._id,dataUpdate,event));
                q.all(dfdAr).then(function(){
                    dfd.resolve(true);

                    const currentActor = currentUser.username;

                    const filter = genFilterGetUsersByRule(RULE_DISPATCH.LEAD_EXTERNAL);
                    UserService.loadUserAggregate(dbNamePrefix, filter).then(function (data) {
                        const externalsNeedToNotify = data.map(user => user.username);
                        RingBellItemService.insert(
                            dbNamePrefix,
                            currentActor,
                            'da_forward_to_board_of_directors',
                            {
                                id: daDetails._id,
                                code: dataUpdate.symbol_number || daDetails.symbol_number
                            },
                            externalsNeedToNotify,
                            [],
                            'approveWorkflowPlay',
                            d.getTime()
                        ).then(function () {
                            console.log("Notification insert success.");
                        }).catch(function (err) {
                            console.error("Error during notification insert:", err);
                        });
                    }, function (err) {
                        console.log(err);
                    });

                }, function(err){ dfd.reject(err) });
            }, function(err){
                console.error(err);
                dfd.reject(err);
            })
           
        }, function(err){ 
            console.error(err);
            dfd.reject(err);
        })

        return dfd.promise;
    }

    reject_department(req) {
        const dfd = q.defer();
        const currentUser = req.body.session;
        const dbNamePrefix = req.body._service[0].dbname_prefix;
        const d = new Date();

        verify_ApproveDepartment(req.body, req.body.id).then(function(daDetails){
            const status = DISPATCH_STATUS.CREATED;
            const event = {
                id: uuidv4(),
                action: ACTION.REJECTED_DEPARTMENT,
                time: new Date().getTime(), 
                username: req.body.username,
                note: req.body.note,
                department: req.body.session.department,
            }
            DAService.reject_department(
                dbNamePrefix,
                req.body.username,
                daDetails._id,
                event,
                status,
            ).then(function(){
                dfd.resolve(true);

                const currentActor = currentUser.username;

                RingBellItemService.insert(
                    dbNamePrefix,
                    currentActor,
                    'da_department_reject_dispatch_arrived',
                    {
                        id: daDetails._id,
                        code: daDetails.symbol_number,
                        action_by: currentActor
                    },
                    [daDetails.username],
                    [],
                    'approveWorkflowPlay',
                    d.getTime()
                ).then(function () {
                    console.log("Notification insert success.");
                }).catch(function (err) {
                    console.error("Error during notification insert:", err);
                });

            }, function(err){ dfd.reject(err) });
        }, function(err){
            console.error(err);
            dfd.reject(err);
        })
        return dfd.promise;
    }

    return_lead_department(req) {
        const dfd = q.defer();
        const currentUser = req.body.session;
        const dbNamePrefix = req.body._service[0].dbname_prefix;
        const d = new Date();

        FileProvider.upload(req, nameLib, validation.send_lead_department, undefined, parentFolder, req.body.username).then(function(res){
            
            verify_ReturnLeadDepartment(req.body, res.Fields.id).then(function(daDetails){
                const {dataUpdate, event} = genData_ReturnLeadDepartment(res, req.body.username, daDetails, req.body);
                dataUpdate.status = DISPATCH_STATUS.WAITING_LEAD_DERPARTMENT_APPROVE;
                const dfdAr = [];

                if(!dataUpdate.code){
                    dataUpdate.code = daDetails.code;
                }

                if(!dataUpdate.incoming_number){
                    dataUpdate.incoming_number = daDetails.incoming_number;
                }

                dfdAr.push(
                    DirectoryService.removeIncommingNumber(req.body._service[0].dbname_prefix, req.body.username, daDetails.code, daDetails.incoming_number * 1).then(function(){
                        DirectoryService.addIncommingNumber(req.body._service[0].dbname_prefix, req.body.username, dataUpdate.code, dataUpdate.incoming_number * 1)
                    })
                );
                

                dfdAr.push(DAService.return_lead_department(dbNamePrefix,req.body.username,daDetails._id,dataUpdate,event))

                q.all(dfdAr).then(function(){
                    dfd.resolve(true);

                    const currentActor = currentUser.username;

                    const filter = genFilterGetUsersByRule(RULE_DISPATCH.LEAD_DEPARTMENT);
                    UserService.loadUserAggregate(dbNamePrefix, filter).then(function (data) {
                        const leadersNeedToNotify = data.map(user => user.username);
                        RingBellItemService.insert(
                            dbNamePrefix,
                            currentActor,
                            'da_department_reject_dispatch_arrived',
                            {
                                id: daDetails._id,
                                code: daDetails.symbol_number,
                                action_by: currentActor
                            },
                            leadersNeedToNotify,
                            [],
                            'approveWorkflowPlay',
                            d.getTime()
                        ).then(function () {
                            console.log("Notification insert success.");
                        }).catch(function (err) {
                            console.error("Error during notification insert:", err);
                        });
                    }, function (err) {
                        console.log(err);
                    });

                }, function(err){ dfd.reject(err) });
            }, function(err){
                console.error(err);
                dfd.reject(err);
            })
           
        }, function(err){ 
            console.error(err);
            dfd.reject(err);
        })

        return dfd.promise;
    }

    transfer_department(req) {
        const dfd = q.defer();
        const currentUser = req.body.session;
        const dbNamePrefix = req.body._service[0].dbname_prefix;
        const d = new Date();

        FileProvider.upload(req, nameLib, validation.transfer_department, undefined, parentFolder, req.body.username).then(function(res){
            verify_TransferDepartment(req.body, res.Fields.id).then(function(daDetails){
                const {dataUpdate, event} = genData_TransferDepartment(res, req.body.username, daDetails, req.body);
                event.notifyAfterApproved = true;
                if(!dataUpdate.department_execute) {
                    dataUpdate.status = DISPATCH_STATUS.APPROVED;
                }else{
                    dataUpdate.status = DISPATCH_STATUS.LEAD_TRANSFER_DEPARTMENT;
                }

                const dfdAr = [];

                if(!dataUpdate.code){
                    dataUpdate.code = daDetails.code;
                }

                if(!dataUpdate.incoming_number){
                    dataUpdate.incoming_number = daDetails.incoming_number;
                }

                dfdAr.push(
                    DirectoryService.removeIncommingNumber(req.body._service[0].dbname_prefix, req.body.username, daDetails.code, daDetails.incoming_number * 1).then(function(){
                        DirectoryService.addIncommingNumber(req.body._service[0].dbname_prefix, req.body.username, dataUpdate.code, dataUpdate.incoming_number * 1)
                    })
                );

                dfdAr.push(DAService.transfer_department(dbNamePrefix,req.body.username,daDetails._id,dataUpdate,event));

                q.all(dfdAr).then(function(){
                    dfd.resolve(true);

                    const currentActor = currentUser.username;
                    if (dataUpdate.department_execute && dataUpdate.department_execute.length > 0) {
                        const filterToExec = genFilterGetUsersByRuleAndDepartment(RULE_DISPATCH.LEAD_CONFIRM, dataUpdate.department_execute);
                        UserService.loadUserAggregate(dbNamePrefix, filterToExec).then(function (data) {
                            const notifyToExec = data.map(user => user.username);
                            RingBellItemService.insert(
                                dbNamePrefix,
                                currentActor,
                                'da_forward_to_departments',
                                {
                                    id: daDetails._id,
                                    code: dataUpdate.symbol_number || daDetails.symbol_number,
                                    justReview: false
                                },
                                notifyToExec,
                                [],
                                'approveWorkflowPlay',
                                d.getTime()
                            ).then(function () {
                                console.log("Notification EXEC success.");
                            }).catch(function (err) {
                                console.error("Error during notification EXEC:", err);
                            });
                        }, function (err) {
                            console.log(err);
                        });
                    }

                    if (dataUpdate.department_receiver && dataUpdate.department_receiver.length > 0) {
                        const notifyToFollow = [];
                        const departmentList = dataUpdate.department_receiver.map(item => item.department);
                        const promises = departmentList.map(async (department) => {                        
                            const filterToFollow = genFilterGetUsersByRuleAndDepartment(RULE_DISPATCH.FOLLOW, department);
                            try {
                                const data = await UserService.loadUserAggregate(dbNamePrefix, filterToFollow);
                                const usernameNeedToFollow = data.map(user => user.username);
                                notifyToFollow.push(...usernameNeedToFollow);
                            } catch (err) {
                                console.error('Error loading user aggregate for department', department, err);
                            }
                        });

                        Promise.all(promises).then(() => {
                            RingBellItemService.insert(
                                dbNamePrefix,
                                currentActor,
                                'da_forward_to_departments',
                                {
                                    id: daDetails._id,
                                    code: dataUpdate.symbol_number || daDetails.symbol_number,
                                    justReview: true
                                },
                                notifyToFollow,
                                [],
                                'approveWorkflowPlay',
                                d.getTime()
                            ).then(function () {
                                console.log("Notification FOLLOW success.");
                            }).catch(function (err) {
                                console.error("Error during notification FOLLOW:", err);
                            });
                        });
                    }

                }, function(err){ dfd.reject(err) });
            }, function(err){
                console.error(err);
                dfd.reject(err);
            })
           
        }, function(err){ 
            console.error(err);
            dfd.reject(err);
        })

        return dfd.promise;
    }

    transfer_department_approve(req) {
        const dfd = q.defer();
        const currentUser = req.body.session;
        const dbNamePrefix = req.body._service[0].dbname_prefix;
        const d = new Date();

        verify_TransferDepartmentApprove(req.body, req.body.id).then(function(daDetails){
            const status = DISPATCH_STATUS.APPROVED;
            const event = {
                id: uuidv4(),
                action: ACTION.TRANSFER_DEPARTMENT_APPROVE,
                time: new Date().getTime(), 
                username: req.body.username,
                note: req.body.note,
                department: req.body.session.department,
            }
            try{

                insertTask(req, daDetails).then(function(task){
                    DAService.transfer_department_approve(
                        dbNamePrefix,
                        req.body.username,
                        daDetails._id,
                        event,
                        status,
                        task.code,
                    ).then(function(){
                        dfd.resolve(true);
    
                        const currentActor = currentUser.username;
                        const usernamesToNotify = [
                            ...new Set(
                              daDetails.events
                                .filter(event => event.notifyAfterApproved) // Lọc các object có notifyAfterApproved: true
                                .map(event => event.username) // Lấy ra username từ các object đã lọc
                            )
                        ];
    
                        RingBellItemService.insert(
                            dbNamePrefix,
                            currentActor,
                            'da_department_accept_dispatch_arrived',
                            {
                                id: daDetails._id,
                                code: daDetails.symbol_number,
                                department_action_by: currentUser.department
                            },
                            usernamesToNotify,
                            [],
                            'approveWorkflowPlay',
                            d.getTime()
                        ).then(function () {
                            console.log("Notification EXEC success.");
                        }).catch(function (err) {
                            console.error("Error during notification EXEC:", err);
                        });
    
                    }, function(err){ dfd.reject(err) });
                }, function(err){
                    dfd.reject(err);
                });
            }catch(err){
                console.error(err);
            }
        }, function(err){
            console.error(err);
            dfd.reject(err);
        })
        return dfd.promise;
    }

    seen_work(req) {
        const dfd = q.defer();
        verify_SeenWork(req.body, req.body.id).then(function(daDetails){
            daDetails.department_receiver.map(item => {
                if(item.department === req.body.session.department){
                    item.seen_at = (new Date()).getTime();
                    item.seen = true;
                }
                return item;
            }) 

            const event = {
                id: uuidv4(),
                action: ACTION.DEPARTMENT_SEEN,
                time: new Date().getTime(), 
                username: req.body.username,
                note: req.body.note,
                department: req.body.session.department,
            }
            
            DAService.seen_work(
                req.body._service[0].dbname_prefix,
                req.body.username,
                daDetails._id,
                event,
                daDetails.department_receiver
            ).then(function(){
                dfd.resolve(true)
            }, function(err){ dfd.reject(err) });
            
        }, function(err){
            console.error(err);
            dfd.reject(err);
        })
        return dfd.promise;
    }

    signAcknowledge(body) {
        let dfd = q.defer();
        DAService.signAcknowledge(
            body._service[0].dbname_prefix,
            body.username,
            body.id,
            body.note,
            body.with_task,
        ).then(
            function (data) {
                dfd.resolve(true);

                RingBellItemService.insert(
                    body._service[0].dbname_prefix,
                    body.username,
                    "acknowledge",
                    {
                        da_id: body.id,
                        username_create_da: data.username,
                    },
                    data.handler,
                    [],
                    "acknowledge",
                    date.getTime(),
                );
            },
            function (err) {
                dfd.reject(err);
                err = undefined;
            },
        );
        return dfd.promise;
    }

    forward(dbPrefix, body) {
        const dfd = q.defer();

        DAService.loadDispatchArrivedInfo(dbPrefix, body.id).then(function (result) {

            const dispatchArrived = result[0];
            let promise = null;
            switch (body.to) {
                case DISPATCH_FORWARD_TO.HEAD_OF_DEPARTMENT:
                    promise = processForwardToHeadOfOffice(dbPrefix, body.username, dispatchArrived, body.note);
                    break;

                case DISPATCH_FORWARD_TO.BOARD_OF_DIRECTORS:
                    promise = processForwardBOD(dbPrefix, body.username, dispatchArrived, body.note);
                    break;

                case DISPATCH_FORWARD_TO.DEPARTMENTS:
                    promise = processToDepartment(dbPrefix, body.username, dispatchArrived, body.note);
                    break;

                default:
                    dfd.reject({ path: "DAService.forward.InvalidForwardTo", mes: "InvalidForwardTo" });
            }

            promise.then(function () { dfd.resolve(true); }, function (err) { dfd.reject(err); })
        }, function (err) {
            dfd.reject({ path: "DAController.forward.getDAInfoFailed", err });
        });
        return dfd.promise;
    }

    response(dbPrefix, currentUser, body) {
        const dfd = q.defer();
        DAService.loadDetails(dbPrefix, body.id, true).then(function (dispatch) {
            if (DISPATCH_ARRIVED_STATUS.TRANSFERRED !== dispatch.status) {
                dfd.reject(new BaseError("DAController.response", "InvalidStatus"));
            } else {
                resolveHandler(dbPrefix, dispatch, currentUser).then(function (dispatch2) {
                    if (!dispatch2.is_handler) {
                        dfd.reject(new BaseError("DAController.response", "NotHandler"));
                    } else {
                        DAService.response(dbPrefix, currentUser.username, currentUser.department, body).then(function () {
                            dfd.resolve(true);
                        }, function (err) {
                            dfd.reject(err instanceof BaseError ? err : new BaseError("DAController.response", "resolveFailed"));
                        });
                    }
                }, function (err) {
                    dfd.reject(err instanceof BaseError ? err : new BaseError("DAController.response", "resolveHandlerFailed"));
                })
            }
        }, function (err) {
            LogProvider.error("Process response error: " + JSON.stringify(err));
            dfd.reject(err instanceof BaseError ? err : new BaseError("DAController.response", "LoadDetailsFailed"));
        });
        return dfd.promise;
    }

    receive(dbPrefix, body) {
        const dfd = q.defer();
        const currentActor = body.username;
        
        DAService.loadDetails(dbPrefix, body.id, true).then(function (dispatch) {
            if (DISPATCH_STATUS.PENDING_RECEIPT !== dispatch.status) {
                dfd.reject(new BaseError("DAController.response", "InvalidStatus"));
            } else {
                const event = {
                    id: uuidv4(),
                    action: ACTION.DEPARTMENT_RECEIVED,
                    time: new Date().getTime(),
                    username: currentActor,
                    note: body.note,
                    department: body.session.department,
                }

                const entityToReceive = {
                    code: body.code, 
                    incoming_number: body.incoming_number, 
                    field: body.field,
                    status: DISPATCH_STATUS.APPROVED
                }

                // Các tác vụ chính
                const dfdAr = [
                    DAService.update(dbPrefix, currentActor, dispatch._id, entityToReceive, event),
                    DirectoryService.addIncommingNumber(dbPrefix, currentActor, entityToReceive.code, Number(entityToReceive.incoming_number)),
                ];

                // Xử lý ODB
                ODBService.loadDetails(dbPrefix, dispatch.odb_id).then(function (odb) {
                    odb.department_receiver.forEach(item => {
                        if (item.department === body.session.department) {
                            item.received_at = Date.now();
                            item.received = true;
                        }
                    });

                    const entityToUpdateODB = { department_receiver: odb.department_receiver };
                    dfdAr.push(ODBService.update(dbPrefix, currentActor, dispatch.odb_id, entityToUpdateODB, event));

                    q.all(dfdAr).then(function () {
    
                        RingBellItemService.insert(
                            dbPrefix,
                            currentActor,
                            "da_department_read_dispatch_arrived",
                            {
                                id: odb._id,
                                code: odb.symbol_number,
                                department_action_by: body.session.department
                            },
                            [odb.username], // Người tạo công văn đi
                            [],
                            'approveWorkflowPlay',
                            new Date().getTime()
                        );
                        
                        dfd.resolve(true);
                    }, function (err) {
                        console.error(err);
                        dfd.reject(err);
                    });
                }).catch(function (err) {
                    console.error(err);
                    dfd.reject(err);
                });
            }
        }, function (err) {
            LogProvider.error("Process response error: " + JSON.stringify(err));
            dfd.reject(err instanceof BaseError ? err : new BaseError("DAController.response", "LoadDetailsFailed"));
        });

        return dfd.promise;
    }
}

class DepartmentController {
    constructor() { }

    load(body) {
        return DepartmentService.load(body._service[0].dbname_prefix);
    }
}

class EmployeeController {
    constructor() { }

    load(body) {
        return EmployeeService.load(body._service[0].dbname_prefix, body.department);
    }
}

exports.DAController = new DAController();
exports.DepartmentController = new DepartmentController();
exports.EmployeeController = new EmployeeController();
