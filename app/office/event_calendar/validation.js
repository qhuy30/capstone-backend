const { ValidationProvider } = require('../../../shared/validation/validation.provider');
const { EVENT_CALENDAR_TYPE, STATUS_EVENT_CALENDAR, EVENT_CALENDAR_UI_TAB, EVENT_CALENDAR_UI_CHECK, LEVEl_CALENDAR} = require('./const');
const Joi = ValidationProvider.initModuleValidation();

var validation = {};

validation.load = function (req, res, next) {
    const schema_body = {
        search: Joi.string().allow(""),
        status: Joi.array().items(Joi.string().valid(Object.values(STATUS_EVENT_CALENDAR))),
        tab: Joi.string().valid(Object.values(EVENT_CALENDAR_UI_TAB)),
        checks: Joi.array().items(Joi.string().valid(Object.values(EVENT_CALENDAR_UI_CHECK))),
        top: Joi.number().required(),
        offset: Joi.number().required(),
        sort: Joi.object().optional(),
        department: Joi.string(),
        participating: Joi.string(),
        created_by: Joi.string(),
        from_date: Joi.date().timestamp(),
        to_date: Joi.date().timestamp(),
        tab_child: Joi.string(),
        sub_filter: Joi.object().optional(),
        levels: Joi.array().items(Joi.string().valid(Object.values(LEVEl_CALENDAR ))).optional().allow([]),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};

validation.export_excel = function (req, res, next) {
    const schema_body = {
        checks: Joi.array().items(Joi.string().valid(Object.values(EVENT_CALENDAR_UI_CHECK))),
        from_date: Joi.date().timestamp(),
        to_date: Joi.date().timestamp(),
        levels: Joi.array().items(Joi.string().valid(Object.values(LEVEl_CALENDAR))).optional().allow([]),
        tab_child: Joi.string(),
        sub_filter: Joi.object().optional()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};

validation.load_calendar = function (req, res, next) {
    const schema_body = {
        checks: Joi.array().items(Joi.string().valid(Object.values(EVENT_CALENDAR_UI_CHECK))),
        from_date: Joi.date().timestamp(),
        to_date: Joi.date().timestamp(),
        levels: Joi.array().items(Joi.string().valid(Object.values(LEVEl_CALENDAR))).optional().allow([]),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};

validation.count = function (req, res, next) {
    const schema_body = {
        search: Joi.string().optional().allow(''),
        status: Joi.array().items(Joi.string().valid(Object.values(STATUS_EVENT_CALENDAR))).optional(),
        tab: Joi.string().valid(Object.values(EVENT_CALENDAR_UI_TAB)).optional(),
        checks: Joi.array().items(Joi.string().valid(Object.values(EVENT_CALENDAR_UI_CHECK))).optional(),
        from_date: Joi.date().timestamp('javascript').optional(),
        to_date: Joi.date().timestamp('javascript').optional(),
        levels: Joi.array().items(Joi.string().valid(Object.values(LEVEl_CALENDAR ))).optional().allow([]),
    };

    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.loaddetails = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required().length(24).hex(),
    };

    ValidationProvider.createMiddleware(schema_body, req, res, next);
};

validation.insert = Joi.object().keys({
    title: Joi.string().required(),
    start_date: Joi.date().timestamp().required(),
    end_date: Joi.date().timestamp().required(),
    main_person: Joi.string().required(),
    departments: Joi.array().items(Joi.string().optional()),
    participants: Joi.array().items(Joi.string().optional()),
    content: Joi.string().required(),
    type: Joi.string().valid(Object.values(EVENT_CALENDAR_TYPE)).required(),
    meeting_link: Joi.string().when('type', {
        is: EVENT_CALENDAR_TYPE.ONLINE,
        then: Joi.required(),
        otherwise: Joi.allow(''),
    }),
    room_booking_id: Joi.string().when('type', {
        is: EVENT_CALENDAR_TYPE.OFFLINE_ONSITE,
        then: Joi.optional().allow(''),
        otherwise: Joi.allow('')
    }),
    vehicle_booking_id: Joi.string().when('type', {
        is: EVENT_CALENDAR_TYPE.OFFLINE_OFFSITE,
        then: Joi.optional().allow(''),
        otherwise: Joi.allow(''),
    }),
    other_info: Joi.string().when('type', {
        is: EVENT_CALENDAR_TYPE.OTHER,
        then: Joi.optional().allow(''),
        otherwise: Joi.allow(''),
    }),
    level: Joi.string().valid(LEVEl_CALENDAR.LEVEL_1, LEVEl_CALENDAR.LEVEL_2),
}).required();

validation.update = Joi.object().keys({
    id: Joi.string().required().length(24).hex(),
    title: Joi.string().required(),
    start_date: Joi.date().timestamp().required(),
    end_date: Joi.date().timestamp().required(),
    main_person: Joi.string().required(),
    departments: Joi.array().items(Joi.string().optional()),
    participants: Joi.array().items(Joi.string().optional()),
    content: Joi.string().required(),
    type: Joi.string().valid(Object.values(EVENT_CALENDAR_TYPE)).required(),
    remove_attachments: Joi.array().items(Joi.string().optional()),
    meeting_link: Joi.string().when('type', {
        is: EVENT_CALENDAR_TYPE.ONLINE,
        then: Joi.required(),
        otherwise: Joi.allow(''),
    }),
    room_booking_id: Joi.string().when('type', {
        is: EVENT_CALENDAR_TYPE.OFFLINE_ONSITE,
        then: Joi.optional().allow(''),
        otherwise: Joi.allow('')
    }),
    vehicle_booking_id: Joi.string().when('type', {
        is: EVENT_CALENDAR_TYPE.OFFLINE_OFFSITE,
        then: Joi.optional().allow(''),
        otherwise: Joi.allow(''),
    }),
    other_info: Joi.string().when('type', {
        is: EVENT_CALENDAR_TYPE.OTHER,
        then: Joi.optional().allow(''),
        otherwise: Joi.allow(''),
    }),
    level: Joi.string().valid(LEVEl_CALENDAR.LEVEL_1, LEVEl_CALENDAR.LEVEL_2),
}).required();

validation.creator_delete = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required().length(24).hex(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};

validation.pushFile = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        attachments: Joi.array().items(Joi.object().required()).required(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};

validation.removeFile = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        filename: Joi.string().required(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};

validation.approve_department = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required().length(24).hex(),
        note: Joi.string().allow(""),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};

validation.reject_department = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required().length(24).hex(),
        note: Joi.string().required(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};

validation.approve_host = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required().length(24).hex(),
        note: Joi.string().allow(""),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};

validation.reject_host = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required().length(24).hex(),
        note: Joi.string().required(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};

validation.request_cancel = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required().length(24).hex(),
        note: Joi.string().required(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};

validation.approve_recall_department = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required().length(24).hex(),
        note: Joi.string().allow(""),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};

validation.reject_recall_department = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required().length(24).hex(),
        note: Joi.string().required(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};

validation.approve_recall_host = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required().length(24).hex(),
        note: Joi.string().allow(""),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};

validation.reject_recall_host = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required().length(24).hex(),
        note: Joi.string().required(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};

validation.load_file_info = function (req, res, next) {
    const schema_body = {
        code: Joi.string().optional(),
        id: Joi.string().optional(),
        filename: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

exports.validation = validation;
