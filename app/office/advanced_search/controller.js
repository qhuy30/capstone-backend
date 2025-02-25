const q = require("q");
const { TYPE } = require("./const");
const { TaskService, AdvancedSearchService, DAService, ODBService, WFPService, BriefcaseService } = require("./service");
const { generateParent, filterLanguage } = require("@utils/util");
const { object } = require("joi");
const mongodb = require("mongodb");
const { DISPATCH_ARRIVED_STATUS, DISPATCH_STATUS, ACTION } = require("../dispatch_arrived/const");
const { WORKFLOW_PLAY_STATUS } = require("@utils/constant");
const { ARCHIVE_STATUS } = require("../briefcase/const");


function findTask(body) {
    const dfd = q.defer();

    TaskService.load_by_code(body._service[0].dbname_prefix, body.search).then(
        function (rs) {
            if (rs.length === 0) {
                const filter = { $match: { $text: { $search: body.search } } };
                TaskService.loadAggregate(body._service[0].dbname_prefix, filter).then(
                    function (data) {
                        if (data.length === 0) {
                            dfd.reject({
                                path: "AdvancedSearchController.search.err",
                                mes: "Data not found",
                            });
                        } else {
                            dfd.resolve(data[0]);
                        }
                    },
                    function (err) {
                        dfd.reject({
                            path: "AdvancedSearchController.search.err",
                            mes: "Data not found",
                        });
                    },
                );
            } else {
                dfd.resolve(rs[0]);
            }
        },
        function (err) {
            dfd.reject({
                path: "AdvancedSearchController.search.err",
                mes: "Data not found",
            });
        },
    );
    return dfd.promise;
}

function findDA(body) {
    const dfd = q.defer();

    DAService.load_by_code(body._service[0].dbname_prefix, body.search).then(
        function (rs) {
            if (rs.length === 0) {
                const filter = { $match: { $text: { $search: body.search } } };
                DAService.loadAggregate(body._service[0].dbname_prefix, filter).then(
                    function (data) {
                        if (data.length === 0) {
                            dfd.reject({
                                path: "AdvancedSearchController.search.err",
                                mes: "Data not found",
                            });
                        } else {
                            dfd.resolve(data[0]);
                        }
                    },
                    function (err) {
                        dfd.reject({
                            path: "AdvancedSearchController.search.err",
                            mes: "Data not found",
                        });
                    },
                );
            } else {
                dfd.resolve(rs[0]);
            }
        },
        function (err) {
            dfd.reject({
                path: "AdvancedSearchController.search.err",
                mes: "Data not found",
            });
        },
    );
    return dfd.promise;
}

function findODB(body) {
    const dfd = q.defer();
    ODBService.load_by_code(body._service[0].dbname_prefix, body.search).then(
        function (rs) {
            if (rs.length === 0) {
                const filter = { $match: { $text: { $search: body.search } } };
                ODBService.loadAggregate(body._service[0].dbname_prefix, filter).then(
                    function (data) {
                        if (data.length === 0) {
                            dfd.reject({
                                path: "AdvancedSearchController.search.err",
                                mes: "Data not found",
                            });
                        } else {
                            dfd.resolve(data[0]);
                        }
                    },
                    function (err) {
                        dfd.reject({
                            path: "AdvancedSearchController.search.err",
                            mes: "Data not found",
                        });
                    },
                );
            } else {
                dfd.resolve(rs[0]);
            }
        },
        function (err) {
            dfd.reject({
                path: "AdvancedSearchController.search.err",
                mes: "Data not found",
            });
        },
    );
    return dfd.promise;
}

function findWfp(body) {
    const dfd = q.defer();
    WFPService.load_by_code(body._service[0].dbname_prefix, body.search).then(
        function (rs) {
            if (rs.length === 0) {
                const filter = { $match: { $text: { $search: body.search } } };
                WFPService.loadAggregate(body._service[0].dbname_prefix, filter).then(
                    function (data) {
                        if (data.length === 0) {
                            dfd.reject({
                                path: "AdvancedSearchController.search.err",
                                mes: "Data not found",
                            });
                        } else {
                            dfd.resolve(data[0]);
                        }
                    },
                    function (err) {
                        dfd.reject({
                            path: "AdvancedSearchController.search.err",
                            mes: "Data not found",
                        });
                    },
                );
            } else {
                dfd.resolve(rs[0]);
            }
        },
        function (err) {
            dfd.reject({
                path: "AdvancedSearchController.search.err",
                mes: "Data not found",
            });
        },
    );
    return dfd.promise;
}

function findArchive(body) {
    const dfd = q.defer();
    BriefcaseService.load_by_code(body._service[0].dbname_prefix, body.search).then(
        function (rs) {
            if (rs.length === 0) {
                const filter = { $match: { $text: { $search: body.search } } };
                BriefcaseService.loadAggregate(body._service[0].dbname_prefix, filter).then(
                    function (data) {
                        if (data.length === 0) {
                            dfd.reject({
                                path: "AdvancedSearchController.search.err",
                                mes: "Data not found",
                            });
                        } else {
                            dfd.resolve(data[0]);
                        }
                    },
                    function (err) {
                        dfd.reject({
                            path: "AdvancedSearchController.search.err",
                            mes: "Data not found",
                        });
                    },
                );
            } else {
                dfd.resolve(rs[0]);
            }
        },
        function (err) {
            dfd.reject({
                path: "AdvancedSearchController.search.err",
                mes: "Data not found",
            });
        },
    );
    return dfd.promise;
}

function findProcess(body, id, obj, detail){
    const dfd = q.defer();
    const dfdAr = [];
    let parents = [];
    const filter = {
        $match: {
            parents: {
                $elemMatch: {
                    id: { $eq: id },
                    object: { $eq: obj }
                }
            }
        }
    };

    dfdAr.push(AdvancedSearchService.loadAggregate(body._service[0].dbname_prefix, 'briefcase', filter));
    dfdAr.push(AdvancedSearchService.loadAggregate(body._service[0].dbname_prefix, 'outgoing_dispatch', filter));
    dfdAr.push(AdvancedSearchService.loadAggregate(body._service[0].dbname_prefix, 'workflow_play', filter));
    dfdAr.push(AdvancedSearchService.loadAggregate(body._service[0].dbname_prefix, 'task', filter));
    dfdAr.push(AdvancedSearchService.loadAggregate(body._service[0].dbname_prefix, 'dispatch_arrived', filter));

    q.all(dfdAr).then(function([[briefcase], [outgoing_dispatch], [workflow_play], [task], [dispatch_arrived]]){
        
        if(briefcase){
            parents = generateParent(briefcase.parents, {
                id: briefcase._id.toString(),
                code: briefcase.code,
                object: 'briefcase',
            });
        }
        if(outgoing_dispatch && parents.length === 0){
            parents = generateParent(outgoing_dispatch.parents, {
                id: outgoing_dispatch._id.toString(),
                code: outgoing_dispatch.symbol_number,
                object: 'outgoing_dispatch',
            });
        }
        if(workflow_play && parents.length === 0){

            parents = generateParent(workflow_play.parents, {
                id: workflow_play._id.toString(),
                code: workflow_play.code,
                object: 'workflow_play',
            });
        }

        if(task && parents.length === 0){
            parents = task.parents;

            parents = generateParent(task.parents, {
                id: task._id.toString(),
                code: task.code,
                object: 'task',
            });
        }

        if(dispatch_arrived && parents.length === 0){
            parents = generateParent([], {
                id: dispatch_arrived._id.toString(),
                code: dispatch_arrived.symbol_number,
                object: 'dispatch_arrived',
            });
        }

        if(parents.length === 0 && (!detail.parents || detail.parents.length === 0)){
            parents = generateParent([], {
                id: detail._id.toString(),
                code: detail.code,
                object: obj,
            });
        }

        if(parents.length === 0 && detail.parents.length !== 0){
            parents = generateParent(detail.parents, {
                id: detail._id.toString(),
                code: detail.code,
                object: obj,
            });
        }

        dfd.resolve(getEvent(body, parents))
    }, function(err){
        dfd.reject(err);
    })

    return dfd.promise;
}

function getEvent(body, parents){
    const dfd = q.defer();
    const dfdAr = [];
    parents.forEach(parent => {
        switch(parent.object){
            case 'task':
                dfdAr.push(getEventTask(body, parent.id));
                break;
            case 'dispatch_arrived':
                dfdAr.push(getEventDA(body, parent.id));
                break;
            case 'outgoing_dispatch':
                dfdAr.push(getEventODB(body, parent.id));
                break;
            case 'workflow_play':
                dfdAr.push(getEventWFP(body, parent.id));
                break;
            case 'briefcase':
                dfdAr.push(getEventArchive(body, parent.id));
                break;
        }
    });

    q.all(dfdAr).then(function(rs){
        dfd.resolve(sortEvent(rs));
    }, function(err){
        console.error(err);
        dfd.reject(err);
    })

    return dfd.promise;
}

function insertBeforeFirstLeftTrue(arr, newObj) {
    // Find the index of the first object with isLeft = true
    const leftTrueIndex = arr.findIndex(obj => obj.isLeft === true);
    let endItem = arr[arr.length - 1];
    // If no object with isLeft = true is found, push to the end
    if(leftTrueIndex !== -1){
        endItem = arr[leftTrueIndex-1]
    }

    if(!Array.isArray(newObj)){
        newObj = [newObj];
    }
    newObj = newObj.map(i => {
        const time = leftTrueIndex !== -1 ? endItem.time+1: endItem.time+1;
        return {...i, time: time, isLeft: endItem.isLeft}
    })

    if (leftTrueIndex === -1) {
        arr.unshift(...newObj);
    } else {
      // Insert the new object before the first object with isLeft = true
      arr.splice(leftTrueIndex, 0, ...newObj);
    }
  
    return arr;
  }

function sortEvent(events){
    const task = events.find(item => item.type === 'task');
    const da = events.find(item => item.type === 'dispatch_arrived');
    const odb = events.find(item => item.type === 'outgoing_dispatch');
    const wfp = events.find(item => item.type === 'workflow_play');
    const archive = events.find(item => item.type === 'briefcase');

    const eventSorted = [];

    let startTask = null;
    let startWfp = null;
    let startOdb = null;
    let startArchive = null;

    if(task){
        startTask = task.event[0].time;
    }

    if(wfp){
        startWfp = wfp.event[0].time;
    }

    if(odb){
        startOdb = odb.event[0].time;
    }

    if(archive){
        startArchive = archive.event[0].time;
    }

    if(da){
        da.event[0].isFirst = true;   
        da.event = da.event.map(e => ({
            ...e,
            isLeft: startTask ? (e.time > startTask) && !e.notDone : false,
        }))
        if(da.nextStep){
            da.event = insertBeforeFirstLeftTrue(da.event, da.nextStep)
        }
        eventSorted.push(...da.event);
    }

    if(task){
        task.event[0].isFirst = true;
        task.event = task.event.map(e => ({
            ...e,
            isLeft: startWfp ? (e.time > startWfp) && !e.notDone : false,
        }))
        if(task.nextStep){
            task.event = insertBeforeFirstLeftTrue(task.event, task.nextStep)
        }
        eventSorted.push(...task.event);
    }

    if(wfp){
        wfp.event[0].isFirst = true;
        wfp.event = wfp.event.map(e => ({
            ...e,
            isLeft: startOdb ? (e.time > startOdb) && !e.notDone : false,
        }))
        if(wfp.nextStep){
            wfp.event = insertBeforeFirstLeftTrue(wfp.event, wfp.nextStep)
        }
        eventSorted.push(...wfp.event);
    }

    if(odb){
        odb.event[0].isFirst = true;
        odb.event = odb.event.map(e => ({
            ...e,
            isLeft: startArchive ? (e.time > startArchive) && !e.notDone : false,
        }))
        if(odb.nextStep){
            odb.event = insertBeforeFirstLeftTrue(odb.event, odb.nextStep)
        }
        eventSorted.push(...odb.event);
    }
    if(archive){
        archive.event[0].isFirst = true;
        if(archive.nextStep){
            archive.event = insertBeforeFirstLeftTrue(archive.event, archive.nextStep)
        }
        eventSorted.push(...archive.event);
    }

    return eventSorted.sort((a, b) => b.time - a.time);
}

function getEventTask(body, id){
    const dfd = q.defer();
    const filter = { $match: { _id: { $eq: new mongodb.ObjectID(id) } } };
    AdvancedSearchService.loadAggregate(body._service[0].dbname_prefix, 'task', filter).then(function(rs){
        const event = rs[0].event.map((e)=>({
            action: e.action,
            type: 'task',
            time: e.time,
            username: e.username,
            id: id,
            code: rs[0].code,
            title: rs[0].title,
        }));
        const nextStep = getNextStepTask(body, rs[0]);
        dfd.resolve({event: event.sort((a, b) => a.time - b.time), type: 'task', nextStep});
    }, function(err){
        dfd.reject(err);
    });
    
    return dfd.promise;
}

function getEventDA(body, id){
    const dfd = q.defer();
    const filter = { $match: { _id: { $eq: new mongodb.ObjectID(id) } } };
    AdvancedSearchService.loadAggregate(body._service[0].dbname_prefix, 'dispatch_arrived', filter).then(function(rs){
        const event = rs[0].events.map((e)=>{
            let department = null;
            if([ACTION.DEPARTMENT_SEEN, ACTION.TRANSFER_DEPARTMENT_APPROVE].includes(e.action)){
                department = e.department;
            }

            return {
                action: e.action,
                type: 'dispatch_arrived',
                time: e.time,
                username: e.username,
                id: id,
                code: rs[0].symbol_number,
                title: rs[0].content,
                department: department
            }
        });
        const nextStep = getNextStepDA(rs[0], body);
        dfd.resolve({event: event.sort((a, b) => a.time - b.time), type: 'dispatch_arrived', nextStep});
    }, function(err){
        dfd.reject(err);
    });
    
    return dfd.promise;
}

function getNextStepDA(da, body){
    const currentLanguage = body.session.language.current;
    let nextEvents = [];
    let department_execute = [];
    switch(da.status){
        case DISPATCH_STATUS.CREATED:
            return {
                notDone: true, 
                type: 'dispatch_arrived',
                action: filterLanguage('Waiting to transfer to the office leadership of the school',currentLanguage)
            }
            break;
        case DISPATCH_STATUS.WAITING_LEAD_DERPARTMENT_APPROVE:
            return {
                notDone: true, 
                type: 'dispatch_arrived',
                action: filterLanguage('WaitingLeadDepartmentApprove',currentLanguage)
            }
            break;
        case DISPATCH_STATUS.WAITING_LEAD_EXTERNAL_APPROVE:
            return {
                notDone: true, 
                type: 'dispatch_arrived',
                action: filterLanguage('WaitingLeadExternalApprove', currentLanguage)
            }
            break;
        case DISPATCH_STATUS.LEAD_TRANSFER_DEPARTMENT:
            nextEvents = [];
            department_execute = `(department){${da.department_execute}}`;
            nextEvents.push({
                notDone: true, 
                type: 'dispatch_arrived',
                action: filterLanguage('Waiting for the manager to receive the task', currentLanguage).replace('{{department}}', department_execute),
            });
            da.department_receiver.filter(item => !item.seen).forEach(item => {
                const department_notSeen = `(department){${item.department}}`
                nextEvents.push({
                    notDone: true, 
                    type: 'dispatch_arrived',
                    action: filterLanguage('Waiting for the manager to see the work', currentLanguage).replace('{{department}}', department_notSeen),
                })
            })
            return nextEvents;
        case DISPATCH_STATUS.APPROVED:
            nextEvents = [];
            da.department_receiver.filter(item => !item.seen).forEach(item => {
                const department_notSeen = `(department){${item.department}}`
                nextEvents.push({
                    notDone: true, 
                    type: 'dispatch_arrived',
                    action: filterLanguage('Waiting for the manager to see the work', currentLanguage).replace('{{department}}', department_notSeen),
                })
            })
            return nextEvents;
            
    }
    return null;
}

function getNextStepTask(body, task){
    const currentLanguage = body.session.language.current;
    if(!task.main_person || task.main_person.length === 0){
        return {
            notDone: true, 
            type: 'task',
            action: filterLanguage('Waiting to transfer to the office leadership of the task', currentLanguage)
        }
    }
    
    switch(task.status){
        case 'Processing':
            return {
                notDone: true, 
                type: 'task',
                action: filterLanguage('Waiting for task completion', currentLanguage)
            }
            break;
        case 'WaitingForApproval':
            return {
                notDone: true, 
                type: 'task',
                action: filterLanguage('Waiting for confirmation of task completion', currentLanguage)
            }
            break;
    }

    return null;
}

function getEventWFP(body, id){
    const dfd = q.defer();
    const filter = { $match: { _id: { $eq: new mongodb.ObjectID(id) } } };

    AdvancedSearchService.loadAggregate(body._service[0].dbname_prefix, 'workflow_play', filter).then(function(rs){
        const event = rs[0].event.map(e=>{
            if(e.action === 'return_creator_additional_document'){
                e.time = e.time - 1500;
            }
            return {
                action: e.action,
                type: 'workflow_play',
                time: e.time,
                username: e.username,
                id: id,
                code: rs[0].code,
                title: rs[0].title,
            }
        });
        const nextStep = getNextStepWfp(body, rs[0]);
        dfd.resolve({event: event.sort((a, b) => a.time - b.time), type: 'workflow_play', nextStep});
    }, function(err){
        dfd.reject(err);
    });
    
    return dfd.promise;
}

function getNextStepWfp(body, wf){
    const currentLanguage = body.session.language.current;
    if(wf.node === -1 || wf.node > wf.flow.length){
        return null;
    }

    const currentFlow = wf.flow[wf.node-1];
    if(currentFlow && currentFlow.type !== 'process'){
        return {   
            notDone: true,
            type: 'workflow_play',
            department: currentFlow.items[0].department,
            competence: currentFlow.items[0].competence,
            action: 'pending processing'
        }
    }

    if(currentFlow && currentFlow.type === 'process' && wf.status !== WORKFLOW_PLAY_STATUS.WAITING_ADDITIONAL_DOCUMENT){
        return {
            notDone: true, 
            type: 'workflow_play',
            action: filterLanguage('waiting processing document', currentLanguage)
        }
    }

    // if(wf.status === WORKFLOW_PLAY_STATUS.WAITING_ADDITIONAL_DOCUMENT){
    //     return {
    //         type: 'workflow_play',
    //         action: filterLanguage('waiting_storage', currentLanguage)
    //     }
    // }

    return null;
}

function getEventODB(body, id){
    const dfd = q.defer();
    const filter = { $match: { _id: { $eq: new mongodb.ObjectID(id) } } };

    AdvancedSearchService.loadAggregate(body._service[0].dbname_prefix, 'outgoing_dispatch', filter).then(function(rs){
        const event = rs[0].events.map(e=>({
            action: e.action,
            type: 'outgoing_dispatch',
            time: e.time,
            username: e.username,
            id: id,
            code: rs[0].symbol_number,
            title: rs[0].content
        }));
        dfd.resolve({event: event.sort((a, b) => a.time - b.time), type: 'outgoing_dispatch'});
    }, function(err){
        dfd.reject(err);
    });
    
    return dfd.promise;
}

function getEventArchive(body, id){
    const dfd = q.defer();
    const filter = { $match: { _id: { $eq: new mongodb.ObjectID(id) } } };

    AdvancedSearchService.loadAggregate(body._service[0].dbname_prefix, 'briefcase', filter).then(function(rs){
        const event = rs[0].event.map(e=>({
            action: e.action,
            type: 'briefcase',
            time: e.time,
            username: e.username,
            id: id,
            code: rs[0].code,
            title: rs[0].title
        }));
        const nextStep = getNextStepArchive(rs[0], body);
        dfd.resolve({event: event.sort((a, b) => a.time - b.time), type: 'briefcase', nextStep: nextStep});
    }, function(err){
        dfd.reject(err);
    });
    
    return dfd.promise;
}

function getNextStepArchive(archive, body){
    const currentLanguage = body.session.language.current;
    switch(archive.status){
        case ARCHIVE_STATUS.WAITING_ADDITIONAL_DOCUMENT:
            return {
                action: filterLanguage('Waiting_Additional_Documents',currentLanguage)
            }
            break;
        case ARCHIVE_STATUS.WAITING_STORAGE:
            return {
                action: filterLanguage('waiting_storage',currentLanguage)
            }
            break;
    }
    return null;
}

class AdvancedSearchController {
    load(req) {
        const body = req.body;
        const dfd = q.defer();

        switch (body.type) {
            case TYPE.TASK:
                findTask(body).then(function(task){
                    dfd.resolve(findProcess(body, task._id.toString(), TYPE.TASK, task));
                }, function(err){
                    dfd.reject(err);
                });
                break;
            case TYPE.DISPATCH_ARRIVED:
                findDA(body).then(function(da){
                    dfd.resolve(findProcess(body, da._id.toString(), 'dispatch_arrived', da));
                }, function(err){
                    dfd.reject(err);
                });
                break;
            case TYPE.OUTGOING_DISPATCH:
                findODB(body).then(function(odb){
                    dfd.resolve(findProcess(body, odb._id.toString(), 'outgoing_dispatch', odb));
                }, function(err){
                    dfd.reject(err);
                });
                break;
            case TYPE.WORKFLOW_PLAY:
                findWfp(body).then(function(wfp){
                    dfd.resolve(findProcess(body, wfp._id.toString(), 'workflow_play', wfp));
                }, function(err){
                    dfd.reject(err);
                });
                break;
            case TYPE.ARCHIVE:
                findArchive(body).then(function(archive){
                    dfd.resolve(findProcess(body, archive._id.toString(), 'briefcase', archive));
                }, function(err){
                    dfd.reject(err);
                });
                break
            default:
                findTask(body).then(function(task){
                    dfd.resolve(findProcess(body, task._id.toString(), TYPE.TASK, task));
                }, function(err){
                    dfd.reject(err);
                });
                break;
        }
        return dfd.promise;
    }
}

exports.AdvancedSearchController = new AdvancedSearchController();
