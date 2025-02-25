const _ = require('lodash');
const q = require('q');
const ExcelJS = require('exceljs');
const moment = require('moment');
const { BuildFilterAggregate } = require('./utility');
const BaseError = require("@shared/error/BaseError");
const { v4: uuidv4 } = require('uuid');

const {
    TaskService,
    UserService,
    DepartmentService,
    ProjectService,
    WorkflowPlayService,
    WorkItemService,
    DispatchArrivedService,
    NotifyService,
    LabelService
} = require('./service');
const { WorkflowPlayService: WFPService } = require("@office/workflow_play/service");
const { TaskTemplateService } = require('../task_template/service');

const { getCurrentDate, isValidValue, getValidValue, praseStringToObject, generateParent, genFilterGetUsersByRuleAndDepartment, extractStringBetweenSlashes } = require('../../../utils/util');
const fileUtil = require('../../../utils/fileUtil');
const {checkRuleCheckBox, checkRuleRadioDepartment} = require('../../../utils/ruleUtils');
const { FileProvider } = require('../../../shared/file/file.provider');
const { gcpProvider } = require('../../../shared/store/gcp/gcp.provider');
const { RingBellItemService } = require('../../management/ringbell_item/service');
const { FileConst } = require('../../../shared/file/file.const');
const { TASK_LEVEL, TASK_STATUS, TAB_FILTER, HEAD_TASK_ORIGIN, TASK_COMMENT_TYPE, TASK_RULE, TASK_EVENT } = require('../../../utils/constant');
const {validation} = require('./validation');
const { LogProvider } = require('../../../shared/log_nohierarchy/log.provider');
const { MongoDBProvider } = require("../../../shared/mongodb/db.provider");
const { isUserAsAdmin } = require("../../../utils/employeeUtil");
const { OBJECT_NAME } = require("@utils/referenceConstant");
const { resolveParents } = require("@utils/referenceUtil");
const workflow_play = require('../workflow_play');
const { dbname_prefix } = require('@shared/multi_tenant/pnt-tenant');
const { genData, getUsernameDepartmentToNotify } = require('./utils');
const department = require('@shared/setup/items/office/department');
const { TASK_RULE_NEW } = require('./const');

const nameLib = "task";
const parentFolder = "office";
const folderArray = ['office'];

const TEMPLATE_NAME_FOR_PROJECTS = "template-for-projects_ver2.xlsx";

const MANAGER_COMPETENCES = ["Generalinchief"];
const DEFAULT_EXPANDS = [
    "parent_task",
    "department",
    "dispatch_arrived",
    "workflow_play",
    "work_items",
    "reference_project",
    "notify_detail",
    "label_details",
    "transfer_tickets",
];

const MAP_EXPANDS = {
    parent_task: getParentTaskDetail,
    department: getDepartmentDetail,
    dispatch_arrived: getDispatchArrivedDetail,
    workflow_play: getWorkflowPlayDetail,
    work_items: getChildTaskDetail,
    reference_project: ProjectService.loadProjectByReference,
    notify_detail: NotifyService.loadNotifyByReference,
    label_details: LabelService.loadLabelReference,
    transfer_tickets: WorkflowPlayService.loadTransferTicketByReference,
};

const countFilter = function (body) {
    let count = 0;
    if (body.search !== undefined && body.search !== "") {
        count++;
    }
    if (body.from_date !== undefined && body.from_date !== "" && body.to_date !== undefined && body.to_date !== "") {
        count++;
    }

    if (body.status !== undefined && body.status !== "") {
        count++;
    }
    if (body.tab !== undefined && body.tab !== "") {
        count++;
    }
    return count;
}

function getFilterHandlerQuickAction(sourceId) {
    if (sourceId == 1) {
        return {
            $and: [
                { 'rule.rule': { $in: [TASK_RULE.LEADER_MANAGE, TASK_RULE.DIRECTOR_MANAGE] } },
            ]
        };
    }
    else {
        return  {
            $and: [
                { 'rule.rule': { $in: [TASK_RULE.DEPARTMENT_LEADER_MANAGE] } },
            ]
        };
    }
}

const genFilter = function (body, count) {
    if (count == 1) {
        let filter = {};
        switch (body.tab) {
            case "created":
                filter = { username: { $eq: body.username } };
                break;
            case "assigned":
                filter = {
                    $or: [
                        { main_person: { $eq: body.username } },
                        { participant: { $eq: body.username } },
                        { observer: { $eq: body.username } }
                    ]
                };
                break;
        }
        return filter;
    }

    let filter = { $and: [] };
    switch (body.tab) {
        case "created":
            filter.$and.push({ username: { $eq: body.username } });
            break;
        case "assigned":
            filter.$and.push({
                $or: [
                    { main_person: { $eq: body.username } },
                    { participant: { $eq: body.username } },
                    { observer: { $eq: body.username } }
                ]
            });
            break;
    }

    if (body.status && body.status.length) {
        filter.$and.push({ status: { $in: body.status } });
    }

    if (body.search && body.search !== '') {
        filter.$and.push({ $text: { $search: body.search } });
    }

    if (body.from_date && body.to_date) {
        filter.$and.push({
            $or: [
                {
                    $and: [
                        { from_date: { $lte: body.from_date } },
                        { to_date: { $gte: body.from_date } }
                    ]
                },
                {
                    $and: [
                        { from_date: { $lte: body.to_date } },
                        { to_date: { $gte: body.to_date } }
                    ]
                },
                {
                    $and: [
                        { from_date: { $gte: body.from_date } },
                        { to_date: { $lte: body.to_date } }
                    ]
                },
                {
                    $and: [
                        { from_date: { $lte: body.from_date } },
                        { to_date: { $gte: body.to_date } }
                    ]
                }
            ]
        });
    }

    if (body.level && body.level !== '') {
        filter.$and.push({ level: { $eq: body.level } });
    }

    return filter;
}

function genFilter_all_project_count(body) {

    let template = {
        $and: [
            {
                $or: [
                    {
                        $and: [
                            { from_date: { $lte: body.from_date } },
                            { to_date: { $gte: body.from_date } }
                        ]
                    },
                    {
                        $and: [
                            { from_date: { $lte: body.to_date } },
                            { to_date: { $gte: body.to_date } }
                        ]
                    },
                    {
                        $and: [
                            { from_date: { $gte: body.from_date } },
                            { to_date: { $lte: body.to_date } }
                        ]
                    },
                    {
                        $and: [
                            { from_date: { $lte: body.from_date } },
                            { to_date: { $gte: body.to_date } }
                        ]
                    }
                ]
            }
        ]
    }
    let filter = {
        completed: JSON.parse(JSON.stringify(template)),
        done: JSON.parse(JSON.stringify(template)),
        process: JSON.parse(JSON.stringify(template)),
        notstart: JSON.parse(JSON.stringify(template)),
        all: JSON.parse(JSON.stringify(template))
    };
    filter.completed.$and.push({ status: { $eq: 'Completed' } });
    filter.completed.$and.push({ in_project: { $eq: true } });
    filter.done.$and.push({ status: { $eq: 'WaitingForApproval' } });
    filter.done.$and.push({ in_project: { $eq: true } });
    filter.process.$and.push({ status: { $eq: 'Processing' } });
    filter.process.$and.push({ in_project: { $eq: true } });
    filter.notstart.$and.push({ status: { $eq: 'NotSeen' } });
    filter.notstart.$and.push({ in_project: { $eq: true } });
    filter.all.$and.push({ in_project: { $eq: true } });

    return filter;
}

function genFilter_all_project_growth(body) {
    let template = {
        $and: [
            {
                $or: [
                    {
                        $and: [
                            { from_date: { $lte: body.from_date } },
                            { to_date: { $gte: body.from_date } }
                        ]
                    },
                    {
                        $and: [
                            { from_date: { $lte: body.to_date } },
                            { to_date: { $gte: body.to_date } }
                        ]
                    },
                    {
                        $and: [
                            { from_date: { $gte: body.from_date } },
                            { to_date: { $lte: body.to_date } }
                        ]
                    },
                    {
                        $and: [
                            { from_date: { $lte: body.from_date } },
                            { to_date: { $gte: body.to_date } }
                        ]
                    }
                ]
            }
        ]
    }
    let filter = {
        created: JSON.parse(JSON.stringify(template)),
        completed: JSON.parse(JSON.stringify(template))
    }
    filter.created.$and.push({ in_project: { $eq: true } });
    filter.completed.$and.push({ in_project: { $eq: true } });
    filter.completed.$and.push({ status: { $eq: 'Completed' } });

    return filter;
}

function genFilter_all_department_count(body) {

    let template = {
        $and: [
            {
                $or: [
                    {
                        $and: [
                            { from_date: { $lte: body.from_date } },
                            { to_date: { $gte: body.from_date } }
                        ]
                    },
                    {
                        $and: [
                            { from_date: { $lte: body.to_date } },
                            { to_date: { $gte: body.to_date } }
                        ]
                    },
                    {
                        $and: [
                            { from_date: { $gte: body.from_date } },
                            { to_date: { $lte: body.to_date } }
                        ]
                    },
                    {
                        $and: [
                            { from_date: { $lte: body.from_date } },
                            { to_date: { $gte: body.to_date } }
                        ]
                    }
                ]
            }
        ]
    }
    let filter = {
        completed: JSON.parse(JSON.stringify(template)),
        done: JSON.parse(JSON.stringify(template)),
        process: JSON.parse(JSON.stringify(template)),
        notstart: JSON.parse(JSON.stringify(template)),
        all: JSON.parse(JSON.stringify(template))
    };
    filter.completed.$and.push({ status: { $eq: 'Completed' } });
    filter.completed.$and.push({ in_department: { $eq: true } });
    filter.done.$and.push({ status: { $eq: 'WaitingForApproval' } });
    filter.done.$and.push({ in_department: { $eq: true } });
    filter.process.$and.push({ status: { $eq: 'Processing' } });
    filter.process.$and.push({ in_department: { $eq: true } });
    filter.notstart.$and.push({ status: { $eq: 'NotSeen' } });
    filter.notstart.$and.push({ in_department: { $eq: true } });
    filter.all.$and.push({ in_department: { $eq: true } });

    return filter;
}

function genFilter_all_department_growth(body) {
    let template = {
        $and: [
            {
                $or: [
                    {
                        $and: [
                            { from_date: { $lte: body.from_date } },
                            { to_date: { $gte: body.from_date } }
                        ]
                    },
                    {
                        $and: [
                            { from_date: { $lte: body.to_date } },
                            { to_date: { $gte: body.to_date } }
                        ]
                    },
                    {
                        $and: [
                            { from_date: { $gte: body.from_date } },
                            { to_date: { $lte: body.to_date } }
                        ]
                    },
                    {
                        $and: [
                            { from_date: { $lte: body.from_date } },
                            { to_date: { $gte: body.to_date } }
                        ]
                    }
                ]
            }
        ]
    }
    let filter = {
        created: JSON.parse(JSON.stringify(template)),
        completed: JSON.parse(JSON.stringify(template))
    }
    filter.created.$and.push({ in_department: { $eq: true } });
    filter.completed.$and.push({ in_department: { $eq: true } });
    filter.completed.$and.push({ status: { $eq: 'Completed' } });

    return filter;
}

const genTransferTicketData = function (fields) {
    let result = {};
    result.title = fields.title;
    result.content = fields.content;
    result.has_time = fields.has_time === 'true' ? true : false;
    result.hours = parseFloat(fields.hours);
    result.task_list = JSON.parse(fields.task_list) || [];
    result.main_person = fields.main_person ? JSON.parse(fields.main_person) : [];
    result.participant = fields.participant ? JSON.parse(fields.participant) : [];
    result.observer = fields.observer ? JSON.parse(fields.observer) : [];
    result.from_date = parseInt(fields.from_date);
    result.to_date = parseInt(fields.to_date);
    result.priority = parseInt(fields.priority);
    result.task_type = parseInt(fields.task_type);
    result.department = fields.department;
    result.department_assign_id = fields.department_assign_id;
    result.transfer_ticket_values = JSON.parse(fields.transfer_ticket_values);
    result.head_task_id = fields.head_task_id;
    result.level = TASK_LEVEL.TRANSFER_TICKET;
    result.parent = fields.parent ? JSON.parse(fields.parent) : {};
    result.parents = generateParent(fields.parents ? JSON.parse(fields.parents) : [], result.parent);
    result.source_id = fields.source_id;
    return result;
};

function genFilter_base_department(body) {
    let rule = body.session.rule.filter(e => e.rule === "Office.Task.Follow_Task_Department")[0];
    let filter = {};
    let check = true;

    const currentUser = body.session.employee_details;
    const isGeneralinchief = ['Generalinchief'].includes(currentUser.competence);
    let filterTaskLevels = [TASK_LEVEL.HEAD_TASK];
    if (isGeneralinchief) {
        filterTaskLevels.push(TASK_LEVEL.TRANSFER_TICKET);
    }

    function generateFilter() {
        switch (body.tab) {
            case "all":
                let count = countFilter(body);
                if (count === 0) {
                    filter = { department: { $eq: body.department } };
                } else {
                    filter = {
                        $and: [
                            { department: { $eq: body.department } }
                        ]
                    }

                    if (body.search) {
                        filter.$and.push({ $text: { $search: body.search } });
                    }

                    if (body.status && body.status !== "") {
                        filter.$and.push({ status: { $eq: body.status } });
                    }
                    if (body.from_date && body.to_date) {
                        filter.$and.push({
                            $or: [
                                {
                                    $and: [
                                        { from_date: { $lte: body.from_date } },
                                        { to_date: { $gte: body.from_date } }
                                    ]
                                },
                                {
                                    $and: [
                                        { from_date: { $lte: body.to_date } },
                                        { to_date: { $gte: body.to_date } }
                                    ]
                                },
                                {
                                    $and: [
                                        { from_date: { $gte: body.from_date } },
                                        { to_date: { $lte: body.to_date } }
                                    ]
                                },
                                {
                                    $and: [
                                        { from_date: { $lte: body.from_date } },
                                        { to_date: { $gte: body.to_date } }
                                    ]
                                },
                                {
                                    $and: [
                                        { from_date: { $lte: body.from_date } },
                                        { time_completed: { $gte: body.from_date } }
                                    ]
                                },
                                {
                                    $and: [
                                        { from_date: { $lte: body.to_date } },
                                        { time_completed: { $gte: body.to_date } }
                                    ]
                                },
                                {
                                    $and: [
                                        { from_date: { $gte: body.from_date } },
                                        { time_completed: { $lte: body.to_date } }
                                    ]
                                },
                                {
                                    $and: [
                                        { from_date: { $lte: body.from_date } },
                                        { time_completed: { $gte: body.to_date } }
                                    ]
                                }
                            ]
                        });
                    }
                }

                break;
            case "created":
                filter = {
                    $and: [
                        { department: { $eq: body.department } },
                        { username: { $eq: body.username } },
                        { $text: { $search: body.search } }
                    ]
                };

                if (body.search) {
                    filter.$and.push({ $text: { $search: body.search } });
                }

                if (body.status && body.status !== "") {
                    filter.$and.push({ status: { $eq: body.status } });
                }
                if (body.from_date && body.to_date) {
                    filter.$and.push({
                        $or: [
                            {
                                $and: [
                                    { from_date: { $lte: body.from_date } },
                                    { to_date: { $gte: body.from_date } }
                                ]
                            },
                            {
                                $and: [
                                    { from_date: { $lte: body.to_date } },
                                    { to_date: { $gte: body.to_date } }
                                ]
                            },
                            {
                                $and: [
                                    { from_date: { $gte: body.from_date } },
                                    { to_date: { $lte: body.to_date } }
                                ]
                            },
                            {
                                $and: [
                                    { from_date: { $lte: body.from_date } },
                                    { to_date: { $gte: body.to_date } }
                                ]
                            },
                            {
                                $and: [
                                    { from_date: { $lte: body.from_date } },
                                    { time_completed: { $gte: body.from_date } }
                                ]
                            },
                            {
                                $and: [
                                    { from_date: { $lte: body.to_date } },
                                    { time_completed: { $gte: body.to_date } }
                                ]
                            },
                            {
                                $and: [
                                    { from_date: { $gte: body.from_date } },
                                    { time_completed: { $lte: body.to_date } }
                                ]
                            },
                            {
                                $and: [
                                    { from_date: { $lte: body.from_date } },
                                    { time_completed: { $gte: body.to_date } }
                                ]
                            }
                        ]
                    });
                }
                break;

            case "assigned":
                filter = {
                    $and: [
                        { $text: { $search: body.search } },
                        { department: { $eq: body.department } },
                        {
                            $or: [
                                { main_person: { $eq: body.username } },
                                { participant: { $eq: body.username } },
                                { observer: { $eq: body.username } }
                            ]
                        }
                    ]
                };
                if (body.search) {
                    filter.$and.push({ $text: { $search: body.search } });
                }

                if (body.status && body.status !== "") {
                    filter.$and.push({ status: { $eq: body.status } });
                }
                if (body.from_date && body.to_date) {
                    filter.$and.push({
                        $or: [
                            {
                                $and: [
                                    { from_date: { $lte: body.from_date } },
                                    { to_date: { $gte: body.from_date } }
                                ]
                            },
                            {
                                $and: [
                                    { from_date: { $lte: body.to_date } },
                                    { to_date: { $gte: body.to_date } }
                                ]
                            },
                            {
                                $and: [
                                    { from_date: { $gte: body.from_date } },
                                    { to_date: { $lte: body.to_date } }
                                ]
                            },
                            {
                                $and: [
                                    { from_date: { $lte: body.from_date } },
                                    { to_date: { $gte: body.to_date } }
                                ]
                            },
                            {
                                $and: [
                                    { from_date: { $lte: body.from_date } },
                                    { time_completed: { $gte: body.from_date } }
                                ]
                            },
                            {
                                $and: [
                                    { from_date: { $lte: body.to_date } },
                                    { time_completed: { $gte: body.to_date } }
                                ]
                            },
                            {
                                $and: [
                                    { from_date: { $gte: body.from_date } },
                                    { time_completed: { $lte: body.to_date } }
                                ]
                            },
                            {
                                $and: [
                                    { from_date: { $lte: body.from_date } },
                                    { time_completed: { $gte: body.to_date } }
                                ]
                            }
                        ]
                    });
                }
                break;

            case "head_task":
                filter = {
                    $and: [
                        { department: { $eq: body.department } },
                        { level: { $in: filterTaskLevels } },
                        { status: { $nin: ['PendingApproval'] } }
                    ]
                }

                if (body.search) {
                    filter.$and.push({ $text: { $search: body.search } });
                }

                if (body.status && body.status !== "") {
                    filter.$and.push({ status: { $eq: body.status } });
                }
                if (body.from_date && body.to_date) {
                    filter.$and.push({
                        $or: [
                            {
                                $and: [
                                    { from_date: { $lte: body.from_date } },
                                    { to_date: { $gte: body.from_date } }
                                ]
                            },
                            {
                                $and: [
                                    { from_date: { $lte: body.to_date } },
                                    { to_date: { $gte: body.to_date } }
                                ]
                            },
                            {
                                $and: [
                                    { from_date: { $gte: body.from_date } },
                                    { to_date: { $lte: body.to_date } }
                                ]
                            },
                            {
                                $and: [
                                    { from_date: { $lte: body.from_date } },
                                    { to_date: { $gte: body.to_date } }
                                ]
                            },
                            {
                                $and: [
                                    { from_date: { $lte: body.from_date } },
                                    { time_completed: { $gte: body.from_date } }
                                ]
                            },
                            {
                                $and: [
                                    { from_date: { $lte: body.to_date } },
                                    { time_completed: { $gte: body.to_date } }
                                ]
                            },
                            {
                                $and: [
                                    { from_date: { $gte: body.from_date } },
                                    { time_completed: { $lte: body.to_date } }
                                ]
                            },
                            {
                                $and: [
                                    { from_date: { $lte: body.from_date } },
                                    { time_completed: { $gte: body.to_date } }
                                ]
                            }
                        ]
                    });
                }
                break;
            case "task":
                filter = {
                    $and: [
                        {
                            $or: [
                                {
                                    department: { $eq: body.department },
                                    $or: [
                                        { level: { $eq: 'Task' } },
                                        { level: { $exists: false } },
                                    ]
                                },
                                ...(isGeneralinchief
                                    ? [{ department_assign_id: { $eq: body.department }, level: { $eq: TASK_LEVEL.TRANSFER_TICKET } }]
                                    : [])
                            ]
                        }
                    ]

                }

                if (body.search) {
                    filter.$and.push({ $text: { $search: body.search } });
                }

                if (body.status && body.status !== "") {
                    filter.$and.push({ status: { $eq: body.status } });
                }
                if (body.from_date && body.to_date) {
                    filter.$and.push({
                        $or: [
                            {
                                $and: [
                                    { from_date: { $lte: body.from_date } },
                                    { to_date: { $gte: body.from_date } }
                                ]
                            },
                            {
                                $and: [
                                    { from_date: { $lte: body.to_date } },
                                    { to_date: { $gte: body.to_date } }
                                ]
                            },
                            {
                                $and: [
                                    { from_date: { $gte: body.from_date } },
                                    { to_date: { $lte: body.to_date } }
                                ]
                            },
                            {
                                $and: [
                                    { from_date: { $lte: body.from_date } },
                                    { to_date: { $gte: body.to_date } }
                                ]
                            },
                            {
                                $and: [
                                    { from_date: { $lte: body.from_date } },
                                    { time_completed: { $gte: body.from_date } }
                                ]
                            },
                            {
                                $and: [
                                    { from_date: { $lte: body.to_date } },
                                    { time_completed: { $gte: body.to_date } }
                                ]
                            },
                            {
                                $and: [
                                    { from_date: { $gte: body.from_date } },
                                    { time_completed: { $lte: body.to_date } }
                                ]
                            },
                            {
                                $and: [
                                    { from_date: { $lte: body.from_date } },
                                    { time_completed: { $gte: body.to_date } }
                                ]
                            }
                        ]
                    });
                }
                break;
        }
    }
    if (rule) {
        switch (rule.details.type) {
            case "All":
                generateFilter();
                break;
            case "Working":
                if (body.username && body.session.employee_details.department === body.department) {
                    generateFilter();
                } else {
                    check = false;
                }
                break;

            case "NotAllow":
                check = false;
                break;
            case "Specific":
                if (rule.details.department.indexOf(body.department) !== -1) {
                    generateFilter();
                } else {
                    check = false;
                }
                break;
        }
    } else {
        check = false;
    }
    return {
        filter, check
    }
}

function checkPermissionFollowDepartment(session, department = null) {
    const result = {
        check: false,
        isManager: false,
        department: [],
    };
    const currentUser = session.employee_details;
    if (isUserAsAdmin(session)) {
        result.check = true;
        result.isManager = true;
        return result;
    }

    result.isManager = MANAGER_COMPETENCES.includes(currentUser.competence);

    const rules = session.rule.filter(e => e.rule === 'Office.Task.Follow_Task_Department');
    if (!Array.isArray(rules) || rules.length === 0) {
        return result;
    }

    for (const rule of rules) {
        switch (rule.details.type) {
            case 'All':
                result.check = true;
                break;

            case 'Working':
                if (currentUser && department && currentUser.department === department) {
                    result.check = true;
                }
                break;

            case 'Specific':
                if (department && rule.details.department.indexOf(department) !== -1) {
                    result.check = true;
                }
                break;
        }
    }
    return result;
}

function checkPermissionFollowProject(body, project = null) {
    const dfd = q.defer();
    const result = {
        check: false,
        project: [],
    };

    if (isUserAsAdmin(body.session)) {
        result.check = true;
        result.isManager = true;
        return q.resolve(result);
    }

    const dbPrefix = body._service[0].dbname_prefix;
    const rules = body.session.rule.filter(e => e.rule === "Office.Task.Follow_Project");
    const filter = { $and: [{ _id: { $eq: new require("mongodb").ObjectId(body.project) } }] };

    let promise = null;
    if (!Array.isArray(rules) || rules.length === 0) {
        return q.resolve(result);
    }
    const rule = rules[0];

    switch (rule.details.type) {
        case "All":
            result.check = true;
            break;

        case "Specific":
            result.check = rule.details.project.indexOf(body.project) !== -1;
            if (!result.check) {
                filter.$and.push({ participant: { $eq: body.username } });
                promise = MongoDBProvider.count_onOffice(dbPrefix, "project", filter);
            }
            break;

        case "Self":
            filter.$and.push({
                $or: [
                    { username: { $eq: body.username } },
                    { participant: { $eq: body.username } }
                ]
            });
            promise = MongoDBProvider.count_onOffice(dbPrefix, "project", filter);
            break;

        case "Join":
            filter.$and.push({ participant: { $eq: body.username } });
            promise = MongoDBProvider.count_onOffice(dbPrefix, "project", filter);
            break;
    }

    if (promise === null) {
        return q.resolve(result);
    } else {
        promise
            .then(count => {
                result.check = count > 0;
                dfd.resolve(result);
            })
            .catch(error => {
                dfd.reject(result);
            });
    }
    return dfd.promise;
}


function genFilter_base_project(body) {
    let dfd = q.defer();
    let rule = body.session.rule.filter(e => e.rule === "Office.Task.Follow_Object_Project")[0];
    let filter = {};
    function generateFilter() {
        switch (body.tab) {
            case 'all':
                let count = countFilter(body);
                if (count === 0) {
                    filter = { project: { $eq: body.project } };
                } else {
                    filter = {
                        $and: [
                            {
                                project: { $eq: body.project },
                            },
                        ],
                    };
                    if (body.search) {
                        filter.$and.push({ $text: { $search: body.search } });
                    }

                    if (body.status && body.status !== '') {
                        filter.$and.push({ status: { $eq: body.status } });
                    }
                    if (body.from_date && body.to_date) {
                        filter.$and.push({
                            $or: [
                                {
                                    $and: [
                                        { from_date: { $lte: body.from_date } },
                                        { to_date: { $gte: body.from_date } }
                                    ]
                                },
                                {
                                    $and: [
                                        { from_date: { $lte: body.from_date } },
                                        { time_completed: { $gte: body.from_date } }
                                    ]
                                },
                                {
                                    $and: [{ from_date: { $lte: body.to_date } }, { to_date: { $gte: body.to_date } }]
                                },
                                {
                                    $and: [{ from_date: { $lte: body.to_date } }, { time_completed: { $gte: body.to_date } }]
                                },
                                {
                                    $and: [
                                        { from_date: { $gte: body.from_date } },
                                        { to_date: { $lte: body.to_date } }
                                    ]
                                },
                                {
                                    $and: [
                                        { from_date: { $gte: body.from_date } },
                                        { time_completed: { $lte: body.to_date } },
                                    ]
                                },
                                {
                                    $and: [
                                        { from_date: { $lte: body.from_date } },
                                        { to_date: { $gte: body.to_date } }
                                    ]
                                },
                                {
                                    $and: [
                                        { from_date: { $lte: body.from_date } },
                                        { time_completed: { $gte: body.to_date } }
                                    ]
                                }
                            ],
                        });
                    }

                    if (body.participant && body.participant !== '') {
                        filter.$and.push({ participant: { $eq: body.participant } });
                    }

                    if (body.main_person && body.main_person !== '') {
                        filter.$and.push({ main_person: { $eq: body.main_person } });
                    }

                    if (body.observer && body.observer !== '') {
                        filter.$and.push({ observer: { $eq: body.observer } });
                    }
                }

                break;

            case 'created':
                filter = {
                    $and: [
                        { project: { $eq: body.project } },
                        { username: { $eq: body.username } },
                        { $text: { $search: body.search } },
                    ],
                };
                if (body.search) {
                    filter.$and.push({ $text: { $search: body.search } });
                }

                if (body.status && body.status !== '') {
                    filter.$and.push({ status: { $eq: body.status } });
                }
                if (body.from_date && body.to_date) {
                    filter.$and.push({
                        $or: [
                            {
                                $and: [{ from_date: { $lte: body.from_date } }, { to_date: { $gte: body.from_date } }],
                            },
                            {
                                $and: [{ from_date: { $lte: body.to_date } }, { to_date: { $gte: body.to_date } }],
                            },
                            {
                                $and: [{ from_date: { $gte: body.from_date } }, { to_date: { $lte: body.to_date } }],
                            },
                            {
                                $and: [{ from_date: { $lte: body.from_date } }, { to_date: { $gte: body.to_date } }],
                            },
                            {
                                $and: [{ from_date: { $lte: body.from_date } }, { time_completed: { $gte: body.from_date } }],
                            },
                            {
                                $and: [{ from_date: { $lte: body.to_date } }, { time_completed: { $gte: body.to_date } }],
                            },
                            {
                                $and: [{ from_date: { $gte: body.from_date } }, { time_completed: { $lte: body.to_date } }],
                            },
                            {
                                $and: [{ from_date: { $lte: body.from_date } }, { time_completed: { $gte: body.to_date } }],
                            }
                        ],
                    });
                }
                if (body.participant && body.participant !== '') {
                    filter.$and.push({ participant: { $eq: body.participant } });
                }

                if (body.main_person && body.main_person !== '') {
                    filter.$and.push({ main_person: { $eq: body.main_person } });
                }

                if (body.observer && body.observer !== '') {
                    filter.$and.push({ observer: { $eq: body.observer } });
                }
                break;

            case 'assigned':
                filter = {
                    $and: [
                        { $text: { $search: body.search } },
                        { project: { $eq: body.project } },
                        {
                            $or: [
                                { main_person: { $eq: body.username } },
                                { participant: { $eq: body.username } },
                                { observer: { $eq: body.username } },
                            ],
                        },
                    ],
                };
                if (body.search) {
                    filter.$and.push({ $text: { $search: body.search } });
                }

                if (body.status && body.status !== '') {
                    filter.$and.push({ status: { $eq: body.status } });
                }
                if (body.from_date && body.to_date) {
                    filter.$and.push({
                        $or: [
                            {
                                $and: [{ from_date: { $lte: body.from_date } }, { to_date: { $gte: body.from_date } }]
                            },
                            {
                                $and: [{ from_date: { $lte: body.to_date } }, { to_date: { $gte: body.to_date } }]
                            },
                            {
                                $and: [{ from_date: { $gte: body.from_date } }, { to_date: { $lte: body.to_date } }]
                            },
                            {
                                $and: [{ from_date: { $lte: body.from_date } }, { to_date: { $gte: body.to_date } }]
                            },
                            {
                                $and: [{ from_date: { $lte: body.from_date } }, { time_completed: { $gte: body.from_date } }]
                            },
                            {
                                $and: [{ from_date: { $lte: body.to_date } }, { time_completed: { $gte: body.to_date } }]
                            },
                            {
                                $and: [{ from_date: { $gte: body.from_date } }, { time_completed: { $lte: body.to_date } }]
                            },
                            {
                                $and: [{ from_date: { $lte: body.from_date } }, { time_completed: { $gte: body.to_date } }]
                            }
                        ]
                    });
                }
                if (body.participant && body.participant !== '') {
                    filter.$and.push({ participant: { $eq: body.participant } });
                }

                if (body.main_person && body.main_person !== '') {
                    filter.$and.push({ main_person: { $eq: body.main_person } });
                }

                if (body.observer && body.observer !== '') {
                    filter.$and.push({ observer: { $eq: body.observer } });
                }
                break;

            case 'head_task':
                filter = {
                    $and: [
                        { project: { $eq: body.project } },
                        { level: { $in: [TASK_LEVEL.HEAD_TASK, TASK_LEVEL.TRANSFER_TICKET] } },
                        { status: { $nin: ['PendingApproval'] } },
                    ],
                };
                if (body.search) {
                    filter.$and.push({ $text: { $search: body.search } });
                }

                if (body.status && body.status !== '') {
                    filter.$and.push({ status: { $eq: body.status } });
                }
                if (body.from_date && body.to_date) {
                    filter.$and.push({
                        $or: [
                            {
                                $and: [{ from_date: { $lte: body.from_date } }, { to_date: { $gte: body.from_date } }]
                            },
                            {
                                $and: [{ from_date: { $lte: body.to_date } }, { to_date: { $gte: body.to_date } }]
                            },
                            {
                                $and: [{ from_date: { $gte: body.from_date } }, { to_date: { $lte: body.to_date } }]
                            },
                            {
                                $and: [{ from_date: { $lte: body.from_date } }, { to_date: { $gte: body.to_date } }]
                            },
                            {
                                $and: [{ from_date: { $lte: body.from_date } }, { time_completed: { $gte: body.from_date } }]
                            },
                            {
                                $and: [{ from_date: { $lte: body.to_date } }, { time_completed: { $gte: body.to_date } }]
                            },
                            {
                                $and: [{ from_date: { $gte: body.from_date } }, { time_completed: { $lte: body.to_date } }]
                            },
                            {
                                $and: [{ from_date: { $lte: body.from_date } }, { time_completed: { $gte: body.to_date } }]
                            }
                        ],
                    });
                }
                if (body.participant && body.participant !== '') {
                    filter.$and.push({ participant: { $eq: body.participant } });
                }

                if (body.main_person && body.main_person !== '') {
                    filter.$and.push({ main_person: { $eq: body.main_person } });
                }

                if (body.observer && body.observer !== '') {
                    filter.$and.push({ observer: { $eq: body.observer } });
                }
                break;

            case 'task':
                filter = {
                    $and: [
                        { project: { $eq: body.project } },
                        { $or: [{ level: { $eq: TASK_LEVEL.TASK } }, { level: { $exists: false } }] },
                    ],
                };
                if (body.search) {
                    filter.$and.push({ $text: { $search: body.search } });
                }

                if (body.status && body.status !== '') {
                    filter.$and.push({ status: { $eq: body.status } });
                }
                if (body.from_date && body.to_date) {
                    filter.$and.push({
                        $or: [
                            {
                                $and: [{ from_date: { $lte: body.from_date } }, { to_date: { $gte: body.from_date } }],
                            },
                            {
                                $and: [{ from_date: { $lte: body.to_date } }, { to_date: { $gte: body.to_date } }],
                            },
                            {
                                $and: [{ from_date: { $gte: body.from_date } }, { to_date: { $lte: body.to_date } }],
                            },
                            {
                                $and: [{ from_date: { $lte: body.from_date } }, { to_date: { $gte: body.to_date } }],
                            },
                            {
                                $and: [{ from_date: { $lte: body.from_date } }, { time_completed: { $gte: body.from_date } }],
                            },
                            {
                                $and: [{ from_date: { $lte: body.to_date } }, { time_completed: { $gte: body.to_date } }],
                            },
                            {
                                $and: [{ from_date: { $gte: body.from_date } }, { time_completed: { $lte: body.to_date } }],
                            },
                            {
                                $and: [{ from_date: { $lte: body.from_date } }, { time_completed: { $gte: body.to_date } }],
                            }
                        ],
                    });
                }
                if (body.participant && body.participant !== '') {
                    filter.$and.push({ participant: { $eq: body.participant } });
                }

                if (body.main_person && body.main_person !== '') {
                    filter.$and.push({ main_person: { $eq: body.main_person } });
                }

                if (body.observer && body.observer !== '') {
                    filter.$and.push({ observer: { $eq: body.observer } });
                }
                break;
        }

    }
    if (rule) {
        switch (rule.details.type) {
            case "All":
                generateFilter();
                dfd.resolve(filter);
                break;
            case "NotAllow":
                dfd.reject({ path: "TaskController.genFilter_base_project.NotPermission", mes: "NotPermission" });
                break;
            case "Specific":
                if (rule.details.project.indexOf(body.project) !== -1) {
                    generateFilter();
                    dfd.resolve(filter);
                } else {
                    dfd.reject({ path: "TaskController.genFilter_base_project.NotPermission", mes: "NotPermission" });
                }
                break;
            case "Self":
                TaskService.countProject(body._service[0].dbname_prefix, {
                    $and:
                        [
                            { username: { $eq: body.username } },
                            { _id: { $eq: new require('mongodb').ObjectID(body.project) } }
                        ]
                }).then(function (count) {
                    if (count > 0) {
                        generateFilter();
                        dfd.resolve(filter);
                    } else {
                        dfd.reject({ path: "TaskController.genFilter_base_project.NotPermission", mes: "NotPermission" });
                    }
                }, function (err) {
                    dfd.reject(err);
                });
                break;
            case "Join":
                TaskService.countProject(body._service[0].dbname_prefix, {
                    $and:
                        [
                            { participant: { $eq: body.username } },
                            { _id: { $eq: new require('mongodb').ObjectID(body.project) } }
                        ]
                }).then(function (count) {
                    if (count > 0) {
                        generateFilter();
                        dfd.resolve(filter);
                    } else {
                        dfd.reject({ path: "TaskController.genFilter_base_project.NotPermission", mes: "NotPermission" });
                    }
                }, function (err) {
                    dfd.reject(err);
                });
                break;
        }
    } else {
        dfd.reject({ path: "TaskController.genFilter_base_project.NotPermission", mes: "NotPermission" });
    }
    return dfd.promise;
}


const genData_comment = function (fields) {
    let result = {};
    let d = new Date();
    result.content = fields.content;
    result.code = fields.code;
    result.id = fields.id;
    result.type = fields.type;
    result.challenge_id = fields.challenge_id;
    result.time = d.getTime();
    return result;
}

const genData_updateComment = function (res) {
    let result = {};
    const fields = res.Fields;
    const attachment = [];

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

    result.task_id = fields.task_id;
    result.comment_id = fields.comment_id;
    result.content = fields.content;
    result.type = fields.type;
    result.attachment = attachment;
    result.date = new Date();
    return result;
}

const genData_proof = function (fields) {
    let result = {};
    let d = new Date();
    result.content = fields.content;
    result.taskId = fields.id;
    result.code = fields.code;
    result.time = d.getTime();
    return result;
}

const genData_done = function (fields) {
    let result = {};
    let d = new Date();
    result.content = fields.content;
    result.worktimes = fields.worktimes;
    result.taskId = fields.id;
    result.code = fields.code;
    result.time = d.getTime();
    result.subAttachment = JSON.parse(fields.subAttachment || '[]') || [];
    return result;
};

const genData_complete = function (fields) {
    let result = {};
    let d = new Date();
    result.content = fields.content;
    result.taskId = fields.id;
    result.code = fields.code;
    result.time = d.getTime();
    return result;
};

const genData_refune = function (fields) {
    let result = {};
    let d = new Date();
    result.content = fields.content;
    result.progress = fields.progress;
    result.taskId = fields.id;
    result.code = fields.code;
    result.time = d.getTime();
    return result;
};

function check_rule_department(body) {

    if (isUserAsAdmin(body.session)) {
        return {
            all: true,
        };
    }

    let ruleTask = body.session.rule.filter(e => e.rule === "Office.Task.Follow_Task_Department")[0];

    if (ruleTask && ruleTask.details.type === 'All') {
        return {
            all: true,
        };
    }

    let idAr_task = [];
    if (ruleTask) {
        switch (ruleTask.details.type) {
            case "Working":
                if (!body.department_id) {
                    idAr_task.push(body.session.employee_details.department);
                }
                break;
            case "Specific":
                idAr_task = ruleTask.details.department;
                break;
        }
    }

    return {
        all: false,
        department: idAr_task
    }
}

function generateDateString(datePOSIX) {
    let date = new Date(datePOSIX);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const formattedDate = `${year}/${month}/${day}`;
    return formattedDate;
}

function getDinstictUsers(tasks) {
    let userResult = []
    const usernameArray = tasks.map(e => e.username);
    const mainPersonUsernameArray = tasks.map(e => e.main_person);
    const participantUsernameArray = tasks.map(e => e.participant);
    const observerUsernameArray = tasks.map(e => e.observer);

    for (let i in usernameArray) {
        if (userResult.indexOf(usernameArray[i]) === -1) {
            userResult.push(usernameArray[i]);
        }
    }

    for (let i in mainPersonUsernameArray) {
        for (let j in mainPersonUsernameArray[i]) {
            if (userResult.indexOf(mainPersonUsernameArray[i][j]) === -1) {
                userResult.push(mainPersonUsernameArray[i][j]);
            }
        }
    }

    for (let i in participantUsernameArray) {
        for (let j in participantUsernameArray[i]) {
            if (userResult.indexOf(participantUsernameArray[i][j]) === -1) {
                userResult.push(participantUsernameArray[i][j]);
            }
        }
    }

    for (let i in observerUsernameArray) {
        for (let j in observerUsernameArray[i]) {
            if (userResult.indexOf(observerUsernameArray[i][j]) === -1) {
                userResult.push(observerUsernameArray[i][j]);
            }
        }
    }
    return userResult;
}

function getDinstictProject(tasks) {
    let result = [];
    for (let i in tasks) {
        if (tasks[i].in_project && result.indexOf(tasks[i].project) === -1) {
            result.push(tasks[i].project);
        }
    }
    return result;
}

function getDinstictDepartment(tasks) {
    let result = [];
    for (let i in tasks) {
        if (tasks[i].in_department && result.indexOf(tasks[i].department) === -1) {
            result.push(tasks[i].department);
        }
    }
    return result;
}

function generateDateForRexport(dbname_prefix, tasks) {
    let dfd = q.defer();
    let userDinstictArray = getDinstictUsers(tasks);
    let projectDinstictArray = getDinstictProject(tasks);
    let departmentDinstictArray = getDinstictDepartment(tasks);
    let dfdAr = [];
    dfdAr.push(UserService.loadUsers(dbname_prefix, userDinstictArray));
    dfdAr.push(ProjectService.getProjects(dbname_prefix, projectDinstictArray));
    dfdAr.push(DepartmentService.getDepartments(dbname_prefix, departmentDinstictArray));
    q.all(dfdAr).then(function (data) {

        tasks = stardardizeData(tasks, data[0]);
        for (let i in tasks) {
            if (tasks[i].in_project) {
                tasks[i].project_title = data[1].filter(e => e._id === tasks[i].project)[0].title;
            }
            if (tasks[i].in_department) {
                tasks[i].department_title = data[2].filter(e => e.id === tasks[i].department)[0].title;
            }

        }

        dfd.resolve(tasks);
    }, function (err) {
        dfd.reject(err);
    });
    return dfd.promise;
}

function checkRuleToExportAndImportTask(user, body) {

    const editTaskDepartmentRule = user.rule.find(rule => rule.rule === 'Office.Task.Import_Task_Department');

    if (editTaskDepartmentRule) {
        switch (editTaskDepartmentRule.details.type) {
            case "All":
                return true;
            case "NotAllow":
                return false;
            case "Specific":
                if (editTaskDepartmentRule.details.department.indexOf(body.department) !== -1) {
                    return true;
                } else {
                    return false;
                }
            case "Working":
                if (body.username && body.session.employee_details.department === body.department) {
                    return true;
                } else {
                    return false;
                }

            default:
                return false;
        }
    }
    return false;
}

function checkRuleToDeleteTask(user, task) {
    const dfd = q.defer();

    if (task.in_department === true) {
        if (task.username === user.username && user.department === task.department) {
            dfd.resolve(true);
        } else {
            switch (task.level) {
                case "HeadTask":
                case "TransferTicket":
                case "Task":
                default:
                    if (task.level === 'Task') {
                        if (task.main_person.includes(user.username) ||
                            task.participant.includes(user.username) ||
                            task.observer.includes(user.username)) {
                            dfd.resolve(true);
                        } else {
                            TaskService.loadDetails(dbname_prefix, task.head_task_id, '').then(taskDetails => {
                                if (taskDetails.main_person.includes(user.username) ||
                                    taskDetails.participant.includes(user.username) ||
                                    taskDetails.observer.includes(user.username)) {
                                    dfd.resolve(true);
                                } else {
                                    dfd.reject(false);
                                }
                            }).catch(err => {
                                dfd.reject(err);
                            });
                        }
                    }
                    else {
                        const editTaskDepartmentRule = user.rule.find(rule => rule.rule === 'Office.Task.Delete_Task_Department');
                        if (editTaskDepartmentRule) {
                            switch (editTaskDepartmentRule.details.type) {
                                case "All":
                                    dfd.resolve(true);
                                    break;
                                case "NotAllow":
                                    dfd.reject(false);
                                    break;
                                case "Specific":
                                    if (editTaskDepartmentRule.details.department.includes(task.department)) {
                                        dfd.resolve(true);
                                    } else {
                                        dfd.reject(false);
                                    }
                                    break;
                                case "Working":
                                    if (task.department === user.department) {
                                        dfd.resolve(true);
                                    } else {
                                        dfd.reject(false);
                                    }
                                    break;
                                default:
                                    dfd.reject(false);
                            }
                        } else {
                            dfd.reject(false);
                        }
                    }
            }
        }
    } else if (task.in_project === true) {
        if (task.username === user.username) {
            dfd.resolve(true);
        } else {
            switch (task.level) {
                case "HeadTask":
                case "TransferTicket":
                case "Task":
                default:
                    const editTaskProjectRule = user.rule.find(rule => rule.rule === 'Office.Task.Delete_Task_Project');
                    if (editTaskProjectRule) {
                        switch (editTaskProjectRule.details.type) {
                            case "All":
                                dfd.resolve(true);
                                break;
                            case "NotAllow":
                                dfd.reject(false);
                                break;
                            case "Specific":
                                if (editTaskProjectRule.details.project.includes(task.project)) {
                                    dfd.resolve(true);
                                } else {
                                    dfd.reject(false);
                                }
                                break;
                            case "Join":
                                ProjectService.getProjectById(dbname_prefix, task.project)
                                    .then(projectDetails => {
                                        if (projectDetails.participant && projectDetails.participant.includes(user.username)) {
                                            dfd.resolve(true);
                                        } else {
                                            dfd.reject(false);
                                        }
                                    })
                                    .catch(err => {
                                        dfd.reject(err);
                                    });
                                break;
                            default:
                                dfd.reject(false);
                        }
                    } else {
                        dfd.reject(false);
                    }
            }
        }
    } else {
        dfd.reject(false);
    }

    return dfd.promise;
}

function checkRuleToCompleteTask(user, task) {
    const dfd = q.defer();

    if (task.in_department === true) {
        if (task.username === user.username && user.department === task.department) {
            dfd.resolve(true);
        } else {
            switch (task.level) {
                case "HeadTask":
                case "TransferTicket":
                    let ruleManage_leader_department = checkRuleRadioDepartment(user.rule, task.department_assign_id, user.department, TASK_RULE.DEPARTMENT_LEADER_MANAGE)
                    let ruleManage_leader = checkRuleRadioDepartment(user.rule, task.department_assign_id, user.department, TASK_RULE.LEADER_MANAGE)
                    let ruleManage_director = checkRuleCheckBox(TASK_RULE.DIRECTOR_MANAGE, user);

                    if (ruleManage_leader_department || ruleManage_leader || ruleManage_director) {
                        dfd.resolve(true);
                    } else {
                        dfd.reject(false);
                    }
                    break;
                case "Task":
                default:
                    if (task.level === 'Task') {
                        if (task.main_person.includes(user.username) ||
                            task.participant.includes(user.username) ||
                            task.observer.includes(user.username)) {
                            dfd.resolve(true);
                        } else {
                            TaskService.loadDetails(dbname_prefix, task.head_task_id, '').then(taskDetails => {
                                if (taskDetails.main_person.includes(user.username) ||
                                    taskDetails.participant.includes(user.username) ||
                                    taskDetails.observer.includes(user.username)) {
                                    dfd.resolve(true);
                                } else {
                                    dfd.reject(false);
                                }
                            }).catch(err => {
                                dfd.reject(err);
                            });
                        }
                    }
                    else {
                        let ruleManage_leader_department = checkRuleRadioDepartment(user.rule, task.from_department, user.department, TASK_RULE.DEPARTMENT_LEADER_MANAGE)
                        let ruleManage_leader = checkRuleRadioDepartment(user.rule, task.from_department, user.department, TASK_RULE.LEADER_MANAGE)
                        let ruleManage_director = checkRuleCheckBox(TASK_RULE.DIRECTOR_MANAGE, user);

                        if (ruleManage_leader_department || ruleManage_leader || ruleManage_director) {
                            dfd.resolve(true);
                        } else {
                            dfd.reject(false);
                        }
                    }
            }
        }
    } else if (task.in_project === true) {
        if (task.username === user.username) {
            dfd.resolve(true);
        } else {
            switch (task.level) {
                case "HeadTask":
                case "TransferTicket":
                case "Task":
                default:
                    const editTaskProjectRule = user.rule.find(rule => rule.rule === 'Office.Task.Complete_Task_Project');
                    if (editTaskProjectRule) {
                        switch (editTaskProjectRule.details.type) {
                            case "All":
                                dfd.resolve(true);
                                break;
                            case "NotAllow":
                                dfd.reject(false);
                                break;
                            case "Specific":
                                if (editTaskProjectRule.details.project.includes(task.project)) {
                                    dfd.resolve(true);
                                } else {
                                    dfd.reject(false);
                                }
                                break;
                            case "Join":
                                ProjectService.getProjectById(dbname_prefix, task.project)
                                    .then(projectDetails => {
                                        if (projectDetails.participant && projectDetails.participant.includes(user.username)) {
                                            dfd.resolve(true);
                                        } else {
                                            dfd.reject(false);
                                        }
                                    })
                                    .catch(err => {
                                        dfd.reject(err);
                                    });
                                break;
                            default:
                                dfd.reject(false);
                        }
                    } else {
                        dfd.reject(false);
                    }
            }
        }
    } else {
        dfd.reject(false);
    }

    return dfd.promise;
}

function checkRuleToEditTask(user, task) {
    const dfd = q.defer();

    if (task.in_department === true) {
        if (task.username === user.username && user.department === task.department) {
            dfd.resolve(true);
        } else {
            switch (task.level) {
                case "HeadTask":
                case "TransferTicket":
                case "Task":
                default:
                    if (task.level === 'Task') {
                        if (task.main_person.includes(user.username) ||
                            task.participant.includes(user.username) ||
                            task.observer.includes(user.username)) {
                            dfd.resolve(true);
                        } else {
                            TaskService.loadDetails(dbname_prefix, task.head_task_id, '').then(taskDetails => {
                                if (taskDetails.main_person.includes(user.username) ||
                                    taskDetails.participant.includes(user.username) ||
                                    taskDetails.observer.includes(user.username)) {
                                    dfd.resolve(true);
                                } else {
                                    dfd.reject(false);
                                }
                            }).catch(err => {
                                dfd.reject(err);
                            });
                        }
                    }
                    else {
                        const editTaskDepartmentRule = user.rule.find(rule => rule.rule === 'Office.Task.Edit_Task_Department');
                        if (editTaskDepartmentRule) {
                            switch (editTaskDepartmentRule.details.type) {
                                case "All":
                                    dfd.resolve(true);
                                    break;
                                case "NotAllow":
                                    dfd.reject(false);
                                    break;
                                case "Specific":
                                    if (editTaskDepartmentRule.details.department.includes(task.department)) {
                                        dfd.resolve(true);
                                    } else {
                                        dfd.reject(false);
                                    }
                                    break;
                                case "Working":
                                    if (task.department === user.department) {
                                        dfd.resolve(true);
                                    } else {
                                        dfd.reject(false);
                                    }
                                    break;
                                default:
                                    dfd.reject(false);
                            }
                        } else {
                            dfd.reject(false);
                        }
                    }
            }
        }
    } else if (task.in_project === true) {
        if (task.username === user.username) {
            dfd.resolve(true);
        } else {
            switch (task.level) {
                case "HeadTask":
                case "TransferTicket":
                case "Task":
                default:
                    const editTaskProjectRule = user.rule.find(rule => rule.rule === 'Office.Task.Edit_Task_Project');
                    if (editTaskProjectRule) {
                        switch (editTaskProjectRule.details.type) {
                            case "All":
                                dfd.resolve(true);
                                break;
                            case "NotAllow":
                                dfd.reject(false);
                                break;
                            case "Specific":
                                if (editTaskProjectRule.details.project.includes(task.project)) {
                                    dfd.resolve(true);
                                } else {
                                    dfd.reject(false);
                                }
                                break;
                            case "Join":
                                ProjectService.getProjectById(dbname_prefix, task.project)
                                    .then(projectDetails => {
                                        if (projectDetails.participant && projectDetails.participant.includes(user.username)) {
                                            dfd.resolve(true);
                                        } else {
                                            dfd.reject(false);
                                        }
                                    })
                                    .catch(err => {
                                        dfd.reject(err);
                                    });
                                break;
                            default:
                                dfd.reject(false);
                        }
                    } else {
                        dfd.reject(false);
                    }
            }
        }
    } else {
        dfd.reject(false);
    }

    return dfd.promise;
}

function checkRuleToEditTaskDetails(user, task) {
    const dfd = q.defer();

    if (task.in_department === true) {
        if (task.username === user.username && user.department === task.from_department) {
            dfd.resolve(true);
        } else {
            switch (task.level) {
                case "HeadTask":
                case "TransferTicket":
                case "Task":
                default:
                    if (task.level === 'Task') {
                        if (task.main_person.includes(user.username) ||
                            task.participant.includes(user.username) ||
                            task.observer.includes(user.username)) {
                            dfd.resolve(true);
                        } else {
                            TaskService.loadDetails(dbname_prefix, task.head_task_id, '').then(taskDetails => {
                                if (taskDetails.main_person.includes(user.username) ||
                                    taskDetails.participant.includes(user.username) ||
                                    taskDetails.observer.includes(user.username)) {
                                    dfd.resolve(true);
                                } else {
                                    dfd.reject(false);
                                }
                            }).catch(err => {
                                dfd.reject(err);
                            });
                        }
                    }
                    else if (task.main_person.includes(user.username) ||
                        task.participant.includes(user.username) ||
                        task.observer.includes(user.username)) {
                        dfd.resolve(true);
                    } else {
                        const editTaskDepartmentRule = user.rule.find(rule => rule.rule === 'Office.Task.Edit_Task_Department');
                        if (editTaskDepartmentRule) {
                            switch (editTaskDepartmentRule.details.type) {
                                case "All":
                                    dfd.resolve(true);
                                    break;
                                case "NotAllow":
                                    dfd.reject(false);
                                    break;
                                case "Specific":
                                    if (editTaskDepartmentRule.details.department.includes(task.department)) {
                                        dfd.resolve(true);
                                    } else {
                                        dfd.reject(false);
                                    }
                                    break;
                                case "Working":
                                    if (task.department === user.department) {
                                        dfd.resolve(true);
                                    } else {
                                        dfd.reject(false);
                                    }
                                    break;
                                default:
                                    dfd.reject(false);
                            }
                        } else {
                            dfd.reject(false);
                        }
                    }
            }
        }
    } else if (task.in_project === true) {
        if (task.username === user.username) {
            dfd.resolve(true);
        } else {
            switch (task.level) {
                case "HeadTask":
                case "TransferTicket":
                case "Task":
                default:
                    if (task.main_person.includes(user.username) ||
                        task.participant.includes(user.username) ||
                        task.observer.includes(user.username)) {
                        dfd.resolve(true);
                    } else {
                        const editTaskProjectRule = user.rule.find(rule => rule.rule === 'Office.Task.Edit_Task_Project');
                        if (editTaskProjectRule) {
                            switch (editTaskProjectRule.details.type) {
                                case "All":
                                    dfd.resolve(true);
                                    break;
                                case "NotAllow":
                                    dfd.reject(false);
                                    break;
                                case "Specific":
                                    if (editTaskProjectRule.details.project.includes(task.project)) {
                                        dfd.resolve(true);
                                    } else {
                                        dfd.reject(false);
                                    }
                                    break;
                                case "Join":
                                    ProjectService.getProjectById(dbname_prefix, task.project)
                                        .then(projectDetails => {
                                            if (projectDetails.participant && projectDetails.participant.includes(user.username)) {
                                                dfd.resolve(true);
                                            } else {
                                                dfd.reject(false);
                                            }
                                        })
                                        .catch(err => {
                                            dfd.reject(err);
                                        });
                                    break;
                                default:
                                    dfd.reject(false);
                            }
                        } else {
                            dfd.reject(false);
                        }
                    }
            }
        }
    } else {
        dfd.reject(false);
    }

    return dfd.promise;
}

function stardardizeData(tasks, users) {
    let copiedTasks = _.cloneDeep(tasks);
    let copiedUsers = _.cloneDeep(users);

    for (let i in copiedTasks) {
        copiedTasks[i].username_title = copiedUsers.filter(e => e.username === copiedTasks[i].username)[0].title;
        copiedTasks[i].main_person_title = [];
        copiedTasks[i].participant_title = [];
        copiedTasks[i].observer_title = [];
        for (let j in copiedTasks[i].main_person) {
            copiedTasks[i].main_person_title.push(
                copiedUsers.filter(e => e.username === copiedTasks[i].main_person[j])[0].title
            );
        }
        for (let j in copiedTasks[i].participant) {
            copiedTasks[i].participant_title.push(
                copiedUsers.filter(e => e.username === copiedTasks[i].participant[j])[0].title
            );
        }
        for (let j in copiedTasks[i].observer) {
            copiedTasks[i].observer_title.push(
                copiedUsers.filter(e => e.username === copiedTasks[i].observer[j])[0].title
            );
        }
        copiedTasks[i].link = `/task-details?${copiedTasks[i]._id}`
        copiedTasks[i].to_date_string = generateDateString(copiedTasks[i].to_date);
        copiedTasks[i].from_date_string = generateDateString(copiedTasks[i].from_date);
    }

    return copiedTasks;
}

function loadTaskReferences(dbname_prefix, task, department, options = {}) {
    let dfd = q.defer();
    const expands = options.expands || DEFAULT_EXPANDS;
    const promises = expands.map((expand) => MAP_EXPANDS[expand](dbname_prefix, task, department));
    q.all(promises)
        .then(() => {
            dfd.resolve(task);
        })
        .catch((err) => {
            dfd.reject(err);
        });
    return dfd.promise;
}

function loadExcelTemplate(fileName) {
    const dfd = q.defer();
    FileProvider.downloadBuffer(`templates/${fileName}`)
        .then((buffer) => {
            const workbook = new ExcelJS.Workbook();
            return workbook.xlsx.load(buffer);
        })
        .then((workbook) => {
            dfd.resolve(workbook);
        })
        .catch((err) => {
            dfd.reject(err);
        });
    return dfd.promise;
}

function getStateOfTask(task) {
    const today = new Date().getTime();
    const totalDuration = task.to_date - task.from_date;
    const elapsedDuration = today - task.from_date;

    if (task.status === 'Completed') {
        return 'OnSchedule';
    }

    let state = '';
    if (task.to_date < today) {
        state = 'Overdue';
    } else if (elapsedDuration > (totalDuration / 2) && (task.process || 0) < 50) {
        state = 'GonnaLate';
    } else {
        state = 'OnSchedule';
    }

    return state;
}


function getUsernameQuickActionToNotify(users, task) {
    return users.map((user) => {
        let ruleManage_leader_department = checkRuleRadioDepartment(user.rule, task.department, user.department, TASK_RULE.DEPARTMENT_LEADER_MANAGE)
        if (task.level == 'TransferTicket') {
            ruleManage_leader_department = ruleManage_leader_department ||
            checkRuleRadioDepartment(user.rule, task.department_assign_id, user.department, TASK_RULE.DEPARTMENT_LEADER_MANAGE)
        }

        let ruleManage_leader = checkRuleRadioDepartment(user.rule, task.department, user.department, TASK_RULE.LEADER_MANAGE)
        let ruleManage_director = checkRuleCheckBox(TASK_RULE.DIRECTOR_MANAGE, user);
        if (ruleManage_director || ruleManage_leader || ruleManage_leader_department) {
            return user.username;
        }
    })
}

function getDispatchArrivedDetail(dbPrefix, task) {
    const dfd = q.defer();
    q.fcall(() => {
        let promise = null;
        if (task.parent && task.parent.object === OBJECT_NAME.DISPATCH_ARRIVED) {
            promise = DispatchArrivedService.getDetailById(dbPrefix, task.parent.value);
        }
        return promise;
    })
        .then((dispatchArrived) => {
            if (dispatchArrived) {
                const dispatchAttachments = dispatchArrived.attachments || [];
                Object.assign(task, {
                    dispatch_arrived: dispatchArrived,
                    attachment: task.attachment.concat(dispatchAttachments),
                });
            }
            dfd.resolve(task);
        })
        .catch((error) => {
            LogProvider.error("Error while getting dispatch arrived detail", error);
            dfd.resolve(task);
        });
    return dfd.promise;
}

function getWorkflowPlayDetail(dbPrefix, task) {
    const dfd = q.defer();
    q.fcall(() => {
        return WFPService.loadWorkflowPlayByTaskId(dbPrefix, undefined, task._id.toString());
    })
        .then((workflowPlayDetail) => {
            if (workflowPlayDetail) {
                Object.assign(task, { workflow_play: workflowPlayDetail });
            }
            dfd.resolve(task);
        })
        .catch((error) => {
            LogProvider.error("Error while getting workflow play detail", error);
            dfd.resolve(task);
        });
    return dfd.promise;
}

function getChildTaskDetail(dbPrefix, task) {
    const dfd = q.defer();
    q.fcall(() => {
        // if (![TASK_LEVEL.HEAD_TASK, TASK_LEVEL.TRANSFER_TICKET].includes(task.level)) {
        //     return [];
        // }

        return WorkItemService.getHeadTaskWorkItems(dbPrefix, task._id.toString());
    })
        .then((childTasks) => {
            const workItem = childTasks.filter((item) => { return item.level !== TASK_LEVEL.TRANSFER_TICKET })
            const transferItem = childTasks.filter((item) => { return item.level === TASK_LEVEL.TRANSFER_TICKET })
            if (workItem.length > 0) {
                const workItemsClone = [...workItem];
                workItemsClone.forEach((item) => {
                    item.state = getStateOfTask(item);
                });
            }
            Object.assign(task, { work_items: workItem });
            Object.assign(task, { transfer_items: transferItem })
            dfd.resolve(task);
        })
        .catch((error) => {
            LogProvider.error("Error while getting child task detail", error);
            dfd.resolve(task);
        });
    return dfd.promise;
}

function getParentTaskDetail(dbPrefix, task) {
    const dfd = q.defer();
    q.fcall(() => {
        if ( !task.parent || !task.parent.value || ![TASK_LEVEL.TASK].includes(task.level)) {
            return null;
        }

        return WorkItemService.getHeadTask(dbPrefix, task.parent.value.toString());
    })
        .then((parentTask) => {
            Object.assign(task, { parent_task : parentTask[0] })
            dfd.resolve(task);
        })
        .catch((error) => {
            LogProvider.error("Error while getting parent task detail", error);
            dfd.resolve(task);
        });
    return dfd.promise;
}


function getDepartmentDetail(dbPrefix, task) {
    if (!task.department) {
        return q.resolve(task);
    }

    const dfd = q.defer();
    q.fcall(() => {
        return DepartmentService.getDepartmentById(dbPrefix, task.department);
    })
        .then((department) => {
            Object.assign(task, { department: department });
            dfd.resolve(task);
        })
        .catch((error) => {
            dfd.resolve(task);
        });
    return dfd.promise;
}

function notify(req, filter, action, params, from_action){
    UserService.loadAggregateUser(req.body._service[0].dbname_prefix, filter).then(function (users) {
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
        );
        
    }, function (err) {
        console.log(err);
    })
}

class TaskController {
    constructor() { }

    loadEmployee(body) {
        return TaskService.loadEmployee(body._service[0].dbname_prefix, body.department, body.username_details.competence, body.username, body.session.rule);
    }

    load_department(body) {
        let dfd = q.defer();
        let check = check_rule_department(body);
        let filter = {};
        if (check.all || check.department.length > 0) {
            DepartmentService.load_department(body._service[0].dbname_prefix, body, check)
                .then(
                    function (data) {
                        dfd.resolve(data);
                    },
                    function (err) {
                        dfd.reject(err);
                    },
                );
        } else {
            dfd.reject({
                path: 'TaskController.load_base_department.NotPermission',
                mes: 'NotPermission',
            });
        }

        return dfd.promise;
    }

    loadDetails(body, expands = []) {
        let dfd = q.defer();
        TaskService.loadDetails(body._service[0].dbname_prefix, body.id, body.code)
            .then((task) => {
                return q.all([
                    task,
                    loadTaskReferences(body._service[0].dbname_prefix, task, { expands }),
                ]);
            })
            .then(([task]) => {
                return q.resolve(Object.assign(task, { state: getStateOfTask(task) }));
            })
            .then((task) => {
                return q.all([
                    task,
                    WorkItemService.checkUserHaveRuleToCreateTaskFromHeadTask(
                        body._service[0].dbname_prefix,
                        body.session,
                        task,
                    ),
                    TaskService.checkRuleToEditProgress(body.session, task),
                ]);
            })
            .then(([task, canCreateTask, canEditProgress]) => {
                Object.assign(task, {
                    addWorkItemFlag: canCreateTask,
                    editProgressFlag: canEditProgress,
                });
                return resolveParents(body._service[0].dbname_prefix, task);
            })
            .then((task) => {
                dfd.resolve(task);
            })
            .catch((err) => {
                dfd.reject(err);
            });
        return dfd.promise;
    }

    loadChild(body) {
        let ar = [];
        for (var i in body.ids) {
            ar.push(new require('mongodb').ObjectID(body.ids[i]));
        }
        return TaskService.loadList(body._service[0].dbname_prefix, { _id: { $in: ar } }, 100, 0, { _id: -1 });
    }

    load_base_department(body) {
        const dfd = q.defer();
        const dbPrefix = body._service[0].dbname_prefix;
        const permissionCheck = checkPermissionFollowDepartment(body.session, body.department);

        q.fcall(() => {
            if (!permissionCheck.check) {
                return dfd.reject({
                    path: "TaskController.load_base_department.NotPermission",
                    mes: "NotPermission",
                });
            }
            return q.resolve();
        })
            .then((users) => {
                return TaskService.loadBaseDepartment(dbPrefix, body, permissionCheck);
            })
            .then((tasks) => {
                return q.all(tasks.map((task) => loadTaskReferences(body._service[0].dbname_prefix, task, body.department)));
            })
            .then((tasks) => {
                return q.all(tasks.map((task) => TaskTemplateService.getRepetitiveInformation(dbPrefix, task)));
            })
            .then((tasks) => {
                dfd.resolve(tasks);
            })
            .catch((error) => {
                dfd.reject(error);
            });
        return dfd.promise;
    }

    count_base_department(body) {

        const dfd = q.defer();
        const dbPrefix = body._service[0].dbname_prefix;
        const permissionCheck = checkPermissionFollowDepartment(body.session, body.department);

        q.fcall(() => {
            if (!permissionCheck.check) {
                return dfd.reject({
                    path: 'TaskController.load_base_department.NotPermission',
                    mes: 'NotPermission',
                });
            }
            return q.resolve();
        })
            .then(() => {
                return TaskService.countBaseDepartment(dbPrefix, body, permissionCheck);
            })
            .then((result) => {
                if (Array.isArray(result) && result.length > 0) {
                    dfd.resolve(result[0]);
                } else {
                    dfd.resolve({
                        count: 0,
                    });
                }
            })
            .catch(err => {
                dfd.reject(err);
            });

        return dfd.promise;
    }

    ganttChart_base_department(body) {
        const dfd = q.defer();
        const dbPrefix = body._service[0].dbname_prefix;
        const permissionCheck = checkPermissionFollowDepartment(body.session, body.department);

        q.fcall(() => {
            if (!permissionCheck.check) {
                return dfd.reject({
                    path: "TaskController.load_base_department.NotPermission",
                    mes: "NotPermission",
                });
            }
            return q.resolve();
        })
            .then(() => {
                return TaskService.ganttChartBaseDepartment(dbPrefix, body, permissionCheck);
            })
            .then((result) => {
                dfd.resolve(result);
            })
            .catch((err) => {
                dfd.reject(err);
            });
        return dfd.promise;
    }

    statistic_department_count(body) {
        const dfd = q.defer();
        const dbPrefix = body._service[0].dbname_prefix;
        TaskService.statisticDepartmentCount(dbPrefix, body)
            .then(dfd.resolve)
            .catch(dfd.reject);
        return dfd.promise;
    }

    statistic_department_growth(body) {
        const dfd = q.defer();
        const dbPrefix = body._service[0].dbname_prefix;
        TaskService.statisticDepartmentGrowth(dbPrefix, body)
            .then(dfd.resolve)
            .catch(dfd.reject);
        return dfd.promise;
    }

    load_base_project(body) {
        let dfd = q.defer();
        const dbPrefix = body._service[0].dbname_prefix;
        checkPermissionFollowProject(body, body.project)
            .then(result => {
                if (!result.check) {
                    dfd.reject({ path: "TaskController.genFilter_base_project.NotPermission", mes: "NotPermission" });
                }
                return TaskService.loadBaseProject(dbPrefix, body, result);
            })
            .then(data => {
                const listOfWorkflowPlayId = data.reduce((pre, task) => {
                    if (task.workflowPlay_id) {
                        pre.push(task.workflowPlay_id);
                    }
                    return pre;
                }, []);

                let tasks = [];
                q.all(listOfWorkflowPlayId.map(id => WorkflowPlayService.getWorkFlowDetailsById(
                    body._service[0].dbname_prefix,
                    id,
                )))
                    .then(listOfWorkflowPlay => {
                        tasks = data.map(task => {
                            if (task.workflowPlay_id) {
                                task.workflowPlay =
                                    listOfWorkflowPlay.find(workflowPlay => workflowPlay._id == task.workflowPlay_id);
                            }
                            return task;
                        });
                        return q.all(tasks.map(task => loadTaskReferences(body._service[0].dbname_prefix, task)));
                    })
                    .then(function () {
                        dfd.resolve(tasks);
                    })
                    .catch(function (error) {
                        LogProvider.error("Can not load base for project with reason: " + error.mess || error.message || error);
                        dfd.reject({
                            path: "TaskController.load_base_project.err",
                            mes: "LoadBaseForProjectFailed",
                        });
                    });
            })
            .catch(dfd.reject)
        return dfd.promise;
    }

    load_project_by_id(body) {
        return TaskService.loadProjectById(body._service[0].dbname_prefix, body)
    }


    count_base_project(body) {
        let dfd = q.defer();
        const dbPrefix = body._service[0].dbname_prefix;
        checkPermissionFollowProject(body, body.project)
            .then(result => {
                if (!result.check) {
                    dfd.reject({
                        path: "TaskController.genFilter_base_project.NotPermission",
                        mes: "NotPermission",
                    });
                }
                return TaskService.countBaseProject(dbPrefix, body, result);
            })
            .then((result) => {
                if (Array.isArray(result) && result.length > 0) {
                    dfd.resolve(result[0]);
                } else {
                    dfd.resolve({
                        count: 0,
                    });
                }
            })
            .catch(err => {
                dfd.reject(err);
            });
        return dfd.promise;
    }

    ganttChart_base_project(body) {
        const dfd = q.defer();
        const dbPrefix = body._service[0].dbname_prefix;
        checkPermissionFollowProject(body, body.project)
            .then(result => {
                if (!result.check) {
                    dfd.reject({
                        path: "TaskController.genFilter_base_project.NotPermission",
                        mes: "NotPermission",
                    });
                }
                return TaskService.ganttChartBaseProject(dbPrefix, body, result);
            })
            .then((result) => {
                dfd.resolve(result);
            })
            .catch((err) => {
                dfd.reject(err);
            });
        return dfd.promise;
    }

    statistic_project_count(body) {
        const dfd = q.defer();
        const dbPrefix = body._service[0].dbname_prefix;
        checkPermissionFollowProject(body, body.project)
            .then(result => {
                if (!result.check) {
                    dfd.reject({
                        path: "TaskController.genFilter_base_project.NotPermission",
                        mes: "NotPermission",
                    });
                }
                return TaskService.statisticProjectCount(dbPrefix, body);
            })
            .then((result) => {
                dfd.resolve(result);
            })
            .catch((err) => {
                dfd.reject(err);
            });
        return dfd.promise;
    }

    statistic_project_growth(body) {
        const dfd = q.defer();
        const dbPrefix = body._service[0].dbname_prefix;
        checkPermissionFollowProject(body, body.project)
            .then(result => {
                if (!result.check) {
                    dfd.reject({
                        path: "TaskController.genFilter_base_project.NotPermission",
                        mes: "NotPermission",
                    });
                }
                return TaskService.statisticProjectGrowth(dbPrefix, body);
            })
            .then((result) => {
                dfd.resolve(result);
            })
            .catch((err) => {
                dfd.reject(err);
            });
        return dfd.promise;
    }

    load(body) {
        let dfd = q.defer();
        const dbPrefix = body._service[0].dbname_prefix;

        TaskService.loadBasePersonal(dbPrefix, body)
            .then(function (data) {
                const listOfWorkflowPlayId = data.reduce((pre, task) => {
                    if (task.workflowPlay_id) {
                        pre.push(task.workflowPlay_id);
                    }
                    return pre;
                }, []);
                let tasks = [];

                q.all(listOfWorkflowPlayId.map(id => WorkflowPlayService.getWorkFlowDetailsById(
                    body._service[0].dbname_prefix,
                    id,
                )))
                    .then(listOfWorkflowPlay => {
                        tasks = data.map(task => {
                            if (task.workflowPlay_id) {
                                task.workflowPlay =
                                    listOfWorkflowPlay.find(workflowPlay => workflowPlay._id == task.workflowPlay_id);
                            }
                            task.editTaskEligible = checkRuleToEditTask(body.session, task);
                            return task;
                        });
                        return q.all(tasks.map(task => TaskTemplateService.getRepetitiveInformation(dbPrefix, task)));
                    }).then(function () {
                        dfd.resolve(tasks);
                    });

            })
            .catch((error) => {
                dfd.reject(error);
            });

        return dfd.promise;

    }

    count(body) {
        let dfd = q.defer();
        const dbPrefix = body._service[0].dbname_prefix;
        TaskService.countBasePersonal(dbPrefix, body)
            .then((result) => {
                if (Array.isArray(result) && result.length > 0) {
                    dfd.resolve(result[0]);
                } else {
                    dfd.resolve({
                        count: 0,
                    });
                }
            })
            .catch(err => {
                dfd.reject(err);
            });
        return dfd.promise;
    }

    load_quickhandle(body) {
        let dfd = q.defer();
        if (!body.session.employee_details) {
            dfd.resolve([]);
        }
        else {
            const aggerationSearch = BuildFilterAggregate.generateUIFilterAggregate_search([], body);
            BuildFilterAggregate.generatePermissionAggregate_QuickHandle(
                body._service[0].dbname_prefix, body.username,
                body.session.employee_details.department,
                body.session.rule,
                body.is_get_all,
                aggerationSearch
            ).then(function (aggerationSteps) {
                const queryCriteria = { ...body };
                const filter = BuildFilterAggregate.generateUIFilterAggregate_load(aggerationSteps, queryCriteria);
                TaskService.load_quickhandle(body._service[0].dbname_prefix, filter).then(function (data) {
                    dfd.resolve(data);
                }, function (err) {
                    dfd.reject(err)
                })
            }, function (err) { dfd.reject(err) })
        }
        return dfd.promise;
    }

    count_quickhandle(body) {
        let dfd = q.defer();
        const aggerationSearch = BuildFilterAggregate.generateUIFilterAggregate_search([], body);
        BuildFilterAggregate.generatePermissionAggregate_QuickHandle(
            body._service[0].dbname_prefix, body.username,
            body.session.employee_details.department,
            body.session.rule,
            body.is_get_all,
            aggerationSearch
        ).then(function (aggerationSteps) {
            const queryCriteria = { ...body };
            const filter = BuildFilterAggregate.generateUIFilterAggregate_count(aggerationSteps, queryCriteria);
            TaskService.count_quickhandle(body._service[0].dbname_prefix, filter).then(function (data) {
                dfd.resolve(data);
            }, function (err) {
                dfd.reject(err)
            })
        }, function (err) { dfd.reject(err) })
        return dfd.promise;
    }

    statistic_personal_count(body) {
        const dbPrefix = body._service[0].dbname_prefix;
        return TaskService.statisticPersonalCount(dbPrefix, body);
    }

    statistic_personal_growth(body) {
        const dbPrefix = body._service[0].dbname_prefix;
        return TaskService.statisticPersonalGrowth(dbPrefix, body);
    }

    export_personal(body) {
        let dfd = q.defer();
        let count = countFilter(body);
        let filter = genFilter(body, count);
        TaskService.loadListForExport(body._service[0].dbname_prefix, filter).then(function (tasks) {
            generateDateForRexport(body._service[0].dbname_prefix, tasks).then(
                function (data) { dfd.resolve(data); },
                function (err) { dfd.reject(err); }
            );
        }, function (err) {
            dfd.reject(err);
        });
        return dfd.promise;
    }

    export_project(body) {
        let dfd = q.defer();
        genFilter_base_project(body).then(function (filter) {
            TaskService.loadListForExport(body._service[0].dbname_prefix, filter).then(function (tasks) {
                generateDateForRexport(body._service[0].dbname_prefix, tasks).then(
                    function (data) { dfd.resolve(data); },
                    function (err) { dfd.reject(err); }
                );
            }, function (err) {
                dfd.reject(err);
            });
        }, function (err) {
            dfd.reject(err);
        });
        return dfd.promise;
    }

    export_department(body) {
        let dfd = q.defer();
        let gen = genFilter_base_department(body)
        if (checkRuleToExportAndImportTask(body.session, body)) {
            if (gen.check) {
                let count = countFilter(body);
                let filter = genFilter(body, count);
                TaskService.loadListForExport(body._service[0].dbname_prefix, filter).then(function (tasks) {
                    generateDateForRexport(body._service[0].dbname_prefix, tasks).then(
                        function (data) { dfd.resolve(data); },
                        function (err) { dfd.reject(err); }
                    );
                }, function (err) {
                    dfd.reject(err);
                });
            } else {
                dfd.reject({ path: "TaskController.export_department.GenCheckFailed", mes: "Gen check failed." });
            }
        } else {
            dfd.reject({ path: "TaskController.export_department.NotPermission", mes: "NotPermission" });
        }

        return dfd.promise;
    }

    load_template(req) {
        const dfd = q.defer();
        const workbook = new ExcelJS.Workbook();

        FileProvider.downloadBuffer('templates/taskImport_template_ver5.xlsx').then(
            (res) => workbook.xlsx.load(res),
            dfd.reject,
        ).then(
            () => {
                /* Template info
                    Sheets: Danh sách công việc | Nhân viên | Độ ưu tiên
                    Sheet "Danh sách công việc" has 3 header rows
                    Sheet "Độ ưu tiên" has 2 header row and 4 data rows
                */

                const priorityValidation = {
                    type: 'list',
                    allowBlank: false,
                    formulae: ["'Độ ưu tiên'!$B$3:$B$6"]
                };

                const taskTypeValidation = {
                    type: 'list',
                    allowBlank: false,
                    formulae: ["'Loại công việc'!$B$3:$B$5"]
                }

                const taskWorksheet = workbook.getWorksheet('Danh sách công việc');
                taskWorksheet.dataValidations.add("D4:D9999", priorityValidation);
                taskWorksheet.dataValidations.add("E4:E9999", taskTypeValidation);

                taskWorksheet.getCell('B4').value = moment(new Date()).format('DD/MM/YYYY');
                taskWorksheet.getCell('C4').value = moment().endOf('y').format('DD/MM/YYYY');
                taskWorksheet.getCell('B5').value = moment(new Date()).format('DD/MM/YYYY');
                taskWorksheet.getCell('C5').value = moment().endOf('y').format('DD/MM/YYYY');

                return workbook.xlsx.writeBuffer();
            },
            dfd.reject,
        ).then(
            (res) => {
                dfd.resolve(res);
            },
            dfd.reject,
        );

        return dfd.promise;
    }

    load_template_for_departments(req) {
        const dfd = q.defer();
        const workbook = new ExcelJS.Workbook();

        FileProvider.downloadBuffer('templates/template_importtask_department_ver4.xlsx').then(
            (res) => workbook.xlsx.load(res),
            dfd.reject,
        ).then(
            () => TaskService.load_department(req.body._service[0].dbname_prefix),
            dfd.reject,
        ).then(
            (departments) => {
                /* Template info
                    Sheets: Danh sách công việc | Phòng ban | Độ ưu tiên
                    Sheet "Danh sách công việc" has 2 header rows
                    Sheet "Phòng ban" has 1 header row
                    Sheet "Độ ưu tiên" has 2 header row and 4 data rows
                */
                const departmentWorksheet = workbook.getWorksheet('Phòng ban');
                departmentWorksheet.addRows((departments || []).map((department) => [
                    (department.title)['vi-VN'],
                ]));
                const departmentValidation = {
                    type: 'list',
                    allowBlank: false,
                    formulae: [`'Phòng ban'!$A$3:$A$${departments.length + 2}`]
                };
                const priorityValidation = {
                    type: 'list',
                    allowBlank: false,
                    formulae: ["'Độ ưu tiên'!$B$3:$B$6"]
                };
                // const taskTypeValidation = {
                //     type: 'list',
                //     allowBlank: false,
                //     formulae: ["'Loại công việc'!$B$3:$B$5"]
                // }

                const taskWorksheet = workbook.getWorksheet('Danh sách công việc');
                taskWorksheet.dataValidations.add("D4:D9999", departmentValidation);
                taskWorksheet.dataValidations.add("E4:E9999", priorityValidation);
                // taskWorksheet.dataValidations.add("F4:F9999", taskTypeValidation);

                return workbook.xlsx.writeBuffer();
            },
            dfd.reject,
        ).then(
            (res) => {
                dfd.resolve(res);
            },
            dfd.reject,
        );

        return dfd.promise;
    }

    load_template_for_projects(dbPrefix) {
        const dfd = q.defer();
        q.all([loadExcelTemplate(TEMPLATE_NAME_FOR_PROJECTS), ProjectService.getProjects(dbPrefix)])
            .then(([workbook, projects]) => {
                const projectSheet = workbook.getWorksheet('Dự án')
                projectSheet.addRows(projects.map((project) => [project.title || '']));
                const projectValidation = {
                    type: 'list',
                    allowBlank: false,
                    formulae: [`'Dự án'!$A$3:$A$${projects.length + 2}`],
                };
                const priorityValidation = {
                    type: 'list',
                    allowBlank: false,
                    formulae: ["'Độ ưu tiên'!$B$3:$B$6"],
                };
                const taskTypeValidation = {
                    type: 'list',
                    allowBlank: false,
                    formulae: ["'Loại công việc'!$B$3:$B$5"]
                }
                const taskWorksheet = workbook.getWorksheet('Danh sách công việc');
                taskWorksheet.dataValidations.add('D4:D9999', projectValidation);
                taskWorksheet.dataValidations.add('E4:E9999', priorityValidation);
                taskWorksheet.dataValidations.add("F4:F9999", taskTypeValidation);

                return workbook.xlsx.writeBuffer();
            })
            .then((res) => {
                dfd.resolve(res);
            })
            .catch((error) => {
                LogProvider.error('Can not download template for projects', error);
                dfd.reject(error);
            });
        return dfd.promise;
    }

    count_created(body) {
        return TaskService.count_created(body._service[0].dbname_prefix, body.username);
    }

    count_assigned(body) {
        return TaskService.count_assigned(body._service[0].dbname_prefix, body.username);
    }

    statistic_all_project_count(body) {
        return TaskService.statistic_personal_count(body._service[0].dbname_prefix, genFilter_all_project_count(body));
    }

    statistic_all_project_growth(body) {
        return TaskService.statistic_personal_growth(body._service[0].dbname_prefix, genFilter_all_project_growth(body));
    }

    statistic_all_department_count(body) {
        return TaskService.statistic_personal_count(body._service[0].dbname_prefix, genFilter_all_department_count(body));
    }

    statistic_all_department_growth(body) {
        return TaskService.statistic_personal_growth(body._service[0].dbname_prefix, genFilter_all_department_growth(body));
    }

    insert(req) {
        let dfd = q.defer();
        const date = new Date();
        const dbPrefix = req.body._service[0].dbname_prefix;
        const currentUser = req.body.username;

        let data;
        let attachments;
        let isHaveDispatchArrived = false;

        FileProvider.upload(req, nameLib, validation.insert, undefined, parentFolder, currentUser)
            .then(function (res) {
                data = genData(res.Fields);
                if (!data.dispatch_arrived_id) {
                    if (!data.main_person || data.main_person.length === 0) {
                        // throw new BaseError("TaskController.insert.MainPersonRequired", "MainPersonRequired");
                    } else if (data.main_person.length > 1) {
                        throw new BaseError("TaskController.insert.CanNotAssignMultipleMainPerson", "CanNotAssignMultipleMainPerson");
                    }
                }
                if (data.main_person.length > 1) {
                    throw new BaseError("TaskController.insert.CanNotAssignMultipleMainPerson", "CanNotAssignMultipleMainPerson");
                }

                attachments = fileUtil.getUploadedFilesWithSpecificKey({
                    nameLib,
                    formData: res,
                    fieldKey: "file",
                });

                isHaveDispatchArrived = isValidValue(data.dispatch_arrived_id);
                if (isHaveDispatchArrived) {
                    return DispatchArrivedService.getDetailById(dbPrefix, data.dispatch_arrived_id);
                }
                return q.resolve(null);
            })
            .then(function (dispatchArrived) {
                if (isHaveDispatchArrived && _.isEmpty(dispatchArrived) && isValidValue(data.dispatch_arrived_id)) {
                    return dfd.reject({
                        path: "TaskController.insert",
                        message: "DispatchArrivedNotFound",
                    });
                }
                if (isHaveDispatchArrived) {
                    Object.assign(data, {
                        level: TASK_LEVEL.HEAD_TASK,
                    });
                }
                return q.resolve();
            })
            .then(function () {

                data.department = data.department || req.body.session.employee_details.department;
                return TaskService.insert(
                    dbPrefix,
                    currentUser,
                    data.estimate,
                    data.priority,
                    data.department,
                    data.title,
                    data.to_department,
                    data.content,
                    data.task_list,
                    data.main_person,
                    data.participant,
                    data.observer,
                    attachments,
                    data.from_date,
                    data.to_date,
                    data.object,
                    data.has_time,
                    data.hours,
                    data.task_type,
                    data.project,
                    data.goals,
                    date,
                    data.level,
                    data.head_task_id,
                    data.references,
                    data.label,
                    null,
                    data.source_id !== "0" ? data.source_id : (isHaveDispatchArrived ? HEAD_TASK_ORIGIN.SCHOOL_OFFICE : HEAD_TASK_ORIGIN.SELF_CREATED),
                    data.parents,
                    data.dispatch_arrived_id,
                    data.is_draft,
                    req.body.session.employee_details.department,
                    data.has_repetitive,
                    data.per,
                    data.cycle,
                    data.has_expired,
                    data.expired_date,
                    data.child_work_percent,
                );

            })
            .then(function (task) {
                return loadTaskReferences(dbPrefix, task, null, { expands: ["department"] });
            })
            .then(function (task) {
                dfd.resolve(task);

                data.code = task.code

                if (data.main_person && data.main_person.length > 0) {
                    data.main_person.filter(username => username !== currentUser)
                    RingBellItemService.insert(
                        dbPrefix,
                        currentUser,
                        "task_assigned_main_person",
                        {
                            taskCode: task.code,
                            title: task.title,
                            username_create_task: currentUser,
                        },
                        task.main_person,
                        [],
                        "createTask",
                        date.getTime()
                    );
                }


                if (data.participant && data.participant.length > 0) {
                    data.participant.filter(username => username !== currentUser)
                    RingBellItemService.insert(
                        dbPrefix,
                        currentUser,
                        "task_assigned_participant",
                        {
                            taskCode: data.code,
                            title: data.title,
                            username_create_task: currentUser,
                        },
                        data.participant,
                        [],
                        "createTask",
                        date.getTime(),
                    );
                }

                if (data.observer && data.observer.length > 0) {
                    data.observer.filter(username => username !== currentUser)
                    RingBellItemService.insert(
                        dbPrefix,
                        currentUser,
                        "task_assigned_observer",
                        {
                            taskCode: data.code,
                            title: data.title,
                            username_create_task: currentUser,
                        },
                        data.observer,
                        [],
                        "createTask",
                        date.getTime(),
                    );
                }


                const filterToNotify = genFilterGetUsersByRuleAndDepartment(TASK_RULE.NOTIFY_DEPARTMENT, data.department);
                UserService.loadAggregateUser(dbPrefix, filterToNotify)
                    .then(function (res) {
                        const usernameToReceive = res.filter(item => item.username !== currentUser).map(item => item.username);
                        if (usernameToReceive.length > 0) {
                            RingBellItemService.insert(
                                dbPrefix,
                                currentUser,
                                'task_receive_to_know',
                                {
                                    taskCode: data.code,
                                    title: data.title,
                                    username_create_task: currentUser,
                                },
                                usernameToReceive,
                                [],
                                "createTask",
                                date.getTime()
                            );
                        }
                    })
                    .catch(function (err) {
                        console.error(err);
                        dfd.reject(err);
                    });

                // TaskService.loadEmployeeDepartment(req.body._service[0].dbname_prefix, data.department)
                //     .then(function (res) {
                //         let usernameToNotifySet = new Set();
                //         let usernameToReceive = getUsernameDepartmentToNotify(res, data.department);
                //         usernameToReceive = usernameToReceive.filter(username => !usernameToNotifySet.has(username) && username != req.body.username);
                //         console.log('usernameToReceive',usernameToReceive);
                //         if (usernameToReceive.length > 0) {
                //             RingBellItemService.insert(
                //                 req.body._service[0].dbname_prefix,
                //                 req.body.username,
                //                 'task_receive_to_know',
                //                 {
                //                     taskCode: data.code,
                //                     title: data.title,
                //                     username_create_task: req.body.username,
                //                 },
                //                 usernameToReceive,
                //                 [],
                //                 "createTask",
                //                 date.getTime()
                //             );
                //         }
                //     })
                //     .catch(function (err) {
                //         console.error(err);
                //         dfd.reject(err);
                //     });
            })
            .catch(function (err) {
                LogProvider.error("Can not save task with reason: " + err.mes || err.message);
                dfd.reject(
                    err instanceof BaseError
                        ? err
                        : new BaseError("TaskController.insert.err", "ProcessInsertTaskFailed"),
                );
            });
        return dfd.promise;
    }

    insert_task_from_template(req) {
        let dfd = q.defer();
        let date = new Date();
        const tasks = req.body.data;
        tasks.forEach((data) => {
            let usernameToNotify = [];
            usernameToNotify = usernameToNotify.concat(data.main_person);
            usernameToNotify = usernameToNotify.concat(data.participant);
            usernameToNotify = usernameToNotify.concat(data.observer);
            usernameToNotify.filter(username => username !== req.body.username);
            const label = Array.isArray(data.label) ? data.label : [];
            TaskService.insert(
                req.body._service[0].dbname_prefix,
                req.body.username,
                data.priority,
                data.department,
                data.title,
                data.to_department,
                data.content,
                data.task_list,
                data.main_person,
                data.participant,
                data.observer,
                [],
                data.from_date,
                data.to_date,
                undefined,
                data.has_time,
                data.hours,
                undefined,
                undefined,
                undefined,
                date,
                TASK_LEVEL.HEAD_TASK,
                null,
                [],
                label,
                null,
                HEAD_TASK_ORIGIN.SCHOOL_OFFICE,
                null,
                null,
                false,
                req.body.session.employee_details.department
            ).then(
                function (res) {
                    dfd.resolve(true);
                    RingBellItemService.insert(
                        req.body._service[0].dbname_prefix,
                        req.body.username,
                        'task_assigned',
                        { taskCode: res.code, title: data.title, username_create_task: req.body.username },
                        usernameToNotify,
                        [],
                        'createTask',
                        date.getTime(),
                    );
                },
                function (err) {
                    dfd.reject(err);
                },
            );
        });
        dfd.resolve(true);
        return dfd.promise;
    }

    insert_for_multiple_departments(req) {
        let dfd = q.defer();
        let date = new Date();
        const tasks = req.body.data;
        tasks.forEach((data) => {
            let usernameToNotify = [];
            data.label = Array.isArray(data.label) ? data.label : [];
            DepartmentService.getDepartmentById(req.body._service[0].dbname_prefix, data.department).then(
                (departmentInfo) => {
                    usernameToNotify.push(departmentInfo.departmentLeader);
                    q.fcall(function () {
                        if (data.dispatch_arrived_id) {
                            return DispatchArrivedService.getDetailById(
                                req.body._service[0].dbname_prefix,
                                data.dispatch_arrived_id,
                            );
                        }
                        return q.resolve(null);
                    })
                        .then(function (dispatchArrived) {
                            if (data.dispatch_arrived_id && _.isEmpty(dispatchArrived)) {
                                return dfd.reject({
                                    path: "TaskController.insert_for_multiple_departments",
                                    message: "DispatchArrivedNotFound",
                                });
                            }
                            data.attachment = [];
                            data.reference = [];
                            if (data.dispatch_arrived_id) {
                                Object.assign(data, {
                                    reference: [{ object: "DispatchArrived", id: data.dispatch_arrived_id }],
                                    level: TASK_LEVEL.HEAD_TASK,
                                    attachment: dispatchArrived.attachment,
                                });
                            }
                        })
                        .then(function () {
                            return TaskService.insert(
                                req.body._service[0].dbname_prefix, //1
                                req.body.username, //1
                                data.priority, //1
                                data.department, //1
                                data.title, //1
                                null,
                                data.content, //1
                                data.task_list, //1
                                usernameToNotify, //main person
                                [], //participant
                                [], //observer
                                data.attachment, //1
                                data.from_date, //1
                                data.to_date, //1
                                undefined, //object
                                data.has_time, //1
                                data.hours, //1
                                data.task_type, //1
                                undefined, //project
                                undefined, //goals
                                date, //1
                                TASK_LEVEL.HEAD_TASK, //1
                                null, //head_task_id
                                data.reference, //1
                                data.label, //label
                                null, //task_template_id
                                HEAD_TASK_ORIGIN.SCHOOL_OFFICE, //1,
                                [], //parents,
                                null, //dispatch_arrived_id,
                                false, //is_draft,
                                null, //from_department,
                                false, //has_repetitive,
                                null, //per,
                                null, //cycle,
                                false, //has_expired,
                                null, //expired_date,
                                null, //child_work_percent,
                                null, //receive_transfer_ticket,
                                null, //label_from_da,
                            );
                        })
                        .then(function (res) {
                            dfd.resolve(true);
                            RingBellItemService.insert(
                                req.body._service[0].dbname_prefix,
                                req.body.username,
                                "task_assigned_department",
                                { taskCode: res.code, title: data.title, username_create_task: req.body.username },
                                usernameToNotify,
                                [],
                                "createTaskDepartment",
                                date.getTime(),
                            );
                        })
                        .catch(function (err) {
                            LogProvider.error("Can not save task with reason: " + err.mes || err.message);
                        });
                },
            );
        });
        dfd.resolve(true);
        return dfd.promise;
    }

    
    insert_task_external(req) {
        let dfd = q.defer();
        let date = new Date();
        const tasks = req.body.data;

        tasks.forEach((data) => {
            let usernameToNotify = [];
            data.label = Array.isArray(data.label) ? data.label : [];
    
            DepartmentService.getDepartmentById(req.body._service[0].dbname_prefix, data.department)
                .then((departmentInfo) => {
                    usernameToNotify.push(departmentInfo.departmentLeader);

                    return TaskService.insert_head_task(
                        req.body._service[0].dbname_prefix, 
                        req.body.username,
                        data.priority, // priority
                        1, // estimate
                        data.department, // department
                        data.title, // title
                        null, // to_department
                        data.content, //content
                        data.task_list, //task_list
                        usernameToNotify, // main_person
                        [], //participant
                        [req.body.username], // observer
                        [], // attachment
                        data.from_date, // from_date
                        data.to_date, // to_date
                        [], // object
                        data.has_time, //has_time
                        undefined, // hours
                        data.task_type, // task_type
                        undefined, // project
                        undefined, // goals
                        date, // date
                        TASK_LEVEL.HEAD_TASK, // level
                        null, // head_task_id
                        null, // references
                        data.label, // label
                        null, // task_template_id
                        "1", // origin
                        [], // parents
                        null, // dispatch_arrived_id
                        false, // is_draft
                        req.body.session.department, // from_department
                        false, // has_repetitive
                        0, // per
                        null, // cycle
                        false, // has_expired
                        NaN, // expired_date
                        NaN, // child_work_percent
                    );
                })
                .then((res) => {
                    return RingBellItemService.insert(
                        req.body._service[0].dbname_prefix,
                        req.body.username,
                        "task_assigned_department",
                        { taskCode: res.code, title: data.title, username_create_task: req.body.username },
                        usernameToNotify,
                        [],
                        "createTaskDepartment",
                        date.getTime(),
                    );
                })
                .catch((err) => {
                    LogProvider.error("Can not save task with reason: " + (err.mes || err.message));
                    dfd.reject(err);
                });
        });
    
        dfd.resolve(true);
        return dfd.promise;
    }    

    insert_transfer_ticket(req) {
        let dfd = q.defer();
        FileProvider.upload(req, nameLib, validation.insert_transfer_ticket, undefined, parentFolder, req.body.username).then(function (res) {
            let date = new Date;
            let data = genTransferTicketData(res.Fields);
            let attachment = [];
            if (res.fileInfo.file) {
                for (let i in res.fileInfo.file) {
                    if (!res.fileInfo.file[i].huge) {
                        attachment.push({
                            timePath: res.fileInfo.file[i].timePath,
                            locate: res.fileInfo.file[i].type,
                            display: res.fileInfo.file[i].filename,
                            name: res.fileInfo.file[i].named,
                            nameLib
                        });
                    }
                }
            }

            WorkItemService.processTransferTicket(req.body._service[0].dbname_prefix, data.department_assign_id, data.department, req.body.session, data.transfer_ticket_values)
                .then(fileInfo => {
                    TaskService.insert_work_item(req.body._service[0].dbname_prefix, req.body.username, data.department,
                        data.main_person, data.participant, data.observer,
                        data.title, data.to_department, data.content, data.task_list, attachment, data.from_date, data.to_date, data.priority,
                        data.has_time, data.hours,
                        data.task_type, date,
                        data.level,
                        data.head_task_id,
                        data.department_assign_id,
                        fileInfo,
                        data.parents,
                        data.parent,
                        data.source_id
                    ).then(function (data) {
                        dfd.resolve(data);
                        TaskService.loadRelateQuickActionPerson(req.body._service[0].dbname_prefix, getFilterHandlerQuickAction(+data.source_id))
                        .then(function (users) {
                            let userArray = [
                                ...(Array.isArray(data.main_person) ? data.main_person : []),
                                ...(Array.isArray(data.participant) ? data.participant : []),
                                ...(Array.isArray(data.observer) ? data.observer : []),
                                ...(Array.isArray(getUsernameQuickActionToNotify(users, data)) ? getUsernameQuickActionToNotify(users, data) : [])
                            ];

                            let usernameToNotifySet = new Set(userArray);
                            let usernameToNotify = Array.from(usernameToNotifySet);

                            if (usernameToNotify && usernameToNotify.length) {
                                usernameToNotify.filter(username => username !== req.body.username);
                                RingBellItemService.insert(
                                    req.body._service[0].dbname_prefix,
                                    req.body.username,
                                    'task_receive_to_know',
                                    {
                                        taskCode: data.code,
                                        title: data.title,
                                        username_create_task: req.body.username,
                                    },
                                    usernameToNotify,
                                    [],
                                    "createTask",
                                    date.getTime()
                                );
                            }
                        })
                        .catch(function (err) {
                            console.error(err);
                            dfd.reject(err);
                        });
                    });
                })

        }).catch(function (err) {
            console.log(err);
            dfd.reject(err);
            err = undefined;
            req = undefined;
        });


        return dfd.promise;
    }

    transfer_ticket_preview(req) {
        return WorkItemService.processPreviewTransferTicket(req.body._service[0].dbname_prefix,
            req.body.department_assign_id, req.body.department,
            req.body.session, req.body.transfer_ticket_values);
    }

    signTransferTicket(req) {
        const dbPrefix = req.body._service[0].dbname_prefix;
        const currentUser = req.body.session;
        const transferTicketId = req.params.transferTicketId;

        const dfd = q.defer();

        let tagValues = [];

        TaskService.loadDetails(dbPrefix, transferTicketId)
            .then(transferTicket => {
                if (transferTicket.level !== 'TransferTicket') {
                    dfd.reject({
                        path: 'TaskController.signTransferTicket.err',
                        mes: 'Invalid transfer ticket',
                    });
                }

                let signature = transferTicket.transfer_ticket_info.signature;
                if (signature && signature.isSigned) {
                    dfd.reject({
                        path: 'TaskController.signTransferTicket.err',
                        mes: 'Transfer ticket has already been signed',
                    });
                }

                const ruleManage_leader_department = checkRuleRadioDepartment(currentUser.rule, transferTicket.department_assign_id, currentUser.department, TASK_RULE.DEPARTMENT_LEADER_MANAGE)
                if (!ruleManage_leader_department) {
                    dfd.reject({
                        path: 'TaskController.signTransferTicket.err',
                        mes: 'Not have permission to sign transfer ticket',
                    });
                }



                tagValues = transferTicket.transfer_ticket_info.tagValues;

                return WorkItemService.processSignTransferTicket(dbPrefix, transferTicket, currentUser);
            }).then(fileInfo => {
                const event = {
                    username: currentUser.username,
                    action: 'SignedTransferTicket',
                    time: new Date().getTime(),
                    filename: fileInfo.display,
                };

                const transferTicketInfo = {
                    ...fileInfo,
                    tagValues,
                    signature: {
                        isSigned: true,
                        signedBy: { username: currentUser.username, time: new Date().getTime() }
                    }
                }

                return WorkItemService.updateProcessTransferTicket(dbPrefix, currentUser.username, transferTicketId, transferTicketInfo, event);
            }).then(() => {
                dfd.resolve(true);
            })
            .catch((error) => {
                dfd.reject({
                    path: 'TaskController.signTransferTicket.err',
                    mes: 'Process sign transfer ticket error',
                    err: error
                });
            });

        return dfd.promise;
    }

    uploadImage(req) {
        let dfd = q.defer();
        FileProvider.upload(req, nameLib, undefined, undefined, parentFolder, req.body.username).then(function (res) {
            if (res.Files[0]) {
                if (FileConst.modeProduction === 'development') {
                    let imgUrl = FileConst.tenantDomain + '/files/' + res.Files[0].folderPath + "/" + res.Files[0].named;
                    dfd.resolve(imgUrl);
                } else {
                    gcpProvider.getSignedUrl(res.Files[0].folderPath + "/" + res.Files[0].named).then(
                        (imgUrl) => {
                            dfd.resolve(imgUrl);
                            imgUrl = undefined;
                        },
                        (err) => {
                            dfd.reject(err);
                        }
                    );
                }
            } else {
                dfd.reject({ path: "TaskController.uploadImg.FileIsNull", mes: "FileIsNull" });
            }
            res = undefined;
            req = undefined;
        }, function (err) {
            dfd.reject(err);
            err = undefined;
            req = undefined;
        });
        return dfd.promise;
    }

    loadFileInfo(body) {
        let dfd = q.defer();
        TaskService.loadDetails(body._service[0].dbname_prefix, body.id).then(function (data) {
            let checkPermission = true;
            let checkFile = false;
            let fileInfo = {};
            let username = body.username;

            if (data.transfer_ticket_info && data.transfer_ticket_info.name === body.filename) {
                fileInfo = data.transfer_ticket_info;
                checkFile = true;
            }
            for (let i in data.attachment) {
                if (data.attachment[i].name === body.filename) {
                    fileInfo = data.attachment[i];
                    checkFile = true;
                    break;
                }
            }

            for (let i in data.comment) {
                for (var j in data.comment[i].attachment) {
                    if (data.comment[i].attachment[j].name === body.filename) {
                        fileInfo = data.comment[i].attachment[j];
                        checkFile = true;
                        break;
                    }
                }

            }

            for (let i in data.proof || []) {
                for (var j in data.proof[i].attachment) {
                    if (data.proof[i].attachment[j].name === body.filename) {
                        fileInfo = data.proof[i].attachment[j];
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
                        extractStringBetweenSlashes(fileInfo.timePath)
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
                        }
                    );
                } else {
                    dfd.reject({ path: "TaskController.loadFileInfo.FileIsNotExists", mes: "FileIsNotExists" });
                }
                body = undefined;
                checkPermission = undefined;
                checkFile = undefined;
            } else {
                dfd.reject({ path: "TaskController.loadFileInfo.NotPermission", mes: "NotPermission" });
                body = undefined;
                checkPermission = undefined;
                checkFile = undefined;
                fileInfo = undefined;
            }
        }, function (err) {
            dfd.reject(err);
            body = undefined;
        });

        return dfd.promise;
    }

    download(body) {
        let dfd = q.defer();

        TaskService.loadDetails(body._service[0].dbname_prefix, body.id).then(function (data) {
            let checkPermission = true;
            let checkFile = false;
            let fileInfo = {};

            if (data.transfer_ticket_info && data.transfer_ticket_info.name === body.filename) {
                fileInfo = data.transfer_ticket_info;
                checkFile = true;
            }

            for (let i in data.attachment) {
                if (data.attachment[i].name === body.filename) {
                    fileInfo = data.attachment[i];
                    checkFile = true;
                    break;
                }
            }

            for (let i in data.comment) {
                for (var j in data.comment[i].attachment) {
                    if (data.comment[i].attachment[j].name === body.filename) {
                        fileInfo = data.comment[i].attachment[j];
                        checkFile = true;
                        break;
                    }
                }

            }

            if (checkPermission) {
                if (checkFile) {
                    console.log('path file: ', body._service[0].dbname_prefix +
                        '/' +
                        parentFolder +
                        '/' +
                        fileInfo.nameLib +
                        '/' +
                        data.username +
                        '/' +
                        body.filename);
                    FileProvider.download(
                        body._service[0].dbname_prefix +
                        '/' +
                        parentFolder +
                        '/' +
                        fileInfo.nameLib +
                        '/' +
                        data.username +
                        '/' +
                        body.filename
                    ).then(
                        (url) => {
                            dfd.resolve(url);
                            url = undefined;
                        },
                        (error) => {
                            dfd.reject(error);
                            error = undefined;
                        }
                    );
                } else {
                    dfd.reject({ path: "TaskController.download.FileIsNotExists", mes: "FileIsNotExists" });
                }
                body = undefined;
                checkPermission = undefined;
                checkFile = undefined;
            } else {
                dfd.reject({ path: "TaskController.download.NotPermission", mes: "NotPermission" });
                body = undefined;
                checkPermission = undefined;
                checkFile = undefined;
                fileInfo = undefined;
            }
        }, function (err) {
            dfd.reject(err);
            body = undefined;
        });

        return dfd.promise;
    }

    start(body) {
        const dfd = q.defer();
        const dbPrefix = body._service[0].dbname_prefix;
        const username = body.username;
        let date = new Date();

        TaskService.getById(dbPrefix, body.id).then(function (taskDetails) {
            checkRuleToEditTaskDetails(body.session, taskDetails).then(function () {
                TaskService.start(dbPrefix, username, body.id, date).then(function (docUpdated) {
                    dfd.resolve(taskDetails);
                    let usernameToNotify = [];

                    usernameToNotify = usernameToNotify.concat(docUpdated.main_person);
                    usernameToNotify = usernameToNotify.concat(docUpdated.participant);
                    usernameToNotify = usernameToNotify.concat(docUpdated.observer);


                    TaskService.loadEmployeeDepartment(dbPrefix, docUpdated.department)
                    .then(function (res) {
                        let usernameToNotifySet = new Set();
                        let usernameToReceive = getUsernameDepartmentToNotify(res, docUpdated.department);
                        usernameToReceive = usernameToReceive.filter(username => !usernameToNotifySet.has(username) && username != body.username);
                        if (usernameToReceive && usernameToReceive.length) {
                            RingBellItemService.insert(
                                dbPrefix,
                                username,
                                "task_updated_status",
                                { taskCode: docUpdated.code, title: docUpdated.title, username_updated_status: username, action: "startTask" },
                                usernameToReceive,
                                [],
                                "startTask",
                                date.getTime());
                        }
                    })
                    .catch(function (err) {
                        console.error(err);
                        dfd.reject(err);
                    });
                }, function (err) {
                    dfd.reject(err);
                });
            }, function () {
                dfd.reject({
                    path: "TaskController.start.YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists",
                    mes: "YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists",
                });
            });
        }, function (err) {
            dfd.reject(err);
        });

        return dfd.promise;
    }

    done(req) {
        let dfd = q.defer();
        FileProvider.upload(req, nameLib, validation.done, undefined, parentFolder, req.body.username).then(
            function (res) {
                let data = genData_done(res.Fields);
                let attachment = data.subAttachment;
                if(res.fileInfo.file) {
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
                
                let date = new Date();
                TaskService.addProof(
                    req.body._service[0].dbname_prefix,
                    req.body.username,
                    data.taskId,
                    data.content,
                    attachment,
                    date,
                    data.worktimes,
                ).then(
                    function (docUpdated) {
                        let usernameToNotifySet = new Set();

                        docUpdated.main_person.forEach((username) => usernameToNotifySet.add(username));
                        docUpdated.participant.forEach((username) => usernameToNotifySet.add(username));
                        docUpdated.observer.forEach((username) => usernameToNotifySet.add(username));
                        TaskService.loadEmployeeDepartment(
                            req.body._service[0].dbname_prefix,
                            req.body.session.employee_details.department,
                        )
                            .then(function (res) {
                                let usernameToReceive = getUsernameDepartmentToNotify(
                                    res,
                                    req.body.session.employee_details.department,
                                );
                                usernameToReceive.forEach((username) => usernameToNotifySet.add(username));

                                let usernameToNotify = Array.from(usernameToNotifySet).filter(
                                    (u) => u !== req.body.username,
                                );
                                RingBellItemService.insert(
                                    req.body._service[0].dbname_prefix,
                                    req.body.username,
                                    "task_updated_status",
                                    {
                                        taskCode: data.code,
                                        title: docUpdated.title,
                                        username_updated_status: req.body.username,
                                        action: "doneTask",
                                    },
                                    usernameToNotify,
                                    [],
                                    "doneTask",
                                    date.getTime(),
                                );
                                dfd.resolve(true);
                            })
                            .catch(function (err) {
                                console.error(err);
                                dfd.reject(err);
                            });
                    },
                    function (err) {
                        dfd.reject(err);
                    },
                );
            },
            function (err) {
                dfd.reject(err);
                err = undefined;
                req = undefined;
            },
        );

        return dfd.promise;
    }

    complete(req) {
        let dfd = q.defer();
        FileProvider.upload(req, nameLib, validation.complete, undefined, parentFolder, req.body.username).then(
            function (res) {
                let data = genData_complete(res.Fields);
                let attachment = [];
                if(res.fileInfo.file) {
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
                
                let date = new Date();
                TaskService.complete(
                    req.body._service[0].dbname_prefix,
                    req.body.username,
                    data.taskId,
                    data.content,
                    attachment,
                    date,
                ).then(
                    function (docUpdated) {
                        let usernameToNotifySet = new Set();

                        docUpdated.main_person.forEach((username) => usernameToNotifySet.add(username));
                        docUpdated.participant.forEach((username) => usernameToNotifySet.add(username));
                        docUpdated.observer.forEach((username) => usernameToNotifySet.add(username));
                        TaskService.loadEmployeeDepartment(
                            req.body._service[0].dbname_prefix,
                            req.body.session.employee_details.department,
                        )
                            .then(function (res) {
                                let usernameToReceive = getUsernameDepartmentToNotify(
                                    res,
                                    req.body.session.employee_details.department,
                                );
                                usernameToReceive.forEach((username) => usernameToNotifySet.add(username));

                                let usernameToNotify = Array.from(usernameToNotifySet).filter(
                                    (u) => u !== req.body.username,
                                );

                                RingBellItemService.insert(
                                    req.body._service[0].dbname_prefix,
                                    req.body.username,
                                    "task_updated_status",
                                    {
                                        taskCode: data.code,
                                        title: docUpdated.title,
                                        username_updated_status: req.body.username,
                                        action: "completedTask"
                                    },
                                    usernameToNotify,
                                    [],
                                    "completedTask",
                                    date.getTime(),
                                );
                                dfd.resolve(true);
                            })
                            .catch(function (err) {
                                console.error(err);
                                dfd.reject(err);
                            });
                    },
                    function (err) {
                        dfd.reject(err);
                    },
                );
            },
            function (err) {
                dfd.reject(err);
                err = undefined;
                req = undefined;
            },
        ), function (err) {
            dfd.reject(err);
            err = undefined;
            req = undefined;
        };

        return dfd.promise;
    }

    refune(req) {
        let dfd = q.defer();
        FileProvider.upload(req, nameLib, validation.refune, undefined, parentFolder, req.body.username).then(
            function (res) {
                let data = genData_refune(res.Fields);
                let attachment = [];
                if(res.fileInfo.file) {
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
                

                let date = new Date();
                TaskService.refune(
                    req.body._service[0].dbname_prefix,
                    req.body.username,
                    data.taskId,
                    data.content,
                    attachment,
                    date,
                    data.progress,
                ).then(
                    function (docUpdated) {
                        let usernameToNotifySet = new Set();
                        docUpdated.main_person.forEach((username) => usernameToNotifySet.add(username));
                        docUpdated.participant.forEach((username) => usernameToNotifySet.add(username));
                        docUpdated.observer.forEach((username) => usernameToNotifySet.add(username));
                        TaskService.loadEmployeeDepartment(
                            req.body._service[0].dbname_prefix,
                            req.body.session.employee_details.department,
                        )
                            .then(function (res) {
                                
                                let usernameToReceive = getUsernameDepartmentToNotify(
                                    res,
                                    req.body.session.employee_details.department,
                                );
                                usernameToReceive.forEach((username) => usernameToNotifySet.add(username));

                                let usernameToNotify = Array.from(usernameToNotifySet).filter(
                                    (u) => u !== req.body.username,
                                );

                                RingBellItemService.insert(
                                    req.body._service[0].dbname_prefix,
                                    req.body.username,
                                    "task_updated_status",
                                    {
                                        taskCode: data.code,
                                        title: docUpdated.title,
                                        username_updated_status: req.body.username,
                                        action: "notApproved"
                                    },
                                    usernameToNotify,
                                    [],
                                    "notApproved",
                                    date.getTime(),
                                );
                                dfd.resolve(true);
                            })
                            .catch(function (err) {
                                console.error(err);
                                dfd.reject(err);
                            });
                    },
                    function (err) {
                        dfd.reject(err);
                    },
                );
            },
            function (err) {
                dfd.reject(err);
                err = undefined;
                req = undefined;
            },
        );

        return dfd.promise;
    }

    cancel(body) {
        const dfd = q.defer();
        const dbPrefix = body._service[0].dbname_prefix;
        const username = body.username;

        TaskService.getById(dbPrefix, body.id).then(function (task) {
            checkRuleToDeleteTask(body.session, task).then(function () {

                TaskService.cancel(dbPrefix, username, body.id, body.comment).then(function () {
                    let usernameToNotifySet = new Set();

                    task.main_person.forEach(username => usernameToNotifySet.add(username));
                    task.participant.forEach(username => usernameToNotifySet.add(username));
                    task.observer.forEach(username => usernameToNotifySet.add(username));

                    let usernameToNotify = Array.from(usernameToNotifySet).filter(u => u !== username);
                    let date = new Date();

                    RingBellItemService.insert(
                        body._service[0].dbname_prefix,
                        body.username,
                        'task_updated_status',
                        {
                            taskCode: task.code,
                            title: task.title,
                            username_updated_status: body.username,
                            action: "cancelTask"
                        },
                        usernameToNotify,
                        [],
                        'cancelTask',
                        date.getTime()
                    );

                    dfd.resolve(task);
                }, function (err) {
                    dfd.reject(err);
                });
            }, function (err) {
                dfd.reject({
                    path: "TaskController.cancel.YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists",
                    mes: "YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists"
                });
            })
        }, function (err) {
            dfd.reject(err);
        });

        return dfd.promise;
    }

    update(body) {
        const dfd = q.defer();
        const date = new Date();
        let currentTask = null;
        let newReference = [];
        let newAttachments = [];
        let parent = null;

        TaskService.getById(body._service[0].dbname_prefix, body.id)
            .then((task) => {
                currentTask = task;
                if (!checkRuleToEditTask(body.session, task)) {
                    throw new BaseError(
                        "TaskController.update.YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists",
                        "YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists"
                    );
                }
                newReference = task.reference || [];
                newAttachments = task.attachment || [];
                parent = task.parent;
                if (isValidValue(body.dispatch_arrived_id)) {
                    return DispatchArrivedService.getDetailById(body._service[0].dbname_prefix, body.dispatch_arrived_id);
                }
                return null;
            })
            .then((dispatchArrived) => {
                if (isValidValue(body.dispatch_arrived_id)) {
                    if (currentTask.level !== TASK_LEVEL.HEAD_TASK) {
                        throw new BaseError("TaskController.update.err", "TaskLevelMustBeHeadTask");
                    }
                    newReference = newReference.filter((ref) => ref.object !== "DispatchArrived");
                    if (!parent || parent.object === OBJECT_NAME.DISPATCH_ARRIVED) {
                        parent = {
                            object: OBJECT_NAME.DISPATCH_ARRIVED,
                            value: body.dispatch_arrived_id
                        };
                    }
                }
                return TaskService.update(
                    body._service[0].dbname_prefix,
                    body.username,
                    body.estimate,
                    body.priority,
                    body.id,
                    body.title,
                    body.content,
                    body.task_list,
                    body.main_person,
                    body.participant,
                    body.observer,
                    body.from_date,
                    body.to_date,
                    body.status,
                    [],
                    body.task_type,
                    body.workflowPlay_id,
                    body.has_time,
                    body.hours,
                    date,
                    body.label,
                    newReference,
                    newAttachments,
                    body.department,
                    parent,
                    body.has_repetitive,
                    body.per,
                    body.cycle,
                    body.has_expired,
                    body.expired_date,
                    body.action_access,
                    body.child_work_percent,
                );
            })
            .then((res) => {
                if (currentTask.department && currentTask.task_template_id) {
                    return TaskTemplateService.setChildTaskCustomized(
                        body._service[0].dbname_prefix,
                        body.username,
                        currentTask.task_template_id,
                        currentTask.department,
                        body.id
                    ).then(() => res);
                }
                return res;
            })
            .then((res) => {
                return loadTaskReferences(body._service[0].dbname_prefix, res, null, { expands: ["department"] });
            })
            .then((res) => {
                dfd.resolve(res);
                let usernameToNotify = [];
                usernameToNotify = usernameToNotify.concat(body.main_person);
                usernameToNotify = usernameToNotify.concat(body.participant);
                usernameToNotify = usernameToNotify.concat(body.observer);

                usernameToNotify.filter(u => u !== body.username);

                RingBellItemService.insert(
                    body._service[0].dbname_prefix,
                    body.username,
                    "task_updated",
                    {
                        taskCode: res.code,
                        title: body.title,
                        username_update_task: body.username
                    },
                    usernameToNotify,
                    [],
                    "updateTask",
                    date.getTime()
                ).catch((err) => {
                    console.error("Error notifying users: ", err);
                });
            })
            .catch((err) => {
                dfd.reject(err);
            });

        return dfd.promise;
    }

    delete(body) {
        const dfd = q.defer();
        const dbPrefix = body._service[0].dbname_prefix;
        const username = body.username;

        TaskService.getById(dbPrefix, body.id).then(function (task) {
            checkRuleToDeleteTask(body.session, task).then(function () {
                TaskService.delete(dbPrefix, username, body.id).then(function () {
                    let usernameToNotifySet = new Set();

                    task.main_person.forEach(username => usernameToNotifySet.add(username));
                    task.participant.forEach(username => usernameToNotifySet.add(username));
                    task.observer.forEach(username => usernameToNotifySet.add(username));

                    let usernameToNotify = Array.from(usernameToNotifySet);
                    usernameToNotify = usernameToNotify.filter(u => u !== username);
                    let date = new Date();
                    RingBellItemService.insert(
                        body._service[0].dbname_prefix,
                        body.username,
                        'task_updated_status',
                        { taskCode: task.code, title: task.title, username_updated_status: body.username, action: "deleteTask" },
                        usernameToNotify,
                        [],
                        'deleteTask',
                        date.getTime(),
                    );
                    dfd.resolve(task);
                }, function (err) {
                    dfd.reject(err);
                });
            }, function (err) {
                dfd.reject({
                    path: "TaskController.delete.YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists",
                    mes: "YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists",
                });
            });
        }, function (err) {
            dfd.reject(err);
        });

        return dfd.promise;
    }

    comment(req) {
        let dfd = q.defer();
        FileProvider.upload(req, nameLib, validation.comment, undefined, parentFolder, req.body.username).then(function (res) {
            let data = genData_comment(res.Fields);
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
            let date = new Date();
            addComment(req, res, date, data, attachment).then(function (docUpdated) {
                dfd.resolve(docUpdated);
                let usernameToNotify = [];
                usernameToNotify = usernameToNotify.concat(docUpdated.main_person);
                usernameToNotify = usernameToNotify.concat(docUpdated.participant);
                usernameToNotify = usernameToNotify.concat(docUpdated.observer);
                usernameToNotify.filter(username => username !== req.body.username);
                let action, actionFrom;
                switch (res.Fields.type) {
                    case TASK_COMMENT_TYPE.COMMENT:
                        action = "task_add_comment";
                        actionFrom = "commentTask";
                        break;
                    case TASK_COMMENT_TYPE.CHALLENGE:
                        action = "task_add_challenge";
                        actionFrom = "addChallengeTask";
                        break;
                    case TASK_COMMENT_TYPE.CHALLENGE_RESOLVER:
                        action = "task_add_challenge_resolver";
                        actionFrom = "addChallengeResolverTask";
                        break;
                    case TASK_COMMENT_TYPE.REMIND:
                        action = "task_add_remind";
                        actionFrom = "addRemindTask";
                        break;
                    case TASK_COMMENT_TYPE.GUIDE_TO_RESOLVE_CHALLENGE:
                        action = "task_add_guide_to_resolve_challenge";
                        actionFrom = "addGuideToResolveChallengeTask";
                        break;
                }
                RingBellItemService.insert(req.body._service[0].dbname_prefix, req.body.username, action, { taskCode: docUpdated.code, title: docUpdated.title, username_add_comment: req.body.username }, usernameToNotify, [], actionFrom, date.getTime());
            }, function (err) {
                dfd.reject(err);
            })

        }, function (err) {
            dfd.reject(err);
            err = undefined;
            req = undefined;
        });


        return dfd.promise;
    }

    updateComment(req) {
        let dfd = q.defer();
        const dbname_prefix = req.body._service[0].dbname_prefix;
        const username = req.body.username;

        FileProvider.upload(req, nameLib, validation.updateComment, undefined, parentFolder, username).then(function (res) {
            const { task_id, comment_id, content, attachment, type, date } = genData_updateComment(res);

            TaskService.loadDetails(dbname_prefix, task_id).then(function (taskDetails) {
            TaskService.updateComment(dbname_prefix, username, task_id, comment_id, content, attachment, date, taskDetails, type, null).then(function (docUpdated) {
                dfd.resolve(docUpdated);
                let usernameToNotify = [];
                usernameToNotify = usernameToNotify.concat(docUpdated.main_person);
                usernameToNotify = usernameToNotify.concat(docUpdated.participant);
                usernameToNotify = usernameToNotify.concat(docUpdated.observer);
                usernameToNotify.filter(u => u !== username);
                let action, actionFrom;
                switch (type) {
                    case TASK_COMMENT_TYPE.COMMENT:
                        action = "task_update_comment";
                        actionFrom = "updateCommentTask";
                        break;
                    case TASK_COMMENT_TYPE.CHALLENGE:
                        action = "task_update_add_challenge";
                        actionFrom = "updateChallengeTask";
                        break;
                    case TASK_COMMENT_TYPE.CHALLENGE_RESOLVER:
                        action = "task_update_add_challenge_resolver";
                        actionFrom = "updateChallengeResolverTask";
                        break;
                    case TASK_COMMENT_TYPE.REMIND:
                        action = "task_add_remind";
                        actionFrom = "addRemindTask";
                        break;
                    case TASK_COMMENT_TYPE.GUIDE_TO_RESOLVE_CHALLENGE:
                        action = "task_update_add_guide_to_resolve_challenge";
                        actionFrom = "updateGuideToResolveChallengeTask";
                        break;
                }
                RingBellItemService.insert(dbname_prefix, username, action, { taskCode: docUpdated.code, title: docUpdated.title, username_update_comment: username }, usernameToNotify, [], actionFrom, date.getTime());
            }, function (err) {
                dfd.reject(err);
            })
        }, function (err) {
            dfd.reject(err);
        });

        }, function (err) {
            dfd.reject(err);
            err = undefined;
            req = undefined;
        });


        return dfd.promise;
    }

    pushFile(req) {
        let dfd = q.defer();
        FileProvider.upload(req, nameLib, validation.pushFile, undefined, parentFolder, req.body.username).then(function (res) {
            if (res.Files[0]) {
                TaskService.pushFile(req.body._service[0].dbname_prefix, req.body.username, res.Fields.id,
                    {
                        timePath: res.Files[0].timePath,
                        locate: res.Files[0].type,
                        display: res.Files[0].filename,
                        name: res.Files[0].named,
                        nameLib
                    }).then(function (docUpdated) {
                        dfd.resolve({
                            timePath: res.Files[0].timePath,
                            locate: res.Files[0].type,
                            display: res.Files[0].filename,
                            name: res.Files[0].named,
                            nameLib
                        });
                        let date = new Date();
                        let usernameToNotify = [];
                        TaskService.loadDetails(req.body._service[0].dbname_prefix, res.Fields.id).then(function (response) {
                            usernameToNotify = usernameToNotify.concat(docUpdated.main_person);
                            usernameToNotify = usernameToNotify.concat(docUpdated.participant);
                            usernameToNotify = usernameToNotify.concat(docUpdated.observer);
                            usernameToNotify.filter(username => username !== req.body.username);
                            RingBellItemService.insert(req.body._service[0].dbname_prefix, req.body.username, "task_push_file", { taskCode: response.code, title: docUpdated.title, username_push_file: req.body.username, attachment: res.Files[0].filename }, usernameToNotify, [], "updateTask", date.getTime());
                        }, function (err) {
                            dfd.reject(err);
                            body = undefined;
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

    removeFile(body) {
        let dfd = q.defer();
        TaskService.loadDetails(body._service[0].dbname_prefix, body.id).then(function (data) {
            let fileInfo = {};
            for (var i in data.attachment) {
                if (data.attachment[i].name === body.filename) {
                    fileInfo = data.attachment[i];
                }
            }
            if (fileInfo.name) {
                const fullPath = body._service[0].dbname_prefix + "/" + folderArray.join('/') + '/' + nameLib + '/' + body.username + '/' + body.filename;

                TaskService.removeFile(body._service[0].dbname_prefix, body.username, body.id, body.filename, {
                    timePath: getCurrentDate(),
                    fullPath: fullPath,
                }).then(function (docUpdated) {
                    dfd.resolve(true);
                    let date = new Date();
                    let usernameToNotify = [];
                    usernameToNotify = usernameToNotify.concat(docUpdated.main_person);
                    usernameToNotify = usernameToNotify.concat(docUpdated.participant);
                    usernameToNotify = usernameToNotify.concat(docUpdated.observer);
                    usernameToNotify.filter(username => username !== body.username);
                    RingBellItemService.insert(body._service[0].dbname_prefix, body.username, "task_remove_file", { taskCode: data.code, title: docUpdated.title, username_remove_file: body.username, attachment: body.filename }, usernameToNotify, [], "updateTask", date.getTime());
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

    update_task_list_status(body) {
        const dfd = q.defer();
        const dbPrefix = body._service[0].dbname_prefix;
        const username = body.username;
        let date = new Date();
        TaskService.getById(dbPrefix, body.id).then(function (task) {
            checkRuleToEditTaskDetails(body.session, task).then(function () {
                TaskService.update_task_list_status(dbPrefix, username, task._id, body.task_list_id, body.value, date).then(function (docUpdated) {
                    dfd.resolve(true);
                }, function (err) {
                    dfd.reject(err);
                });
            }, function (err) {
                dfd.reject({
                    path: "TaskController.delete.YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists",
                    mes: "YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists",
                });
            });
        }, function (err) {
            dfd.reject(err);
        });
        return dfd.promise;
    }

    update_task_list(body) {
        const dfd = q.defer();
        const dbPrefix = body._service[0].dbname_prefix;
        const username = body.username;
        let date = new Date();
        TaskService.getById(dbPrefix, body.id).then(function (task) {
            checkRuleToEditTaskDetails(body.session, task).then(function () {
                TaskService.update_task_list(dbPrefix, username, body.id, body.task_list, date).then(function (docUpdated) {
                    dfd.resolve(true);
                }, function (err) {
                    dfd.reject(err);
                });
            }, function (err) {
                dfd.reject({
                    path: "TaskController.delete.YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists",
                    mes: "YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists",
                });
            });
        }, function (err) {
            dfd.reject(err);
        });
        return dfd.promise;
    }

    update_progress(body) {
        let dfd = q.defer();
        const dbPrefix = body._service[0].dbname_prefix;
        const username = body.username;
        let date = new Date();
        let data = null
        TaskService.getById(dbPrefix, body.id).then(function (task) {
            checkRuleToEditTaskDetails(body.session, task).then(function () {
                const event = {
                    username,
                    time: date.getTime(),
                    action: "UpdatedProgress",
                    from_progress: task.progress,
                    to_progress: body.progress,
                };
                TaskService.update_progress(body._service[0].dbname_prefix, body.username, body.id, body.progress, event).then(function (docUpdated) {
                    dfd.resolve(true);
                    data = docUpdated
                    TaskService.loadRelateQuickActionPerson(dbPrefix, getFilterHandlerQuickAction(2))
                    .then(function (users) {
                        let userArray = [
                            ...(Array.isArray(data.main_person) ? data.main_person : []),
                            ...(Array.isArray(data.participant) ? data.participant : []),
                            ...(Array.isArray(data.observer) ? data.observer : []),
                            ...(Array.isArray(getUsernameQuickActionToNotify(users, data)) ? getUsernameQuickActionToNotify(users, data) : [])
                        ];

                        let usernameToNotifySet = new Set(userArray);
                        let usernameToNotify = Array.from(usernameToNotifySet).filter(u => u !== username);

                        if (usernameToNotify && usernameToNotify.length) {
                            RingBellItemService.insert(
                                body._service[0].dbname_prefix,
                                body.username,
                                "task_updated_progress",
                                {
                                    taskCode: docUpdated.code,
                                    title: docUpdated.title,
                                    username_updated_progress: body.username,
                                    from_progress: docUpdated.progress,
                                    to_progress: body.progress,
                                },
                                usernameToNotify,
                                [],
                                "updateProgress",
                                date.getTime(),
                            );
                        }
                    })
                    .catch(function (err) {
                        console.error(err);
                        dfd.reject(err);
                    });

                }, function (err) {
                    dfd.reject(err);
                });
            }, function (err) {
                dfd.reject({
                    path: "TaskController.delete.YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists",
                    mes: "YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists",
                });
            });
        }, function (err) {
            dfd.reject(err);
        });
        return dfd.promise;
    }

    insert_for_multiple_projects(dbNamePrefix, currentUser, tasks, sync) {
        return TaskService.insert_for_multiple_projects(dbNamePrefix, currentUser, tasks, sync);
    }

    link_workflow_play(body) {
        let dfd = q.defer();
        let date = new Date();
        TaskService.link_workflow_play(body._service[0].dbname_prefix, body.username, body.id, body.workflowPlay_id, date).then(function (docUpdated) {
            dfd.resolve(true);
            let usernameToNotify = [];
            usernameToNotify = usernameToNotify.concat(docUpdated.main_person);
            usernameToNotify = usernameToNotify.concat(docUpdated.participant);
            usernameToNotify = usernameToNotify.concat(docUpdated.observer);
            usernameToNotify.filter(username => username !== body.username);
            RingBellItemService.insert(body._service[0].dbname_prefix, body.username, "task_updated", { taskCode: body.code, title: docUpdated.title, username_update_task: body.username, action: "link_workflow_play" }, usernameToNotify, [], "updateTask", date.getTime());
        }, function (err) { dfd.reject(err); err = undefined; });
        return dfd.promise;
    }

    addProof(req) {
        let dfd = q.defer();
        FileProvider.upload(req, nameLib, validation.addProof, undefined, parentFolder, req.body.username).then(function (res) {
            let data = genData_proof(res.Fields);
            let attachment = [];
            if (!res.fileInfo.file || res.fileInfo.file.length === 0) {
                return dfd.reject({ path: "TaskController.addProof.RequiredFile", mes: "ProofFileRequired" });
            }
            for (let i in res.fileInfo.file) {
                if (!res.fileInfo.file[i].huge) {
                    attachment.push({
                        timePath: res.fileInfo.file[i].timePath,
                        locate: res.fileInfo.file[i].type,
                        display: res.fileInfo.file[i].filename,
                        name: res.fileInfo.file[i].named,
                        nameLib
                    });
                }
            }

            let date = new Date();
            TaskService.addProof(req.body._service[0].dbname_prefix, req.body.username, data.taskId, data.content, attachment, date).then(function (docUpdated) {
                let usernameToNotifySet = new Set();

                docUpdated.main_person.forEach(username => usernameToNotifySet.add(username));
                docUpdated.participant.forEach(username => usernameToNotifySet.add(username));
                docUpdated.observer.forEach(username => usernameToNotifySet.add(username));
                TaskService.loadEmployeeDepartment(req.body._service[0].dbname_prefix, req.body.session.employee_details.department)
                    .then(function (res) {
                        let usernameToReceive = getUsernameDepartmentToNotify(res, req.body.session.employee_details.department);
                        usernameToReceive.forEach(username => usernameToNotifySet.add(username));

                        let usernameToNotify = Array.from(usernameToNotifySet).filter(u => u !== req.body.username);

                        RingBellItemService.insert(req.body._service[0].dbname_prefix, req.body.username, "task_add_proof", { taskCode: data.code, title: docUpdated.title, username_add_proof: req.body.username }, usernameToNotify, [], "addProof", date.getTime());
                        dfd.resolve(true);
                    })
                    .catch(function (err) {
                        console.error(err);
                        dfd.reject(err);
                    });
            }, function (err) {
                dfd.reject(err);
            });
        }, function (err) {
            dfd.reject(err);
            err = undefined;
            req = undefined;
        });

        return dfd.promise;
    }

    removeProof(body) {
        let dfd = q.defer();
        TaskService.loadDetails(body._service[0].dbname_prefix, body.id).then(function (data) {
            let proof = {};
            for (var i in data.proof) {
                if (data.proof[i].id === body.proofId) {
                    proof = data.proof[i];
                }
            }
            let date = new Date();
            if (proof) {
                TaskService.removeProof(body._service[0].dbname_prefix, body.username, body.id, body.proofId, date).then(function (docUpdated) {
                    dfd.resolve(true);
                    let date = new Date();
                    let usernameToNotify = [];
                    usernameToNotify = usernameToNotify.concat(docUpdated.main_person);
                    usernameToNotify = usernameToNotify.concat(docUpdated.participant);
                    usernameToNotify = usernameToNotify.concat(docUpdated.observer);
                    usernameToNotify.filter(username => username !== body.username);
                    RingBellItemService.insert(body._service[0].dbname_prefix, body.username, "task_remove_proof", { taskCode: data.code, title: docUpdated.title, username_remove_proof: body.username }, usernameToNotify, [], "removeProof", date.getTime());
                }, function (err) {
                    dfd.reject(err);
                    err = undefined;
                });
            } else {
                dfd.reject({ path: "TaskController.removeProof.FileIsNull", mes: "FileIsNull" });
            }
        }, function (err) {
            dfd.reject(err);
            err = undefined;
        });

        return dfd.promise;
    }

    expandTaskReferences(dbPrefix, task, department, expands = []) {
        const dfd = q.defer();
        q.fcall(() => {
            return loadTaskReferences(dbPrefix, task, department, { expands });
        })
            .then((task) => {
                dfd.resolve(task);
            })
            .catch((error) => {
                dfd.reject(error);
            });
        return dfd.promise;
    }


    insert_transferTicketTask(req) {
        let dfd = q.defer();
        const date = new Date();
        const dbPrefix = req.body._service[0].dbname_prefix;


        FileProvider.upload(req, nameLib, validation.insert_transferTicketTask, undefined, parentFolder, req.body.username)
            .then(function (res) {
                const data = genData(res.Fields);
                data.status = TASK_STATUS.WAITING_LEAD_DEPARTMENT_APPROVE_RECEIVE;
                data.department = data.to_department;
                data.from_department = req.body.session.employee_details.department;
                data.attachment = fileUtil.getUploadedFilesWithSpecificKey({
                    nameLib,
                    formData: res,
                    fieldKey: "file",
                });
                data.parent_code = res.Fields.parent_code;
                data.event = [{ 
                    action: TASK_EVENT.RECEIVE,
                    username: req.body.username,
                    time: new Date().getTime(),
                    id: uuidv4()
                }];
                data.username = req.body.username;
                data.observer = [ req.body.username ];
                TaskService.insert_transferTicketTask(dbPrefix, req.body.username, data).then(function (task) {
                    dfd.resolve(task);
                    const filterNotify = genFilterGetUsersByRuleAndDepartment(TASK_RULE.RECEIVE_TASK, data.from_department);
                    notify(req, filterNotify, 'need_approve_department_receive_task', {
                        code: task.code,
                        parent_code: task.parent_code,
                        title: task.title,
                        from_department: data.from_department,
                        department: data.department,
                        time: date.getTime(),
                        username: req.body.username, 
                    }, 'need_approve_department_receive_task');
                }, function(err){
                    dfd.reject(err);
                })
            }, function(err){
                dfd.reject(err);
            })
            
        return dfd.promise;
    }

    receive_task(body) {
        const dfd = q.defer();
        const date = new Date();
        TaskService.loadDetails(body._service[0].dbname_prefix, body.id, body.code).then(function (task) {
            const event = {
                action: TASK_EVENT.RECEIVE_TASK,
                username: body.username,
                time: new Date().getTime(),
                id: uuidv4()
            };
            const note_receive = body.note;
            const status = TASK_STATUS.PROCESSING;
            TaskService.receive_task(body._service[0].dbname_prefix, body.username, task.code, event, status, note_receive).then(function (docUpdated) {
                dfd.resolve(true);

                RingBellItemService.insert(
                    body._service[0].dbname_prefix,
                    body.username,
                    'receive_task',
                    {
                        code: task.code,
                        parent_code: task.parent_code,
                        title: task.title,
                        from_department: task.from_department,
                        department: task.department,
                        time: date.getTime(),
                        username: body.username, 
                    },
                    [task.username],
                    [],
                    'receive_task',
                    new Date().getTime()
                );
            }, function (err) {
                dfd.reject(err);
                err = undefined;
            });
           
        }, function (err) {
            dfd.reject(err);
            err = undefined;
        });

        return dfd.promise;
    }

    approval_receive_task(req) {
        const dfd = q.defer();
        const date = new Date();
        const body = req.body;
        TaskService.loadDetails(body._service[0].dbname_prefix, body.id, body.code).then(function (task) {
            const event = {
                action: TASK_EVENT.APPROVAL_RECEIVE_TASK,
                username: body.username,
                time: new Date().getTime(),
                id: uuidv4()
            };
            const note_receive = body.note;
            const status = TASK_STATUS.WAITING_RECEIVE;
            TaskService.approval_receive_task(body._service[0].dbname_prefix, body.username, task.code, event, status, note_receive).then(function (docUpdated) {
                dfd.resolve(true);
                
                const filterNotify = genFilterGetUsersByRuleAndDepartment(TASK_RULE.RECEIVE_TASK, task.department);
                notify(req, filterNotify, 'need_approve_receive_task', {
                    code: task.code,
                    parent_code: task.parent_code,
                    title: task.title,
                    from_department: task.from_department,
                    department: task.department,
                    time: date.getTime(),
                    username: body.username, 
                }, 'need_approve_receive_task');
                
            }, function (err) {
                dfd.reject(err);
                err = undefined;
            });
           
        }, function (err) {
            dfd.reject(err);
            err = undefined;
        });

        return dfd.promise;
    }

    reject_approval_receive_task(body) {
        const dfd = q.defer();
        const date = new Date();
        TaskService.loadDetails(body._service[0].dbname_prefix, body.id, body.code).then(function (task) {
            const event = {
                action: TASK_EVENT.REJECT_RECEIVE_TASK,
                username: body.username,
                time: new Date().getTime(),
                id: uuidv4()
            }
            const status = TASK_STATUS.REJECTED;
            const note_receive = body.note;
            TaskService.reject_approval_receive_task(body._service[0].dbname_prefix, body.username, task.code, event, status, note_receive).then(function (docUpdated) {
                dfd.resolve(true);

                RingBellItemService.insert(
                    body._service[0].dbname_prefix,
                    body.username,
                    'reject_approval_receive_task',
                    {
                        code: task.code,
                        parent_code: task.parent_code,
                        title: task.title,
                        from_department: task.from_department,
                        department: task.department,
                        time: date.getTime(),
                        username: body.username, 
                    },
                    [task.username],
                    [],
                    'reject_approval_receive_task',
                    new Date().getTime()
                );
            }, function (err) {
                dfd.reject(err);
                err = undefined;
            });
           
        }, function (err) {
            dfd.reject(err);
            err = undefined;
        });

        return dfd.promise;
    }

    reject_receive_task(body) {
        const dfd = q.defer();
        const date = new Date();
        TaskService.loadDetails(body._service[0].dbname_prefix, body.id, body.code).then(function (task) {
            const event = {
                action: TASK_EVENT.REJECT_RECEIVE_TASK,
                username: body.username,
                time: new Date().getTime(),
                id: uuidv4()
            }
            const status = TASK_STATUS.REJECTED;
            const note_receive = body.note;
            TaskService.reject_receive_task(body._service[0].dbname_prefix, body.username, task.code, event, status, note_receive).then(function (docUpdated) {
                dfd.resolve(true);

                RingBellItemService.insert(
                    body._service[0].dbname_prefix,
                    body.username,
                    'reject_receive_task',
                    {
                        code: task.code,
                        parent_code: task.parent_code,
                        title: task.title,
                        from_department: task.from_department,
                        department: task.department,
                        time: date.getTime(),
                        username: body.username, 
                    },
                    [task.username],
                    [],
                    'reject_receive_task',
                    new Date().getTime()
                );
            }, function (err) {
                dfd.reject(err);
                err = undefined;
            });
           
        }, function (err) {
            dfd.reject(err);
            err = undefined;
        });

        return dfd.promise;
    }


    load_receive_task(body) {
        const dfd = q.defer();
        const filter = {
            $match: {
                parent_code: { $eq: body.code }
            }
        };
        TaskService.loadAggregate_onOffice(body._service[0].dbname_prefix, filter).then(function (tasks) {
            dfd.resolve(tasks);
        }, function (err) {
            dfd.reject(err);
            err = undefined;
        });

        return dfd.promise;
    }

    insert_head_task(req) {
        let dfd = q.defer();
        const date = new Date();
        const dbPrefix = req.body._service[0].dbname_prefix;
        const currentUser = req.body.username;

        let data;
        let attachments;
        let isHaveDispatchArrived = false;

        FileProvider.upload(req, nameLib, validation.insert_head_task, undefined, parentFolder, currentUser)
            .then(function (res) {
                data = genData(res.Fields);
                if (data.main_person.length > 1) {
                    throw new BaseError("TaskController.insert_head_task.CanNotAssignMultipleMainPerson", "CanNotAssignMultipleMainPerson");
                }

                attachments = fileUtil.getUploadedFilesWithSpecificKey({
                    nameLib,
                    formData: res,
                    fieldKey: "file",
                });

                return findLeadDepartment(dbPrefix, data.department);

            })
            .then(function (departmentLead) {
                departmentLead = departmentLead.map(item => item.username);
                data.main_person = departmentLead.length > 0 ? [departmentLead[0]] : [];
                data.participant = departmentLead.length > 1 ? departmentLead.slice(1) : [];
                data.department = data.department || req.body.session.employee_details.department;
                return TaskService.insert_head_task(
                    dbPrefix,
                    currentUser,
                    data.priority,
                    data.estimate,
                    data.department,
                    data.title,
                    data.to_department,
                    data.content,
                    data.task_list,
                    data.main_person,
                    data.participant,
                    data.observer,
                    attachments,
                    data.from_date,
                    data.to_date,
                    data.object,
                    data.has_time,
                    data.hours,
                    data.task_type,
                    data.project,
                    data.goals,
                    date,
                    data.level,
                    data.head_task_id,
                    data.references,
                    data.label,
                    null,
                    data.source_id !== "0" ? data.source_id : (isHaveDispatchArrived ? HEAD_TASK_ORIGIN.SCHOOL_OFFICE : HEAD_TASK_ORIGIN.SELF_CREATED),
                    data.parents,
                    data.dispatch_arrived_id,
                    data.is_draft,
                    req.body.session.employee_details.department,
                    data.has_repetitive,
                    data.per,
                    data.cycle,
                    data.has_expired,
                    data.expired_date,
                    data.child_work_percent,
                );

            }).then(function (task) {
                dfd.resolve(task);
                    data.code = task.code

                    if (data.main_person && data.main_person.length > 0) {
                        data.main_person.filter(username => username !== currentUser)
                        RingBellItemService.insert(
                            dbPrefix,
                            currentUser,
                            "task_assigned_main_person",
                            {
                                taskCode: task.code,
                                title: task.title,
                                username_create_task: currentUser,
                            },
                            task.main_person,
                            [],
                            "createTask",
                            date.getTime()
                        );
                    }


                    if (data.participant && data.participant.length > 0) {
                        data.participant.filter(username => username !== currentUser)
                        RingBellItemService.insert(
                            dbPrefix,
                            currentUser,
                            "task_assigned_participant",
                            {
                                taskCode: data.code,
                                title: data.title,
                                username_create_task: currentUser,
                            },
                            data.participant,
                            [],
                            "createTask",
                            date.getTime(),
                        );
                    }

                    if (data.observer && data.observer.length > 0) {
                        data.observer.filter(username => username !== currentUser)
                        RingBellItemService.insert(
                            dbPrefix,
                            currentUser,
                            "task_assigned_observer",
                            {
                                taskCode: data.code,
                                title: data.title,
                                username_create_task: currentUser,
                            },
                            data.observer,
                            [],
                            "createTask",
                            date.getTime(),
                        );
                    }

            }, function(err){
                console.error(err)
                dfd.reject(err);
            })
        return dfd.promise;
    }

    load_task_external(body) {
        const dbPrefix = body._service[0].dbname_prefix;
        const aggerationSearch = BuildFilterAggregate.generateUIFilterAggregate_search([], body);
        const queryCriteria = { ...body };
        const filter = BuildFilterAggregate.generateUIFilterAggregate_load_task_external(aggerationSearch, queryCriteria, body.username);
        return TaskService.loadAggregate_onOffice(dbPrefix, filter);
    }

    count_task_external(body) {
        const dbPrefix = body._service[0].dbname_prefix;
        const aggerationSearch = BuildFilterAggregate.generateUIFilterAggregate_search([], body);
        const queryCriteria = { ...body };
        const filter = BuildFilterAggregate.generateUIFilterAggregate_count_task_external(aggerationSearch, queryCriteria, body.username);
        return TaskService.loadAggregate_onOffice(dbPrefix, filter);
    }

    update_head_task(req) {
        const dfd = q.defer();
        const date = new Date();
        const dbPrefix = req.body._service[0].dbname_prefix;
        const currentUser = req.body.username;

        FileProvider.upload(req, nameLib, validation.update_head_task, undefined, parentFolder, currentUser).then(function (res) {
            verify_Update(req.body, res.Fields.code).then(function(task){
                const attachments = fileUtil.getUploadedFilesWithSpecificKey({
                    nameLib,
                    formData: res,
                    fieldKey: "file",
                });
                const dataUpdate = genDataUpdateHeadTask(res.Fields, attachments, task.attachment, currentUser);
                findLeadDepartment(dbPrefix, dataUpdate.department).then(function(departmentLead){
                    departmentLead = departmentLead.map(item => item.username);
                    dataUpdate.main_person = departmentLead.length > 0 ? [departmentLead[0]] : [];
                    dataUpdate.participant = departmentLead.length > 1 ? departmentLead.slice(1) : [];
                    TaskService.update_head_task(dbPrefix, currentUser, dataUpdate).then(function(docUpdated){
                        dfd.resolve(task);
                        const newMainPerson = dataUpdate.main_person.filter(user => !task.main_person.includes(user));
                        const newParticipant = dataUpdate.participant.filter(user => !task.participant.includes(user));
                        const newObserver = dataUpdate.observer.filter(user => !task.observer.includes(user));

                        if (newMainPerson.length > 0) {
                            newMainPerson.filter(username => username !== currentUser)
                            RingBellItemService.insert(
                                dbPrefix,
                                currentUser,
                                "task_assigned_main_person",
                                {
                                    taskCode: task.code,
                                    title: dataUpdate.title,
                                    username_create_task: task.username,
                                },
                                newMainPerson,
                                [],
                                "createTask",
                                date.getTime()
                            );
                        }
    
    
                        if (newParticipant.length > 0) {
                            newParticipant.filter(username => username !== currentUser)
                            RingBellItemService.insert(
                                dbPrefix,
                                currentUser,
                                "task_assigned_participant",
                                {
                                    taskCode: task.code,
                                    title: dataUpdate.title,
                                    username_create_task: currentUser,
                                },
                                newParticipant,
                                [],
                                "createTask",
                                date.getTime(),
                            );
                        }
    
                        if (newObserver.length > 0) {
                            newObserver.filter(username => username !== currentUser)
                            RingBellItemService.insert(
                                dbPrefix,
                                currentUser,
                                "task_assigned_observer",
                                {
                                    taskCode: task.code,
                                    title: dataUpdate.title,
                                    username_create_task: currentUser,
                                },
                                newObserver,
                                [],
                                "createTask",
                                date.getTime(),
                            );
                        }

                    }, function(err){
                        dfd.reject(err);
                    })
                }, function(err){
                    dfd.reject(err);
                })
            }, function(err){
                console.log(err);
                dfd.reject(err);
            })
        }, function(err){
            console.log(err)
            dfd.reject(err);
        })
        return dfd.promise;
    }

}

const addComment = function (req, res, date, data, attachment) {
    let dfd = q.defer();
    TaskService.loadDetails(req.body._service[0].dbname_prefix, data.id).then(function (taskDetails) {
        checkRuleToEditTaskDetails(req.body.session, taskDetails).then(
            function (result) {
                if (res.Fields.type !== TASK_COMMENT_TYPE.CHALLENGE_RESOLVER) {
                    TaskService.comment(req.body._service[0].dbname_prefix, req.body.username, res.Fields.id, res.Fields.content, attachment, date, taskDetails, res.Fields.type, res.Fields.challenge_id).then(function (docUpdated) {
                        dfd.resolve(docUpdated);
                    }, function (err) {
                        dfd.reject(err);
                    });
                } else {
                    TaskService.resolveChallenge(req.body._service[0].dbname_prefix, req.body.username, res.Fields.id, taskDetails, res.Fields.type, res.Fields.challenge_id).then(function (docUpdated) {
                        dfd.resolve(docUpdated);
                    }, function (err) {
                        dfd.reject(err);
                    });
                }
            },
            function (err) {
                dfd.reject({
                    path: "TaskController.comment.YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists",
                    mes: "YouHaveNotPermissionToPerformThisOperationOrDataIsNotExists"
                });
            }
        )
    }, function (err) {
        dfd.reject(err);
    });
    return dfd.promise;
}

function genDataUpdateHeadTask(Fields, new_attachments, old_attachments, username){
    const data = {};
    const remove_attachment = JSON.parse(Fields.remove_attachment);
    data.code = Fields.code;
    data.title = Fields.title;
    data.estimate = Fields.estimate * 1;
    data.department = Fields.department;
    data.content = Fields.content;
    data.observer = JSON.parse(Fields.observer);
    data.from_date = Fields.from_date * 1;
    data.to_date = Fields.to_date * 1;
    data.priority = Fields.priority * 1;
    data.label = JSON.parse(Fields.label);
    old_attachments = old_attachments.filter(file => !remove_attachment.includes(file.name));
    data.attachment = [
        ...old_attachments,
        ...new_attachments,
    ];
    data.event = { 
        action: 'Update',
        username,
        time: new Date().getTime(),
        id: uuidv4() 
    }
    return data;
}

function findLeadDepartment(dbname_prefix, department_id){
    const rule = TASK_RULE_NEW.RECEIVE_EXTERNAL;
    const filter = genFilterGetUsersByRuleAndDepartment(rule, department_id);
    return UserService.loadAggregateUser(dbname_prefix, filter);
}

function verify_Update(body, code){
    let dfd = q.defer();
    TaskService.loadDetails(body._service[0].dbname_prefix, null, code).then(function(task){
        if(task.username === body.username){
            dfd.resolve(task);
        }else{
            dfd.reject({path:"TaskController.verify_Update.StatusInvalid", mes:"StatusInvalid"});
        }
    },function(err){
        dfd.reject(err);
    })
    return dfd.promise;
}

exports.TaskController = new TaskController();
exports.loadTaskReferences = loadTaskReferences;
