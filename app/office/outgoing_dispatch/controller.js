const q = require("q");
const { BuildFilterAggregate } = require('./utility');

const { cloneDeep } = require("lodash");

const BaseError = require("@shared/error/BaseError");

const { FileProvider } = require("../../../shared/file/file.provider");
const { LogProvider } = require("../../../shared/log_nohierarchy/log.provider.js");

const ReferencesUtil = require("@utils/referencesUtil");

const { ODBService, DepartmentService, EmployeeService, TaskService, UserService: UserODBService } = require("./service");
const { RingBellItemService } = require("../../management/ringbell_item/service");
const { EmployeeService: EmpService } = require("@app/office/human/employee/service");
const { UserService } = require("@app/management/user/user.service");
const {validation} = require("./validation");

const WORKFLOW_PLAY_CONF = require("@app/office/workflow_play/const");
const { OBD_STATUS } = require("@utils/constant.js");
const { WorkflowPlayService, TaskWorkFlowPlayService: TaskServiceWFP } = require("@app/office/workflow_play/service");

const { TASK_STATUS } = require("@utils/constant");
const { resolveParents } = require("@utils/referenceUtil");
const { NAME_LIB, DISPATCH_STATUS, ACTION } = require("@app/office/outgoing_dispatch/const");
const { getValidValue, generateParent } = require("../../../utils/util");
const fileUtil = require("../../../utils/fileUtil");
const parentFolder = "/office";
const { v4: uuidv4 } = require('uuid');
const { getObjectDifferences } = require("@utils/ruleUtils");
const { BriefCaseService } = require("../briefcase/service");
const { ARCHIVE_STATUS, ARCHIVE_EVENT } = require("../briefcase/const");
const { DAService } = require("../dispatch_arrived/service");
const { DISPATCH_STATUS: ARRIVED_DISPATCH_STATUS, DISPATCH_SCOPE, RULE_DISPATCH } = require("../dispatch_arrived/const");
const { genFilterGetUsersByRule, genFilterGetUsersByRuleAndDepartment } = require("@utils/util");

const fieldSearchAr = ["search", "odb_book", "priority", "send_method", "type", "tab"];

const countFilter = function (body) {
    let count = 0;
    for (var i in fieldSearchAr) {
        if (body[fieldSearchAr[i]] !== undefined && body[fieldSearchAr[i]] !== "") {
            count++;
        }
    }
    return count;
}

const genFilter = function (body, count) {
    let filter = { $and: [] };
    if (count === 1) {
        switch (body.tab) {
            case "created":
                filter.$and.push({ username: { $eq: body.username } });
                break;
            case "all":
                break;
            case "need_to_handle":
                filter.$and.push({ handler: { $eq: body.username } });
                break;
            case "waiting_storage":
                filter.$and.push({ status: { $eq: OBD_STATUS.RELEASED } });
                break;
            case "dispatchAway":
                filter.$and.push({ document_type: { $ne: 'separate_dispatch' } });
                break;
            case "separateDispatch":
                filter.$and.push({ document_type: { $eq: 'separate_dispatch' } });
        }
        filter.$and.push({
            status: { $ne: OBD_STATUS.NOT_PUBLIC_YET },
        });
        return filter;
    }

    for (var i in fieldSearchAr) {
        if (body[fieldSearchAr[i]] !== undefined && body[fieldSearchAr[i]] !== "") {
            switch (fieldSearchAr[i]) {
                case "tab":
                    switch (body.tab) {
                        case "created":
                            filter.$and.push({ username: { $eq: body.username } });
                            break;
                        case "all":
                            filter.$and.push({ _id: { $ne: false } });
                            break;
                        case "need_to_handle":
                            filter.$and.push({ handler: { $eq: body.username } });
                            break;
                        case "waiting_storage":
                            filter.$and.push({ status: { $eq: OBD_STATUS.RELEASED } });
                            break;
                    }
                    break;
                case "search":
                    filter.$and.push({
                        $text: { $search: body[fieldSearchAr[i]] },
                    });
                    break;
                default:
                    let item = {};
                    item[fieldSearchAr[i]] = { $eq: body[fieldSearchAr[i]] };
                    filter.$and.push(item);
            }
        }
    }

    filter.$and.push({
        status: { $ne: OBD_STATUS.NOT_PUBLIC_YET },
    });

    return filter;
}


const genUpdateData = function (fields) {
    let result = {};
    if(fields.from === 'origin' ) {
        result.odb_book= fields.odb_book;
        result.signed_date = fields.signed_date;
        result.type= fields.type;
        result.excerpt= fields.excerpt;
        result.priority= fields.priority;
        result.expiration_date= fields.expiration_date;
    } else if (fields.from === 'transfer') {
        result.notification_departments = fields.notification_departments;
        result.notification_recipients = fields.notification_recipients;
    }
    return result;
}


function genUpdateReferencesData(dto) {
    return {
        references: groupReferences(dto)
    };
}

function groupReferences(references) {
    const result = {};

    for (const reference of references) {
        if (!result[reference.object]) {
            result[reference.object] = [];
        }
        result[reference.object].push(reference.id);
    }
    return Object.keys(result).map((key) => ({
        type: "array",
        object: key,
        value: result[key],
        isDefault: false
    }));
}

function sendNotificationToRecipients(dbNamePrefix, publisher, obd, recipients) {
    const dfd = q.defer();
    q.fcall(() => {
        if (!Array.isArray(recipients) || recipients.length === 0) {
            dfd.resolve();
            return;
        }
        return RingBellItemService.insert(
            dbNamePrefix,
            publisher.username,
            "obd_released",
            {
                workflowPlayId: obd.workflowPlayId,
                code : obd.code,
                obdId: obd._id.toString(),
                title: obd.title,
                mes: "JustReleasedBy",
                username_release: publisher.username,
            },
            recipients,
            [],
            "releaseOBD",
            new Date().getTime(),
        );
    })
        .then(() => {
            dfd.resolve();
        })
        .catch((error) => {
            dfd.reject(error);
        });
    return dfd.promise;
}

function sendNotificationToDepartments(dbNamePrefix, publisher, obd, departments) {
    const dfd = q.defer();
    q.fcall(() => {
        if (!Array.isArray(departments) || departments.length === 0) {
            dfd.resolve();
            return;
        }
        return EmpService.loadLeadersByDepartmentIds(dbNamePrefix, departments);
    })
        .then((departments) => {
            let employeeIds = [];
            for (const department of departments) {
                if (Array.isArray(department.leader) && department.leader.length > 0) {
                    employeeIds = employeeIds.concat(department.leader.map((leader) => leader._id.toString()));
                }
            }
            if (employeeIds.length === 0) {
                dfd.resolve();
                return;
            }
            return UserService.loadByEmployeeIds(dbNamePrefix, employeeIds);
        })
        .then((users) => {
            if (!Array.isArray(users) || users.length === 0) {
                dfd.resolve();
                return;
            }
            const recipients = users.map((user) => user.username);
            return sendNotificationToRecipients(dbNamePrefix, publisher, obd, recipients);
        })
        .then(() => {
            dfd.resolve();
        })
        .catch((error) => {
            dfd.reject(error);
        });
    return dfd.promise;
}

const handleSendNotificationForRelease = function (
    dbNamePrefix,
    publisher,
    obd
) {
    const dfd = q.defer();

    const notificationDepartments = obd.receiver_notification || [];
    const notificationRecipients = obd.department_notification || [];

    q.all([
        sendNotificationToRecipients(dbNamePrefix, publisher, obd, notificationRecipients),
        sendNotificationToDepartments(dbNamePrefix, publisher, obd, notificationDepartments),
    ])
        .then(() => {
            dfd.resolve();
        })
        .catch((error) => {
            LogProvider.error("Process send notification for release OBD error", error);
            dfd.reject(error);
        });
    return dfd.promise;
};

function loadReference(dbname_prefix, username, odb) {
    const dfd = q.defer();
    q.fcall(() => {
        const referenceGroup = ReferencesUtil.groupReferences(odb["references"]);

        let briefcasePromise = null;
        if (referenceGroup["brief_case"]) {
            briefcasePromise = BriefcaseService.loadDetail(dbname_prefix, username, referenceGroup["brief_case"]);
        }

        let taskRelatedPromise = null;
        if (referenceGroup["workflow_play"]) {
            taskRelatedPromise = TaskService.loadDetailByWorkFlowPlayId(
                dbname_prefix,
                username,
                referenceGroup["workflow_play"],
            );
        }

        let workflowPlayPromise = null;
        if (referenceGroup["workflow_play"]) {
            workflowPlayPromise = WorkflowPlayService.loadDetails(dbname_prefix, username, referenceGroup["workflow_play"]);
        }

        return q.all([briefcasePromise, taskRelatedPromise, workflowPlayPromise]);
    })
        .then(([briefcase, taskRelated, workflowPlay]) => {
            Object.assign(odb, {
                briefcase: briefcase,
                related_task: taskRelated,
                workflow_play: workflowPlay,
            });
            dfd.resolve(odb);
        })
        .catch((error) => {
            dfd.reject(error);
        });
    return dfd.promise;
}

function buildOutgoingDispatchDTOFromRequest(formData) {
    const fields = formData.Fields;
    const dto = {
        outgoing_dispatch_id: getValidValue(fields.outgoing_dispatch_id),
        outgoing_dispatch_book: getValidValue(fields.outgoing_dispatch_book),
        document_date: fields.document_date,
        outgoing_documents: [],
        attach_documents: [],
        excerpt: getValidValue(fields.excerpt),
        signers: fields.signers,
        draft_department: fields.draft_department,
        receiver_notification: fields.receiver_notification,
        department_notification: fields.department_notification,
        document_quantity: fields.document_quantity,
        transfer_date: fields.transfer_date,
        note: getValidValue(fields.note),
        expiration_date: fields.expiration_date,
        priority: fields.priority,
        code: fields.code
    };
    // dto.outgoing_documents = fileUtil.getUploadedFilesWithSpecificKey({
    //     nameLib: NAME_LIB,
    //     formData,
    //     fieldKey: "outgoing_documents",
    // });
    // dto.attach_documents = fileUtil.getUploadedFilesWithSpecificKey({
    //     nameLib: NAME_LIB,
    //     formData,
    //     fieldKey: "attach_documents",
    // });
    
    return dto;
}

function filterByUserRule (userData, results) {
    const rules = userData.session.rule;
    const curRule = rules.find(rule => rule.rule === 'Office.DispatchOutgoing.ViewODB');
    const { type, department } = curRule.details;
    let response;
    switch (type) {
        case 'NotAllow':
            response = [];
            break;
    
        case 'All':
            response = results;
            break;
            
        case 'Specific':
            results 
                ? response = results.filter(odb => {
                    const dp_notification = odb.department_notification;
                    return dp_notification.some(dp => department && department.includes(dp));
                })
                : [];
            break;
        
        case 'Working':
            results 
                ? response = results.filter(odb => odb.department_notification.includes(userData.session.department)) 
                : [];
            break;    

        default:
            response = [];
            break;
    }

    return response;
}

function genDataInsert(res, username){
    const fields = res.Fields;
    const data = {};

    data.year = fields.year * 1;
    data.code = fields.code;
    data.symbol_number = fields.symbol_number;
    data.number = fields.number * 1;
    data.type = fields.type;
    data.date_sign = fields.date_sign * 1;
    data.departmemt_write = fields.departmemt_write;
    data.person_sign = fields.person_sign;
    data.content = fields.content;
    data.expire_date = fields.expire_date * 1;
    data.security_level = fields.security_level;
    data.urgency_level = fields.urgency_level;
    // data.text_tags = fields.text_tags;
    // data.self_end = JSON.parse(fields.self_end);
    data.other_destination = JSON.parse(fields.other_destination);
    data.department_receiver = JSON.parse(fields.other_destination|| '[]').map(department => ({
        department
    }));
    data.workflow_play_code = fields.workflow_code;
    data.workflow_id = fields.workflow_id;
    if(fields.workflow_code && fields.parents){
        data.parents = generateParent(JSON.parse(fields.parents), {
            code: data.workflow_play_code,
            object: 'workflow_play',
            id: data.workflow_id
        })
    }
    data.attachments = [];
    data.outgoing_file = [];

    if(res.fileInfo.attachments){
        data.attachments = res.fileInfo.attachments.map(item => {
            return {
                id: uuidv4(),
                timePath: item.timePath,
                locate: item.type,
                display: item.filename,
                name: item.named,
                nameLib: NAME_LIB,
                folderPath: item.folderPath,
                username: username
            }
        })
    }

    if(res.fileInfo.outgoing_file){
        data.outgoing_file = res.fileInfo.outgoing_file.map(item => {
            return {
                id: uuidv4(),
                timePath: item.timePath,
                locate: item.type,
                display: item.filename,
                name: item.named,
                nameLib: NAME_LIB,
                folderPath: item.folderPath,
                username: username
            }
        })
    }

    const event = {
        id: uuidv4(),
        action: ACTION.CREATE,
        time: new Date().getTime(), 
        username: username
    }
    data.events = [ event ];
    return data;
    
}

function genDataUpdate(res, username, odbDetails){
    const fields = res.Fields;
    const data = {};

    data.year = fields.year * 1 || odbDetails.year;
    data.code = fields.code || odbDetails.code;
    data.symbol_number = fields.symbol_number || odbDetails.symbol_number;
    data.type = fields.type || odbDetails.type;
    data.date_sign = fields.date_sign * 1 || odbDetails.date_sign;
    data.departmemt_write = fields.departmemt_write || odbDetails.departmemt_write;
    data.person_sign = fields.person_sign || odbDetails.person_sign;
    data.content = fields.content || odbDetails.content;
    data.expire_date = fields.expire_date * 1 || odbDetails.expire_date;
    data.security_level = fields.security_level || odbDetails.security_level;
    data.urgency_level = fields.urgency_level || odbDetails.urgency_level;
    data.other_destination = fields.other_destination ? JSON.parse(fields.other_destination) : odbDetails.other_destination;
    // data.text_tags = fields.text_tags || odbDetails.text_tags;
    // data.self_end = fields.self_end ? JSON.parse(fields.self_end) : odbDetails.self_end;

    data.attachments = [];
    data.outgoing_file = [];

    if(res.fileInfo.attachments){
        data.attachments = res.fileInfo.attachments.map(item => {
            return {
                id: uuidv4(),
                timePath: item.timePath,
                locate: item.type,
                display: item.filename,
                name: item.named,
                nameLib: NAME_LIB,
                folderPath: item.folderPath,
                username: username
            }
        })
    }

    if(res.fileInfo.outgoing_file){
        data.outgoing_file = res.fileInfo.outgoing_file.map(item => {
            return {
                id: uuidv4(),
                timePath: item.timePath,
                locate: item.type,
                display: item.filename,
                name: item.named,
                nameLib: NAME_LIB,
                folderPath: item.folderPath,
                username: username
            }
        })
    }

    const outgoing_file_remove = JSON.parse(fields.outgoing_file_remove || '[]');
    const attachments_remove = JSON.parse(fields.attachments_remove || '[]');
    
    const newAttachments = odbDetails.attachments ? odbDetails.attachments.filter(item => !attachments_remove.includes(item.id)) : [];
    const newOutgoing_file = odbDetails.outgoing_file ? odbDetails.outgoing_file.filter(item => !outgoing_file_remove.includes(item.id)) : [];

    data.attachments = newAttachments.concat(data.attachments);
    data.outgoing_file = newOutgoing_file.concat(data.outgoing_file);

    const dataChange = getObjectDifferences(data, odbDetails);

    const event = {
        id: uuidv4(),
        action: ACTION.UPDATED,
        time: new Date().getTime(), 
        username: username
    }

    if(Object.keys(dataChange).length > 0){
        event.data_change = dataChange;
    }

    return {dataUpdate: data, event};
}

function genDataArchive(res, username, odbDetails){
    try{

        const fields = res.Fields;
        const data = {};
    
        data.year = fields.year * 1 || odbDetails.year;
        data.code = fields.code || odbDetails.code;
        data.symbol_number = fields.symbol_number || odbDetails.symbol_number;
        data.type = fields.type || odbDetails.type;
        data.date_sign = fields.date_sign * 1 || odbDetails.date_sign;
        data.departmemt_write = fields.departmemt_write || odbDetails.departmemt_write;
        data.person_sign = fields.person_sign || odbDetails.person_sign;
        data.content = fields.content || odbDetails.content;
        data.expire_date = fields.expire_date * 1 || odbDetails.expire_date;
        data.security_level = fields.security_level || odbDetails.security_level;
        data.urgency_level = fields.urgency_level || odbDetails.urgency_level;
        data.other_destination = fields.other_destination ? JSON.parse(fields.other_destination) : odbDetails.other_destination;
        // data.text_tags = fields.text_tags || odbDetails.text_tags;
        // data.self_end = fields.self_end ? JSON.parse(fields.self_end) : odbDetails.self_end;
    
        data.attachments = [];
        data.outgoing_file = [];
    
        if(res.fileInfo.attachments){
            data.attachments = res.fileInfo.attachments.map(item => {
                return {
                    id: uuidv4(),
                    timePath: item.timePath,
                    locate: item.type,
                    display: item.filename,
                    name: item.named,
                    nameLib: NAME_LIB,
                    folderPath: item.folderPath,
                    username: username
                }
            })
        }
    
        if(res.fileInfo.outgoing_file){
            data.outgoing_file = res.fileInfo.outgoing_file.map(item => {
                return {
                    id: uuidv4(),
                    timePath: item.timePath,
                    locate: item.type,
                    display: item.filename,
                    name: item.named,
                    nameLib: NAME_LIB,
                    folderPath: item.folderPath,
                    username: username
                }
            })
        }
    
        const outgoing_file_remove = JSON.parse(fields.outgoing_file_remove || '[]');
        const attachments_remove = JSON.parse(fields.attachments_remove || '[]');
        
        const newAttachments = odbDetails.attachments ? odbDetails.attachments.filter(item => !attachments_remove.includes(item.id)) : [];
        const newOutgoing_file = odbDetails.outgoing_file ? odbDetails.outgoing_file.filter(item => !outgoing_file_remove.includes(item.id)) : [];
    
        data.attachments = newAttachments.concat(data.attachments);
        data.outgoing_file = newOutgoing_file.concat(data.outgoing_file);
    
        const dataChange = getObjectDifferences(data, odbDetails);
    
        const event = {
            id: uuidv4(),
            action: ACTION.WAITING_FOR_SRORAGE,
            time: new Date().getTime(), 
            username: username,
            note: fields.note
        }
    
        if(Object.keys(dataChange).length > 0){
            event.data_change = dataChange;
        }
    
        return {dataUpdate: data, event};
    }catch(e){
        console.log(e)
    }
}

function verify_Update(body, id){
    let dfd = q.defer();
    ODBService.loadDetails(body._service[0].dbname_prefix, id).then(function(odbDetails){
        dfd.resolve(odbDetails);
    },function(err){
        dfd.reject(err);
    })
    return dfd.promise;
}

function verify_Archive(body, id){
    let dfd = q.defer();
    ODBService.loadDetails(body._service[0].dbname_prefix, id).then(function(odbDetails){
        dfd.resolve(odbDetails);
    },function(err){
        dfd.reject(err);
    })
    return dfd.promise;
}

function generateDAAndBriefCaseData(odb, currentActor, currentDepartment) {
    const departments = odb.other_destination || [];

    // Tạo danh sách các bản ghi dataInsertDA
    const listDataInsertDA = departments.map(department => ({
        scope: DISPATCH_SCOPE.INTERNAL,
        type: odb.type,
        incomming_date: new Date().getTime(),
        date_sign: odb.date_sign,
        expried: odb.expire_date,
        sending_place: odb.departmemt_write,
        content: odb.content,
        security_level: odb.security_level,
        urgency_level: odb.urgency_level,
        department_receiver: [{ department }], // Chỉ một department, dạng mảng object để đồng bộ với các record của công văn đến External
        status: ARRIVED_DISPATCH_STATUS.PENDING_RECEIPT,
        department: currentDepartment,
        incoming_file: odb.outgoing_file,
        attachments: odb.attachments,
        events: [{
            id: uuidv4(),
            action: ACTION.CREATE,
            time: new Date().getTime(),
            username: currentActor,
            department: currentDepartment
        }],
        odb_id: odb._id.toString(),
        symbol_number: odb.symbol_number,
        username: currentActor,
        time: new Date().getTime(),
    }));

    // Tạo bản ghi dataInsertBriefCase
    const dataInsertBriefCase = {
        title: odb.content,
        odb_id: odb._id.toString(),
        odb_code: odb.symbol_number,
        status: ARCHIVE_STATUS.WAITING_ADDITIONAL_DOCUMENT,
        event:{
            id: uuidv4(),
            action: ARCHIVE_EVENT.CREATE,
            time: new Date().getTime(), 
            username: currentActor
        },
        parents: generateParent(odb.parents, {
            code: odb.symbol_number,
            object: 'outgoing_dispatch',
            id: odb._id
        })
    }

    return { listDataInsertDA, dataInsertBriefCase };
}

function notifyDAInternalReceiver(Dbname_prefix, currentActor, item) {
    const department = item.department_receiver[0].department;

    // Tạo bộ lọc & tải danh sách user theo department và rule
    const filterToFollow = genFilterGetUsersByRuleAndDepartment(RULE_DISPATCH.FOLLOW, department);
    UserODBService.loadUserAggregate(Dbname_prefix, filterToFollow)
        .then((data) => {
            // Lấy danh sách username cần gửi thông báo
            const usernameNeedToFollow = data.map((user) => user.username);

            if (usernameNeedToFollow.length > 0) {
                return RingBellItemService.insert(
                    Dbname_prefix,
                    currentActor,
                    "da_forward_to_departments",
                    {
                        id: item._id,
                        code: item.symbol_number,
                        justReview: true,
                    },
                    usernameNeedToFollow,
                    [],
                    'approveWorkflowPlay',
                    new Date().getTime()
                );
            }
        })
        .catch((err) => {
            console.error('Error processing notification for department', department, err);
        });
}

class ODBController {
    constructor() {}

    getNumber(body) {
        return ODBService.getNumber(body._service[0].dbname_prefix, body.odb_book);
    }

    insert(req) {
        const dfd = q.defer();
        FileProvider.upload(req, NAME_LIB, validation.insert, undefined, parentFolder, req.body.username).then(function(res){
            const dataInsert = genDataInsert(res, req.body.username);
            dataInsert.department = req.body.session.department;
            dataInsert.status = DISPATCH_STATUS.CREATED;
            if(dataInsert.workflow_play_code){
                dataInsert.status = DISPATCH_STATUS.WAITING_FOR_SRORAGE;
            }
            
            ODBService.insert(
                req.body._service[0].dbname_prefix,
                req.body.username,
                dataInsert,
            ).then(function(result){
                dfd.resolve(result.ops[0])
            }, function(err){ dfd.reject(err) });
        }, function(err){ 
            console.error(err);
            dfd.reject(err);
        })

        return dfd.promise;
    }

    insert_waiting_archive(req) {
        const Dbname_prefix = req.body._service[0].dbname_prefix;
        const currentActor = req.body.username;
        const currentDepartment = req.body.session.department;

        const dfd = q.defer();
        FileProvider.upload(req, NAME_LIB, validation.insert, undefined, parentFolder, currentActor).then(function(res){
            const dataInsert = genDataInsert(res, currentActor);
            const dfdArr = [];
            dataInsert.department = currentDepartment;
            dataInsert.status = DISPATCH_STATUS.CREATED;
            if(dataInsert.workflow_play_code){
                dataInsert.status = DISPATCH_STATUS.WAITING_FOR_SRORAGE;
            }

            ODBService.insert(Dbname_prefix, currentActor, dataInsert).then(function(result){
                // DepartmentService.getDepartmentById()
                const odb = result.ops[0];

                const { listDataInsertDA, dataInsertBriefCase } = generateDAAndBriefCaseData(odb, currentActor, currentDepartment);

                BriefCaseService.insert_waiting_additional_document(Dbname_prefix, req.body.username, dataInsertBriefCase).then(function(briefcase){
                    dfd.resolve(briefcase.ops[0])
                }, function(err){
                    dfd.reject(err);
                });

                DAService.insertMany(Dbname_prefix, currentActor, listDataInsertDA).then(function (result) {
                    result.ops.forEach((item) => {
                      // Gọi hàm notifyDAInternalReceiver để gửi thông báo
                      notifyDAInternalReceiver(Dbname_prefix, currentActor, item);
                    });
                  })
                  .catch((err) => {
                    console.error('Error during insertMany operation', err);
                  });
            }, function(err){
                console.error(err);
                dfd.reject(err);
            });
        }, function(err){ 
            console.error(err);
            dfd.reject(err);
        })
        return dfd.promise;
    }

    archive(req) {
        const dfd = q.defer();
        FileProvider.upload(req, NAME_LIB, validation.archive, undefined, parentFolder, req.body.username).then(function(res){
            verify_Archive(req.body, res.Fields.id).then(function(odbDetails){
                
                const {dataUpdate, event} = genDataArchive(res, req.body.username, odbDetails);
                dataUpdate.status = DISPATCH_STATUS.WAITING_FOR_SRORAGE;
                ODBService.archive(
                    req.body._service[0].dbname_prefix,
                    req.body.username,
                    odbDetails._id,
                    dataUpdate,
                    event
                ).then(function(result){
                    dfd.resolve(true)
                }, function(err){ dfd.reject(err) });
            }, function(err){
            console.error(err);

                dfd.reject(err)
            })
        }, function(err){ 
            console.error(err);
            dfd.reject(err);
        })

        return dfd.promise;
    }

    loadDetail(dbname_prefix, body) {
        
        return ODBService.load(dbname_prefix, body.id, body.code)
            

    }

    load(body) {
        const aggerationSearch = BuildFilterAggregate.generateUIFilterAggregate_search([], body);
        const aggerationSteps = BuildFilterAggregate.generatePermissionAggregate_ManageUI(body.username, body.session.employee_details.department, body.session.rule, body.checks, aggerationSearch);
        const queryCriteria = { ...body };
        const filter = BuildFilterAggregate.generateUIFilterAggregate_load(aggerationSteps, queryCriteria);
        return ODBService.executeAggregate(body._service[0].dbname_prefix, filter);
    }

    count(body) {
        const aggerationSearch = BuildFilterAggregate.generateUIFilterAggregate_search([], body);
        const aggerationSteps = BuildFilterAggregate.generatePermissionAggregate_ManageUI(body.username, body.session.employee_details.department, body.session.rule, body.checks, aggerationSearch);
        const queryCriteria = { ...body };
        const filter = BuildFilterAggregate.generateUIFilterAggregate_count(aggerationSteps, queryCriteria);
        return ODBService.executeAggregate(body._service[0].dbname_prefix, filter);
    }

    loadforarchive(body) {
        const aggerationSearch = BuildFilterAggregate.generateUIFilterAggregate_search([], body);
        const aggerationSteps = BuildFilterAggregate.generatePermissionAggregate_archive(body.username, body.session.employee_details.department, body.session.rule, body.checks, aggerationSearch);
        const queryCriteria = { ...body };
        const filter = BuildFilterAggregate.generateUIFilterAggregate_load(aggerationSteps, queryCriteria);
        return ODBService.executeAggregate_waiting_archive(body._service[0].dbname_prefix, filter);
    }

    countforarchive(body) {
        const aggerationSearch = BuildFilterAggregate.generateUIFilterAggregate_search([], body);
        const aggerationSteps = BuildFilterAggregate.generatePermissionAggregate_archive(body.username, body.session.employee_details.department, body.session.rule, body.checks, aggerationSearch);
        const queryCriteria = { ...body };
        const filter = BuildFilterAggregate.generateUIFilterAggregate_count(aggerationSteps, queryCriteria);
        return ODBService.executeAggregate_waiting_archive(body._service[0].dbname_prefix, filter);
    }

    loadFileInfo(dbPrefix, currentUser, odbId, fileName) {
        let dfd = q.defer();

        let targetDocument = null;

        ODBService.load(dbPrefix, currentUser.username, odbId)
            .then(function (data) {
                const allDocuments = data.outgoing_documents.concat(data.attach_documents)
                    .concat(data.archived_documents);
                targetDocument = allDocuments.find((doc) => doc.name === fileName);

                if (!targetDocument) {
                    throw new BaseError("OutgoingDispatchController.loadFileInfo", "FileNotFound", 404);
                }

                return FileProvider.loadFile(
                    dbPrefix,
                    currentUser,
                    targetDocument.nameLib,
                    targetDocument.name,
                    targetDocument.timePath,
                    targetDocument.locate,
                    WORKFLOW_PLAY_CONF.FOLDER_ARRAY,
                    currentUser.username,
                );
            })
            .then((fileDetail) => {
                Object.assign(fileDetail, { display: targetDocument.display });
                dfd.resolve(fileDetail);
            })
            .catch((err) => {
                dfd.reject(
                    err instanceof BaseError
                        ? err
                        : new BaseError("OutgoingDispatchController.loadFileInfo", "LoadFileDetailFailed"),
                );
            });

        return dfd.promise;
    }

    update(req) {
        const dfd = q.defer();

        FileProvider.upload(req, NAME_LIB, validation.updateFormData, undefined, parentFolder, req.body.username).then(function(res){
            verify_Update(req.body, res.Fields.id).then(function(odbDetails){
                const {dataUpdate, event} = genDataUpdate(res, req.body.username, odbDetails);

                ODBService.update(
                    req.body._service[0].dbname_prefix,
                    req.body.username,
                    odbDetails._id,
                    dataUpdate,
                    event
                ).then(function(){
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

    updateReferences(dbname_prefix, body) {
        let dfd = q.defer();
        ODBService.load(dbname_prefix, body.username, body.id)
            .then((obd) => {
                if (obd.status !== OBD_STATUS.RELEASED) {
                    dfd.reject({ path: 'ODBController.update.InvalidAction', mes: 'InvalidAction' })
                    return;
                }
                const notDefaultReferences = body.references.filter(item => item.isDefault === false);
                const defaultReferences = body.references.filter(item => item.isDefault === true);
                let data = genUpdateReferencesData(notDefaultReferences);
                data.references = [...defaultReferences, ...data.references];
                // defaultReferences.forEach(item => {
                //     data.references.unshift(item)
                // })
                // data.references.push(defaultReferences);
                const combinedReferences = [...defaultReferences, ...data.references];
                return ODBService.update(
                    dbname_prefix,
                    body.username,
                    body.id,
                    data
                );
            })
            .then(() => {
                dfd.resolve(true);
            }).catch(err => {
                dfd.reject(err);
            });

        return dfd.promise;
    }

    release(dbname_prefix, body) {
        let dfd = q.defer();
        const d = new Date();
        let obd = {};
        ODBService.load(dbname_prefix, body.username, body.id)
            .then((data) => {
                obd = cloneDeep(data);
                if (obd.status !== OBD_STATUS.NOT_PUBLIC_YET) {
                    throw new BaseError("ODBController.release.InvalidAction", "InvalidAction");
                }

                if (!obd.receiver_notification.length && !obd.department_notification.length) {
                    throw new BaseError("ODBController.release.ReceiverOrDepartmentNotificationIsRequired", "ReceiverOrDepartmentNotificationIsRequired");
                }

                return handleSendNotificationForRelease(dbname_prefix, body.session, obd);
            })
            .then(() => {
                const workflowPlay = obd.references.find((ref) => ref.object === "workflow_play");
                return q.all([
                    ODBService.release(dbname_prefix, body.username, body.id),
                    TaskServiceWFP.updateTaskStatusbyWFP(
                        dbname_prefix,
                        body.username,
                        workflowPlay.value,
                        TASK_STATUS.COMPLETED,
                    ),
                ]);
            })
            .then(() => {
                dfd.resolve(true);
            })
            .catch((err) => {
                dfd.reject(err);
            });
        return dfd.promise;
    }

    loadArchivedDocument(dbname_prefix, body) {
        let dfd = q.defer();
        let odbArr = [];
        ODBService.loadList(dbname_prefix, { code: body.code })
            .then(function (data) {
                odbArr = data;
                let promiseArray = [];
                if (data.length > 0) {
                    promiseArray.push(loadReference(dbname_prefix, body.username, odbArr[0]));
                }
                return q.all(promiseArray);
            })
            .then(() => {
                dfd.resolve(odbArr);
            })
            .catch((err) => dfd.reject(err));

        return dfd.promise;
    }

    insertSeparatelyOutgoingDispatch(dbname_prefix, currentUser, formData) {
        let dfd = q.defer();
        let dto = buildOutgoingDispatchDTOFromRequest(formData);
        dto = validation.validation.processFormData(dto);
        ODBService.insertSeparatelyOutgoingDispatch(dbname_prefix, currentUser.username, dto)
            .then(function (data) {
                dfd.resolve(data);
            })
            .catch(function (err) {
                dfd.reject(err);
            });
        return dfd.promise;
    }

    delete(body) {
        return ODBService.delete(body._service[0].dbname_prefix, body.username, body.id);
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
        return EmployeeService.load(body._service[0].dbname_prefix,body.department);
    }
}

exports.ODBController = new ODBController();
exports.DepartmentController = new DepartmentController();
exports.EmployeeController = new EmployeeController();
