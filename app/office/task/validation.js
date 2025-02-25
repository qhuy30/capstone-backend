const { ValidationProvider } = require('../../../shared/validation/validation.provider');

const {
    TASK_LEVEL,
    TASK_STATUS,
    TASK_STATE,
    TASK_GROUP_FILTER,
    TAB_FILTER,
    TASK_PRIORITY,
    TASK_COMMENT_TYPE,
    TASK_REPETITIVE_CYCLE
} = require('../../../utils/constant');
const { TASK_ROLE } = require('./const');

const Joi = ValidationProvider.initModuleValidation();

let validation = {};

validation.load_child = function (req, res, next) {
    const schema_body = {
        ids: Joi.array().items(Joi.string().required()).required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.load = function (req, res, next) {
    const schema_body = {
        top: Joi.number().required(),
        offset: Joi.number().required(),
        from_date: Joi.date().timestamp('javascript').required(),
        to_date: Joi.date().timestamp('javascript').required(),
        tab: Joi.string().valid([
            TAB_FILTER.ALL,
            TAB_FILTER.ASSIGNED,
            TAB_FILTER.CREATED,
            TAB_FILTER.RESPONSIBLE,
            TAB_FILTER.SUPPORT,
            TAB_FILTER.SUPERVISION
        ]).required(),
        search: Joi.string().allow(null, ''),
        priority: Joi.array().items(Joi.string().valid(Object.values(TASK_PRIORITY))),
        status: Joi.array().items(Joi.string().valid(Object.values(TASK_STATUS))),
        state: Joi.array().items(Joi.string().valid(Object.values(TASK_STATE))),
        task_type: Joi.array().items(Joi.number()),
        label: Joi.array().items(Joi.string()),
        task_group: Joi.array().items(Joi.string().valid(Object.values(TASK_GROUP_FILTER))),
        projects: Joi.array().items(Joi.string()),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};

validation.load_quickhandle = function (req, res, next) {
    const schema_body = {
        top: Joi.number().required(),
        offset: Joi.number().required(),
        search: Joi.string().allow(null, ''),
        priority: Joi.array().items(Joi.string().valid(Object.values(TASK_PRIORITY))),
        status: Joi.array().items(Joi.string().valid(Object.values(TASK_STATUS))),
        state: Joi.array().items(Joi.string().valid(Object.values(TASK_STATE))),
        task_type: Joi.array().items(Joi.number()),
        label: Joi.array().items(Joi.string()),
        departments: Joi.array().items(Joi.string()),
        projects: Joi.array().items(Joi.string()),
        is_dispatch_arrived: Joi.boolean(),
        is_receiver_task: Joi.boolean(),
        is_approval_receiver_task: Joi.boolean(),
        is_get_all: Joi.boolean()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};

validation.count_quickhandle = function (req, res, next) {
    const schema_body = {
        search: Joi.string().allow(null, ''),
        priority: Joi.array().items(Joi.string().valid(Object.values(TASK_PRIORITY))),
        status: Joi.array().items(Joi.string().valid(Object.values(TASK_STATUS))),
        state: Joi.array().items(Joi.string().valid(Object.values(TASK_STATE))),
        task_type: Joi.array().items(Joi.number()),
        label: Joi.array().items(Joi.string()),
        departments: Joi.array().items(Joi.string()),
        projects: Joi.array().items(Joi.string()),
        is_dispatch_arrived: Joi.boolean(),
        is_receiver_task: Joi.boolean(),
        is_get_all: Joi.boolean()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};

validation.export_personal = function (req, res, next) {
    const schema_body = {
        search: Joi.string(),
        status: Joi.string(),
        tab: Joi.any().valid(["created", "assigned", "all"]).required(),
        from_date: Joi.number(),
        to_date: Joi.number()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.export_project = function (req, res, next) {
    const schema_body = {
        search: Joi.string(),
        status: Joi.string(),
        tab: Joi.any().valid(["created", "assigned", "all"]).required(),
        project: Joi.string().required(),
        from_date: Joi.number(),
        to_date: Joi.number()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.export_department = function (req, res, next) {
    const schema_body = {
        search: Joi.string(),
        status: Joi.string(),
        tab: Joi.any().valid(["created", "assigned", "all"]).required(),
        department: Joi.string().required(),
        from_date: Joi.number(),
        to_date: Joi.number(),
        status: Joi.array().items(Joi.string().valid(Object.values(TASK_STATUS))),

    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.load_department = function (req, res, next) {
    const schema_body = {
        department_id: Joi.string(),
        department_grade: Joi.number(),
        search: Joi.string().allow(null, ''),
        sort_by: Joi.string(),
        sorting_order: Joi.number(),
        from_date: Joi.number(),
        to_date: Joi.number()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};

validation.load_template = function (req, res, next) {
    const schema_body = {
        department: Joi.string().required(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.load_template = function (req, res, next) {
    const schema_body = {
        department: Joi.string().required(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.load_base_department = function (req, res, next) {
    const schema_body = {
        top: Joi.number().required(),
        offset: Joi.number().required(),
        from_date: Joi.date().timestamp("javascript").required(),
        to_date: Joi.date().timestamp("javascript").required(),
        tab: Joi.string().valid([
            TAB_FILTER.ALL,
            TAB_FILTER.HEAD_TASK,
            TAB_FILTER.TASK,
        ]).required(),
        search: Joi.string().allow(null, ''),
        department: Joi.string().required(),
        employee: Joi.array().items(Joi.string()),
        priority: Joi.array().items(Joi.string().valid(Object.values(TASK_PRIORITY))),
        status: Joi.array().items(Joi.string().valid(Object.values(TASK_STATUS))),
        state: Joi.array().items(Joi.string().valid(Object.values(TASK_STATE))),
        task_type: Joi.array().items(Joi.number()),
        label: Joi.array().items(Joi.string()),
        task_group: Joi.array().items(Joi.string().valid(Object.values(TASK_GROUP_FILTER))),
        projects: Joi.array().items(Joi.string()),
        sort: Joi.any(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};

validation.count_base_department = function (req, res, next) {
    const schema_body = {
        from_date: Joi.date().timestamp("javascript").required(),
        to_date: Joi.date().timestamp("javascript").required(),
        tab: Joi.string().valid([
            TAB_FILTER.ALL,
            TAB_FILTER.HEAD_TASK,
            TAB_FILTER.TASK,
        ]).required(),
        search: Joi.string().allow(null, ''),
        department: Joi.string().required(),
        employee: Joi.array().items(Joi.string()),
        priority: Joi.array().items(Joi.string().valid(Object.values(TASK_PRIORITY))),
        status: Joi.array().items(Joi.string().valid(Object.values(TASK_STATUS))),
        state: Joi.array().items(Joi.string().valid(Object.values(TASK_STATE))),
        task_type: Joi.array().items(Joi.number()),
        label: Joi.array().items(Joi.string()),
        task_group: Joi.array().items(Joi.string().valid(Object.values(TASK_GROUP_FILTER))),
        projects: Joi.array().items(Joi.string()),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};

validation.ganttChart_base_department = function (req, res, next) {
    const schema_body = {
        from_date: Joi.number().required(),
        to_date: Joi.number().required(),
        department: Joi.string().required(),
        employee: Joi.array().items(Joi.string()),
        priority: Joi.array().items(Joi.string().valid(Object.values(TASK_PRIORITY))),
        status: Joi.array().items(Joi.string().valid(Object.values(TASK_STATUS))),
        state: Joi.array().items(Joi.string().valid(Object.values(TASK_STATE))),
        task_type: Joi.array().items(Joi.number()),
        label: Joi.array().items(Joi.string()),
        task_group: Joi.array().items(Joi.string().valid(Object.values(TASK_GROUP_FILTER))),
        projects: Joi.array().items(Joi.string()),
        search: Joi.string().allow(null, ''),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};

validation.statistic_department_count = function (req, res, next) {
    const schema_body = {
        from_date: Joi.number().required(),
        to_date: Joi.number().required(),
        department: Joi.string().required(),
        employee: Joi.array().items(Joi.string()),
        priority: Joi.array().items(Joi.string().valid(Object.values(TASK_PRIORITY))),
        status: Joi.array().items(Joi.string().valid(Object.values(TASK_STATUS))),
        task_type: Joi.array().items(Joi.number()),
        label: Joi.array().items(Joi.string()),
        task_group: Joi.array().items(Joi.string().valid(Object.values(TASK_GROUP_FILTER))),
        projects: Joi.array().items(Joi.string()),
        search: Joi.string().allow(null, ''),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};

validation.statistic_department_growth = function (req, res, next) {
    const schema_body = {
        from_date: Joi.number().required(),
        to_date: Joi.number().required(),
        department: Joi.string().required(),
        employee: Joi.array().items(Joi.string()),
        priority: Joi.array().items(Joi.string().valid(Object.values(TASK_PRIORITY))),
        status: Joi.array().items(Joi.string().valid(Object.values(TASK_STATUS))),
        task_type: Joi.array().items(Joi.number()),
        label: Joi.array().items(Joi.string()),
        task_group: Joi.array().items(Joi.string().valid(Object.values(TASK_GROUP_FILTER))),
        projects: Joi.array().items(Joi.string()),
        search: Joi.string().allow(null, ''),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};

validation.load_base_project = function (req, res, next) {
    const schema_body = {
        top: Joi.number().required(),
        offset: Joi.number().required(),
        from_date: Joi.date().timestamp('javascript').required(),
        to_date: Joi.date().timestamp('javascript').required(),
        tab: Joi.string().valid([
            TAB_FILTER.ALL,
            TAB_FILTER.HEAD_TASK,
            TAB_FILTER.TASK,
        ]).required(),
        search: Joi.string().allow(null, ''),
        project: Joi.string().required(),
        participant: Joi.array().items(Joi.string()),
        priority: Joi.array().items(Joi.string().valid(Object.values(TASK_PRIORITY))),
        status: Joi.array().items(Joi.string().valid(Object.values(TASK_STATUS))),
        state: Joi.array().items(Joi.string().valid(Object.values(TASK_STATE))),
        task_type: Joi.array().items(Joi.number()),
        label: Joi.array().items(Joi.string()),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};



validation.count_base_project = function (req, res, next) {
    const schema_body = {
        from_date: Joi.date().timestamp('javascript').required(),
        to_date: Joi.date().timestamp('javascript').required(),
        tab: Joi.string().valid([
            TAB_FILTER.ALL,
            TAB_FILTER.HEAD_TASK,
            TAB_FILTER.TASK,
        ]).required(),
        project: Joi.string().required(),
        participant: Joi.array().items(Joi.string()),
        priority: Joi.array().items(Joi.string().valid(Object.values(TASK_PRIORITY))),
        status: Joi.array().items(Joi.string().valid(Object.values(TASK_STATUS))),
        state: Joi.array().items(Joi.string().valid(Object.values(TASK_STATE))),
        task_type: Joi.array().items(Joi.number()),
        label: Joi.array().items(Joi.string()),
        search: Joi.string().allow(null, ''),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};

validation.statistic_all_project_count = function (req, res, next) {
    const schema_body = {
        from_date: Joi.number().required(),
        to_date: Joi.number().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.statistic_all_project_growth = function (req, res, next) {
    const schema_body = {
        from_date: Joi.number().required(),
        to_date: Joi.number().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.statistic_personal_count = function (req, res, next) {
    const schema_body = {
        from_date: Joi.date().timestamp('javascript').required(),
        to_date: Joi.date().timestamp('javascript').required(),
        tab: Joi.string().valid([
            TAB_FILTER.CREATED,
            TAB_FILTER.MY_TASK,
        ]).required(),
        search: Joi.string().allow(null, ''),
        priority: Joi.array().items(Joi.string().valid(Object.values(TASK_PRIORITY))),
        status: Joi.array().items(Joi.string().valid(Object.values(TASK_STATUS))),
        state: Joi.array().items(Joi.string().valid(Object.values(TASK_STATE))),
        task_type: Joi.array().items(Joi.number()),
        label: Joi.array().items(Joi.string()),
        task_group: Joi.array().items(Joi.string().valid(Object.values(TASK_GROUP_FILTER))),
        projects: Joi.array().items(Joi.string()),
    };

    ValidationProvider.createMiddleware(schema_body, req, res, next);
};

validation.statistic_personal_growth = function (req, res, next) {
    const schema_body = {
        from_date: Joi.date().timestamp('javascript').required(),
        to_date: Joi.date().timestamp('javascript').required(),
        tab: Joi.string().valid([
            TAB_FILTER.CREATED,
            TAB_FILTER.MY_TASK,
        ]).required(),
        search: Joi.string().allow(null, ''),
        priority: Joi.array().items(Joi.string().valid(Object.values(TASK_PRIORITY))),
        status: Joi.array().items(Joi.string().valid(Object.values(TASK_STATUS))),
        state: Joi.array().items(Joi.string().valid(Object.values(TASK_STATE))),
        task_type: Joi.array().items(Joi.number()),
        label: Joi.array().items(Joi.string()),
        task_group: Joi.array().items(Joi.string().valid(Object.values(TASK_GROUP_FILTER))),
        projects: Joi.array().items(Joi.string()),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};

validation.statistic_project_count = function (req, res, next) {
    const schema_body = {
        from_date: Joi.date().timestamp('javascript').required(),
        to_date: Joi.date().timestamp('javascript').required(),
        project: Joi.string().required(),
        participant: Joi.array().items(Joi.string()),
        priority: Joi.array().items(Joi.string().valid(Object.values(TASK_PRIORITY))),
        status: Joi.array().items(Joi.string().valid(Object.values(TASK_STATUS))),
        state: Joi.array().items(Joi.string().valid(Object.values(TASK_STATE))),
        task_type: Joi.array().items(Joi.number()),
        label: Joi.array().items(Joi.string()),
        search: Joi.string().allow(null, ''),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};

validation.statistic_project_growth = function (req, res, next) {
    const schema_body = {
        from_date: Joi.date().timestamp('javascript').required(),
        to_date: Joi.date().timestamp('javascript').required(),
        project: Joi.string().required(),
        participant: Joi.array().items(Joi.string()),
        priority: Joi.array().items(Joi.string().valid(Object.values(TASK_PRIORITY))),
        status: Joi.array().items(Joi.string().valid(Object.values(TASK_STATUS))),
        state: Joi.array().items(Joi.string().valid(Object.values(TASK_STATE))),
        task_type: Joi.array().items(Joi.number()),
        label: Joi.array().items(Joi.string()),
        search: Joi.string().allow(null, ''),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.loadDetails = function (req, res, next) {
    const schema_body = {
        id: Joi.string().when('code', { is: "", then: Joi.required(), otherwise: Joi.allow("") }),
        department: Joi.string().allow(""),
        code: Joi.string().allow("")
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.loadEmployee = function (req, res, next) {
    const schema_body = {
        department: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.count = function (req, res, next) {
    const schema_body = {
        from_date: Joi.date().timestamp('javascript').required(),
        to_date: Joi.date().timestamp('javascript').required(),
        tab: Joi.string().valid([
            TAB_FILTER.ALL,
            TAB_FILTER.ASSIGNED,
            TAB_FILTER.CREATED,
            TAB_FILTER.RESPONSIBLE,
            TAB_FILTER.SUPPORT,
            TAB_FILTER.SUPERVISION,
            TAB_FILTER.ALL
        ]).required(),
        search: Joi.string().allow(null, ''),
        priority: Joi.array().items(Joi.string().valid(Object.values(TASK_PRIORITY))),
        status: Joi.array().items(Joi.string().valid(Object.values(TASK_STATUS))),
        state: Joi.array().items(Joi.string().valid(Object.values(TASK_STATE))),
        task_type: Joi.array().items(Joi.number()),
        label: Joi.array().items(Joi.string()),
        task_group: Joi.array().items(Joi.string().valid(Object.values(TASK_GROUP_FILTER))),
        projects: Joi.array().items(Joi.string()),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};

validation.loadFileInfo = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        filename: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.insert = Joi.object().keys({
    estimate: Joi.string(),
    title: Joi.string().required(),
    to_department: Joi.string().allow(""),
    content: Joi.string().allow(""),
    task_list: Joi.string().allow(""),
    main_person: Joi.string().allow(""),
    participant: Joi.string().allow(""),
    observer: Joi.string().allow(""),
    from_date: Joi.string().allow(""),
    to_date: Joi.string().allow(""),
    has_time: Joi.string().allow(""),
    // hours: Joi.string().required(),
    parent_id: Joi.string(),
    project: Joi.string(),
    priority: Joi.string().allow(""),
    task_type: Joi.string(),
    parents: Joi.array(),
    parent: Joi.object(),
    source_id: Joi.string(),
    hours: Joi.string(),
    head_task_id: Joi.string(),
    department: Joi.string(),
    dispatch_arrived_id: Joi.string().allow(""),
    level: Joi.string(),
    label: Joi.string(),
    is_draft: Joi.string(),

    has_repetitive: Joi.boolean().optional(),
    per: Joi.number(),
    cycle: Joi.string().valid(Object.values(TASK_REPETITIVE_CYCLE)).allow(""),
    has_expired: Joi.boolean(),
    expired_date: Joi.number(),
    child_work_percent: Joi.number(),
}).required();

validation.insertTasks = function (req, res, next) {
    const schema_body = {
        data: Joi.array().items({
            id: Joi.string().required(),
            title: Joi.string().required(),
            to_department: Joi.string(),
            content: Joi.string().required(),
            from_date: Joi.date().timestamp(),
            to_date: Joi.date().timestamp().min(Joi.ref('from_date')).required(),
            department: Joi.string().allow(''),
            main_person: Joi.array(),
            participant: Joi.array(),
            observer: Joi.array(),
            priority: Joi.number(),
            task_type: Joi.number(),
            has_time: Joi.boolean().required(),
            searching: Joi.string(),
            dispatch_arrived_id: Joi.string().allow(null),
            task_list: Joi.array().items(
                Joi.object({
                    title: Joi.string().allow('').required(),
                    id: Joi.string().required(),
                    status: Joi.boolean().required(),
                }),
            ),
        }),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};

validation.insert_task_from_template = function (req, res, next) {
    const schema_body = {
        data: Joi.array().items({
            id: Joi.string().required(),
            title: Joi.string().required(),
            to_department: Joi.string(),
            content: Joi.string().required(),
            from_date: Joi.date().timestamp(),
            to_date: Joi.date().timestamp().min(Joi.ref('from_date')).required(),
            department: Joi.string().allow(''),
            main_person: Joi.array(),
            label: Joi.array().items(
                Joi.string().length(24).hex()
            ).allow(null).allow([]),
            participant: Joi.array(),
            observer: Joi.array(),
            priority: Joi.number(),
            task_type: Joi.number(),
            has_time: Joi.boolean().required(),
            searching: Joi.string(),
            dispatch_arrived_id: Joi.string().allow(null),
            task_list: Joi.array().items(
                Joi.object({
                    title: Joi.string().allow('').required(),
                    id: Joi.string().required(),
                    status: Joi.boolean().required(),
                }),
            ),
        }),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};

validation.insertTasksForMultipleDepartments = function (req, res, next) {
    const schema_body = {
        data: Joi.array().items({
            id: Joi.string().required(),
            title: Joi.string().required(),
            to_department: Joi.string(),
            content: Joi.string(),
            from_date: Joi.date().timestamp(),
            to_date: Joi.date().timestamp().min(Joi.ref('from_date')).required(),
            department: Joi.string().required(),
            priority: Joi.number(),
            // hours: Joi.number(),
            has_time: Joi.boolean().required(),
            searching: Joi.string(),
            task_list: Joi.array().items(Joi.object({
                title: Joi.string().allow("").required(),
                id: Joi.string().required(),
                status: Joi.boolean().required()
            })),
            dispatch_arrived_id: Joi.string().allow(null),
            label: Joi.array().items(
                Joi.string().length(24).hex()
            ).allow(null).allow([]),
            // task_type: Joi.number(),
        })
    } ;
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.insert_task_external = function (req, res, next) {
    const schema_body = {
        data: Joi.array().items({
            id: Joi.string().required(),
            title: Joi.string().required(),
            to_department: Joi.string(),
            content: Joi.string(),
            from_date: Joi.date().timestamp(),
            to_date: Joi.date().timestamp().min(Joi.ref('from_date')).required(),
            department: Joi.string().required(),
            priority: Joi.number(),
            has_time: Joi.boolean().required(),
            searching: Joi.string(),
            task_list: Joi.array().items(Joi.object({
                title: Joi.string().allow("").required(),
                id: Joi.string().required(),
                status: Joi.boolean().required()
            })),
            label: Joi.array().items(
                Joi.string().length(24).hex()
            ).allow(null).allow([]),
        })
    } ;
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.insert_transfer_ticket = Joi.object().keys({
    title: Joi.string().allow(""),
    content: Joi.string().allow(""),
    task_list: Joi.string().allow(""),
    main_person: Joi.string().allow(""),
    participant: Joi.string(),
    observer: Joi.string(),
    from_date: Joi.string().allow(""),
    to_date: Joi.string().allow(""),
    has_time: Joi.string(),
    hours: Joi.string(),
    priority: Joi.string().allow(""),
    task_type: Joi.number(),
    department: Joi.string().allow(""),
    department_assign_id: Joi.string().allow(""),
    head_task_id: Joi.string().allow(""),
    transfer_ticket_values: Joi.object().keys({
        title: Joi.string().required(),
        content: Joi.string().required(),
        perform: Joi.string().required(),
        base: Joi.string().required(),
        recipient: Joi.string().required()
    }),
    parents: Joi.array(),
    parent: Joi.object(),
    source_id: Joi.string().required()
}).required();

validation.transferTicketPreview = function(req, res, next) {
    const schemaBody = {
        department: Joi.string().required(),
        department_assign_id: Joi.string().required(),
        transfer_ticket_values: {
            title: Joi.string().required(),
            content: Joi.string().required(),
            perform: Joi.string().required(),
            base: Joi.string().required(),
            recipient: Joi.string().required(),
        }
    };
    ValidationProvider.createMiddleware(schemaBody, req, res, next);
};

validation.start = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.done = Joi.object().keys({
    id: Joi.string().required(),
    code: Joi.string(),
    content: Joi.string().allow(""),
    worktimes: Joi.number().allow(null),
    subAttachment: Joi.string().allow(""),
}).required();

validation.complete = Joi.object().keys({
    id: Joi.string().required(),
    code: Joi.string(),
    content: Joi.string().allow(""),
}).required();

validation.refune = Joi.object().keys({
    id: Joi.string().required(),
    code: Joi.string(),
    content: Joi.string().allow(""),
    progress: Joi.number()
}).required();

validation.cancel = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        comment: Joi.string().required(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};

validation.delete = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.comment = Joi.object().keys({
    content: Joi.when('type',{
        is: TASK_COMMENT_TYPE.CHALLENGE_RESOLVER,
        then: Joi.string().allow(""),
        otherwise: Joi.string().required(),
    }),
    type: Joi.string().valid(Object.values(TASK_COMMENT_TYPE)).required(),
    challenge_id : Joi.when('type',{
        is: TASK_COMMENT_TYPE.CHALLENGE_RESOLVER,
        then: Joi.string().required(),
        otherwise: Joi.string().allow(""),
    }),
    id: Joi.string().required(),
    code: Joi.string()
}).required();

validation.updateComment = Joi.object().keys({
    content: Joi.when('type',{
        is: TASK_COMMENT_TYPE.CHALLENGE_RESOLVER,
        then: Joi.string().allow(""),
        otherwise: Joi.string().required(),
    }),
    type: Joi.string().valid(Object.values(TASK_COMMENT_TYPE)).required(),
    challenge_id : Joi.when('type',{
        is: TASK_COMMENT_TYPE.CHALLENGE_RESOLVER,
        then: Joi.string().required(),
        otherwise: Joi.string().allow(""),
    }),
    task_id: Joi.string().required(),
    comment_id: Joi.string().required()
}).required();

validation.update = function (req, res, next) {
    const schema_body = {
        estimate: Joi.number().allow(null),
        id: Joi.string().required(),
        title: Joi.string(),
        content: Joi.string().allow(""),
        task_list: Joi.array().items(
            Joi.object({
                title: Joi.string().allow("").required(),
                id: Joi.string().required(),
                status: Joi.boolean().required(),
            }),
        ),
        main_person: Joi.array(),
        participant: Joi.array(),
        observer: Joi.array(),
        from_date: Joi.number(),
        to_date: Joi.number(),
        status: Joi.string(),
        has_time: Joi.boolean(),
        // hours: Joi.number(),
        priority: Joi.number(),
        task_type: Joi.number(),
        workflowPlay_id: Joi.string().allow(""),
        label: Joi.array().items(Joi.string()),
        dispatch_arrived_id: Joi.string().allow(null, ""),
        department: Joi.string().allow(null, ""),
        has_repetitive: Joi.boolean(),
        per: Joi.number(),
        cycle: Joi.string().valid(Object.values(TASK_REPETITIVE_CYCLE)),
        has_expired: Joi.boolean(),
        expired_date: Joi.number(),
        action_access: Joi.string(),
        child_work_percent: Joi.number().optional().allow(null),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.update_task_list_status = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        task_list_id: Joi.string().required(),
        value: Joi.boolean().required(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.update_task_list = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        task_list: Joi.array().items(Joi.object({
            title: Joi.string().allow("").required(),
            id: Joi.string().required(),
            status: Joi.boolean().required()
        })).required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.pushFile = Joi.object().keys({
    id: Joi.string().required()
}).required();

validation.removeFile = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        filename: Joi.string().required(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};

validation.updateProgress = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        progress: Joi.number().required(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};

validation.insertTasksForMultipleProjects = function (req, res, next) {
    const schema_body = {
        data: Joi.array().items({
            id: Joi.string().required(),
            title: Joi.string().required(),
            content: Joi.string(),
            from_date: Joi.date().timestamp(),
            to_date: Joi.date().timestamp().min(Joi.ref('from_date')).required(),
            project: Joi.string().required(),
            priority: Joi.number(),
            task_type: Joi.number(),
            has_time: Joi.boolean().required(),
            searching: Joi.string(),
            task_list: Joi.array().items(
                Joi.object({
                    id: Joi.string().required(),
                    title: Joi.string().allow('').required(),
                    status: Joi.boolean().required(),
                })
            )
        })
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};

validation.link_workflow_play = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        workflowPlay_id: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};

validation.ganttChart_base_project = function (req, res, next) {
    const schema_body = {
        from_date: Joi.date().timestamp('javascript').required(),
        to_date: Joi.date().timestamp('javascript').required(),
        project: Joi.string().required(),
        participant: Joi.array().items(Joi.string()),
        priority: Joi.array().items(Joi.string().valid(Object.values(TASK_PRIORITY))),
        status: Joi.array().items(Joi.string().valid(Object.values(TASK_STATUS))),
        state: Joi.array().items(Joi.string().valid(Object.values(TASK_STATE))),
        task_type: Joi.array().items(Joi.number()),
        label: Joi.array().items(Joi.string())
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.addProof = Joi.object().keys({
    id: Joi.string().required(),
    code: Joi.string().required(),
    content: Joi.string().allow("")
}).required();

validation.removeProof = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        proofId: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};

validation.insert_transferTicketTask = Joi.object().keys({
    title: Joi.string().required(),
    to_department: Joi.string().allow(""),
    from_date: Joi.string().allow(""),
    to_date: Joi.string().allow(""),
    content: Joi.string().allow(""),
    label: Joi.string(),
    priority: Joi.string().allow(""),
    parent: Joi.object(),
    parents: Joi.array(),
    parent_code: Joi.string(),
    level: Joi.string(),
    source_id: Joi.string(),
    estimate: Joi.number(),
}).required();

validation.receive_task = function (req, res, next) {
    const schema_body = {
        code: Joi.string().required(),
        note: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};

validation.approval_receive_task = function (req, res, next) {
    const schema_body = {
        code: Joi.string().required(),
        note: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};

validation.reject_receive_task = function (req, res, next) {
    const schema_body = {
        code: Joi.string().required(),
        note: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};

validation.reject_approval_receive_task = function (req, res, next) {
    const schema_body = {
        code: Joi.string().required(),
        note: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};

validation.load_receive_task = function (req, res, next) {
    const schema_body = {
        code: Joi.string().required(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};

validation.insert_head_task = Joi.object().keys({
    title: Joi.string().required(),
    to_department: Joi.string().allow(""),
    content: Joi.string().allow(""),
    task_list: Joi.string().allow(""),
    main_person: Joi.string().allow(""),
    participant: Joi.string().allow(""),
    observer: Joi.string().allow(""),
    from_date: Joi.string().allow(""),
    to_date: Joi.string().allow(""),
    has_time: Joi.string().allow(""),
    // hours: Joi.string().required(),
    parent_id: Joi.string(),
    project: Joi.string(),
    priority: Joi.string().allow(""),
    task_type: Joi.string(),
    parents: Joi.array(),
    parent: Joi.object(),
    source_id: Joi.string(),
    hours: Joi.string(),
    head_task_id: Joi.string(),
    department: Joi.string().required(),
    dispatch_arrived_id: Joi.string().allow(""),
    level: Joi.string(),
    label: Joi.string(),
    is_draft: Joi.string(),

    has_repetitive: Joi.boolean().optional(),
    per: Joi.number(),
    cycle: Joi.string().valid(Object.values(TASK_REPETITIVE_CYCLE)).allow(""),
    has_expired: Joi.boolean(),
    expired_date: Joi.number(),
    child_work_percent: Joi.number(),
    estimate: Joi.number(),
}).required();

validation.load_task_external = function (req, res, next) {
    const schema_body = {
        top: Joi.number().required(),
        offset: Joi.number().required(),
        sort: Joi.object().required(),
        roles: Joi.array().items(Joi.string().valid(Object.values(TASK_ROLE))),
        from_date: Joi.date().timestamp('javascript').required(),
        to_date: Joi.date().timestamp('javascript').required(),
        search: Joi.string().allow(null, ''),
        status: Joi.array().items(Joi.string().valid(Object.values(TASK_STATUS))),
        state: Joi.array().items(Joi.string().valid(Object.values(TASK_STATE))),
        label: Joi.array().items(Joi.string()),
        priority: Joi.array().items(Joi.number()),
        // task_type: Joi.array().items(Joi.number()),
        // task_group: Joi.array().items(Joi.string().valid(Object.values(TASK_GROUP_FILTER))),
        // projects: Joi.array().items(Joi.string()),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};

validation.count_task_external = function (req, res, next) {
    const schema_body = {
        roles: Joi.array().items(Joi.string().valid(Object.values(TASK_ROLE))),
        from_date: Joi.date().timestamp('javascript').required(),
        to_date: Joi.date().timestamp('javascript').required(),
        search: Joi.string().allow(null, ''),
        status: Joi.array().items(Joi.string().valid(Object.values(TASK_STATUS))),
        state: Joi.array().items(Joi.string().valid(Object.values(TASK_STATE))),
        label: Joi.array().items(Joi.string()),
        priority: Joi.array().items(Joi.number()),
        // task_type: Joi.array().items(Joi.number()),
        // task_group: Joi.array().items(Joi.string().valid(Object.values(TASK_GROUP_FILTER))),
        // projects: Joi.array().items(Joi.string()),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};

validation.update_head_task = Joi.object().keys({
    code: Joi.string().required(),
    title: Joi.string().required(),
    content: Joi.string().allow(""),
    observer: Joi.array().items(Joi.string()),
    from_date: Joi.string().allow(""),
    to_date: Joi.string().allow(""),
    priority: Joi.string().allow(""),
    department: Joi.string().required(),
    label: Joi.string(),
    estimate: Joi.number(),
    remove_attachment: Joi.array().items(Joi.string()),
}).required();

exports.validation = validation;
