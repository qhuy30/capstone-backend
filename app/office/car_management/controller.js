const { removeUnicode, filterLanguage, genFilterRuleUser, getWeekNumber, genFilterGetUsersByRuleAndDepartment, genFilterGetUsersByRule } = require('@utils/util');

const {  RULE_CAR, STATUS_CAR, STATUS_FLOW, CARD_CREDIT_STATUS, CAR_ACTION_NAME, CAR_FROM_ACTION, CAR_TAB } = require("./const");
const { validation } = require("./validation");
const { CarManagementService, UserService, DirectoryService } = require('./service');
const { checkRuleRadioDepartment, getObjectDifferences, checkRuleCheckBox } = require('../../../utils/ruleUtils');
const nameLib = "car_management";
const parentFolder = "office";
const folderArray = ['office'];
const { RingBellItemService } = require("../../management/ringbell_item/service");
const { MongoDBProvider } = require("../../../shared/mongodb/db.provider");
const mongodb = require("mongodb");
const { BuildFilterAggregate } = require("./utility");
const { FileProvider } = require("../../../shared/file/file.provider");
const { v4: uuidv4 } = require('uuid');
const { STATUS_EVENT_CALENDAR } = require("../event_calendar/const");
const XLSX = require('xlsx-js-style');
const { formatTimestamp, generateCalendar } = require("@utils/eventUtil");
const q = require('q');



const genInsertEntity = function (fields, username) {
    let result = {};

    result.starting_place = fields.starting_place;
    result.destination = fields.destination;
    result.destination_search = removeUnicode(fields.destination);
    result.passenger = JSON.parse(fields.passenger);
    result.contact_passenger = JSON.parse(fields.contact_passenger);
    result.to_department = JSON.parse(fields.to_department);
    result.time_to_go = fields.time_to_go;
    result.pick_up_time = fields.pick_up_time;
    result.number_of_people = parseInt(fields.number_of_people);
    result.content = fields.content;
    result.event = [
        { action: "Created", username, time: new Date().getTime(), id: uuidv4() }
    ];
    result.status = STATUS_CAR.CREATED;
    result.flow_status = STATUS_FLOW.REGISTER;
    result.title = fields.title;
    return result;
};

const genUpdateEntity = function (fields, username) {
    let result = {};
    result.code = fields.code;
    result.removed_attachments = (JSON.parse(fields.removed_attachments) || []).map(item => item.id);
    result.starting_place = fields.starting_place;
    result.destination = fields.destination;
    result.destination_search = removeUnicode(fields.destination);
    result.passenger = JSON.parse(fields.passenger);
    result.contact_passenger = JSON.parse(fields.contact_passenger);
    result.to_department = JSON.parse(fields.to_department);
    result.time_to_go = fields.time_to_go;
    result.pick_up_time = fields.pick_up_time;
    result.number_of_people = parseInt(fields.number_of_people);
    result.content = fields.content;
    result.title = fields.title;
    result.event = { action: CAR_FROM_ACTION.UPDATED, username, time: new Date().getTime(), id: uuidv4() };
    result.status = STATUS_CAR.CREATED;
    result.flow_status = STATUS_FLOW.REGISTER;
    return result;
};

const genUpdateDepartmentEntity = function (fields, username, item) {
    let result = {};
    let action = CAR_FROM_ACTION.DEPARTMENT_APPROVED;
    result.code = fields.code;
    result.starting_place = fields.starting_place;
    result.destination = fields.destination;
    result.destination_search = removeUnicode(fields.destination);
    result.passenger = JSON.parse(fields.passenger);
    result.to_department = JSON.parse(fields.to_department);
    result.contact_passenger = JSON.parse(fields.contact_passenger);
    result.time_to_go = fields.time_to_go;
    result.pick_up_time = fields.pick_up_time;
    result.number_of_people = parseInt(fields.number_of_people);
    result.content = fields.content;
    result.title = fields.title;
    result.status = STATUS_CAR.CREATED;
    result.flow_status = STATUS_FLOW.REGISTER;

    const dataUpdate = getObjectDifferences(result, item);
    result.removed_attachments = JSON.parse(fields.removed_attachments);
    
    result.event = { 
        id: uuidv4(),
        username,
        time: new Date().getTime(),
    };
    if(Object.keys(dataUpdate).length > 0){
        action = CAR_FROM_ACTION.DEPARTMENT_APPROVED;
        result.event.data_change = dataUpdate;
    }
    result.event.action = action;

    return result;
};

const genCreatorReturnCardEntity = function(fields, username){
    const result = {};
    result.code = fields.code;
    result.number_km = fields.km * 1;
    result.money = fields.money * 1;
    result.event = { action: "CreatorReturnCard", username, note:fields.note, time: new Date().getTime(), id: uuidv4() };
    return result;
};

const genCarManagementEntity = function(fields){
    let rs = {};
    rs.assign_card = fields.assign_card;
    rs.card = undefined;
    rs.car = undefined;
    rs.driver = undefined;
    if(rs.assign_card){
        rs.card = fields.card;
    }else{
        rs.car = fields.car;
        rs.driver = fields.driver;
    }
    
    return rs;
};

const genCarLeadEntity = function(body, item){
    
    let rs = {};
    let action = CAR_FROM_ACTION.LEAD_APPROVED;
    rs.assign_card = body.assign_card;
    rs.card = null;
    rs.car = null;
    rs.driver = null;
    if(rs.assign_card){
        rs.card = body.card;
    }else{
        rs.car = body.car;
        rs.driver = body.driver;
    }
    const dataUpdate = getObjectDifferences(rs, item);
    rs.event = {
        username: body.username,
        time: new Date().getTime(),
        id: uuidv4(),
        note: body.note,
    }
    
    if(Object.keys(dataUpdate).length > 0){
        action = CAR_FROM_ACTION.LEAD_APPROVED_AND_CHANGE;
        rs.event.data_change = dataUpdate;
    }
    rs.event.action = action;
  
    return {rs, action};
};

function findAndNotifyApprover(req, item) {
    const rule = RULE_CAR.APPROVE_DEPARTMENT;
    const filter = genFilterRuleUser(rule, item.department);

    notify(req, filter, CAR_ACTION_NAME.NEED_TO_APPROVE,{
        code: item.code,
        destination: item.destination,
        title: item.title,
        username_create_ticket: req.body.username,
        time_to_go: item.item_to_go,
        status: STATUS_CAR.CREATED
    }, CAR_FROM_ACTION.CREATED)
}

function findAndNotifyCreatorApprove(req, item, action, from_action){
    const rule = [RULE_CAR.APPROVE_DEPARTMENT];
    const ruleToDepartment = [RULE_CAR.NOTIFY_DEPARTMENT];
    const filterDepartments = [];
    const filter = genFilterRuleUser(rule, item.department, [
        { username: { $eq: item.username } },
    ]);
    item.to_department.forEach(department => {
        filterDepartments.push(genFilterRuleUser(ruleToDepartment, department));
    })

    notifyManyDepartment(req, filterDepartments, CAR_ACTION_NAME.NEED_REVIEW,{
        code: item.code,
        destination: item.destination,
        title: item.title,
        username_create_ticket: item.username,
        time_to_go: item.item_to_go,
        status: item.status,
        username: req.body.username
    }, from_action, [...item.passenger, item.driver, item.contact_passenger])

    notify(req, filter, action,{
        code: item.code,
        destination: item.destination,
        title: item.title,
        username_create_ticket: item.username,
        time_to_go: item.item_to_go,
        status: item.status,
        username: req.body.username
    }, from_action);
}

function findAndNotifyDepartmentCreator(req, item, action, from_action) {
    const rule = RULE_CAR.APPROVE_DEPARTMENT;
    const filter = genFilterRuleUser(rule, item.department,[{ username: { $eq: item.username } }]);
    notify(req, filter, action,{
        code: item.code,
        destination: item.destination,
        title: item.title,
        username_create_ticket: item.username,
        time_to_go: item.item_to_go,
        status: item.status,
    }, from_action);
}

function findAndNotifyReject(req, item, action, from_action){
    const users = [...new Set(item.event.map(item => item.username).filter(user => user !== req.body.username))];

    const params = {
        code: item.code,
        destination: item.destination,
        title: item.title,
        username_create_ticket: item.username,
        time_to_go: item.item_to_go,
        status: item.status
    }

    RingBellItemService.insert(
        req.body._service[0].dbname_prefix,
        req.body.username,
        action,
        params,
        users,
        [],
        from_action,
        new Date().getTime()
    )
}

function findAndNotifyCarManagement(req, item) {
    const rule = RULE_CAR.CONFIRM; 
    const filter = genFilterRuleUser(rule, item.department);

    notify(req, filter, CAR_ACTION_NAME.NEED_TO_APPROVE,{
        code: item.code,
        destination: item.destination,
        title: item.title,
        username_create_ticket: item.username,
        time_to_go: item.item_to_go,
        status: STATUS_CAR.LEADER_DEPARTMENT_APPROVED
    }, CAR_FROM_ACTION.DEPARTMENT_APPROVED);
}

function findAndNotifyLeadApprove(req, item) {
    const rule = RULE_CAR.APPROVE_LEAD;
    const filter = genFilterRuleUser(rule, item.department);
  
    notify(req, filter, CAR_ACTION_NAME.NEED_TO_APPROVE,{
        code: item.code,
        destination: item.destination,
        title: item.title,
        username_create_ticket: item.username,
        time_to_go: item.item_to_go,
        status: STATUS_CAR.CONFIRMER_APPROVED
    }, CAR_FROM_ACTION.MANAGEMENT_CAR_APPROVED);
}

function findAndNotifyManagementCard(req, item, action, from_action) {
    const rule  = RULE_CAR.CONFIRM;
    const filter = genFilterRuleUser(rule, item.department);
    
    notify(req, filter, action,{
        code: item.code,
        destination: item.destination,
        title: item.title,
        username_create_ticket: item.username,
        time_to_go: item.item_to_go,
        status: item.status,
        username: item.username
    }, from_action);
    
}

function findAndNotifyLeadExternal(req, item, action, from_action) {
    const rule = RULE_CAR.APPROVE_LEAD_EXTERNAL;

    const filter = genFilterRuleUser(rule, item.department);
    
    notify(req, filter, action,{
        code: item.code,
        destination: item.destination,
        title: item.title,
        username_create_ticket: item.username,
        time_to_go: item.item_to_go,
        status: item.status
    }, from_action);
}

function notify(req, filter, action, params, from_action){
    UserService.loadUser(req.body._service[0].dbname_prefix, filter).then(function (users) {
        users = users.map(e => e.username).filter(e => e !== req.body.username);
        RingBellItemService.insert(
            req.body._service[0].dbname_prefix,
            req.body.username,
            action,
            params,
            users,
            [],
            from_action,
            new Date().getTime()
        )
        
    }, function (err) {
        console.log(action, JOSN.stringify(err));
    })
}

function notifyManyDepartment(req, filters, action, params, from_action, to_users){
    const dfdAr = [];
    filters.forEach(filter => {
        dfdAr.push(UserService.loadUser(req.body._service[0].dbname_prefix, filter));
    })

    q.all(dfdAr).then(function (users) {
        users = users.reduce((acc, val) => acc.concat(val), []);
        users = users.map(e => e.username).filter(e => e !== req.body.username);
        users = users.concat(to_users);
        users = [...new Set(users)]
        RingBellItemService.insert(
            req.body._service[0].dbname_prefix,
            req.body.username,
            action,
            params,
            users,
            [],
            from_action,
            new Date().getTime()
        )
        
    }, function (err) {
        console.error(action, JOSN.stringify(err));
    })
}

function verify_ApproveDepartment(body, code){
    let dfd = q.defer();
    CarManagementService.loadDetails(body._service[0].dbname_prefix,code).then(function(ticketDetails){
        
        if(ticketDetails.status === STATUS_CAR.CREATED ){
            if(checkRuleRadioDepartment(body.session.rule,ticketDetails.department,
                body.session.employee_details.department,
                RULE_CAR.APPROVE_DEPARTMENT
            )){
                dfd.resolve(ticketDetails);
            }else{
                dfd.reject({path:"CarManagementController.verify_ApproveDepartment.NotPermission", mes:"NotPermission"});
            }
        }else{
            dfd.reject({path:"CarManagementController.verify_ApproveDepartment.StatusInvalid", mes:"StatusInvalid"});
        }
    },function(err){
        dfd.reject(err);
    })
    return dfd.promise;
}

function verify_Update(body, code){
    let dfd = q.defer();
    CarManagementService.loadDetails(body._service[0].dbname_prefix,code).then(function(ticketDetails){
        
        if(ticketDetails.status === STATUS_CAR.CREATED){
            dfd.resolve(ticketDetails);
        }else{
            dfd.reject({path:"CarManagementController.verify_Update.StatusInvalid", mes:"StatusInvalid"});
        }
    },function(err){
        dfd.reject(err);
    })
    return dfd.promise;
}

function verify_ApproveCarManagement(body){
    let dfd = q.defer();
    CarManagementService.loadDetails(body._service[0].dbname_prefix,body.code).then(function(ticketDetails){
        if(ticketDetails.status === STATUS_CAR.LEADER_DEPARTMENT_APPROVED ){
            if(body.session.rule.some(e => e.rule === RULE_CAR.CONFIRM)){
                dfd.resolve(ticketDetails);
            }else{
                dfd.reject({path:"CarManagementController.verify_ApproveCarManagement.NotPermission", mes:"NotPermission"});
            }
        }else{
            dfd.reject({path:"CarManagementController.verify_ApproveCarManagement.StatusInvalid", mes:"StatusInvalid"});
        }
    },function(err){
        dfd.reject(err);
    })
    return dfd.promise;
}

function verify_ApproveLead(body){
    let dfd = q.defer();
    CarManagementService.loadDetails(body._service[0].dbname_prefix,body.code).then(function(ticketDetails){
        if(ticketDetails.status === STATUS_CAR.CONFIRMER_APPROVED){
            if(body.session.rule.some(e => e.rule === RULE_CAR.APPROVE_LEAD)){
                dfd.resolve(ticketDetails);
            }else{
                dfd.reject({path:"CarManagementController.verify_ApproveLead.NotPermission", mes:"NotPermission"});
            }
        }else{
            dfd.reject({path:"CarManagementController.verify_ApproveLead.StatusInvalid", mes:"StatusInvalid"});
        }
    },function(err){
        dfd.reject(err);
    })
    return dfd.promise;
}

function verify_ApproveLeadExternal(body){
    let dfd = q.defer();
    CarManagementService.loadDetails(body._service[0].dbname_prefix,body.code).then(function(ticketDetails){
        if(ticketDetails.status === STATUS_CAR.LEAD_APPROVED_CAR){
            if(body.session.rule.some(e => e.rule === RULE_CAR.APPROVE_LEAD_EXTERNAL)){
                dfd.resolve(ticketDetails);
            }else{
                dfd.reject({path:"CarManagementController.verify_ApproveLeadExternal.NotPermission", mes:"NotPermission"});
            }
        }else{
            dfd.reject({path:"CarManagementController.verify_ApproveLeadExternal.StatusInvalid", mes:"StatusInvalid"});
        }
    },function(err){
        dfd.reject(err);
    })
    return dfd.promise;
}

function verify_ApproveCardManagement(body){
    let dfd = q.defer();
    CarManagementService.loadDetails(body._service[0].dbname_prefix,body.code).then(function(ticketDetails){
        if(ticketDetails.status === STATUS_CAR.LEAD_APPROVED_CAR ){
            if(body.session.rule.some(e => e.rule === RULE_CAR.ASSIGN_CARD)){
                dfd.resolve(ticketDetails);
            }else{
                dfd.reject({path:"CarManagementController.verify_ApproveCardManagement.NotPermission", mes:"NotPermission"});
            }
        }else{
            dfd.reject({path:"CarManagementController.verify_ApproveCardManagement.StatusInvalid", mes:"StatusInvalid"});
        }
    },function(err){
        dfd.reject(err);
    })
    return dfd.promise;
}

function verify_EditCardManagement(body){
    let dfd = q.defer();
    CarManagementService.loadDetails(body._service[0].dbname_prefix,body.code).then(function(ticketDetails){
        if(ticketDetails.status === STATUS_CAR.LEAD_APPROVED_CARD ){
            if(body.session.rule.some(e => e.rule === RULE_CAR.ASSIGN_CARD)){
                dfd.resolve(ticketDetails);
            }else{
                dfd.reject({path:"CarManagementController.verify_EditCardManagement.NotPermission", mes:"NotPermission"});
            }
        }else{
            dfd.reject({path:"CarManagementController.verify_EditCardManagement.StatusInvalid", mes:"StatusInvalid"});
        }
    },function(err){
        dfd.reject(err);
    })
    return dfd.promise;
}

function verify_DeliveriedCard(body){
    let dfd = q.defer();
    CarManagementService.loadDetails(body._service[0].dbname_prefix,body.code).then(function(ticketDetails){
        if(ticketDetails.status === STATUS_CAR.LEAD_APPROVED_CARD ){
            if(body.session.rule.some(e => e.rule === RULE_CAR.ASSIGN_CARD)){
                dfd.resolve(true);
            }else{
                dfd.reject({path:"CarManagementController.verify_DeliveriedCard.NotPermission", mes:"NotPermission"});
            }
        }else{
            dfd.reject({path:"CarManagementController.verify_DeliveriedCard.StatusInvalid", mes:"StatusInvalid"});
        }
    },function(err){
        dfd.reject(err);
    })
    return dfd.promise;
} 

function verify_CreatorReceiveCard(body){
    let dfd = q.defer();
    CarManagementService.loadDetails(body._service[0].dbname_prefix,body.code).then(function(ticketDetails){
        if(ticketDetails.status === STATUS_CAR.LEAD_EXTERNAL_APPROVED){
            if(body.username === ticketDetails.username){
                dfd.resolve(ticketDetails);
            }else{
                dfd.reject({path:"CarManagementController.verify_CreatorReceiveCard.NotPermission", mes:"NotPermission"});
            }
        }else{
            dfd.reject({path:"CarManagementController.verify_CreatorReceiveCard.StatusInvalid", mes:"StatusInvalid"});
        }
    },function(err){
        dfd.reject(err);
    })
    return dfd.promise;
}

function verify_CreatorReturnCard(req, res){
    const dfd = q.defer();
    CarManagementService.loadDetails(req.body._service[0].dbname_prefix,res.Fields.code).then(function(ticketDetails){
        if(ticketDetails.status === STATUS_CAR.CREATOR_RECEIVED_CARD ){
            if(req.body.username === ticketDetails.username){
                dfd.resolve(ticketDetails);
            }else{
                dfd.reject({path:"CarManagementController.verify_CreatorReturnCard.NotPermission", mes:"NotPermission"});
            }
        }else{
            dfd.reject({path:"CarManagementController.verify_CreatorReturnCard.StatusInvalid", mes:"StatusInvalid"});
        }
    },function(err){
        dfd.reject(err);
    })
    return dfd.promise;
}

function verify_ManagerReceiveCard(body){
    let dfd = q.defer();
    CarManagementService.loadDetails(body._service[0].dbname_prefix,body.code).then(function(ticketDetails){
        if(ticketDetails.status === STATUS_CAR.CREATOR_RETURNED_CARD ){
            if(body.session.rule.some(e => e.rule === RULE_CAR.CONFIRM)){
                dfd.resolve(ticketDetails);
            }else{
                dfd.reject({path:"CarManagementController.verify_ManagerReceiveCard.NotPermission", mes:"NotPermission"});
            }
        }else{
            dfd.reject({path:"CarManagementController.verify_ManagerReceiveCard.StatusInvalid", mes:"StatusInvalid"});
        }
    },function(err){
        dfd.reject(err);
    })
    return dfd.promise;
}

function verify_CreatorCancel(body){
    let dfd = q.defer();
    const statusesAllowedToCancel =[
        STATUS_CAR.CREATED,
        STATUS_CAR.LEADER_DEPARTMENT_APPROVED,
        STATUS_CAR.CONFIRMER_APPROVED,
        STATUS_CAR.LEAD_APPROVED_CAR,
        STATUS_CAR.LEAD_APPROVED_CARD,
    ]
    CarManagementService.loadDetails(body._service[0].dbname_prefix,body.code).then(function(ticketDetails){
        if(statusesAllowedToCancel.includes(ticketDetails.status)){
            if(body.username === ticketDetails.username){
                dfd.resolve(ticketDetails);
            }else{
                dfd.reject({path:"CarManagementController.verify_CreatorCancel.NotPermission", mes:"NotPermission"});
            }
        }else{
            dfd.reject({path:"CarManagementController.verify_CreatorCancel.StatusInvalid", mes:"StatusInvalid"});
        }
    },function(err){
        dfd.reject(err);
    })
    return dfd.promise;
} 

function verify_RequestCancel(body){
    let dfd = q.defer();
    const currentUser = body.session;
    const currentDepartment = currentUser.employee_details.department;

    CarManagementService.loadDetails(body._service[0].dbname_prefix, body.code).then(function(ticketDetail){
        // if(ticketDetail.status === STATUS_CAR){
        // }else{
        //     dfd.reject({path:"CarManagementController.verify_RequestCancel.StatusInvalid", mes:"StatusInvalid"});
        // }
        let nextStatus = null;
        let filterToNotify = null;

        if (ticketDetail.username === body.username) {
            // Trạng thái khi người tạo yêu cầu hủy
            nextStatus = STATUS_CAR.CREATED; 
            // filter tìm người tiếp theo nhận thông báo là TRƯỞNG ĐƠN VỊ
            filterToNotify = genFilterGetUsersByRuleAndDepartment(RULE_CAR.APPROVE_DEPARTMENT, ticketDetail.department);
        }
        else if (checkRuleRadioDepartment(currentUser.rule, ticketDetail.department, currentDepartment, RULE_CAR.APPROVE_DEPARTMENT)) {
            // Trạng thái khi trưởng đơn vị duyệt yêu cầu hủy
            nextStatus = STATUS_CAR.LEADER_DEPARTMENT_APPROVED;
            // filter tìm người tiếp theo nhận thông báo là QUẢN LÝ PHÒNG
            filterToNotify = genFilterGetUsersByRule(RULE_CAR.CONFIRM); 
        } 
        else if (checkRuleCheckBox(RULE_CAR.CONFIRM, currentUser)) {
            // Trạng thái khi người quản lý phòng yêu cầu hủy
            nextStatus = STATUS_CAR.CONFIRMER_APPROVED;
            // filter tìm người tiếp theo nhận thông báo là CHÁNH VĂN PHÒNG
            filterToNotify = genFilterGetUsersByRule(RULE_CAR.APPROVE_LEAD);
        }

        if (nextStatus && filterToNotify) {
            dfd.resolve({ ticketDetail, nextStatus, filterToNotify });
        } else {
            dfd.reject({ path: "CarManagementController.verify_RequestCancel.NotPermission", mes: "NotPermission" });
        }
    },function(err){
        dfd.reject(err);
    })
    return dfd.promise;
}

function verify_RejectRecall(body){
    let dfd = q.defer();
    const currentUser = body.session;
    const currentDepartment = currentUser.employee_details.department;

    CarManagementService.loadDetails(body._service[0].dbname_prefix, body.code).then(function(ticketDetail){
        dfd.resolve(ticketDetail);
        
    },function(err){
        dfd.reject(err);
    })
    return dfd.promise;
}

class CarManagementController {
    constructor() { }

    load(body) {
        const aggerationSearch = BuildFilterAggregate.generateUIFilterAggregate_search([], body);
        const aggerationSteps = BuildFilterAggregate.generatePermissionAggregate_ManageUI(body.username,body.tab, body.session.employee_details.department, body.session.rule, body.checks, aggerationSearch);
        const queryCriteria = { ...body };
        const filter = BuildFilterAggregate.generateUIFilterAggregate_load(aggerationSteps, queryCriteria,body.tab);
        return CarManagementService.executeAggregate(body._service[0].dbname_prefix, filter);
    }

    count(body) {
        const aggerationSearch = BuildFilterAggregate.generateUIFilterAggregate_search([], body);
        const aggerationSteps = BuildFilterAggregate.generatePermissionAggregate_ManageUI(body.username, CAR_TAB.MANAGEMENT,body.session.employee_details.department, body.session.rule, body.checks, aggerationSearch);
        const queryCriteria = { ...body };
        const filter = BuildFilterAggregate.generateUIFilterAggregate_count(aggerationSteps, queryCriteria);
        return CarManagementService.executeAggregate(body._service[0].dbname_prefix, filter);
    }

    loadDetail(body){
        const aggerationCode = [
            {
                $match:{
                    code: { $eq: body.code }
                }
            }
        ]
        const filter = BuildFilterAggregate.generateUIFilterAggregate_loadDetails(aggerationCode);
        return CarManagementService.executeAggregate(body._service[0].dbname_prefix, filter);
    }


    insert(req) {
        const dfd = q.defer();
        FileProvider.upload(req, nameLib, validation.insert, undefined, parentFolder, req.body.username)
            .then(function (res) {

                let data = genInsertEntity(res.Fields, req.body.username);

                let attachment = [];
                if (res.fileInfo.file) {
                    for (let i in res.fileInfo.file) {
                        if (!res.fileInfo.file[i].huge) {
                            attachment.push({
                                timePath: res.fileInfo.file[i].timePath,
                                locate: res.fileInfo.file[i].type,
                                display: res.fileInfo.file[i].filename,
                                name: res.fileInfo.file[i].named,
                                nameLib,
                                id: uuidv4()
                            });
                        }
                    }
                }
                data.attachment = attachment;
                CarManagementService.getCode(req.body._service[0].dbname_prefix, req.body.session.department_details.ordernumber).then(function (code) {
                    CarManagementService.insert(req.body._service[0].dbname_prefix, req.body.username,
                        data.starting_place, data.destination, data.destination_search, data.passenger, data.contact_passenger,
                        data.number_of_people, data.time_to_go, data.pick_up_time,
                        data.to_department, data.content, data.attachment, data.event, req.body.session.employee_details.department, code,
                        data.status, data.flow_status, data.title
                    ).then(function (data) {
                        dfd.resolve(data.ops[0]);
                        findAndNotifyApprover(req, data.ops[0]);
                    }, function (err) {
                        dfd.reject(err);
                    });
                }, function (err) { dfd.reject(err) })

            }, function (err) {
                console.log(err);
                dfd.reject({ path: "CarManagementController.insert.uploadfailed", err: "uploadfailed" })
            });
        return dfd.promise;
    }

    update(req) {
        const dfd = q.defer();
       
        FileProvider.upload(req, nameLib, validation.update, undefined, parentFolder, req.body.username)
            .then(function (res) {
                verify_Update(req.body, res.Fields.code).then(function(ticketDetails){
                    let data = genUpdateEntity(res.Fields, req.body.username);
                    
                    let attachment = [];
                    if (res.fileInfo.file) {
                        for (let i in res.fileInfo.file) {
                            if (!res.fileInfo.file[i].huge) {
                                attachment.push({
                                    timePath: res.fileInfo.file[i].timePath,
                                    locate: res.fileInfo.file[i].type,
                                    display: res.fileInfo.file[i].filename,
                                    name: res.fileInfo.file[i].named,
                                    nameLib,
                                    id: uuidv4()
                                });
                            }
                        }
                    }
                    data.attachment = ticketDetails.attachments.filter(item => !data.removed_attachments.includes(item.id)).concat(attachment);
                    CarManagementService.update(req.body._service[0].dbname_prefix, req.body.username, data.code,
                        data.starting_place, data.destination, data.passenger, data.contact_passenger,
                        data.number_of_people, data.time_to_go, data.pick_up_time,
                        data.to_department, data.content, data.title, data.attachment,
                        data.event
                    ).then(function () {
                        dfd.resolve(true);
                    }, function (err) { dfd.reject(err); })

                }, function(err){
                    dfd.reject(err);
                });
                
            }, function (err) {
                console.log(err);
                dfd.reject({ path: "CarManagementController.update.uploadfailed", err: "uploadfailed" })
            });
        return dfd.promise;
    }

    delete(body) {
        return CarManagementService.delete(body._service[0].dbname_prefix, body.username, body.id);
    }


    load_file_info(body) {
        let dfd = q.defer();

        CarManagementService.loadDetails(body._service[0].dbname_prefix,body.code).then(
            function (data) {
                const fileInfo = data.attachments.find((item) => item.name === body.filename);

                if (fileInfo) {
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
                        },
                        function (err) {
                            dfd.reject(err);
                        },
                    );
                } else {
                    dfd.reject({ path: "CarManagementController.load_file_info.FileIsNotExists", mes: "FileIsNotExists" });
                }
            },
            function (err) {
                dfd.reject(err);
            },
        );

        return dfd.promise;
    }

    load_file_invoice(body) {
        let dfd = q.defer();

        CarManagementService.loadDetails(body._service[0].dbname_prefix,body.code).then(
            function (data) {
                const fileInfo = data.invoices.find((item) => item.name === body.filename);

                if (fileInfo) {
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
                        },
                        function (err) {
                            dfd.reject(err);
                        },
                    );
                } else {
                    dfd.reject({ path: "CarManagementController.load_file_invoice.FileIsNotExists", mes: "FileIsNotExists" });
                }
            },
            function (err) {
                dfd.reject(err);
            },
        );

        return dfd.promise;
    }

    downloadfile(body) {
        let dfd = q.defer();
     
        CarManagementService.loadDetails_byid(body._service[0].dbname_prefix,body.id).then(
            function (data) {
               
                const checkFile = data.attachments.some((item) => item.name === body.filename);
                if (checkFile) {
                    const url = `${body._service[0].dbname_prefix}/${parentFolder}/${nameLib}/${data.username}/${body.filename}`;
                    FileProvider.download(url).then(
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
                    dfd.reject({ path: "CarManagementController.downloadfile.FileIsNotExists", mes: "FileIsNotExists" });
                }
            },
            function (err) {
                dfd.reject(err);
                body = undefined;
            },
        );

        return dfd.promise;
    }

    approve_department(req){
        let dfd = q.defer();
        const body = req.body;
        FileProvider.upload(req, nameLib, validation.approve_department, undefined, parentFolder, req.body.username)
            .then(function (res) {
                verify_ApproveDepartment(body, res.Fields.code).then(function(ticketDetails){
                    const data = genUpdateDepartmentEntity(res.Fields, body.username, ticketDetails);
                    let removedAttachmentIds = data.removed_attachments.map(item => item.id);
                    let attachment = [];
                    if (res.fileInfo.file) {
                        for (let i in res.fileInfo.file) {
                            if (!res.fileInfo.file[i].huge) {
                                attachment.push({
                                    timePath: res.fileInfo.file[i].timePath,
                                    locate: res.fileInfo.file[i].type,
                                    display: res.fileInfo.file[i].filename,
                                    name: res.fileInfo.file[i].named,
                                    nameLib,
                                    id: uuidv4()
                                });
                            }
                        }
                    }
                    data.attachment = attachment.concat(ticketDetails.attachments);
                    data.attachment = data.attachment.filter(item => !removedAttachmentIds.includes(item.id));

                    CarManagementService.deparment_approve(req.body._service[0].dbname_prefix, req.body.username, data.code,
                        data.starting_place, data.destination, data.passenger, data.contact_passenger,
                        data.number_of_people, data.time_to_go, data.pick_up_time,
                        data.to_department, data.content, data.title, data.attachment,
                        data.event, STATUS_CAR.LEADER_DEPARTMENT_APPROVED
                    ).then(function () {
                        dfd.resolve(true);
                        ticketDetails.status = STATUS_CAR.LEADER_DEPARTMENT_APPROVED;
                        findAndNotifyCarManagement(req, ticketDetails);
                    }, function (err) { dfd.reject(err); })

                },function(err){dfd.reject(err)})
            }, function (err) {
                console.log(err);
                dfd.reject({ path: "CarManagementController.approve_department.uploadfailed", err: "uploadfailed" })
            });
        return dfd.promise;
    }

    reject_department(req){
        let dfd = q.defer();
        const body = req.body;
        verify_ApproveDepartment(body, body.code).then(function(ticketDetails){
            CarManagementService.assess_department_level(body._service[0].dbname_prefix,body.username,body.code,
                STATUS_CAR.REJECTED,{
                    username: body.username,
                    time: new Date().getTime(),
                    action: CAR_FROM_ACTION.DEPARTMENT_REJECTED,
                    id: uuidv4(),
                    note: body.note
                }
            ).then(function(){
                dfd.resolve(true);
                ticketDetails.status = STATUS_CAR.REJECTED;
                findAndNotifyReject(req, ticketDetails, CAR_ACTION_NAME.REJECTED, CAR_FROM_ACTION.DEPARTMENT_REJECTED);
            },function(err){dfd.reject(err)});
        },function(err){
            dfd.reject(err);
        })
        return dfd.promise;
    }

    approve_car_management(req){
        let dfd = q.defer();
        const body = req.body;
        verify_ApproveCarManagement(body).then(function(ticketDetails){
            const data = genCarManagementEntity(body);
            CarManagementService.assess_car_management(body._service[0].dbname_prefix,body.username,body.code,
                STATUS_CAR.CONFIRMER_APPROVED,{
                    username: body.username,
                    time: new Date().getTime(),
                    action: CAR_FROM_ACTION.MANAGEMENT_CAR_APPROVED,
                    id: uuidv4(),
                    note: body.note
                },data.assign_card, data.card, data.car, data.driver
            ).then(function(){
                dfd.resolve(true);
                findAndNotifyLeadApprove(req, ticketDetails);
            },function(err){dfd.reject(err)});
        },function(err){
            dfd.reject(err);
        })
        return dfd.promise;
    }

    reject_car_management(req){
        let dfd = q.defer();
        const body = req.body;
        verify_ApproveCarManagement(body).then(function(ticketDetails){
            CarManagementService.assess_car_management(body._service[0].dbname_prefix,body.username,body.code,
                STATUS_CAR.REJECTED,{
                    username: body.username,
                    time: new Date().getTime(),
                    action: CAR_FROM_ACTION.MANAGEMENT_CAR_REJECTED,
                    id: uuidv4(),
                    note: body.note
                }
            ).then(function(){
                dfd.resolve(true);
                findAndNotifyReject(req, ticketDetails, CAR_ACTION_NAME.REJECTED, CAR_FROM_ACTION.MANAGEMENT_CAR_REJECTED);
            },function(err){dfd.reject(err)});
        },function(err){
            dfd.reject(err);
        })
        return dfd.promise;
    }

    approve_lead(req){
        let dfd = q.defer();
        const body = req.body;
        verify_ApproveLead(body).then(function(ticketDetails){
            const {rs, action} = genCarLeadEntity(body, ticketDetails);
            CarManagementService.assess_lead_level(body._service[0].dbname_prefix,body.username,body.code,
                STATUS_CAR.LEAD_APPROVED_CAR, rs.event, rs.assign_card, rs.card, rs.car, rs.driver
            ).then(function(){
                dfd.resolve(true);
                ticketDetails.status = STATUS_CAR.LEAD_APPROVED_CAR;
                findAndNotifyLeadExternal(req, ticketDetails, CAR_ACTION_NAME.NEED_TO_APPROVE, action);

            },function(err){dfd.reject(err)});
        },function(err){
            dfd.reject(err);
        })
        return dfd.promise;
    }

    reject_lead(req){
        let dfd = q.defer();
        const body = req.body;
        verify_ApproveLead(body).then(function(ticketDetails){
            CarManagementService.assess_lead_level(body._service[0].dbname_prefix,body.username,body.code,
                STATUS_CAR.REJECTED,{
                    username: body.username,
                    time: new Date().getTime(),
                    action: CAR_FROM_ACTION.LEAD_REJECTED,
                    id: uuidv4(),
                    note: body.note
                }
            ).then(function(){
                dfd.resolve(true);
                ticketDetails.status = STATUS_CAR.REJECTED;
                findAndNotifyReject(req, ticketDetails, CAR_ACTION_NAME.REJECTED, CAR_FROM_ACTION.LEAD_REJECTED);
            },function(err){dfd.reject(err)});
        },function(err){
            dfd.reject(err);
        })
        return dfd.promise;
    }

    approve_lead_external(req){
        let dfd = q.defer();
        const body = req.body;
        const action = CAR_FROM_ACTION.LEAD_EXTERNAL_APPROVED;
        verify_ApproveLeadExternal(body).then(function(ticketDetails){
            CarManagementService.assess_lead_external_level(body._service[0].dbname_prefix,body.username,body.code,
                STATUS_CAR.LEAD_EXTERNAL_APPROVED, {
                    username: body.username,
                    time: new Date().getTime(),
                    action: action,
                    id: uuidv4(),
                    note: body.note,
                }
            ).then(function(){
                dfd.resolve(true);
                ticketDetails.status = STATUS_CAR.LEAD_EXTERNAL_APPROVED;
                if(ticketDetails.assign_card){
                    CarManagementService.setStatusCardCredit(
                        body._service[0].dbname_prefix,
                        body.username,
                        ticketDetails.card,
                        CARD_CREDIT_STATUS.BUSY,{
                            username: body.username,
                            time: new Date().getTime(),
                            action: action,
                            id: uuidv4(),
                            note: body.note,
                            
                        },
                        ticketDetails.username,
                        ticketDetails.department,
                    );
                }
                const actionName = ticketDetails.assign_card ? CAR_ACTION_NAME.NEED_TO_APPROVE : CAR_ACTION_NAME.APPROVE;
                
                findAndNotifyCreatorApprove(req, ticketDetails, actionName, action);

            },function(err){dfd.reject(err)});
        },function(err){
            dfd.reject(err);
        })
        return dfd.promise;
    }

    reject_lead_external(req){
        let dfd = q.defer();
        const body = req.body;
        const action = CAR_FROM_ACTION.LEAD_EXTERNAL_REJECTED;
        verify_ApproveLeadExternal(body).then(function(ticketDetails){
            CarManagementService.assess_lead_external_level(body._service[0].dbname_prefix,body.username,body.code,
                STATUS_CAR.REJECTED, {
                    username: body.username,
                    time: new Date().getTime(),
                    action: action,
                    id: uuidv4(),
                    note: body.note,
                }
            ).then(function(){
                dfd.resolve(true);
                ticketDetails.status = STATUS_CAR.REJECTED;
                if(ticketDetails.assign_card){
                    CarManagementService.setStatusCardCredit(
                        body._service[0].dbname_prefix,
                        body.username,
                        ticketDetails.card,
                        CARD_CREDIT_STATUS.ACTIVE,{
                            username: body.username,
                            time: new Date().getTime(),
                            action: action,
                            id: uuidv4(),
                            note: body.note,
                        }
                    );
                }
                
                findAndNotifyReject(req, ticketDetails, CAR_ACTION_NAME.REJECTED, action);

            },function(err){dfd.reject(err)});
        },function(err){
            dfd.reject(err);
        })
        return dfd.promise;
    }

    creator_receive_card(req){
        let dfd = q.defer();
        const body = req.body;
        verify_CreatorReceiveCard(body).then(function(ticketDetails){
            CarManagementService.creator_receive_card(body._service[0].dbname_prefix,body.username,body.code,
                STATUS_CAR.CREATOR_RECEIVED_CARD,{
                    username: body.username,
                    time: new Date().getTime(),
                    action: CAR_FROM_ACTION.CREATOR_RECEIVED_CARD,
                    id: uuidv4(),
                    note: body.note
                }
            ).then(function(){
                dfd.resolve(true);
                ticketDetails.status = STATUS_CAR.CREATOR_RECEIVED_CARD;
                findAndNotifyManagementCard(req, ticketDetails, CAR_ACTION_NAME.NEED_TO_APPROVE, CAR_FROM_ACTION.CREATOR_RECEIVED_CARD);
            },function(err){dfd.reject(err)});
        },function(err){
            dfd.reject(err);
        })
        return dfd.promise;
    }

    creator_return_card(req){
        const dfd = q.defer();        
        FileProvider.upload(req, nameLib, validation.creator_return_card, undefined, parentFolder, req.body.username)
            .then(function (res) {
                verify_CreatorReturnCard(req,res).then(function(ticketDetails){ 
                    let data = genCreatorReturnCardEntity(res.Fields, req.body.username);
                    let invoices = [];
                    if (res.fileInfo.invoices) {
                        for (let i in res.fileInfo.invoices) {
                            if (!res.fileInfo.invoices[i].huge) {
                                invoices.push({
                                    timePath: res.fileInfo.invoices[i].timePath,
                                    locate: res.fileInfo.invoices[i].type,
                                    display: res.fileInfo.invoices[i].filename,
                                    name: res.fileInfo.invoices[i].named,
                                    nameLib,
                                    id: uuidv4()
                                });
                            }
                        }
                    }
                    data.invoices = invoices;
                    CarManagementService.creator_return_card(
                        req.body._service[0].dbname_prefix,
                        req.body.username,
                        data.code,
                        STATUS_CAR.CREATOR_RETURNED_CARD,
                        data.invoices,
                        data.money,
                        data.number_km,
                        data.event
                    ).then(function () {
                        dfd.resolve(true);
                        ticketDetails.status = STATUS_CAR.CREATOR_RETURNED_CARD;
                        findAndNotifyManagementCard(req, ticketDetails, CAR_ACTION_NAME.NEED_TO_APPROVE, CAR_FROM_ACTION.CREATOR_RETURNED_CARD);
                    }, function (err) {
                        dfd.reject(err);
                    });
                },function(err){
                    dfd.reject(err);
                })

            }, function (err) {
                console.log(err);
                dfd.reject({ path: "CarManagementController.insert.uploadfailed", err: "uploadfailed" })
            });
            
        return dfd.promise;
    }

    manager_receive_card(req){
        let dfd = q.defer();
        const body = req.body;
        verify_ManagerReceiveCard(body).then(function(ticketDetails){
            CarManagementService.manager_receive_card(body._service[0].dbname_prefix,body.username,body.code,
                STATUS_CAR.MANAGER_RECEIVED_CARD,{
                    username: body.username,
                    time: new Date().getTime(),
                    action: CAR_FROM_ACTION.MANAGEMENT_RECEIVED_CARD,
                    id: uuidv4(),
                    note: body.note
                }
            ).then(function(){
                dfd.resolve(true);
                CarManagementService.setStatusCardCredit(
                    body._service[0].dbname_prefix,
                    body.username,
                    ticketDetails.card,
                    CARD_CREDIT_STATUS.ACTIVE,{
                        username: body.username,
                        time: new Date().getTime(),
                        action: CAR_FROM_ACTION.MANAGEMENT_RECEIVED_CARD,
                        id: uuidv4(),
                        note: body.note,
                    }
                );
                ticketDetails.status = STATUS_CAR.MANAGER_RECEIVED_CARD;
                findAndNotifyDepartmentCreator(req, ticketDetails, CAR_ACTION_NAME.NEED_TO_APPROVE, CAR_FROM_ACTION.MANAGEMENT_RECEIVED_CARD)
            },function(err){dfd.reject(err)});
        },function(err){
            dfd.reject(err);
        })
        return dfd.promise;
    }

    creator_cancel(body){
        let dfd = q.defer();
        verify_CreatorCancel(body).then(function(ticketDetail){
            CarManagementService.creator_cancel(
                body._service[0].dbname_prefix,
                body.username,
                body.code,
                STATUS_CAR.CANCELLED,{
                    username: body.username,
                    time: new Date().getTime(),
                    action: CAR_FROM_ACTION.CREATOR_CANCEL,
                    id: uuidv4(),
                    note: body.note
                }
            ).then(function(){
                dfd.resolve(true);

                if(ticketDetail.status === STATUS_CAR.LEAD_APPROVED_CARD){
                    CarManagementService.setStatusCardCredit(
                        body._service[0].dbname_prefix,
                        body.username,
                        ticketDetail.card,
                        CARD_CREDIT_STATUS.ACTIVE,{
                            username: body.username,
                            time: new Date().getTime(),
                            action: CAR_FROM_ACTION.CREATOR_CANCEL,
                            id: uuidv4(),
                            note: body.note,
                        }
                    );
                }
                ticketDetail.status = STATUS_CAR.CANCELLED;
                findAndNotifyReject(req, ticketDetail, CAR_ACTION_NAME.CREATOR_CANCEL,CAR_FROM_ACTION.CREATOR_CANCEL);
            },function(err){dfd.reject(err)});
        },function(err){
            dfd.reject(err);
        })
        return dfd.promise;
    }

    export_excel(body) {
        let dfd = q.defer();
        const languageCurrent = body.session.language.current;
        const aggerationSearch = BuildFilterAggregate.generateUIFilterAggregate_search([], body);

        // aggerationSearch.push({
        //     $match: {
        //         $and: [
        //             { status: STATUS_CAR.LEAD_EXTERNAL_APPROVED },
        //             { assign_card: false }
        //         ]
        //     }
        // })
        const aggerationSteps = BuildFilterAggregate.generatePermissionAggregate_ManageUI(body.username, CAR_TAB.CALENDAR, body.session.employee_details.department, body.session.rule, body.checks, aggerationSearch);
        const queryCriteria = { ...body };
        const filter = BuildFilterAggregate.generateUIFilterAggregate_export_excel(aggerationSteps, queryCriteria, CAR_TAB.CALENDAR);
        const now = new Date();
        const todayDay = now.getDate().toString().padStart(2, '0');
        const todayMonth = (now.getMonth() + 1).toString().padStart(2, '0');
        const todayYear = now.getFullYear().toString();
        CarManagementService.executeAggregate(body._service[0].dbname_prefix, filter).then(function(events){
            let dfdAr = [];
            dfdAr.push(loadUserExportExcel(events, body));
            dfdAr.push(loadCarExportExcel(events, body));
            dfdAr.push(loadCardExportExcel(events, body));
            dfdAr.push(loadLocationExportExcel(events, body));
            q.all(dfdAr).then(()=>{              
                const calendarDates = genDataCalendar(events, body);
                const row = [];
                var firstDayMonth = getDayMonthFullTextDate(body.from_date);
                var lastDayMonth = getDayMonthFullTextDate(body.to_date);

                for (let i = 0; i < 10; i++) {
                    row.push(new Array(12).fill(''));
                }

                row[0][0] = 'TRƯỜNG ĐẠI HỌC Y KHOA';
                row[1][0] = 'PHẠM NGỌC THẠCH';
                row[2][0] = 'VĂN PHÒNG TRƯỜNG';
                row[4][0] = 'Số: .../TB-VPT';
                row[6][3] = 'THÔNG BÁO';
                row[7][3] = 'Lịch sử dụng ô tô cơ quan';
                row[8][3] = `(Tuần ${getWeekNumber(body.from_date)} từ ngày ${firstDayMonth} đến ngày ${lastDayMonth})`;
                row[0][8] = 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM';
                row[1][8] = 'Độc lập - Tự do - Hạnh phúc';
                row[4][8] = `Thành phố Hồ Chí Minh, ngày ${todayDay} tháng ${todayMonth} năm ${todayYear}`;
                const headerRow = [
                    'STT', 
                    filterLanguage('Time',languageCurrent),
                    filterLanguage('Time',languageCurrent),
                    filterLanguage('Time',languageCurrent),
                    filterLanguage('Content',languageCurrent),
                    filterLanguage('Passenger',languageCurrent),
                    filterLanguage('ParticipateDepartments',languageCurrent),
                    filterLanguage('Starting place',languageCurrent),
                    filterLanguage('Destination',languageCurrent),
                    filterLanguage('Car',languageCurrent),
                    filterLanguage('Driver',languageCurrent),
                    filterLanguage('Department proposed',languageCurrent),
                ];
                const headerRow2 = [
                    '',
                    filterLanguage('DayEvent',languageCurrent),
                    filterLanguage('Time to go',languageCurrent),
                    filterLanguage('Pick up time',languageCurrent),
                    '',
                    '',
                    '',
                    '',
                    '',
                    '',
                    '',
                    '',
                ];

                const headerMerges = [
                    { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
                    { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } },
                    { s: { r: 2, c: 0 }, e: { r: 2, c: 1 } },
                    { s: { r: 4, c: 0 }, e: { r: 4, c: 1 } },

                    { s: { r: 6, c: 3 }, e: { r: 6, c: 7 } },
                    { s: { r: 7, c: 3 }, e: { r: 7, c: 7 } },
                    { s: { r: 8, c: 3 }, e: { r: 8, c: 7 } },

                    { s: { r: 10, c: 1 }, e: { r: 10, c: 2 } },

                    { s: { r: 0, c: 8 }, e: { r: 0, c: 11 } },
                    { s: { r: 1, c: 8 }, e: { r: 1, c: 11 } },
                    { s: { r: 4, c: 8 }, e: { r: 4, c: 11 } },
                ];

                for (let i = 0; i < headerRow.length; i++) {
                    if (i !== 1 && i !== 2) {
                        headerMerges.push({ s: { r: 10, c: i }, e: { r: 11, c: i } });
                    }
                }

                row.push(headerRow);
                row.push(headerRow2);

                let stt = 1;
                calendarDates.forEach(day => {
                    if(day.events.length < 1){
                        row.push( [stt, `${filterLanguage(day.weekDay,languageCurrent)} \n ${formatTimestamp(day.value)}`, '', '', '', '', '', '', '', '', '', '']);
                        stt++;
                    }else{
                        day.events.forEach(d =>{
                            row.push([
                                stt,
                                `${filterLanguage(day.weekDay,languageCurrent)} \n ${formatTimestamp(day.value)}`,
                                d.start_time_event,
                                d.end_time_event,
                                d.content,
                                d.passenger.join('\n'),
                                d.to_department_titles.map(title => title[languageCurrent]).join('\n'),
                                d.starting_place,
                                d.destination,
                                d.assign_card ? d.card : d.car,
                                d.driver_detail ? d.driver_detail.fullname : '',
                                d.department_title[languageCurrent]
                            ]);
                        stt++;
                        })
                    }
                });


                const mergedCells = [];
                let dem = 2;
                calendarDates.forEach((day,index) => {
                    if(day.events.length > 0){
                        mergedCells.push(
                            { s: { r: index + dem + 10, c: 1 }, e: { r: index + dem + day.events.length - 1 +10, c: 1 } }
                        )
                        dem += day.events.length-1;
                    }
                });

                const wb = XLSX.utils.book_new();
                    const ws = XLSX.utils.aoa_to_sheet(row);
                    const borderStyle = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };

                    ws['!cols'] = [
                        {wch: 10},  // Cột A độ rộng 10 ký tự
                        {wch: 20},  // Cột B độ rộng 20 ký tự
                        {wch: 20},  // Cột B độ rộng 20 ký tự
                        {wch: 20},  // Cột B độ rộng 20 ký tự
                        {wch: 20},  // Cột B độ rộng 20 ký tự
                        {wch: 20},  // Cột B độ rộng 20 ký tự
                        {wch: 20},  // Cột B độ rộng 20 ký tự
                        {wch: 20},  // Cột B độ rộng 20 ký tự
                        {wch: 20},  // Cột B độ rộng 20 ký tự
                        {wch: 20},  // Cột B độ rộng 20 ký tự
                        {wch: 20},  // Cột B độ rộng 20 ký tự
                        {wch: 20},  // Cột B độ rộng 20 ký tự
                    ];
                
                    // ws['!cols'] = ws['!cols'].concat(new Array(rooms.length).fill({wch: 20}))

                    const headerStyle = {
                        font: {
                            bold: true,
                            sz: 14
                        },
                        alignment: {
                            horizontal: 'center',
                            vertical: 'center',
                            wrapText: true
                        },
                        border: borderStyle
                    };
                    
                    const noBorderStyle = {
                        top: null,
                        bottom: null,
                        left: null,
                        right: null
                    };

                    const range = XLSX.utils.decode_range(ws['!ref']);
                    if (!ws['!rows']) ws['!rows'] = [];
                    for (let R = range.s.r; R <= range.e.r; ++R) {
                        for (let C = range.s.c; C <= range.e.c; ++C) {
                            const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                            if (!ws[cellAddress]) ws[cellAddress] = {};
                            ws[cellAddress].s = ws[cellAddress].s || {};
                            if (R < 10 ) {
                                ws[cellAddress].s.border = noBorderStyle;
                                ws[cellAddress].s.fill = { fgColor: { rgb: "FFFFFF" } };
                                ws[cellAddress].s.alignment = {
                                    horizontal: 'center',
                                    vertical: 'center',
                                    wrapText: true
                                };
                                if (ws[cellAddress].v) {
                                    ws[cellAddress].s.font = { bold: true, sz: 14 };
                                }
                            } else {
                                if (R === 10 || R === 11) {
                                    ws[cellAddress].s = { ...ws[cellAddress].s, ...headerStyle };
                                } else {
                                    ws['!rows'][R] = { hpx: 35 };

                                    ws[cellAddress].s.border = borderStyle;

                                    ws[cellAddress].s.alignment = {
                                        horizontal: 'center',
                                        vertical: 'center',
                                        wrapText: true
                                    };
                                    ws[cellAddress].s.font = { sz: 11 };
                                }
                            }
                        }
                    }
                    
                    ws['!merges'] = headerMerges.concat(mergedCells);
                    XLSX.utils.book_append_sheet(wb, ws, "Car Management Data");
                    
                    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
                    dfd.resolve(excelBuffer);
            }, function (err) { dfd.reject(err); });
        }, function(error){
            dfd.reject(error);
        });
        return dfd.promise;
    }

    /** LUỒNG RECALL: YÊU CẦU HỦY, PHÊ DUYỆT HỦY, TỪ CHỐI HỦY */

    // GỬI YÊU CẦU HỦY: người tạo, Trưởng đơn vị, Quản lý xe được phép gửi yêu cầu hủy
    request_cancel(req) {
        let dfd = q.defer();
        const body = req.body;
        const flow = STATUS_FLOW.RECALL;
        verify_RequestCancel(body).then(function({ ticketDetail, nextStatus, filterToNotify }){
            const event = {
                username: body.username,
                time: new Date().getTime(),
                action: CAR_FROM_ACTION.REQUEST_CANCEL,
                id: uuidv4(),
                note: body.note
            }
            CarManagementService.request_cancel(
                req.body._service[0].dbname_prefix,
                req.body.username, ticketDetail._id,
                nextStatus, flow, event
            ).then(function(){
                dfd.resolve(true);

                ticketDetail.status = nextStatus;
                notify(req, filterToNotify, CAR_ACTION_NAME.REQUEST_CANCEL, {
                    code: ticketDetail.code,
                    title: ticketDetail.title,
                    username_create_ticket: ticketDetail.username,
                    status: ticketDetail.status,
                    action_by: req.body.username
                }, CAR_FROM_ACTION.REQUEST_CANCEL);
            },function(err){
                dfd.reject(err);
            })

        },function(err) { dfd.reject(err); })
        return dfd.promise;
    }

    // DUYỆT YÊU CẦU HỦY (TRƯỞNG ĐƠN VỊ DUYỆT)
    approve_recall_department(req){
        let dfd = q.defer();
        const body = req.body;
        verify_ApproveDepartment(body, body.code).then(function(ticketDetail){
            CarManagementService.assess_recall(
                req.body._service[0].dbname_prefix,
                req.body.username, ticketDetail.code,
                STATUS_CAR.LEADER_DEPARTMENT_APPROVED,{
                    username: body.username,
                    time: new Date().getTime(),
                    action: CAR_FROM_ACTION.DEPARTMENT_APPROVE_RECALL,
                    id: uuidv4(),
                    note: body.note
                }
            ).then(function(){
                dfd.resolve(true);
                ticketDetail.status = STATUS_CAR.LEADER_DEPARTMENT_APPROVED;
                findAndNotifyManagement(req, ticketDetail, CAR_ACTION_NAME.APPROVE_RECALL, CAR_FROM_ACTION.DEPARTMENT_APPROVE_RECALL);
            },function(err){
                dfd.reject(err);
            })

        },function(err) { dfd.reject(err); })
        return dfd.promise;
    }

    // reject_recall_department(req){
    //     let dfd = q.defer();
    //     const body = req.body;
    //     verify_ApproveDepartment(body, body.id).then(function(ticketDetail){
    //         MeetingRoomService.reject_recall(
    //             req.body._service[0].dbname_prefix,
    //             req.body.username, ticketDetail._id,
    //             MEETING_ROOM_SCHEDULE_STATUS.APPROVED, MEETING_ROOM_SCHEDULE_FLOW.APPROVE,{
    //                 username: body.username,
    //                 time: new Date().getTime(),
    //                 action: MEETING_ROOM_FROM_ACTION.REJECT_RECALL_DEPARTMENT,
    //                 id: uuidv4(),
    //                 note: body.note
    //             }
    //         ).then(function(){
    //             dfd.resolve(true);
    //             ticketDetail.status = MEETING_ROOM_SCHEDULE_STATUS.REJECTED;
    //             findAndNotifyReject(req, ticketDetail, MEETING_ROOM_ACTION_NAME.REJECT_RECALL, MEETING_ROOM_FROM_ACTION.REJECT_RECALL_DEPARTMENT);
    //         },function(err){
    //             dfd.reject(err);
    //         })

    //     },function(err) { dfd.reject(err);})
    //     return dfd.promise;
    // }

    // DUYỆT YÊU CẦU HỦY (QUẢN LÝ XE DUYỆT)
    approve_recall_management(req) {
        let dfd = q.defer();
        const body = req.body;
        verify_ApproveCarManagement(body).then(function(ticketDetail){
            CarManagementService.assess_recall(
                req.body._service[0].dbname_prefix,
                req.body.username, ticketDetail.code,
                STATUS_CAR.CONFIRMER_APPROVED,{
                    username: body.username,
                    time: new Date().getTime(),
                    action: CAR_FROM_ACTION.MANAGEMENT_APPROVE_RECALL,
                    id: uuidv4(),
                    note: body.note
                }
            ).then(function(){
                dfd.resolve(true);
                ticketDetail.status = STATUS_CAR.CONFIRMER_APPROVED;
                findAndNotifyLead(req, ticketDetail, CAR_ACTION_NAME.APPROVE_RECALL, CAR_FROM_ACTION.MANAGEMENT_APPROVE_RECALL);
            },function(err){
                dfd.reject(err);
            })

        },function(err) { dfd.reject(err); })
        return dfd.promise;
    }

    // reject_recall_management(req) {
    //     let dfd = q.defer();
    //     const body = req.body;
    //     verify_ApproveManagement(body).then(function(ticketDetail){
    //         MeetingRoomService.reject_recall(
    //             req.body._service[0].dbname_prefix,
    //             req.body.username, ticketDetail._id,
    //             MEETING_ROOM_SCHEDULE_STATUS.APPROVED, MEETING_ROOM_SCHEDULE_FLOW.APPROVE,{
    //                 username: body.username,
    //                 time: new Date().getTime(),
    //                 action: MEETING_ROOM_FROM_ACTION.REJECT_RECALL_MANAGEMENT,
    //                 id: uuidv4(),
    //                 note: body.note
    //             }
    //         ).then(function(){
    //             dfd.resolve(true);
    //             ticketDetail.status = MEETING_ROOM_SCHEDULE_STATUS.REJECTED;
    //             findAndNotifyReject(req, ticketDetail, MEETING_ROOM_ACTION_NAME.REJECT_RECALL, MEETING_ROOM_FROM_ACTION.REJECT_RECALL_MANAGEMENT);
    //         },function(err){
    //             dfd.reject(err);
    //         })

    //     },function(err) { dfd.reject(err);})
    //     return dfd.promise;
    // }

    // DUYỆT YÊU CẦU HỦY (CHÁNH VĂN PHÒNG DUYỆT)
    approve_recall_lead(req) {
        let dfd = q.defer();
        const body = req.body;
        verify_ApproveLead(body).then(function(ticketDetail){
            CarManagementService.assess_recall(
                req.body._service[0].dbname_prefix,
                req.body.username, ticketDetail.code,
                STATUS_CAR.RECALLED,{
                    username: body.username,
                    time: new Date().getTime(),
                    action: CAR_FROM_ACTION.LEAD_APPROVE_RECALL,
                    id: uuidv4(),
                    note: body.note
                }
            ).then(function(){
                dfd.resolve(true);
                ticketDetail.status = STATUS_CAR.RECALLED;
                findAndNotifyAllActors(req, ticketDetail, STATUS_CAR.RECALLED);
            },function(err){
                dfd.reject(err);
            })

        },function(err) { dfd.reject(err); })
        return dfd.promise;
    }

    // reject_recall_lead(req) {
    //     let dfd = q.defer();
    //     const body = req.body;
    //     verify_ApproveLead(body).then(function(ticketDetail){
    //         MeetingRoomService.reject_recall(
    //             req.body._service[0].dbname_prefix,
    //             req.body.username, ticketDetail._id,
    //             MEETING_ROOM_SCHEDULE_STATUS.APPROVED, MEETING_ROOM_SCHEDULE_FLOW.APPROVE,{
    //                 username: body.username,
    //                 time: new Date().getTime(),
    //                 action: MEETING_ROOM_FROM_ACTION.REJECT_RECALL_LEAD,
    //                 id: uuidv4(),
    //                 note: body.note
    //             }
    //         ).then(function(){
    //             dfd.resolve(true);
    //             ticketDetail.status = MEETING_ROOM_SCHEDULE_STATUS.REJECTED;
    //             findAndNotifyReject(req, ticketDetail, MEETING_ROOM_ACTION_NAME.REJECT_RECALL, MEETING_ROOM_FROM_ACTION.REJECT_RECALL_LEAD);
    //         },function(err){
    //             dfd.reject(err);
    //         })

    //     },function(err) { dfd.reject(err);})
    //     return dfd.promise;
    // }

    reject_recall(req) {
        let dfd = q.defer();
        const body = req.body;

        verify_RejectRecall(body).then(function(ticketDetail){
            const event = {
                username: body.username,
                time: new Date().getTime(),
                action: CAR_FROM_ACTION.REJECT_RECALL,
                id: uuidv4(),
                note: body.note
            }
            CarManagementService.reject_recall(
                req.body._service[0].dbname_prefix,
                req.body.username, body.code,
                STATUS_CAR.LEAD_EXTERNAL_APPROVED, STATUS_FLOW.REGISTER, event
            ).then(function(){
                dfd.resolve(true);
    
                RingBellItemService.insert(
                    req.body._service[0].dbname_prefix,
                    req.body.username,
                    CAR_ACTION_NAME.REJECT_RECALL,
                    {
                        code: ticketDetail.code,
                        title: ticketDetail.title,
                        username_create_ticket: ticketDetail.username,
                        status: ticketDetail.status,
                        action_by: req.body.username
                    },
                    [ticketDetail.username],
                    [],
                    CAR_FROM_ACTION.REJECT_RECALL,
                    new Date().getTime()
                );

            },function(err){
                dfd.reject(err);
            })

        },function(err) { dfd.reject(err); })
        return dfd.promise;
    }
}

function genDataCalendar(events, body){
    events = events.map(event =>{
        return {
            ...event,
            start_date: event.time_to_go*1,
            end_date: event.pick_up_time*1,
            start_date_text: new Date(event.time_to_go*1),
            end_date_text: new Date (event.pick_up_time*1),
        }
    });
    const from_date = new Date(body.from_date);
    const to_date = new Date(body.to_date);
    return generateCalendar(from_date, to_date, events);
}

function loadUserExportExcel(events,body){
    let dfd = q.defer();
    const users = events.reduce((acc, current) => {
        return acc.concat(current.passenger);
    }, []);
    const filterUsers = {
        $match: { username: {$in: users } }
    }
    UserService.loadUser(body._service[0].dbname_prefix, filterUsers).then(users =>{
        const userTitles = {};
        users.forEach(user =>{
            userTitles[user.username] = user.title;
        })
        events = events.forEach(event => {
            event.passenger = event.passenger.map(item => userTitles[item]);
        });
        dfd.resolve(userTitles);
    });
    return dfd.promise;
}

function loadCarExportExcel(events, body){
    let dfd = q.defer();
    const languageCurrent = body.session.language.current;
    const cars = events.map(event =>event.car);
    DirectoryService.loadCar(body._service[0].dbname_prefix, cars).then(carTitles =>{
        events.forEach(event => {
            const car = carTitles.find(car => car.value === event.car);
            if(car){
                event.car = car.title[languageCurrent]
            }
        })
        dfd.resolve(carTitles);
    });
    return dfd.promise;
}

function loadCardExportExcel(events, body){
    let dfd = q.defer();
    const languageCurrent = body.session.language.current;
    const cards = events.map(event => event.card);
    DirectoryService.loadCard(body._service[0].dbname_prefix, cards).then(cardTitles =>{
        events.forEach(event => {
            const card = cardTitles.find(card => card.value === event.card);
            if(card){
                event.card = card.title[languageCurrent]
            }
        })
        dfd.resolve(cardTitles);
    });
    return dfd.promise;
}

function loadCardExportExcel(events, body){
    let dfd = q.defer();
    const languageCurrent = body.session.language.current;
    const cards = events.map(event => event.card);
    DirectoryService.loadCard(body._service[0].dbname_prefix, cards).then(cardTitles =>{
        events.forEach(event => {
            const card = cardTitles.find(card => card.value === event.card);
            if(card){
                event.card = card.title[languageCurrent]
            }
        })
        dfd.resolve(cardTitles);
    });
    return dfd.promise;
}

function loadLocationExportExcel(events, body){
    let dfd = q.defer();
    const languageCurrent = body.session.language.current;
    const starting_places = events.map(event => event.starting_place);
    DirectoryService.loadLocation(body._service[0].dbname_prefix, starting_places).then(locations =>{
        events.forEach(event => {
            const starting_place = locations.find(location => location.value === event.starting_place);
            if(starting_place){
                event.starting_place = starting_place.title[languageCurrent]
            }
        })
        dfd.resolve(locations);
    });
    return dfd.promise;
}

function getDayMonthFullTextDate(value) {
    var date = new Date(value);
    var day = date.getDate().toString().padStart(2, '0');
    var month = (date.getMonth() + 1).toString().padStart(2, '0');
    var year = (date.getFullYear()).toString();
    return [day, month, year].join('/');
}

function findAndNotifyManagement(req, item, action, from_action) {
    const filter = genFilterGetUsersByRule(RULE_CAR.CONFIRM);
    
    notify(req, filter, action,{
        code: item.code,
        title: item.title,
        username_create_ticket: item.username,
        status: item.status,
        action_by: req.body.username
    }, from_action);
    
}

function findAndNotifyLead(req, item, action, from_action) {
    const filter = genFilterGetUsersByRule(RULE_CAR.APPROVE_LEAD);
    
    notify(req, filter, action,{
        code: item.code,
        title: item.title,
        username_create_ticket: item.username,
        status: item.status,
        roomType: item.type,
        action_by: req.body.username
    }, from_action);
    
}

function findAndNotifyAllActors(req, item, status){
    const filter1 = genFilterGetUsersByRuleAndDepartment(RULE_CAR.APPROVE_DEPARTMENT, item.department); // tìm trưởng đơn vị duyệt
    const filter2 = genFilterGetUsersByRuleAndDepartment(RULE_CAR.NOTIFY_DEPARTMENT, item.to_department); // tìm người nhận thông báo đại diện phòng ban

    q.all([
        UserService.loadUser(req.body._service[0].dbname_prefix, filter1),
        UserService.loadUser(req.body._service[0].dbname_prefix, filter2)
    ]).then(([usersFromFilter1, usersFromFilter2]) => {
        const usersInApprovedNotify = [
            ...new Set([
                item.username, // Người tạo
                ...usersFromFilter1.map(user => user.username) // Trưởng đơn vị duyệt
            ])
        ]; 
        
        const usersInLetterNotify = [
            ...new Set([
                item.driver, // Tài xế
                ...item.passenger, // Người chủ trì
                ...item.contact_passenger, // Người tham dự
                ...usersFromFilter2.map(user => user.username) // Người đại diện phòng ban
            ])
        ];

        RingBellItemService.insert(
            req.body._service[0].dbname_prefix,
            req.body.username,
            CAR_ACTION_NAME.APPROVE_RECALL,
            {
                code: item.code,
                title: item.title,
                username_create_ticket: item.username,
                status: item.status,
            },
            usersInApprovedNotify,
            [],
            CAR_FROM_ACTION.LEAD_APPROVED,
            new Date().getTime()
        );

        // thông báo cho những người tham gia
        RingBellItemService.insert(
            req.body._service[0].dbname_prefix,
            req.body.username,
            'car_registration_letter',
            {
                code: item.code,
                title: item.title,
                username_create_ticket: item.username,
                status: item.status,
            },
            usersInLetterNotify,
            [],
            CAR_FROM_ACTION.LEAD_APPROVED,
            new Date().getTime()
        );
    }).catch(err => {
        console.error('Error fetching users:', err);
    });
}

exports.CarManagementController = new CarManagementController();
