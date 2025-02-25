const q = require("q");
const { NotifyService, TaskService, UserService } = require("./service");
const { FileProvider } = require("../../../shared/file/file.provider");
const { validation } = require("./validation");
const { gcpProvider } = require("../../../shared/store/gcp/gcp.provider");
const { FileConst } = require("../../../shared/file/file.const");
const { BuildFilterAggregate } = require('./utility');
const nameLib = "notify";

const parentFolder = "office";

const folderArray = ["office"];
const { getValidValue, genFilterRuleUser } = require("../../../utils/util");
const { NOTIFY_SCOPE, NOTIFY_STATUS, NOTIFY_RULE, NOTIFY_BELL_MODAL, NOTIFY_TYPE } = require("./const");
const { RingBellItemService } = require("@app/management/ringbell_item/service");
const { checkRuleRadioDepartment , checkRuleCheckBox} = require("@utils/ruleUtils");
const BaseError = require("@shared/error/BaseError");

function sendRingBellInternal(body, notify){
    const d = new Date().getTime();

    const toCreator = notify.username;
    const toNotifier = notify.to_user;

    // Thông báo cho người tạo
    RingBellItemService.insert(
        body._service[0].dbname_prefix,
        body.username,
        NOTIFY_BELL_MODAL.APPROVED,
        {
            code: notify.code,
            title: notify.title,
            scope: notify.scope,
            created_by: notify.username,
            status: notify.status,
            action_by: body.username,
            department: notify.department
        },
        [toCreator],
        [],
        notify.status,
        d,
        []
    );

    // Thông báo cho người cần thông báo
    RingBellItemService.insert(
        body._service[0].dbname_prefix,
        body.username,
        NOTIFY_BELL_MODAL.APPROVED_TO_USER,
        {
            code: notify.code,
            title: notify.title,
            scope: notify.scope,
            created_by: notify.username,
            status: notify.status,
            action_by: body.username,
            department: notify.department
        },
        toNotifier,
        [],
        notify.status,
        d,
        []
    );
}

function getStatusApproveByNotify(notify) {
    if (notify.scope === NOTIFY_SCOPE.INTERNAL) {
        switch (notify.status) {
            //APPROVED
            case NOTIFY_STATUS.PENDING:
                return NOTIFY_STATUS.APPROVED;
                
            //RECALLED
            case NOTIFY_STATUS.PENDING_RECALLED:
                return NOTIFY_STATUS.RECALLED;

            default:
                return notify.status;
        }
    } else if (notify.scope === NOTIFY_SCOPE.EXTERNAL) {
        switch (notify.status) {
            //APPROVED
            case NOTIFY_STATUS.PENDING:
                return NOTIFY_STATUS.APPROVED_BY_DEPARTMENT_LEADER;
            case NOTIFY_STATUS.APPROVED_BY_DEPARTMENT_LEADER:
                return NOTIFY_STATUS.APPROVED_LEAD_EXTERNAL;
            case NOTIFY_STATUS.APPROVED_LEAD_EXTERNAL:
                return NOTIFY_STATUS.APPROVED;

            //RECALLED
            case NOTIFY_STATUS.PENDING_RECALLED:
                return NOTIFY_STATUS.APPROVED_RECALL_BY_DEPARTMENT_LEADER;
            case NOTIFY_STATUS.APPROVED_RECALL_BY_DEPARTMENT_LEADER:
                return NOTIFY_STATUS.RECALLED;
            // case NOTIFY_STATUS.APPROVED_RECALL_BY_DEPARTMENT_LEADER:
            //     return NOTIFY_STATUS.APPROVED_RECALL_BY_LEAD;
            // case NOTIFY_STATUS.APPROVED_RECALL_BY_LEAD:
            //     return NOTIFY_STATUS.RECALLED;

            default:
                return notify.status;
        }
    }
    return notify.status;
}

function sendRingBellReject(body, rejectedNotify) {
    sendRingBellDepartmentCreate(body, rejectedNotify, NOTIFY_BELL_MODAL.REJECTED, "rejectNotify")
}

function checkRuleToApproveNotify(user, notify) {
    const findApprovalRule = (ruleType) => user.rule.find((rule) => rule.rule === ruleType);
    const checkApprovalCheckbox = (approvalRule) => {
        return approvalRule
    };
    
    const checkApproval = (approvalRule, department) => {
        switch (approvalRule.details.type) {
            case "All":
                return true;
            case "None":
                return false;
            case "Specific":
                return approvalRule.details.department.includes(department);
            case "Working":
                return department === user.department;
            default:
                return false;
        }
    };

    if (notify.scope === NOTIFY_SCOPE.INTERNAL) {
        const approveNotifyRuleLevel_2 = findApprovalRule(NOTIFY_RULE.APPROVE_DEPARTMENT);
        return approveNotifyRuleLevel_2 ? checkApproval(approveNotifyRuleLevel_2, notify.department) : false;
    } else if (notify.scope === NOTIFY_SCOPE.EXTERNAL) {
        if (
            [
                NOTIFY_STATUS.APPROVED_BY_DEPARTMENT_LEADER,
                NOTIFY_STATUS.APPROVED_RECALL_BY_DEPARTMENT_LEADER,
            ].includes(notify.status)
        ) {
            const approveNotifyRuleLevel_1 = findApprovalRule(NOTIFY_RULE.APPROVE_LEAD);
            return approveNotifyRuleLevel_1 ? checkApprovalCheckbox(approveNotifyRuleLevel_1, notify.department) : false;
        }

        if (notify.status === NOTIFY_STATUS.APPROVED_LEAD_EXTERNAL) {
            const approveNotifyRuleExternal = findApprovalRule(NOTIFY_RULE.APPROVE_LEAD_EXTERNAL);
            return approveNotifyRuleExternal ? checkApprovalCheckbox(approveNotifyRuleExternal, notify.department) : false;
        }
        if (notify.status === NOTIFY_STATUS.APPROVED_RECALL_BY_LEAD) {
            const approveNotifyRuleExternalRecall = findApprovalRule(NOTIFY_RULE.APPROVE_LEAD_EXTERNAL);
            return approveNotifyRuleExternalRecall ? checkApprovalCheckbox(approveNotifyRuleExternalRecall, notify.department) : false;
        }
        else  {
            const approveNotifyRuleLevel_2 = findApprovalRule(NOTIFY_RULE.APPROVE_DEPARTMENT);
            return approveNotifyRuleLevel_2 ? checkApproval(approveNotifyRuleLevel_2, notify.department) : false;
        }
    } else {
        return false;
    }
}

function sendRingBellApproved(body, action, approvedNotify, fromAction, userList) {
    const d = new Date().getTime();
    RingBellItemService.insert(
        body._service[0].dbname_prefix,
        body.username,
        action,
        {
            code: approvedNotify.code,
            title: approvedNotify.title,
            scope: approvedNotify.scope,
            created_by: approvedNotify.username,
            status: approvedNotify.status,
            action_by: body.username,
            department: approvedNotify.department,
        },
        userList,
        [],
        fromAction,
        d,
        []
    );
}

function sendRingBellInsert(req, newNotify, approverUsername) {
    const d = new Date().getTime();
    RingBellItemService.insert(
        req.body._service[0].dbname_prefix,
        req.body.username,
        NOTIFY_BELL_MODAL.PENDING,
        {
            code: newNotify.code,
            title: newNotify.title,
            scope: newNotify.scope,
            created_by: newNotify.username,
            status: newNotify.status,
            action_by: req.body.username,
            department: newNotify.department,
        },
        approverUsername,
        [],
        "createNotify",
        d,
        []
    );
}

function sendRingBellRecalled(body, notify){
    const d = new Date().getTime();
    const rule = NOTIFY_RULE.APPROVE_DEPARTMENT;
    const conditionCreator = [{
        username: { $eq: notify.username },
    }];
    const filterDepartmentCreated = genFilterRuleUser(rule, notify.department, conditionCreator);

    const action = NOTIFY_BELL_MODAL.RECALLED;
    const fromAction = 'approveRecallNotify';
    getUsersNotify(body, filterDepartmentCreated).then(function(users) {
        users = users.filter(user => user !== body.username);
        RingBellItemService.insert(
            body._service[0].dbname_prefix,
            body.username,
            action,
            {
                code: notify.code,
                title: notify.title,
                scope: notify.scope,
                created_by: notify.username,
                status: notify.status,
                action_by: body.username,
                department:notify.department,
            },
            users,
            [],
            fromAction,
            d,
            []
        );
    }, function(err){ console.error(err); });
}

function sendRingBellNeedApproval(body, notify) {
    const d = new Date().getTime();
    let ruleToApprove = NOTIFY_RULE.APPROVE_DEPARTMENT;
    const fromAction = notify.status;
    let action = NOTIFY_BELL_MODAL.APPROVED_BY_DEPARTMENT_LEADER;

    if (notify.status === NOTIFY_STATUS.PENDING) {
        ruleToApprove = NOTIFY_RULE.APPROVE_DEPARTMENT;
    }

    if (notify.status === NOTIFY_STATUS.APPROVED_BY_DEPARTMENT_LEADER) {
        ruleToApprove = NOTIFY_RULE.APPROVE_LEAD;
    }

    if (notify.status === NOTIFY_STATUS.APPROVED_LEAD_EXTERNAL) {
        ruleToApprove = NOTIFY_RULE.APPROVE_LEAD_EXTERNAL;
    }

    const filterNotify = genFilterRuleUser(ruleToApprove, notify.department);

    getUsersNotify(body, filterNotify).then(function(users) {
        users = users.filter(user => user !== body.username);
        RingBellItemService.insert(
            body._service[0].dbname_prefix,
            body.username,
            action,
            {
                code: notify.code,
                title: notify.title,
                scope: notify.scope,
                created_by: notify.username,
                status: notify.status,
                action_by: body.username,
                department: notify.department
            },
            users,
            [],
            fromAction,
            d,
            []
        );
    }, function(err) {
        console.error(err);
    });
}

function sendRingBellNeedApprovalRecall(body, notify){
    const d = new Date().getTime();
    let ruleToApprove = NOTIFY_RULE.APPROVE_DEPARTMENT;
    const fromAction = notify.status;
    if(notify.status === NOTIFY_STATUS.PENDING_RECALLED){
        ruleToApprove = NOTIFY_RULE.APPROVE_DEPARTMENT;
    }

    if(notify.status === NOTIFY_STATUS.APPROVED_RECALL_BY_DEPARTMENT_LEADER){
        ruleToApprove = NOTIFY_RULE.APPROVE_LEAD;
    }

    const filterNotify = genFilterRuleUser(ruleToApprove, notify.department);

    const action = NOTIFY_BELL_MODAL.APPROVED_RECALL_BY_DEPARTMENT_LEADER;
    getUsersNotify(body, filterNotify).then(function(users) {
        users = users.filter(user => user !== body.username);
        RingBellItemService.insert(
            body._service[0].dbname_prefix,
            body.username,
            action,
            {
                code: notify.code,
                title: notify.title,
                scope: notify.scope,
                created_by: notify.username,
                status: notify.status,
                action_by: body.username,
                department: notify.department,
            },
            users,
            [],
            fromAction,
            d,
            []
        );
    }, function(err){ console.error(err); });
}

function sendRingBellDepartmentCreate(body, notify, action, fromAction){
    const dfd = q.defer();
    const d = new Date().getTime();
    const rule = [NOTIFY_RULE.APPROVE_DEPARTMENT, NOTIFY_RULE.NOTIFY_DEPARTMENT];
    const filterNotify = genFilterRuleUser(rule, notify.department, [{ username: { $eq: notify.username } }]);
    getUsersNotify(body, filterNotify).then(function(users) {
        dfd.resolve(users);
        users = users.filter(user => user !== body.username);
        RingBellItemService.insert(
            body._service[0].dbname_prefix,
            body.username,
            action,
            {
                code: notify.code,
                title: notify.title,
                scope: notify.scope,
                created_by: notify.username,
                status: notify.status,
                action_by: body.username,
                department: notify.department
            },
            users,
            [],
            fromAction,
            d,
            []
        );
    }, function(err){ console.error(err); });
    return dfd.promise;
}

function sendRingBellApproval(body, notify){
    const d = new Date().getTime();
    sendRingBellDepartmentCreate(body, notify, NOTIFY_BELL_MODAL.APPROVED, notify.status).then(function(departmentUser){
        const to_users = notify.to_user.filter(user => !user.includes(departmentUser) && user !== body.username );
        const action = NOTIFY_BELL_MODAL.APPROVED_TO_USER;
        const fromAction = notify.status;
        RingBellItemService.insert(
            body._service[0].dbname_prefix,
            body.username,
            action,
            {
                code: notify.code,
                title: notify.title,
                scope: notify.scope,
                created_by: notify.username,
                status: notify.status,
                action_by: body.username,
                department: notify.department
            },
            to_users,
            [],
            fromAction,
            d,
            []
        );
    }, function(err){ console.error(err); });
}

function sendRingBellApproval_All(body, notify){
        const d = new Date().getTime();
        const to_users = notify.to_user
        const action = NOTIFY_BELL_MODAL.APPROVED_TO_USER;
        const fromAction = notify.status;
        RingBellItemService.insert(
            body._service[0].dbname_prefix,
            body.username,
            action,
            {
                code: notify.code,
                title: notify.title,
                scope: notify.scope,
                created_by: notify.username,
                status: notify.status,
                action_by: body.username,
                department: notify.department
            },
            to_users,
            [],
            fromAction,
            d,
            []
        ),
     function(err){ console.error(err); }
}

function sendRingBellRecalledAll(body, notify){
    const d = new Date().getTime();
    const to_users = notify.to_user
    const action = NOTIFY_BELL_MODAL.RECALLED;
    const fromAction = 'approveRecallNotify';
    RingBellItemService.insert(
        body._service[0].dbname_prefix,
        body.username,
        action,
        {
            code: notify.code,
            title: notify.title,
            scope: notify.scope,
            created_by: notify.username,
            status: notify.status,
            action_by: body.username,
            department: notify.department
        },
        to_users,
        [],
        fromAction,
        d,
        []
    ),
 function(err){ console.error(err); }
}

function getStatusRecallByNotify(scope, user) {
    const hasApprovalRuleCheckbox = (ruleType) => user.rule.some(
        (rule) => rule.rule === ruleType && rule.details.type !== "None"
    );
    const hasApprovalRuleRadio = (ruleType) => user.rule.some(
        (rule) => rule.rule === ruleType
    );

    const approveNotifyRuleLevel_1 = hasApprovalRuleRadio(NOTIFY_RULE.APPROVE_LEAD);
    const approveNotifyRuleLevel_2 = hasApprovalRuleCheckbox(NOTIFY_RULE.APPROVE_DEPARTMENT);
    
    if (approveNotifyRuleLevel_1 || approveNotifyRuleLevel_2) {
        if (scope === NOTIFY_SCOPE.INTERNAL) {
            return NOTIFY_STATUS.RECALLED;
        }
        else {
            return approveNotifyRuleLevel_1 ? NOTIFY_STATUS.RECALLED : NOTIFY_STATUS.APPROVED_RECALL_BY_DEPARTMENT_LEADER;
        }
    }
    return NOTIFY_STATUS.PENDING_RECALLED;
}


const genData = function (body, fields) {
    return {
        event: [{ username: body.username, action: "Created", time: new Date().getTime() }],
        title: fields.title,
        content: fields.content,
        group: fields.group,
        type: fields.type,
        to_employee: JSON.parse(fields.to_employee),
        to_department: JSON.parse(fields.to_department),
        to_director: JSON.parse(fields.to_director),
        task_id: getValidValue(fields.task_id),
        status: NOTIFY_STATUS.PENDING
    };
};

function getScope(dbname_prefix, type, to_employee, to_department, department) {
    let dfd = q.defer();
    try {
        switch (type) {
            case NOTIFY_TYPE.WHOLESCHOOL:
                dfd.resolve(NOTIFY_SCOPE.EXTERNAL);
                break;
            case NOTIFY_TYPE.DEPARTMENT:
                // if (to_department.some(d => d !== department)) {
                //     dfd.resolve(NOTIFY_SCOPE.EXTERNAL);
                // } else {
                //     dfd.resolve(NOTIFY_SCOPE.INTERNAL);
                // }
                dfd.resolve(NOTIFY_SCOPE.INTERNAL);

                break;
            case NOTIFY_TYPE.EMPLOYEE:
                UserService.countUser(dbname_prefix, to_employee, department).then(function (count) {
                    if (count > 0) {
                        dfd.resolve(NOTIFY_SCOPE.EXTERNAL);
                    } else {
                        dfd.resolve(NOTIFY_SCOPE.INTERNAL);
                    }
                }, function (err) { dfd.reject(err) })
                break;
        }
    } catch (error) {
        console.log(error);
    }

    return dfd.promise;
}

function getUsersNotify(body, filter){
    const dfd = q.defer();
    UserService.loadUser(body._service[0].dbname_prefix, filter).then(function(users){
        users = users.map(e => e.username).filter(e => e !== body.username);
        dfd.resolve(users);
    }, function(err){ dfd.reject(err); });

    return dfd.promise;
}

function verify_loadDetails(body){
    let dfd = q.defer();
    let hasPermission = false;
    NotifyService.loadDetails(body._service[0].dbname_prefix, body.id, body.code).then(function(notify){
        hasPermission = hasLoadDetailPermission(body, notify);
        if(hasPermission){
                dfd.resolve(notify);
        }else{
            dfd.reject(BaseError.notFound("NotifyController.load_details.NotFound", "ShowPageNotFound"));
        }
    },function(err){
        dfd.reject(err);
    })
    return dfd.promise;
}

function hasLoadDetailPermission(body, notify) {

    const approvedStatuses = [
        NOTIFY_STATUS.APPROVED,
        NOTIFY_STATUS.PENDING_RECALLED,
        NOTIFY_STATUS.APPROVED_RECALL_BY_DEPARTMENT_LEADER,
        NOTIFY_STATUS.APPROVED_RECALL_BY_LEAD
    ];

    const rules_checkbox = [
        NOTIFY_RULE.CREATE,
        NOTIFY_RULE.APPROVE_LEAD,
        NOTIFY_RULE.APPROVE_LEAD_EXTERNAL,
    ];

    if (notify.status === NOTIFY_STATUS.RECALLED) {

        for (const rule of rules_checkbox) {
            if (checkRuleCheckBox(rule, body.session) || 
                checkRuleRadioDepartment(
                    body.session.rule, 
                    notify.department, 
                    body.session.department, 
                    NOTIFY_RULE.APPROVE_DEPARTMENT)) 
                {
                return true;
            }
        }
    }

    if (approvedStatuses.includes(notify.status)) {
        if (notify.scope === NOTIFY_SCOPE.EXTERNAL) {
            return true; 
        }

        if (
            notify.scope === NOTIFY_SCOPE.INTERNAL &&
            (notify.to_user.includes(body.username) || notify.to_director.includes(body.username))
        ) {
            return true;
        }
    }
    
    for (const rule of rules_checkbox) {
        if (checkRuleCheckBox(rule, body.session) || 
            checkRuleRadioDepartment(
                body.session.rule, 
                notify.department, 
                body.session.department, 
                NOTIFY_RULE.APPROVE_DEPARTMENT)) 
            {
            return true;
        }
    }

    return false;
}

class NotifyController {
    constructor() { }

    load_quick_handle(body) {
        const aggerationSearch = BuildFilterAggregate.generateUIFilterAggregate_search([], body);
        const aggerationSteps = BuildFilterAggregate.generatePermissionAggregate_QuickHandle(body.session.employee_details.department, body.session.rule, aggerationSearch);
        const queryCriteria = { ...body };
        const filter = BuildFilterAggregate.generateUIFilterAggregate_load(aggerationSteps, queryCriteria);
        return NotifyService.load_quick_handle(body._service[0].dbname_prefix, filter);
    }

    count_quick_handle(body) {
        const aggerationSearch = BuildFilterAggregate.generateUIFilterAggregate_search([], body);
        const aggerationSteps = BuildFilterAggregate.generatePermissionAggregate_QuickHandle(body.session.employee_details.department, body.session.rule, aggerationSearch);
        const queryCriteria = { ...body };
        const filter = BuildFilterAggregate.generateUIFilterAggregate_count(aggerationSteps, queryCriteria);
        return NotifyService.count_quick_handle(body._service[0].dbname_prefix, filter);
    }

    load(body) {
        const aggerationSearch = BuildFilterAggregate.generateUIFilterAggregate_search([], body);
        const aggerationSteps = BuildFilterAggregate.generatePermissionAggregate_load(body.username, body.session.employee_details.department, body.session.rule, body.checks, aggerationSearch);
        const queryCriteria = { ...body };
        const filter = BuildFilterAggregate.generateUIFilterAggregate_load(aggerationSteps, queryCriteria);

        return NotifyService.load(body._service[0].dbname_prefix, filter);
    }

    count(body) {
        const aggerationSearch = BuildFilterAggregate.generateUIFilterAggregate_search([], body);
        const aggerationSteps = BuildFilterAggregate.generatePermissionAggregate_load(body.username, body.session.employee_details.department, body.session.rule, body.checks, aggerationSearch);
        const queryCriteria = { ...body };
        const filter = BuildFilterAggregate.generateUIFilterAggregate_count(aggerationSteps, queryCriteria);

        return NotifyService.count(body._service[0].dbname_prefix, filter);
    }

    count_not_seen(body) {
        return NotifyService.count_not_seen(body._service[0].dbname_prefix, body.username);
    }


    insert(req) {
        let dfd = q.defer();
        let filter = {};
 
        FileProvider.upload(req, nameLib, validation.insert, undefined, parentFolder, req.body.username)
            .then(function (res) {
                let data = genData(req.body, res.Fields);
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
                            });
                        }
                    }
                }
                data.attachment = attachment;
                switch (data.type) {
                    case NOTIFY_TYPE.WHOLESCHOOL:
                        break;
                    case NOTIFY_TYPE.EMPLOYEE:
                        filter = { username: { $in: data.to_employee } };
                        break;
                    case NOTIFY_TYPE.DEPARTMENT:
                        filter = { department: { $in: data.to_department } };
                        break;
                }


                getScope(req.body._service[0].dbname_prefix, data.type, data.to_employee, data.to_department, req.body.session.employee_details.department).then(function (scope) {
                    NotifyService.insert(
                        req.body._service[0].dbname_prefix,
                        req.body.username,
                        req.body.session.employee_details.department,
                        data.title,
                        data.content,
                        data.group,
                        data.type,
                        data.attachment,
                        data.status,
                        data.to_employee,
                        data.to_department,
                        data.to_director,
                        data.event,
                        data.task_id,
                        scope,
                        filter
                    ).then(function (data) {
                        dfd.resolve(data);
                        const newNotify = data.ops[0];
                        const rule = NOTIFY_RULE.APPROVE_DEPARTMENT;
                        const filterNotify = genFilterRuleUser(rule, newNotify.department);
                        
                        getUsersNotify(req.body, filterNotify).then(function(users){
                            if (newNotify.status == NOTIFY_STATUS.APPROVED) {
                                sendRingBellApproved(req.body, "notify_approved", newNotify, "approveNotify");
                            } else {
                                sendRingBellInsert(req, newNotify, users);
                            }
                        }, function(err){ console.error(err) })
                    }, function (err) {
                        dfd.reject(err);
                    });
                }, function (err) {
                    dfd.reject(err);
                })
            })

        return dfd.promise;
    }


    update(body) {
        let dfd = q.defer();
        getScope(body._service[0].dbname_prefix, body.type, body.to_employee, body.to_department, body.session.employee_details.department).then(function (scope) {
            NotifyService.update(
                body._service[0].dbname_prefix,
                body.username,
                body.id,
                body.title,
                body.content,
                body.group,
                body.type,
                body.to_employee,
                body.to_department,
                body.to_director,
                body.task_id,
                scope,
            ).then(function () {
                dfd.resolve(true);
            }, function (err) { dfd.reject(err) })
        }, function (err) { dfd.reject(err) })
        return dfd.promise;
    }

    approve_department(body) {
        let dfd = q.defer();
        let status;
        getScope(body._service[0].dbname_prefix, body.type, body.to_employee, body.to_department, body.session.employee_details.department).then(function (scope) {
            NotifyService.get_by_id(body._service[0].dbname_prefix, body.id).then(function(notify){
                notify.scope = scope;
                const statusAbleToApprove =
                        notify.status &&
                        [
                            NOTIFY_STATUS.PENDING,
                            NOTIFY_STATUS.APPROVED_BY_DEPARTMENT_LEADER,
                            NOTIFY_STATUS.PENDING_RECALLED,
                            NOTIFY_STATUS.APPROVED_RECALL_BY_DEPARTMENT_LEADER,
                        ].includes(notify.status);
                status = getStatusApproveByNotify(notify);

                if (checkRuleToApproveNotify(body.session, notify) && statusAbleToApprove){
                    NotifyService.approve_department(
                        body._service[0].dbname_prefix,
                        body.username,
                        body.id,
                        body.title,
                        body.content,
                        body.group,
                        body.type,
                        body.to_employee,
                        body.to_department,
                        body.to_director,
                        body.task_id,
                        scope,
                        body.note,
                        status
                    ).then(function () {
                        dfd.resolve(true);
                        notify.status = status
                        if(status === NOTIFY_STATUS.APPROVED_BY_DEPARTMENT_LEADER){ // Toàn trường
                            sendRingBellNeedApproval(body, notify);
                        }

                        if(status === NOTIFY_STATUS.APPROVED && notify.scope === NOTIFY_SCOPE.INTERNAL){ // Nội bộ
                            return sendRingBellInternal(body, notify);
                        }
                    }, function (err) { dfd.reject(err) })
                }else{
                    dfd.reject({
                        path: "NotifyController.approval.YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists",
                        mes: "YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists",
                    });
                }
                
            }, function (err) { dfd.reject(err); });
        }, function (err) { dfd.reject(err) })
        return dfd.promise;
    }

    approval(body) {
        let dfd = q.defer();
        let status = "";

        NotifyService.get_by_id(body._service[0].dbname_prefix, body.id)
            .then((notify) => {
                const statusAbleToApprove =
                    notify.status &&
                    [
                        NOTIFY_STATUS.PENDING,
                        NOTIFY_STATUS.APPROVED_BY_DEPARTMENT_LEADER,
                        NOTIFY_STATUS.PENDING_RECALLED,
                        NOTIFY_STATUS.APPROVED_RECALL_BY_DEPARTMENT_LEADER,
                        NOTIFY_STATUS.APPROVED_LEAD_EXTERNAL,
                        NOTIFY_STATUS.APPROVED_RECALL_BY_LEAD,
                    ].includes(notify.status);
                status = getStatusApproveByNotify(notify);

                if (checkRuleToApproveNotify(body.session, notify) && statusAbleToApprove) {
                    return [
                        notify,
                        NotifyService.approval(body._service[0].dbname_prefix, body.username, body.id, status, body.note),
                    ];
                } else {
                    dfd.reject({
                        path: "NotifyController.approval.YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists",
                        mes: "YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists",
                    });
                }
            })
            .then(([notify, result]) => {
                dfd.resolve(result);
                const approvedNotify = notify;
                const ruleToApprove = NOTIFY_RULE.APPROVE_LEAD;
                approvedNotify.status = status;
                if (approvedNotify.task_id && status === NOTIFY_STATUS.APPROVED) {
                    TaskService.completedTaskById(body._service[0].dbname_prefix, body.username, approvedNotify.task_id);
                }
                
                NotifyService.up_view(body._service[0].dbname_prefix, body.username, notify._id);
                if(!notify.event.some(e => e.action ==='Seen' && e.username === body.username)){
                    NotifyService.add_user_seen(body._service[0].dbname_prefix, body.username, notify._id);
                }

                //Thông báo cho bộ phận tạo
                if(notify.status === NOTIFY_STATUS.RECALLED){
                    return sendRingBellRecalledAll(body, notify);
                }

                // Thông báo đã duyệt all
                if(notify.status === NOTIFY_STATUS.APPROVED && notify.scope === NOTIFY_SCOPE.EXTERNAL ){
                    return sendRingBellApproval_All(body, notify);
                }

                //Thông báo đã duyệt
                if(notify.status === NOTIFY_STATUS.APPROVED || notify.status === NOTIFY_STATUS.APPROVED_BY_DEPARTMENT_LEADER || notify.status === NOTIFY_STATUS.APPROVED_LEAD_EXTERNAL && notify.scope === NOTIFY_SCOPE.INTERNAL){
                    return sendRingBellApproval(body, notify);
                }

                //Thông báo cần duyệt cho hủy
                if(notify.status === NOTIFY_STATUS.PENDING_RECALLED || notify.status === NOTIFY_STATUS.APPROVED_RECALL_BY_DEPARTMENT_LEADER || notify.status === NOTIFY_STATUS.APPROVED_RECALL_BY_LEAD){
                    return sendRingBellNeedApprovalRecall(body, notify);
                }

                //Thông báo cần duyệt
                return sendRingBellNeedApproval(body, notify);
            });

        return dfd.promise;
    }



    reject(body) {
        let dfd = q.defer();

        NotifyService.get_by_id(body._service[0].dbname_prefix, body.id).then(
            (rejectedNotify) => {
                let nextStatus = NOTIFY_STATUS.REJECTED;
                if(
                    [NOTIFY_STATUS.PENDING_RECALLED, NOTIFY_STATUS.APPROVED_RECALL_BY_DEPARTMENT_LEADER].includes(rejectedNotify.status)
                ){
                    nextStatus = NOTIFY_STATUS.APPROVED;
                }
                NotifyService.reject(body._service[0].dbname_prefix, body.username, body.id, body.reason, nextStatus).then(
                    function (result) {
                        dfd.resolve(result);
                        sendRingBellReject(body, rejectedNotify);
                        NotifyService.up_view(body._service[0].dbname_prefix, body.username, rejectedNotify._id);
                        if(!rejectedNotify.event.some(e => e.action ==='Seen' && e.username === body.username)){
                            NotifyService.add_user_seen(body._service[0].dbname_prefix, body.username, rejectedNotify._id);
                        }
                    },
                    function (err) {
                        dfd.reject(err);
                    },
                );
            },
            (err) => {
                dfd.reject(err);
            },
        );

        return dfd.promise;
    }

    delete(body) {
        return NotifyService.delete(body._service[0].dbname_prefix, body.username, body.id);
    }

    recall(body) {
        let dfd = q.defer();
        let recalledNotify;
        let status = "";

        NotifyService.get_by_id(body._service[0].dbname_prefix, body.id).then((notify) => {
            let statusAbleToRecall = false;

            if (notify.scope === NOTIFY_SCOPE.EXTERNAL) {
                if (notify.status === NOTIFY_STATUS.APPROVED) {
                    statusAbleToRecall = true;
                }
            } else {
                if ([NOTIFY_STATUS.APPROVED, NOTIFY_STATUS.APPROVED_BY_DEPARTMENT_LEADER].indexOf(notify.status) !== -1) {
                    statusAbleToRecall = true;
                }
            }

            if (statusAbleToRecall) {
                recalledNotify = notify;
                status = getStatusRecallByNotify(recalledNotify.scope, body.session);
                NotifyService.recall(body._service[0].dbname_prefix, body.username, body.id, body.recall_reason, status).then(
                    (result) => {
                        dfd.resolve(result);
                        notify.status = status;

                        NotifyService.up_view(body._service[0].dbname_prefix, body.username, notify._id);
                        if(!notify.event.some(e => e.action ==='Seen' && e.username === body.username)){
                            NotifyService.add_user_seen(body._service[0].dbname_prefix, body.username, notify._id);
                        }

                        if(notify.status === NOTIFY_STATUS.RECALLED){
                            return sendRingBellRecalledAll(body, notify)
                        }

                        if(notify.status === NOTIFY_STATUS.PENDING_RECALLED || notify.status === NOTIFY_STATUS.APPROVED_RECALL_BY_DEPARTMENT_LEADER){
                            return sendRingBellNeedApprovalRecall(body, notify);
                        }
              
                    },
                    function (err) {
                        dfd.reject(err);
                    },
                );
            } else
                dfd.reject({
                    path: "NotifyController.recall.YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists",
                    mes: "YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists",
                });
        });

        return dfd.promise;
    }

    load_details(body) {
        let dfd = q.defer();
        let dfdArr = [];
        verify_loadDetails(body).then(function(notify){
            dfdArr.push(NotifyService.up_view(body._service[0].dbname_prefix, body.username, notify._id));
            if(!notify.event.some(e => e.action ==='Seen' && e.username === body.username)){
                dfdArr.push(NotifyService.add_user_seen(body._service[0].dbname_prefix, body.username, notify._id));
            }
            q.all(dfdArr).then(function(data){
                notify.view += 1;
                dfd.resolve(notify);
            }, function(err){ dfd.reject(err); })
        }, function(err) { dfd.reject(err); });
        return dfd.promise;
    }

    reload_details(body) {
        let dfd = q.defer();
        let dfdArr = [];
        verify_loadDetails(body).then(function(notify){
            dfdArr.push(NotifyService.up_view(body._service[0].dbname_prefix, body.username, notify._id));
            if(!notify.event.some(e => e.action ==='Seen' && e.username === body.username)){
                dfdArr.push(NotifyService.add_user_seen(body._service[0].dbname_prefix, body.username, notify._id));
            }
            q.all(dfdArr).then(function(){
                dfd.resolve(notify);
            }, function(err){ dfd.reject(err); })
        }, function(err) { dfd.reject(err); });
        return dfd.promise;
    }

    upload_image(req) {
        let dfd = q.defer();
        FileProvider.upload(req, nameLib, undefined, "/task", parentFolder, req.body.username).then(
            function (res) {
                if (res.Files[0]) {
                    if (FileConst.modeProduction === "development") {
                        let imgUrl =
                            FileConst.tenantDomain + "/files/" + res.Files[0].folderPath + "/" + res.Files[0].named;
                        dfd.resolve(imgUrl);
                    } else {
                        gcpProvider.getSignedUrl(res.Files[0].folderPath + "/" + res.Files[0].named).then(
                            (imgUrl) => {
                                dfd.resolve(imgUrl);
                                imgUrl = undefined;
                            },
                            (err) => {
                                dfd.reject(err);
                                err = undefined;
                            },
                        );
                    }
                } else {
                    dfd.reject({ path: "NotifyController.uploadImg.FileIsNull", mes: "FileIsNull" });
                }
                res = undefined;
                req = undefined;
            },
            function (err) {
                dfd.reject(err);
                err = undefined;
                req = undefined;
            },
        );
        return dfd.promise;
    }

    load_file_info(body) {
        let dfd = q.defer();

        NotifyService.loadDetails(body._service[0].dbname_prefix, body.id, body.code).then(
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
                    dfd.reject({ path: "NotifyController.load_file_info.FileIsNotExists", mes: "FileIsNotExists" });
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

        NotifyService.loadDetails(body._service[0].dbname_prefix, body.username, body.id).then(
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
                    dfd.reject({ path: "NotifyController.downloadfile.FileIsNotExists", mes: "FileIsNotExists" });
                }
            },
            function (err) {
                dfd.reject(err);
                body = undefined;
            },
        );

        return dfd.promise;
    }

    like(body) {
        return NotifyService.like(body._service[0].dbname_prefix, body.username, body.id);
    }

    unlike(body) {
        return NotifyService.unlike(body._service[0].dbname_prefix, body.username, body.id);
    }

    throw_to_recyclebin(body) {
        let dfd = q.defer();
        NotifyService.loadDetails(body._service[0].dbname_prefix, body.username, body.id).then(
            function (data) {
                NotifyService.throw_to_recyclebin(body._service[0].dbname_prefix, body.username, body.id).then(
                    function () {
                        dfd.resolve(true);
                    },
                    function (err) {
                        dfd.reject(err);
                    },
                );
            },
            function (err) {
                dfd.reject(err);
                body = undefined;
            },
        );
        return dfd.promise;
    }

    restore_from_recyclebin(body) {
        let dfd = q.defer();
        NotifyService.loadDetails(body._service[0].dbname_prefix, body.username, body.id).then(
            function (data) {
                NotifyService.restore_from_recyclebin(body._service[0].dbname_prefix, body.username, body.id).then(
                    function () {
                        dfd.resolve(true);
                    },
                    function (err) {
                        dfd.reject(err);
                    },
                );
            },
            function (err) {
                dfd.reject(err);
                body = undefined;
            },
        );
        return dfd.promise;
    }

    // TODO
    pushfile(req) {
        let dfd = q.defer();
        FileProvider.upload(req, nameLib, validation.pushfile, undefined, parentFolder, req.body.username).then(function (res) {
            if (res.Files[0]) {
                NotifyService.pushfile(req.body._service[0].dbname_prefix, req.body.username, res.Fields.id,
                    {
                        timePath: res.Files[0].timePath,
                        locate: res.Files[0].type,
                        display: res.Files[0].filename,
                        name: res.Files[0].named,
                        nameLib
                    }).then(function () {
                        dfd.resolve({
                            timePath: res.Files[0].timePath,
                            locate: res.Files[0].type,
                            display: res.Files[0].filename,
                            name: res.Files[0].named,
                            nameLib
                        });

                    }, function (err) {
                        dfd.reject(err);
                    });
            } else {
                dfd.resolve(true);
            }
        }, function (err) {
            dfd.reject(err);
            err = undefined;
            req = undefined;
        });

        return dfd.promise;
    }

    removefile(body) {
        let dfd = q.defer();
        NotifyService.loadDetails(body._service[0].dbname_prefix, body.id, body.code).then(function (data) {
            let fileInfo = {};
            for (var i in data.attachments) {
                if (data.attachments[i].name === body.filename) {
                    fileInfo = data.attachments[i];
                }
            }
            if (fileInfo.name) {
                NotifyService.removefile(body._service[0].dbname_prefix, body.username, body.id, body.filename).then(function (docUpdated) {
                    dfd.resolve(true);
                }, function (err) {
                    dfd.reject(err);
                    err = undefined;
                });
            } else {
                dfd.reject({ path: "TaskController.removeFile.FileIsNull", mes: "FileIsNull" });
            }
        }, function (err) {
            dfd.reject(err);
            err = undefined;
        });

        return dfd.promise;
    }


    save_bookmark(body) {
        return NotifyService.save_bookmark(body._service[0].dbname_prefix, body.username, body.id)
    }

    unsave_bookmark(body) {
        return NotifyService.unsave_bookmark(body._service[0].dbname_prefix, body.username, body.id)
    }
}

exports.NotifyController = new NotifyController();


