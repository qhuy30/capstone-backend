const { ValidationProvider } = require('../../../shared/validation/validation.provider');
const Joi = ValidationProvider.initModuleValidation();
const {
    MEETING_ROOM_SCHEDULE_EVENT,
} = require("@utils/constant");
const {MEETING_ROOM_CHECKLIST_ON_MANAGE_TAB,MEETING_ROOM_TAB, SCHEDULE_MEETING_ROOM_FEATURE_NAME, ROOM_TYPE, MEETING_ROOM_HOST_SCOPE} = require('./const');
const { EVENT_FEATURE_NAME } = require('../event_calendar/const');
const { CAR_FEATURE_NAME } = require('../car_management/const');

var validation = {};

validation.register = Joi.object().keys({
    room: Joi.string(),
    host_scope: Joi.string().valid(Object.values(MEETING_ROOM_HOST_SCOPE)),
    host_external: Joi.string().allow('').when('host_scope', { 
      is: 'external', 
      then: Joi.required(), 
      otherwise: Joi.allow('') 
    }),
    host: Joi.string().allow('').when('host_scope', { 
      is: 'internal', 
      then: Joi.required(), 
      otherwise: Joi.allow('') 
    }),
    title: Joi.string().required(),
    date_start: Joi.date().timestamp().required().greater(Date.now()),
    date_end: Joi.date().timestamp().required().greater(Joi.ref('date_start')),
    type: Joi.string().valid(
        ROOM_TYPE.MEETING,
        ROOM_TYPE.CLASS
    ),
    participants: Joi.array().items(Joi.string()),
    other_participants: Joi.array().items(Joi.string()),
    to_department: Joi.array().items(Joi.string()),
    content: Joi.string().required(),
    person: Joi.number().required(),
    teabreak: Joi.bool().required(),
    teabreak_text: Joi.string().when('teabreak', {
        is: true, 
        then: Joi.required(), 
        otherwise: Joi.optional()
    }),
    helpdesk: Joi.bool().required(),
    helpdesk_text: Joi.string().when('helpdesk', {
        is: true, 
        then: Joi.required(), 
        otherwise: Joi.optional()
    }),
    service_proposal: Joi.bool().required(),
    service_proposal_text: Joi.string().when('service_proposal', {
        is: true, 
        then: Joi.required(), 
        otherwise: Joi.optional()
    }),
}).required();

validation.update = Joi.object().keys({
    id: Joi.string().required().length(24).hex(),
    room: Joi.string(),
    host_scope: Joi.string().valid(Object.values(MEETING_ROOM_HOST_SCOPE)),
    host_external: Joi.string().allow('').when('host_scope', { 
        is: 'external', 
        then: Joi.required(), 
        otherwise: Joi.allow('') 
    }),
    host: Joi.string().allow('').when('host_scope', { 
        is: 'internal', 
        then: Joi.required(), 
        otherwise: Joi.allow('') 
    }),
    title: Joi.string().required(),
    date_start: Joi.date().timestamp().required(),
    date_end: Joi.date().timestamp().required(),
    type: Joi.string().valid(
        ROOM_TYPE.MEETING,
        ROOM_TYPE.CLASS
    ),
    participants: Joi.array().items(Joi.string()),
    other_participants: Joi.array().items(Joi.string()),
    to_department: Joi.array().items(Joi.string()),
    content: Joi.string().required(),
    person: Joi.number().required(),
    teabreak: Joi.bool().required(),
    teabreak_text: Joi.string().when('teabreak', {
        is: true, 
        then: Joi.required(), 
        otherwise: Joi.optional().allow('')
    }),
    helpdesk: Joi.bool().required(),
    helpdesk_text: Joi.string().when('helpdesk', {
        is: true, 
        then: Joi.required(), 
        otherwise: Joi.optional().allow('')
    }),
    service_proposal: Joi.bool().required(),
    service_proposal_text: Joi.string().when('service_proposal', {
        is: true, 
        then: Joi.required(), 
        otherwise: Joi.optional().allow('')
    }),
    removeAtachments: Joi.array().items(Joi.string()).allow([]),
}).required();

validation.approve_department = Joi.object().keys({
    id: Joi.string().required().length(24).hex(),
    note: Joi.string().required(),
    room: Joi.string(),
    host_scope: Joi.string().valid(Object.values(MEETING_ROOM_HOST_SCOPE)),
    host_external: Joi.string().allow('').when('host_scope', { 
        is: 'external', 
        then: Joi.required(), 
        otherwise: Joi.allow('') 
    }),
    host: Joi.string().allow('').when('host_scope', { 
        is: 'internal', 
        then: Joi.required(), 
        otherwise: Joi.allow('') 
    }),
    title: Joi.string().required(),
    date_start: Joi.date().timestamp().required(),
    date_end: Joi.date().timestamp().required(),
    type: Joi.string().valid(
        ROOM_TYPE.MEETING,
        ROOM_TYPE.CLASS
    ),
    participants: Joi.array().items(Joi.string()),
    other_participants: Joi.array().items(Joi.string()),
    to_department: Joi.array().items(Joi.string()),
    content: Joi.string().required(),
    person: Joi.number().required(),
    teabreak: Joi.bool().required(),
    teabreak_text: Joi.string().when('teabreak', {
        is: true, 
        then: Joi.required(), 
        otherwise: Joi.optional().allow('')
    }),
    helpdesk: Joi.bool().required(),
    helpdesk_text: Joi.string().when('helpdesk', {
        is: true, 
        then: Joi.required(), 
        otherwise: Joi.optional().allow('')
    }),
    service_proposal: Joi.bool().required(),
    service_proposal_text: Joi.string().when('service_proposal', {
        is: true, 
        then: Joi.required(), 
        otherwise: Joi.optional().allow('')
    }),
    removeAtachments: Joi.array().items(Joi.string()).allow([]),
}).required();

validation.reject_department = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required().length(24).hex(),
        note: Joi.string().required(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.approve_management = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required().length(24).hex(),
        note: Joi.string().required(),
        room: Joi.string().required(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.reject_management = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required().length(24).hex(),
        note: Joi.string().required(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.approve_lead = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required().length(24).hex(),
        note: Joi.string().required(),
        room: Joi.string().optional(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.reject_lead = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required().length(24).hex(),
        note: Joi.string().required(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.request_cancel = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required().length(24).hex(),
        note: Joi.string().required(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.approve_recall_department = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required().length(24).hex(),
        note: Joi.string().required(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.reject_recall_department = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required().length(24).hex(),
        note: Joi.string().required(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.approve_recall_management = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required().length(24).hex(),
        note: Joi.string().required(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.reject_recall_management = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required().length(24).hex(),
        note: Joi.string().required(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.approve_recall_lead = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required().length(24).hex(),
        note: Joi.string().required(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.reject_recall_lead= function (req, res, next) {
    const schema_body = {
        id: Joi.string().required().length(24).hex(),
        note: Joi.string().required(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.load = function (req, res, next) {
    const schema_body = {
        search:Joi.string(),
        status: Joi.array().items(Joi.string().valid(
            MEETING_ROOM_SCHEDULE_EVENT.REGISTERED,
            MEETING_ROOM_SCHEDULE_EVENT.REQUEST_CANCEL,
            MEETING_ROOM_SCHEDULE_EVENT.CANCELLED,
            MEETING_ROOM_SCHEDULE_EVENT.REJECTED,
            MEETING_ROOM_SCHEDULE_EVENT.CONFIRMED,
            MEETING_ROOM_SCHEDULE_EVENT.APPROVED
        )),
        tab : Joi.string().valid(Object.values(MEETING_ROOM_TAB)),
        checks: Joi.array().items(Joi.string().valid(Object.values(MEETING_ROOM_CHECKLIST_ON_MANAGE_TAB))),
        room_types: Joi.array().items(Joi.string()).allow([]),
        top: Joi.number().required(),
        offset: Joi.number().required(),
        sort: Joi.object().required(),
        date_start: Joi.date().timestamp(),
        date_end: Joi.date().timestamp(),
        services_required: Joi.bool()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.export_excel = function (req, res, next) {
    const schema_body = {
        tab : Joi.string().valid(Object.values(MEETING_ROOM_TAB)),
        checks: Joi.array().items(Joi.string().valid(Object.values(MEETING_ROOM_CHECKLIST_ON_MANAGE_TAB))),
        room_types: Joi.array().items(Joi.string()).allow([]),
        top: Joi.number().required(),
        offset: Joi.number().required(),
        sort: Joi.object().required(),
        date_start: Joi.date().timestamp(),
        date_end: Joi.date().timestamp(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.count = function (req, res, next) {
    const schema_body = {
        search:Joi.string(),
        status: Joi.array().items(Joi.string().valid(
            MEETING_ROOM_SCHEDULE_EVENT.REGISTERED,
            MEETING_ROOM_SCHEDULE_EVENT.REQUEST_CANCEL,
            MEETING_ROOM_SCHEDULE_EVENT.CANCELLED,
            MEETING_ROOM_SCHEDULE_EVENT.REJECTED,
            MEETING_ROOM_SCHEDULE_EVENT.CONFIRMED,
            MEETING_ROOM_SCHEDULE_EVENT.APPROVED
        )),
        tab : Joi.string().valid(Object.values(MEETING_ROOM_TAB)),
        checks: Joi.array().items(Joi.string().valid( Object.values(MEETING_ROOM_CHECKLIST_ON_MANAGE_TAB)))
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}


validation.deleteRegistered = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required().length(24).hex()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.loadDetailForUpdate = function (req, res, next) {
    const schema_body = {
        id: Joi.string().length(24).hex(),
        code: Joi.string(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.changeStatus = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        status: Joi.string().valid(
            MEETING_ROOM_SCHEDULE_EVENT.DEPARTMENT_APPROVED,
            MEETING_ROOM_SCHEDULE_EVENT.CONFIRMED,
            MEETING_ROOM_SCHEDULE_EVENT.APPROVED,
            MEETING_ROOM_SCHEDULE_EVENT.CANCELLED,
            MEETING_ROOM_SCHEDULE_EVENT.REJECTED
        ).required(),
        reasonReject: Joi.when('status', {
            is: MEETING_ROOM_SCHEDULE_EVENT.REJECTED,
            then: Joi.string().min(1).required(),
        }),
        roomCode: Joi.when('status',{
            is: MEETING_ROOM_SCHEDULE_EVENT.CONFIRMED,
            then: Joi.string().min(1).required(),
        }),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.requestCancel = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required().length(24).hex(),
        reason: Joi.string().allow(""),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.load_quick_handle = function (req, res, next) {
    const schema_body = {
        search: Joi.string().allow(''),
        top: Joi.number().required(),
        offset: Joi.number().required(),
        sort: Joi.any().required(),
        feature: Joi.array().items(Joi.string().valid([
            SCHEDULE_MEETING_ROOM_FEATURE_NAME,
            CAR_FEATURE_NAME,
            EVENT_FEATURE_NAME,
        ])),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};

validation.load_my_calendar = function (req, res, next) {
    const schema_body = {
        feature: Joi.array().items(Joi.string().valid([
            SCHEDULE_MEETING_ROOM_FEATURE_NAME,
            CAR_FEATURE_NAME,
            EVENT_FEATURE_NAME,
        ])),
        from_date: Joi.date().timestamp(),
        end_date: Joi.date().timestamp(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};


validation.count_quick_handle = function (req, res, next) {
    const schema_body = {
        search: Joi.string(),
        feature: Joi.array().items(Joi.string().valid([
            SCHEDULE_MEETING_ROOM_FEATURE_NAME,
            CAR_FEATURE_NAME,
            EVENT_FEATURE_NAME,
        ])),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.load_file_info = function (req, res, next) {
    const schema_body = {
        code: Joi.string().optional(),
        id: Joi.string().optional(),
        filename: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.load_butler = function (req, res, next) {
    const schema_body = {
        search:Joi.string().allow(''),
        top: Joi.number().required(),
        offset: Joi.number().required(),
        sort: Joi.object(),
        date_start: Joi.date().timestamp(),
        date_end: Joi.date().timestamp(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.count_butler = function (req, res, next) {
    const schema_body = {
        search:Joi.string().allow(''),
        date_start: Joi.date().timestamp(),
        date_end: Joi.date().timestamp(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

exports.validation = validation;
