const q = require("q");
const { EventCalendarService, UserService, DirectoryService } = require("./service");
const { validation } = require("./validation");
const { FileProvider } = require("../../../shared/file/file.provider");
const { EVENT_CALENDAR_ACTION, FLOW_STATUS, STATUS_EVENT_CALENDAR, RULE_EVENT_CALENDAR, EVENT_CALENDAR_TYPE, EVENT_CALENDAR_ACTION_NAME, LEVEl_CALENDAR, EVENT_CALENDAR_FROM_ACTION, EVENT_CALENDAR_UI_TAB, EVENT_CALENDAR_UI_CHECK } = require("./const");
const { RingBellItemService } = require("../../management/ringbell_item/service");
const BuildFilterAggregateEventCalendar = require('./utility');
const nameLib = "event_calendar";
const parentFolder = "office";
const folderArray = ['office']
const { v4: uuidv4 } = require('uuid');
const fileUtil = require('../../../utils/fileUtil');
const { checkRuleRadioDepartment } = require('../../../utils/ruleUtils');
const XLSX = require('xlsx-js-style');
const { generateCalendar, formatTimestamp } = require("@utils/eventUtil");
const { filterLanguage, genFilterRuleUser, getWeekNumber, genFilterGetUsersByRuleAndDepartment } = require("@utils/util");
const { CHECKS_ON_UI } = require("../car_management/const");
const { ObjectID } = require("mongodb");

class EventCalendarController {
    constructor() {}

    load(req) {
        const body = req.body;
        const aggerationSearch = BuildFilterAggregateEventCalendar.generateUIFilterAggregate_search([], body);
        const aggerationSteps = BuildFilterAggregateEventCalendar.generatePermissionAggregate_ManageUI(
            body.username,
            body.session.department,
            body.session.rule,
            body.tab,
            body.checks,
            body.tab_child,
            body.sub_filter,
            aggerationSearch
        );
        const queryCriteria = { ...body };
        const filter = BuildFilterAggregateEventCalendar.generateUIFilterAggregate_load(aggerationSteps, queryCriteria, body.tab);        
        return EventCalendarService.executeAggregate(body._service[0].dbname_prefix, filter);
    }

    count(req) {
        const body = req.body;
        const aggerationSearch = BuildFilterAggregateEventCalendar.generateUIFilterAggregate_search([], body);
        const aggerationSteps = BuildFilterAggregateEventCalendar.generatePermissionAggregate_ManageUI(
            body.username,
            body.session.department,
            body.session.rule,
            body.tab,
            body.checks,
            body.tab_child,
            body.sub_filter,
            aggerationSearch
        );
        const queryCriteria = { ...body };
        const filter = BuildFilterAggregateEventCalendar.generateUIFilterAggregate_count(aggerationSteps, queryCriteria);
        return EventCalendarService.executeAggregate(body._service[0].dbname_prefix, filter);
    }

    // loaddetails(req) {
    //     const dfd = q.defer();
    //     const body = req.body;

    //     EventCalendarService.loaddetails(body._service[0].dbname_prefix, body.id)
    //         .then(data => {
    //             dfd.resolve(data);
    //         })
    //         .catch(err => {
    //             dfd.reject(err);
    //         });

    //     return dfd.promise;
    // }

    loaddetails(req) {
        const body = req.body;
        const aggerationCode = [
            {
                $match:{
                    _id: { $eq: ObjectID(req.body.id) }
                }
            }
        ]
        const filter = BuildFilterAggregateEventCalendar.generateUIFilterAggregate_loadDetails(aggerationCode);
        return EventCalendarService.executeAggregate(body._service[0].dbname_prefix, filter)
    }

    insert(req) {
        let dfd = q.defer();
        let data;
        let attachments;
        
        FileProvider.upload(req, nameLib, validation.insert, undefined, parentFolder, req.body.username).then(function (res) {
            data = genDataInsert(res.Fields);
            attachments = fileUtil.getUploadedFilesWithSpecificKey({
                nameLib,
                formData: res,
                fieldKey: "file",
            });
            

            data.attachments = attachments.map(attachment =>({
                ...attachment,
                id:uuidv4(),
            }));

            data.department = req.body.session.employee_details.department;

            UserService.loadDepartmenByUsername(req.body._service[0].dbname_prefix, data.participants).then(function (department){
                data.participants_info = department.map(item => {
                    return {
                        username: item.username,
                        department: item.department
                    };
                });
                UserService.loadDetails(req.body._service[0].dbname_prefix, data.main_person).then(function (userinfo){
                    
                    data.main_person_info = {
                        username: userinfo.username,
                        department: userinfo.department
                    };
                    
                    EventCalendarService.getCode(req.body._service[0].dbname_prefix, req.body.session.department_details.ordernumber).then(function (code) {
                        EventCalendarService.insert(
                            req.body._service[0].dbname_prefix,
                            req.body.username,
                            data,
                            code
                        ).then(function(data){
                            dfd.resolve(data);
                            findAndNotifyApprover(req, data);
        
                        },function(err){
                            dfd.reject(err);
                        });
                    }, function (err) { dfd.reject(err) })
                }),function(err) { dfd.reject(err)}
            
            }),function(err) { dfd.reject(err)}
        }, function (err) {
            dfd.reject(err);
        })

        return dfd.promise;
    }

    creator_update(req) {
        let dfd = q.defer();
        let data;
        let attachments;
        let new_attachments = [];

        FileProvider.upload(req, nameLib, validation.update, undefined, parentFolder, req.body.username).then(function (res) {
            verify_CreatorUpdate(req, res).then(function(event){
                data = genDataUpdate(res.Fields);
                attachments = fileUtil.getUploadedFilesWithSpecificKey({
                    nameLib,
                    formData: res,
                    fieldKey: "file",
                });
                attachments = attachments.map(item =>({
                    ...item,
                    id:uuidv4(),
                }))                
                new_attachments = event.attachments.filter(file => !data.remove_attachments.includes(file.id));
                data.attachments = new_attachments.concat(attachments);
                UserService.loadDepartmenByUsername(req.body._service[0].dbname_prefix, data.participants).then(function (department){
                    data.participants_info = department.map(item => {
                        return {
                            username: item.username,
                            department: item.department
                        };
                    });
                    UserService.loadDetails(req.body._service[0].dbname_prefix, data.main_person).then(function (userinfo){
                        
                        data.main_person_info = {
                            username: userinfo.username,
                            department: userinfo.department
                        };
                        EventCalendarService.update(req.body._service[0].dbname_prefix, req.body.username, event._id, data, {
                            username: req.body.username,
                            time: new Date().getTime(),
                            action: EVENT_CALENDAR_FROM_ACTION.CREATOR_UPDATE,
                            id: uuidv4(),
                            note: ''
                        }).then(function(documentUpdate){
                            dfd.resolve(documentUpdate);
                            const attachmentsDelete = meetingRoomSchedule.attachments.filter(item=> data.remove_attachments.includes(item.id));
                            FileProvider.delete(body._service[0].dbname_prefix, req.body.session, nameLib, attachmentsDelete, event.username, folderArray);
                        },function(err){
                            dfd.reject(err);
                        })
                    }),function(err) { dfd.reject(err)}
                }),function(err) { dfd.reject(err)}
            }, function (err) {
                dfd.reject(err);
            })
        },function(err){ dfd.reject(err); });
        
        return dfd.promise;
    }

    creator_delete(body) {
        let dfd = q.defer();
        verify_Creator_delete(body).then(function(eventDetail){
            EventCalendarService.delete(body._service[0].dbname_prefix,body.id,body.username).then(function(){
                dfd.resolve(true);
            },function(err){dfd.reject(err)});
        },function(err){
            dfd.reject(err);
        })
        return dfd.promise;
    }



    approve_department(req){
        let dfd = q.defer();
        const body = req.body;
        verify_ApproveDepartment(body).then(function(eventDetail){
            EventCalendarService.assess_department_level(body._service[0].dbname_prefix,body.username,body.id,
                STATUS_EVENT_CALENDAR.LEADER_DEPARTMENT_APPROVED,{
                    username: body.username,
                    time: new Date().getTime(),
                    action: EVENT_CALENDAR_FROM_ACTION.APPROVE_DEPARTMENT,
                    id: uuidv4(),
                    note: body.note
                }
            ).then(function(){
                dfd.resolve(true);
                eventDetail.status = STATUS_EVENT_CALENDAR.LEADER_DEPARTMENT_APPROVED;
                switch(eventDetail.level){
                    case LEVEl_CALENDAR.LEVEL_2:
                        findAndNotifyAllPartiesInvolved(
                            req,
                            eventDetail,
                            EVENT_CALENDAR_ACTION.APPROVE,
                            EVENT_CALENDAR_FROM_ACTION.APPROVE_DEPARTMENT
                        );    
                        break;
                    case LEVEl_CALENDAR.LEVEL_1:
                        findAndNotifyHost(
                            req,
                            eventDetail,
                            EVENT_CALENDAR_ACTION.NEED_APPROVE,
                            EVENT_CALENDAR_FROM_ACTION.APPROVE_DEPARTMENT
                        );
                        break;
                }
            },function(err){dfd.reject(err)});
        },function(err){
            dfd.reject(err);
        })
        return dfd.promise;
    }

    reject_department(req){
        let dfd = q.defer();
        const body = req.body;
        verify_ApproveDepartment(body).then(function(eventDetail){
            EventCalendarService.assess_department_level(body._service[0].dbname_prefix,body.username,body.id,
                STATUS_EVENT_CALENDAR.REJECTED,{
                    username: body.username,
                    time: new Date().getTime(),
                    action: EVENT_CALENDAR_FROM_ACTION.REJECTED_DEPARTMENT,
                    id: uuidv4(),
                    note: body.note
                }
            ).then(function(){
                dfd.resolve(true);
                eventDetail.status = STATUS_EVENT_CALENDAR.REJECTED;
                findAndNotifyCreatorDepartment(req, eventDetail, EVENT_CALENDAR_ACTION.REJECT, EVENT_CALENDAR_FROM_ACTION.REJECTED_DEPARTMENT);
            },function(err){dfd.reject(err)});
        },function(err){
            dfd.reject(err);
        })
        return dfd.promise;
    }

    approve_host(req){
        let dfd = q.defer();
        const body = req.body;
        verify_ApproveHost(body).then(function(eventDetail){
            EventCalendarService.assess_host_level(body._service[0].dbname_prefix,body.username,body.id,
                STATUS_EVENT_CALENDAR.LEAD_APPROVED,{
                    username: body.username,
                    time: new Date().getTime(),
                    action: EVENT_CALENDAR_FROM_ACTION.APPROVE_HOST,
                    id: uuidv4(),
                    note: body.note
                }
            ).then(function(){
                dfd.resolve(true);
                eventDetail.status = STATUS_EVENT_CALENDAR.LEAD_APPROVED;
                findAndNotifyCreatorDepartment(req, eventDetail, EVENT_CALENDAR_ACTION.APPROVE, EVENT_CALENDAR_FROM_ACTION.APPROVE_HOST);
            },function(err){dfd.reject(err)});
        },function(err){
            dfd.reject(err);
        })
        return dfd.promise;
    }

    reject_host(req){
        let dfd = q.defer();
        const body = req.body;
        verify_ApproveHost(body).then(function(eventDetail){
            EventCalendarService.assess_host_level(body._service[0].dbname_prefix,body.username,body.id,
                STATUS_EVENT_CALENDAR.REJECTED,{
                    username: body.username,
                    time: new Date().getTime(),
                    action: EVENT_CALENDAR_FROM_ACTION.REJECTED_HOST,
                    id: uuidv4(),
                    note: body.note
                }
            ).then(function(){
                dfd.resolve(true);
                eventDetail.status = STATUS_EVENT_CALENDAR.REJECTED;
                findAndNotifyCreatorDepartment(req, eventDetail, EVENT_CALENDAR_ACTION.REJECT, EVENT_CALENDAR_FROM_ACTION.REJECTED_HOST);
            },function(err){dfd.reject(err)});
        },function(err){
            dfd.reject(err);
        })
        return dfd.promise;
    }

    request_cancel(req) {
        const dfd = q.defer();
        const body = req.body;
        const flow = FLOW_STATUS.CANCEL;
        let action = EVENT_CALENDAR_FROM_ACTION.REQUEST_CANCEL;
        verify_request_cancel(body).then(function({nextStatus, event}){
            if(nextStatus === STATUS_EVENT_CALENDAR.CANCELLED){
                action = EVENT_CALENDAR_FROM_ACTION.CANCELED;
            }
            EventCalendarService.request_cancel(body._service[0].dbname_prefix, body.username, body.id,
                nextStatus, flow, {
                    username: body.username,
                    time: new Date().getTime(),
                    action: action,
                    id: uuidv4(),
                    note: body.note
            }).then(function(){
                dfd.resolve(true);
                event.status = nextStatus;
                if(nextStatus === STATUS_EVENT_CALENDAR.CANCELLED){
                    findAndNotifyAllPartiesInvolved(req, event, EVENT_CALENDAR_ACTION.NEED_APPROVE_RECALL, EVENT_CALENDAR_FROM_ACTION.CANCELED);
                }else if(nextStatus === STATUS_EVENT_CALENDAR.LEADER_DEPARTMENT_APPROVED){
                    findAndNotifyHost(req, event, EVENT_CALENDAR_ACTION.NEED_APPROVE_RECALL, EVENT_CALENDAR_FROM_ACTION.APPROVE_RECALL_DEPARTMENT);
                }else{
                    findAndNotifyApprover(req, event, EVENT_CALENDAR_ACTION.NEED_APPROVE_RECALL, EVENT_CALENDAR_FROM_ACTION.REQUEST_CANCEL)
                }

            }, function(err){ dfd.reject(err); })
                    
        },function(err){
            dfd.reject(err);
        })
        return dfd.promise;
    }

    approve_recall_department(req){
        let dfd = q.defer();
        let nextStatus;
        const body = req.body;
        const flow = FLOW_STATUS.CANCEL;
        verify_ApproveRecallDeparment(body).then(function(eventDetail){
            if(eventDetail.level === LEVEl_CALENDAR.LEVEL_2){
                nextStatus = STATUS_EVENT_CALENDAR.CANCELLED;
            }else{
                nextStatus = STATUS_EVENT_CALENDAR.LEADER_DEPARTMENT_APPROVED;
            }
            EventCalendarService.assess_recall_department(body._service[0].dbname_prefix, body.username, body.id,
                nextStatus, flow, {
                    username: body.username,
                    time: new Date().getTime(),
                    action: EVENT_CALENDAR_FROM_ACTION.APPROVE_RECALL_DEPARTMENT,
                    id: uuidv4(),
                    note: body.note
                }
            ).then(function(){
                dfd.resolve(true);

                if(nextStatus === STATUS_EVENT_CALENDAR.CANCELLED){
                    findAndNotifyAllPartiesInvolved(req, eventDetail, EVENT_CALENDAR_ACTION.NEED_APPROVE_RECALL, EVENT_CALENDAR_FROM_ACTION.CANCELED);
                }else if(nextStatus === STATUS_EVENT_CALENDAR.LEADER_DEPARTMENT_APPROVED){
                    findAndNotifyHost(req, eventDetail, EVENT_CALENDAR_ACTION.NEED_APPROVE_RECALL, EVENT_CALENDAR_FROM_ACTION.APPROVE_RECALL_DEPARTMENT);
                }
            },function(err){dfd.reject(err)});
        
        },function(err){
            dfd.reject(err);
        })
        return dfd.promise;
    }

    reject_recall_department(req){
        let dfd = q.defer();
        const body = req.body;
        let nextStatus;
        const flow = FLOW_STATUS.APPROVE;
        verify_ApproveRecallDeparment(body).then(function(eventDetail){
            if(eventDetail.level === LEVEl_CALENDAR.LEVEL_2){
                nextStatus = STATUS_EVENT_CALENDAR.LEADER_DEPARTMENT_APPROVED;
            }else{
                nextStatus = STATUS_EVENT_CALENDAR.LEAD_APPROVED;
            }
            EventCalendarService.assess_recall_department(body._service[0].dbname_prefix, body.username, body.id,
                nextStatus, flow, {
                    username: body.username,
                    time: new Date().getTime(),
                    action: EVENT_CALENDAR_FROM_ACTION.REJECT_RECALL_DEPARTMENT,
                    id: uuidv4(),
                    note: body.note
                }
            ).then(function(){
                dfd.resolve(true);
                eventDetail.status = nextStatus;
                findAndNotifyCreatorDepartment(req, eventDetail, EVENT_CALENDAR_ACTION.REJECT_RECALl, EVENT_CALENDAR_FROM_ACTION.REJECT_RECALL_DEPARTMENT);
            },function(err){dfd.reject(err)});
        
        },function(err){
            dfd.reject(err);
        })
        return dfd.promise;
    }

    approve_recall_host(req){
        let dfd = q.defer();
        const body = req.body;
        const flow = FLOW_STATUS.CANCEL;
        verify_ApproveRecallLead(body).then(function(eventDetail){
            EventCalendarService.assess_recall_host(body._service[0].dbname_prefix, body.username, body.id,
                STATUS_EVENT_CALENDAR.CANCELLED, flow, {
                    username: body.username,
                    time: new Date().getTime(),
                    action: EVENT_CALENDAR_FROM_ACTION.APPROVE_RECALL_HOST,
                    id: uuidv4(),
                    note: body.note
                }
            ).then(function(){
                dfd.resolve(true);
                eventDetail.status = STATUS_EVENT_CALENDAR.CANCELLED;
                findAndNotifyAllPartiesInvolved(req, eventDetail, EVENT_CALENDAR_ACTION.NEED_APPROVE_RECALL, EVENT_CALENDAR_FROM_ACTION.CANCELED);
            },function(err){dfd.reject(err)});
        
        },function(err){
            dfd.reject(err);
        })
        return dfd.promise;
    }

    reject_recall_host(req){
        let dfd = q.defer();
        const body = req.body;
        const flow = FLOW_STATUS.APPROVE;
        verify_ApproveRecallLead(body).then(function(eventDetail){
            EventCalendarService.assess_recall_host(body._service[0].dbname_prefix, body.username, body.id,
                STATUS_EVENT_CALENDAR.LEAD_APPROVED, flow, {
                    username: body.username,
                    time: new Date().getTime(),
                    action: EVENT_CALENDAR_FROM_ACTION.REJECT_RECALL_HOST,
                    id: uuidv4(),
                    note: body.note
                }
            ).then(function(){
                dfd.resolve(true);

                findAndNotifyCreatorDepartment(req, eventDetail, EVENT_CALENDAR_ACTION.REJECT_RECALl, EVENT_CALENDAR_FROM_ACTION.REJECT_RECALL_HOST);
            },function(err){dfd.reject(err)});
        
        },function(err){
            dfd.reject(err);
        })
        return dfd.promise;
    }

    pushFile(req) {
        let dfd = q.defer();
        FileProvider.upload(req, nameLib, validation.pushFile, undefined, parentFolder, req.body.username).then(
            function (res) {
                if (res.Files[0]) {
                    EventCalendarService.pushFile(
                        req.body._service[0].dbname_prefix,
                        req.body.username,
                        res.Fields.id,
                        {
                            timePath: res.Files[0].timePath,
                            locate: res.Files[0].type,
                            display: res.Files[0].filename,
                            name: res.Files[0].named,
                            nameLib,
                        },
                    ).then(
                        function () {
                            dfd.resolve({
                                timePath: res.Files[0].timePath,
                                locate: res.Files[0].type,
                                display: res.Files[0].filename,
                                name: res.Files[0].named,
                                nameLib,
                            });
                        },
                        function (err) {
                            dfd.reject(err);
                        },
                    );
                } else {
                    dfd.resolve(true);
                }
            },
            function (err) {
                dfd.reject(err);
                err = undefined;
                req = undefined;
            },
        );

        return dfd.promise;
    }

    removeFile(req) {
        let dfd = q.defer();
        EventCalendarService.loadDetails(req.body._service[0].dbname_prefix, req.body.id).then(function (data) {
            let fileInfo = {};
            for (var i in data.attachments) {
                if (data.attachments[i].name === req.body.filename) {
                    fileInfo = data.attachments[i];
                }
            }
            if (fileInfo.name) {
                const fullPath = req.body._service[0].dbname_prefix + "/" + parentFolder + '/' + nameLib + '/' + req.body.username + '/' + req.body.filename;
                EventCalendarService.removeFile(req.body._service[0].dbname_prefix, req.body.username, req.body.id, req.body.filename, {
                    timePath: getCurrentDate(),
                    fullPath: fullPath,
                }).then(function () {
                    dfd.resolve(true);
                }, function (err) {
                    dfd.reject(err);
                    err = undefined;
                });
            } else {
                dfd.reject({ path: "EventCalendarController.removeFile.FileIsNull", mes: "FileIsNull" });
            }
        }, function (err) {
            dfd.reject(err);
            err = undefined;
        });

        return dfd.promise;
    }

    load_file_info(body) {
        let dfd = q.defer();
        EventCalendarService.loadDetail(body._service[0].dbname_prefix, body.id).then(
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
                    dfd.reject({ path: "EventCalendarController.load_file_info.FileIsNotExists", mes: "FileIsNotExists" });
                }
            },
            function (err) {
                dfd.reject(err);
            },
        );

        return dfd.promise;
    }

    export_excel(req) {
        const dfd = q.defer();
        const body = req.body;
        const now = new Date();
        const todayDay = now.getDate().toString().padStart(2, '0');
        const todayMonth = (now.getMonth() + 1).toString().padStart(2, '0');
        const todayYear = now.getFullYear().toString();
        const languageCurrent = body.session.language.current;
        const aggerationSearch = BuildFilterAggregateEventCalendar.generateUIFilterAggregate_search([], body);
        const aggerationSteps = BuildFilterAggregateEventCalendar.generatePermissionAggregate_ManageUI(
            body.username,
            body.session.department,
            body.session.rule,
            EVENT_CALENDAR_UI_TAB.CALENDAR,
            body.checks,
            body.tab_child,
            body.sub_filter,
            aggerationSearch
        );
        const queryCriteria = { ...body };
        const filter = BuildFilterAggregateEventCalendar.generateUIFilterAggregate_load(aggerationSteps, queryCriteria, EVENT_CALENDAR_UI_TAB.CALENDAR);        
        EventCalendarService.executeAggregate(body._service[0].dbname_prefix, filter).then(function(events){
           
            let department = '';
            if(body.checks.length ===1 && body.checks[0] === EVENT_CALENDAR_UI_CHECK.MANAGE){
                department = 'Văn phòng trường';
            }else{
                department = body.session.department_details.title[languageCurrent];
            }

            let dfdAr = [];
            dfdAr.push(loadUserExportExcel(events, body));
            dfdAr.push(loadRoomExportExcel(events, body));
            dfdAr.push(loadCarExportExcel(events, body));
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
                row[2][0] = `${department.toUpperCase()}`;
                row[4][0] = 'Số: .../TB-VPT';
                row[6][3] = 'THÔNG BÁO';
                row[7][3] = `Lịch làm việc của ${department}`;
                row[8][3] = `(Tuần ${getWeekNumber(body.from_date)} từ ngày ${firstDayMonth} đến ngày ${lastDayMonth})`;
                row[0][6] = 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM';
                row[1][6] = 'Độc lập - Tự do - Hạnh phúc';
                row[4][6] = `Thành phố Hồ Chí Minh, ngày ${todayDay} tháng ${todayMonth} năm ${todayYear}`;

                const headerRow = [
                    'STT', 
                    filterLanguage('Time',languageCurrent),
                    filterLanguage('Time',languageCurrent),
                    filterLanguage('Content',languageCurrent),
                    filterLanguage('HostPerson',languageCurrent),
                    filterLanguage('AddressEvent',languageCurrent),
                    filterLanguage('Participant',languageCurrent),

                    filterLanguage('Department prepare content',languageCurrent),
                    filterLanguage('Note',languageCurrent),
                ];
                
                const headerRow2 = [
                    '',
                    filterLanguage('DayEvent',languageCurrent),
                    filterLanguage('Hours',languageCurrent),
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

                    { s: { r: 6, c: 3 }, e: { r: 6, c: 5 } },
                    { s: { r: 7, c: 3 }, e: { r: 7, c: 5 } },
                    { s: { r: 8, c: 3 }, e: { r: 8, c: 5 } },

                    { s: { r: 10, c: 1 }, e: { r: 10, c: 2 } },

                    { s: { r: 0, c: 6 }, e: { r: 0, c: 9 } },
                    { s: { r: 1, c: 6 }, e: { r: 1, c: 9 } },
                    { s: { r: 4, c: 6 }, e: { r: 4, c: 9 } },


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
                        row.push( [stt, `${filterLanguage(day.weekDay,languageCurrent)} \n ${formatTimestamp(day.value)}`, '', '', '', '', '', '', '']);
                        stt++;
                    }else{
                        day.events.forEach(d =>{
                            let addressEvent = '';
                            switch(d.type){
                                case EVENT_CALENDAR_TYPE.OFFLINE_ONSITE:
                                    if(d.meeting_room_registration){
                                        addressEvent = filterLanguage(d.meeting_room_registration.type, languageCurrent)
                                        if(d.meeting_room_registration.room){
                                            addressEvent = d.meeting_room_registration.room;
                                        }
                                    }
                                    break;
                                case EVENT_CALENDAR_TYPE.OFFLINE_OFFSITE:
                                    if(d.vehicle_registration){
                                        addressEvent = `Địa điểm: ${d.vehicle_registration.destination} \n Xe: ${d.vehicle_registration.car}`;
                                    }
                                    break;
                                case EVENT_CALENDAR_TYPE.ONLINE:
                                    addressEvent = filterLanguage('Online', languageCurrent);
                                    break;
                            }
                            row.push([
                                stt,
                                `${filterLanguage(day.weekDay,languageCurrent)} \n ${formatTimestamp(day.value)}`,
                                d.start_time_event,
                                d.content,
                                d.main_person,
                                addressEvent,
                                [...d.participants, d.to_department_titles.map(department => department[languageCurrent])].join('\n'),
                                d.department_title[languageCurrent],
                                d.meeting_link,
                            ]);
                        stt++;
                        })
                    }
                });
                
                const mergedCells = [];
                let dem = 2 + 10;
                calendarDates.forEach((day,index) => {
                    if(day.events.length > 0){
                        mergedCells.push(
                            { s: { r: index + dem, c: 1 }, e: { r: index + dem + day.events.length - 1, c: 1 } }
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
                XLSX.utils.book_append_sheet(wb, ws, "Lịch công tác");
                
                const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
                dfd.resolve(excelBuffer);
            }, function (err) { dfd.reject(err); });
            
        }, function(err){ dfd.reject(err); });
        return dfd.promise;
    }

    load_calendar(req) {
        const dfd = q.defer();
        const body = req.body;
        const aggerationSearch = BuildFilterAggregateEventCalendar.generateUIFilterAggregate_search([], body);
        const aggerationSteps = BuildFilterAggregateEventCalendar.generatePermissionAggregate_ManageUI(
            body.username,
            body.session.department,
            body.session.rule,
            EVENT_CALENDAR_UI_TAB.CALENDAR,
            body.checks,
            body.tab_child,
            body.sub_filter,
            aggerationSearch
        );
        const queryCriteria = { ...body };
        const filter = BuildFilterAggregateEventCalendar.generateUIFilterAggregate_load(aggerationSteps, queryCriteria, EVENT_CALENDAR_UI_TAB.CALENDAR);        
        EventCalendarService.executeAggregate(body._service[0].dbname_prefix, filter).then(function(events){
            let dfdAr = [];
            q.all(dfdAr).then(()=>{              
                const calendarDates = genDataCalendar(events, body);                
                dfd.resolve(calendarDates);
            }, function (err) { dfd.reject(err); });

            
        }, function(err){ dfd.reject(err); });
        return dfd.promise;
    }
}

exports.EventCalendarController = new EventCalendarController();

const genDataInsert = function(fields){
    const data = {
        title: fields.title,
        start_date: fields.start_date*1,
        end_date: fields.end_date*1,
        main_person: fields.main_person,
        departments: JSON.parse(fields.departments),
        participants: JSON.parse(fields.participants),
        content: fields.content,
        type: fields.type,
        meeting_link: '',
        vehicle_booking_id: '',
        room_booking_id: '',
        other_info: '',
        level: fields.level,
        meeting_link: fields.meeting_link,
    };

    switch(fields.type){
        case EVENT_CALENDAR_TYPE.OFFLINE_OFFSITE:
            data.vehicle_booking_id = fields.vehicle_booking_id;
            break;
        case EVENT_CALENDAR_TYPE.OFFLINE_ONSITE:
            data.room_booking_id = fields.room_booking_id;
            break;
        case EVENT_CALENDAR_TYPE.OTHER:
            data.other_info = fields.other_info;
            break;
    };

    return data;
}

const genDataUpdate = function(fields){
    const data = {
        id: fields.id,
        title: fields.title,
        start_date: fields.start_date * 1,
        end_date: fields.end_date * 1,
        main_person: fields.main_person,
        departments: JSON.parse(fields.departments),
        participants: JSON.parse(fields.participants),
        content: fields.content,
        type: fields.type,
        meeting_link: '',
        vehicle_booking_id: '',
        room_booking_id: '',
        other_info: '',
        remove_attachments: JSON.parse(fields.remove_attachments),
        level: fields.level,
    };


    switch(fields.type){
        case EVENT_CALENDAR_TYPE.ONLINE:
            data.meeting_link = fields.meeting_link;
            break;
        case EVENT_CALENDAR_TYPE.OFFLINE_OFFSITE:
            data.vehicle_booking_id = fields.vehicle_booking_id;
            break;
        case EVENT_CALENDAR_TYPE.OFFLINE_ONSITE:
            data.room_booking_id = fields.room_booking_id;
            break;
        case EVENT_CALENDAR_TYPE.OTHER:
            data.other_info = fields.other_info;
            break;
    };

    return data;
}

const send_notify = function(dbname_prefix, filter, username, action, fromAction, data){
    let dfd = q.defer();
    const d = new Date().getTime();
    EventCalendarService.getNotifyUsers(dbname_prefix, filter).then(function(response) {
        const userList = response.map(user => user.username);
        RingBellItemService.insert(
            dbname_prefix,
            username,
            action,
            data,
            userList,
            [],
            fromAction,
            d,
            []
        )
    }).then(function(response) {
        dfd.resolve(response);
    }, function(err) {
        dfd.reject(err);
    });
    return dfd.promise;
}

function verify_ApproveDepartment(body){
    let dfd = q.defer();
    EventCalendarService.loadDetail(body._service[0].dbname_prefix, body.id).then(function(eventDetail){
        if(eventDetail.status === STATUS_EVENT_CALENDAR.CREATED){
            if(checkRuleRadioDepartment(body.session.rule,eventDetail.department,
                body.session.employee_details.department,
                RULE_EVENT_CALENDAR.APPROVE_DEPARTMENT
            )){
                dfd.resolve(eventDetail);
            }else{
                dfd.reject({path:"EventCalendarController.verify_ApproveDepartment.NotPermission", mes:"NotPermission"});
            }
        }else{
            dfd.reject({path:"EventCalendarController.verify_ApproveDepartment.StatusInvalid", mes:"StatusInvalid"});
        }
    },function(err){
        dfd.reject(err);
    })
    return dfd.promise;
}

function verify_ApproveHost(body){
    let dfd = q.defer();
    EventCalendarService.loadDetail(body._service[0].dbname_prefix, body.id).then(function(eventDetail){
        if(eventDetail.status === STATUS_EVENT_CALENDAR.LEADER_DEPARTMENT_APPROVED){
            if(body.username === eventDetail.main_person){
                dfd.resolve(eventDetail);
            }else{
                dfd.reject({path:"EventCalendarController.verify_ApproveHost.NotPermission", mes:"NotPermission"});
            }
        }else{
            dfd.reject({path:"EventCalendarController.verify_ApproveHost.StatusInvalid", mes:"StatusInvalid"});
        }
    },function(err){
        dfd.reject(err);
    })
    return dfd.promise;
}

function verify_CreatorUpdate(req, res){
    let dfd = q.defer();
    EventCalendarService.loadDetail(req.body._service[0].dbname_prefix, res.Fields.id).then(function(eventDetail){
        if(eventDetail.status === STATUS_EVENT_CALENDAR.CREATED){
            if(req.body.username === eventDetail.username){
                dfd.resolve(eventDetail);
            }else{
                dfd.reject({path:"EventCalendarController.verify_CreatorUpdate.NotPermission", mes:"NotPermission"});
            }
        }else{
            dfd.reject({path:"EventCalendarController.verify_CreatorUpdate.StatusInvalid", mes:"StatusInvalid"});
        }
    },function(err){
        dfd.reject(err);
    })
    return dfd.promise;
}

function verify_Creator_delete(body){
    let dfd = q.defer();
    EventCalendarService.loadDetail(body._service[0].dbname_prefix, body.id).then(function(eventDetail){
        if(eventDetail.status === STATUS_EVENT_CALENDAR.CREATED){
            if(body.username === eventDetail.username){
                dfd.resolve(eventDetail);
            }else{
                dfd.reject({path:"EventCalendarController.verify_Creator_delete.NotPermission", mes:"NotPermission"});
            }
        }else{
            dfd.reject({path:"EventCalendarController.verify_Creator_delete.StatusInvalid", mes:"StatusInvalid"});
        }
    },function(err){
        dfd.reject(err);
    })
    return dfd.promise;
}

function verify_request_cancel(body){
    let dfd = q.defer();
    const username = body.username;
    EventCalendarService.loadDetail(body._service[0].dbname_prefix, body.id).then(function(eventDetail){
        switch(eventDetail.level){
            case LEVEl_CALENDAR.LEVEL_2:
                if(eventDetail.status !== STATUS_EVENT_CALENDAR.LEADER_DEPARTMENT_APPROVED){
                    dfd.reject({path:"EventCalendarController.verify_request_cancel.StatusInvalid", mes:"StatusInvalid"});
                }else if(checkRuleRadioDepartment(body.session.rule,eventDetail.department,
                    body.session.employee_details.department,
                    RULE_EVENT_CALENDAR.APPROVE_DEPARTMENT
                )){
                    dfd.resolve({nextStatus: STATUS_EVENT_CALENDAR.CANCELLED, event: eventDetail });
                }else if(eventDetail.username === username){
                    dfd.resolve({nextStatus: STATUS_EVENT_CALENDAR.CREATED, event: eventDetail });
                }else{
                    dfd.reject({path:"EventCalendarController.verify_request_cancel.NotPermission", mes:"NotPermission"});
                }
                break;
            case LEVEl_CALENDAR.LEVEL_1:
                if(eventDetail.status !== STATUS_EVENT_CALENDAR.LEAD_APPROVED){
                    dfd.reject({path:"EventCalendarController.verify_request_cancel.StatusInvalid", mes:"StatusInvalid"});
                }else if(eventDetail.main_person === username){
                    dfd.resolve({nextStatus: STATUS_EVENT_CALENDAR.CANCELLED, event: eventDetail });
                }else if(checkRuleRadioDepartment(body.session.rule,eventDetail.department,
                    body.session.employee_details.department,
                    RULE_EVENT_CALENDAR.APPROVE_DEPARTMENT
                )){
                    dfd.resolve({nextStatus: STATUS_EVENT_CALENDAR.LEADER_DEPARTMENT_APPROVED, event: eventDetail });
                }else if(eventDetail.username === username){
                    dfd.resolve({nextStatus: STATUS_EVENT_CALENDAR.CREATED, event: eventDetail });
                }else{
                    dfd.reject({path:"EventCalendarController.verify_request_cancel.NotPermission", mes:"NotPermission"});
                }
                break;
        }
    },function(err){
        dfd.reject(err);
    })
    return dfd.promise;
}

function verify_ApproveRecallDeparment(body){
    let dfd = q.defer();
    EventCalendarService.loadDetail(body._service[0].dbname_prefix, body.id).then(function(eventDetail){
        if(eventDetail.status === STATUS_EVENT_CALENDAR.CREATED && eventDetail.flow_status === FLOW_STATUS.CANCEL){
            if(checkRuleRadioDepartment(body.session.rule,eventDetail.department,
                body.session.employee_details.department,
                RULE_EVENT_CALENDAR.APPROVE_DEPARTMENT
            )){
                dfd.resolve(eventDetail);
            }else{
                dfd.reject({path:"EventCalendarController.verify_ApproveRecallDeparment.NotPermission", mes:"NotPermission"});
            }
        }else{
            dfd.reject({path:"EventCalendarController.verify_ApproveRecallDeparment.StatusInvalid", mes:"StatusInvalid"});
        }
    },function(err){
        dfd.reject(err);
    })
    return dfd.promise;
}

function verify_ApproveRecallLead(body){
    let dfd = q.defer();
    EventCalendarService.loadDetail(body._service[0].dbname_prefix, body.id).then(function(eventDetail){
        if(eventDetail.status === STATUS_EVENT_CALENDAR.LEADER_DEPARTMENT_APPROVED && eventDetail.flow_status === FLOW_STATUS.CANCEL && eventDetail.level === LEVEl_CALENDAR.LEVEL_1){
            if(eventDetail.main_person === body.username){
                dfd.resolve(eventDetail);
            }else{
                dfd.reject({path:"EventCalendarController.verify_ApproveRecallLead.NotPermission", mes:"NotPermission"});
            }
        }else{
            dfd.reject({path:"EventCalendarController.verify_ApproveRecallLead.StatusInvalid", mes:"StatusInvalid"});
        }
    },function(err){
        dfd.reject(err);
    })
    return dfd.promise;
}

//notify
function notify(req, filter, action, params, from_action) {
    UserService.loadUser(req.body._service[0].dbname_prefix, filter).then(function(users) {
        users = users.map(e => e.username).filter(e => e !== req.body.username);

        RingBellItemService.insert(
            req.body._service[0].dbname_prefix,
            req.body.username,
            action,
            {
                ...params,
                action_by: req.body.username
            },
            users,
            [],
            from_action,
            new Date().getTime()
        );
    }).catch(function(err) {
        console.error(action, JSON.stringify(err));
    });
}


function findAndNotifyApprover(req, item, action = EVENT_CALENDAR_ACTION.NEED_APPROVE, from_action = EVENT_CALENDAR_FROM_ACTION.CREATED) {
    const rule = RULE_EVENT_CALENDAR.APPROVE_DEPARTMENT;
    const filter = genFilterRuleUser(rule, item.department);

    notify(req, filter, action,{
        id: item._id,
        code: item.code,
        title: item.title,
        username_create: item.username,
        status: STATUS_EVENT_CALENDAR.CREATED
    }, from_action)
}

function findAndNotifyCreatorDepartment(req, item, action, from_action) {
    const rule = [RULE_EVENT_CALENDAR.APPROVE_DEPARTMENT];
    const filter2 = genFilterGetUsersByRuleAndDepartment(RULE_EVENT_CALENDAR.NOTIFY_DEPARTMENT, item.departments);
    const filter = genFilterRuleUser(rule, item.department, [
        { username: { $eq: item.username } },
        { username: { $in: item.participants } },
    ]);

    notify(req, filter, action,{
        id: item._id,
        code: item.code,
        title: item.title,
        username_create: item.username,
        status: item.status
    }, from_action)

    notify(req, filter2, action,{
        id: item._id,
        code: item.code,
        title: item.title,
        username_create: item.username,
        status: item.status
    }, from_action)
}

function findAndNotifyAllPartiesInvolved(req, item, action, from_action){
    const rule = RULE_EVENT_CALENDAR.APPROVE_DEPARTMENT;
    const filter = genFilterRuleUser(rule, item.department, [
        { username: { $eq: item.username } },
        { username: { $eq: item.main_person } },
        { username: { $in: item.participants } },
    ])
    const filterdepartment = genFilterGetUsersByRuleAndDepartment(RULE_EVENT_CALENDAR.NOTIFY_DEPARTMENT, item.departments);

    notify(req, filter, action,{
        id: item._id,
        code: item.code,
        title: item.title,
        username_create: item.username,
        status: item.status
    }, from_action)

    notify(req, filterdepartment, action,{
        id: item._id,
        code: item.code,
        title: item.title,
        username_create: item.username,
        status: item.status
    }, from_action)
}

function findAndNotifyHost(req, item, action, from_action) {
    const filter = {
        $match: { username: { $eq: item.main_person } }
    };

    notify(req, filter, action,{
        id: item._id,
        code: item.code,
        title: item.title,
        username_create: item.username,
        status: item.status
    }, from_action)
}

function genDataCalendar(events, body){
    events = events.map(event =>{
        return {
            ...event,
            start_date: event.start_date*1,
            end_date: event.end_date*1,
            start_date_text: new Date(event.start_date*1),
            end_date_text: new Date (event.end_date*1),
        }
    });
    const from_date = new Date(body.from_date);
    const to_date = new Date(body.to_date);
    return generateCalendar(from_date, to_date, events);
}

function loadUserExportExcel(events,body){
    let dfd = q.defer();
    const participants = events.reduce((acc, current) => {
        return acc.concat(current.participants);
    }, []);
    const users = events.reduce((acc, current) => {
        return acc.concat([current.username]);
    }, []);
    const hosts = events.reduce((acc, current) => {
        return acc.concat([current.main_person]);
    }, []);
    const list_users = [
        ...participants,
        ...users,
        ...hosts
    ]
    const filterUsers = {
        $match: {username: {$in: list_users }}
    }
    UserService.loadUser(body._service[0].dbname_prefix, filterUsers).then(users =>{ 
        const userTitles = {};
        users.forEach(user =>{
            userTitles[user.username] = user.title;
        })
        events = events.forEach(event => {
            event.main_person = userTitles[event.main_person];
            event.username = userTitles[event.username];
            event.participants = event.participants.map(item => userTitles[item]);
        });
        dfd.resolve(userTitles);
    });
    return dfd.promise;
}

function loadRoomExportExcel(events,body){
    const dfd = q.defer();
    const codeRoom = events.map(item => {
        if(item.meeting_room_registration){
            return item.meeting_room_registration.room
        }
        return null
    }).filter(item => item)
    const cond = [{ value: { $in: codeRoom } }]
    DirectoryService.loadRoom(body._service[0].dbname_prefix, cond).then(function(res){
        events.forEach(item =>{
            if(item.meeting_room_registration){
                const roomInfo = res.find(room => room.value === item.meeting_room_registration.room);
                if(roomInfo){
                    item.meeting_room_registration.room = roomInfo.title['vi-VN']
                }
            }
        })
        dfd.resolve(true);

    }, function(err){
        console.error(err)
    })
    return dfd.promise;
}

function loadCarExportExcel(events, body){
    let dfd = q.defer();
    const languageCurrent = body.session.language.current;
    const codCars = events.map(item => {
        if(item.vehicle_registration && !item.vehicle_registration.assign_card){
            return item.vehicle_registration.car
        }
        return null
    }).filter(item => item);
    DirectoryService.loadCar(body._service[0].dbname_prefix, codCars).then(cars =>{
        events.forEach(event => {
            if(event.vehicle_registration && !event.vehicle_registration.assign_card){
                const car = cars.find(car => car.value === event.vehicle_registration.car);
                if(car){
                    event.vehicle_registration.car = car.title[languageCurrent]
                }
            }
        })
        dfd.resolve(events);
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
