const { expire_date } = require('@shared/multi_tenant/pnt-tenant');
const { CHECKS_ON_UI } = require("./const")
const { ValidationProvider } = require('../../../shared/validation/validation.provider');
const Joi = ValidationProvider.initModuleValidation();
var validation = {};

validation.delete = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.get_number = function (req, res, next) {
    const schema_body = {
        odb_book: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.load_detail = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        code: Joi.string().allow(''),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.load = function (req, res, next) {
    const schema_body = {
        search: Joi.string(),
        symbol_number: Joi.string(),
        urgency_level: Joi.string(),
        receive_method: Joi.string(),
        type: Joi.string(),
        checks: Joi.array().items(Joi.string().valid(Object.values(CHECKS_ON_UI))).required(),
        tab: Joi.string().allow(["created","need_to_handle","all","waiting_storage","dispatchAway","separateDispatch"]).required(),
        top:Joi.number().required(),
        offset:Joi.number().required(),
        sort:Joi.any().required(),
        date_start: Joi.date().timestamp(),
        date_end: Joi.date().timestamp(),
        year: Joi.number()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.loadforarchive = function (req, res, next) {
    const schema_body = {
        search: Joi.string(),
        symbol_number: Joi.string(),
        urgency_level: Joi.string(),
        receive_method: Joi.string(),
        type: Joi.string(),
        top:Joi.number().required(),
        offset:Joi.number().required(),
        sort:Joi.any().required(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.count = function (req, res, next) {
    const schema_body = {
        search: Joi.string(),
        symbol_number: Joi.string(),
        urgency_level: Joi.string(),
        receive_method: Joi.string(),
        type: Joi.string(),
        checks: Joi.array().items(Joi.string().valid(Object.values(CHECKS_ON_UI))).required(),
        tab: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.countforarchive = function (req, res, next) {
    const schema_body = {
        search: Joi.string(),
        symbol_number: Joi.string(),
        urgency_level: Joi.string(),
        receive_method: Joi.string(),
        type: Joi.string(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.loadFileInfo = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        filename: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

// validation.update = function (req, res, next) {
//     const schema = {
//         id: Joi.string().required(),
//         from: Joi.string().valid('origin', 'transfer').required(),
//         odb_book: Joi.when('from', { is: 'origin', then: Joi.string().required() }),
//         signed_date: Joi.when('from', { is: 'origin', then: Joi.date().timestamp("javascript").required() }),
//         type: Joi.when('from', { is: 'origin', then: Joi.string().required() }),
//         excerpt: Joi.any(),
//         expiration_date: Joi.when('from', { is: 'origin', then: Joi.date().timestamp("javascript").required() }),
//         priority: Joi.any(),
//         notification_departments: Joi.array().items(Joi.string()),
//         notification_recipients: Joi.array().items(Joi.string()),
//     };

//     ValidationProvider.createMiddleware(schema, req, res, next);
// }

validation.updateReferences = function (req, res, next) {
    const schema = {
        id: Joi.string().required(),
        from: Joi.string().valid('origin', 'transfer').required(),
        references: Joi.array()
    };

    ValidationProvider.createMiddleware(schema, req, res, next);
}

validation.release = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.load_by_code = function (req, res, next) {
    const schema_body = {
        code: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.processFormData = function (data) {
    const schema_body = {
        outgoing_dispatch_id: Joi.string().allow(null, "").default(null),
        outgoing_dispatch_book: Joi.string().required(),
        document_date: Joi.date().timestamp("javascript").required().raw(),
        outgoing_documents: Joi.array().items(Joi.object().required()).required(),
        attach_documents: Joi.array().items(Joi.object()).default([]),
        excerpt: Joi.string().required(),
        signers: Joi.array().items(Joi.string()).required(),
        draft_department: Joi.string(),
        receiver_notification: Joi.array().items(Joi.string()).default([]),
        department_notification: Joi.array().items(Joi.string()).default([]),
        document_quantity: Joi.number().positive().integer().required(),
        transfer_date: Joi.date().timestamp("javascript").required().raw(),
        note: Joi.string().allow(null, "").default(null),
        expiration_date: Joi.date().timestamp("javascript").required().raw(),
        priority: Joi.string().required(),
        parents: Joi.array(),
        parent: Joi.object(),
        code: Joi.string()
    };
    return ValidationProvider.validateData(schema_body, data);
};

validation.insert = Joi.object().keys({
    year: Joi.number().optional(),
    code: Joi.string().required(),
    symbol_number: Joi.string().required(),
    number: Joi.string().required(),
    type: Joi.string().required(),
    date_sign: Joi.date().timestamp("javascript").required(),
    departmemt_write: Joi.string().required(),
    person_sign: Joi.string().required(),
    content: Joi.string().required(),
    expire_date: Joi.date().timestamp("javascript").required(),
    security_level: Joi.string().required(),
    urgency_level: Joi.string().required(),
    text_tags: Joi.string(), // tạm thời k dùng
    self_end: Joi.boolean(), // tạm thời k dùng
    workflow_code: Joi.string(),
    workflow_id: Joi.string(),
    parents: Joi.array().allow([]),
    other_destination: Joi.array().items(Joi.string().required()).allow([]),
}).required();

validation.archive = Joi.object().keys({
    id: Joi.string().length(24).hex(),
    year: Joi.number(),
    code: Joi.string(),
    symbol_number: Joi.string(),
    type: Joi.string(),
    date_sign: Joi.date().timestamp("javascript"),
    departmemt_write: Joi.string(),
    person_sign: Joi.string(),
    content: Joi.string(),
    expire_date: Joi.date().timestamp("javascript"),
    security_level: Joi.string(),
    urgency_level: Joi.string(),
    text_tags: Joi.string(),
    self_end: Joi.boolean(),
    other_destination: Joi.array().items(Joi.string().required()).allow([]),
    outgoing_file_remove: Joi.array().items(Joi.string().required()).allow([]),
    attachments_remove: Joi.array().items(Joi.string().required()).allow([]),
    note: Joi.string(),
}).required();

validation.updateFormData = Joi.object().keys({
    id: Joi.string().length(24).hex(),
    year: Joi.number(),
    code: Joi.string(),
    symbol_number: Joi.string(),
    type: Joi.string(),
    date_sign: Joi.date().timestamp("javascript"),
    departmemt_write: Joi.string(),
    person_sign: Joi.string(),
    content: Joi.string(),
    expire_date: Joi.date().timestamp("javascript"),
    security_level: Joi.string(),
    urgency_level: Joi.string(),
    text_tags: Joi.string(),
    self_end: Joi.boolean(),
    other_destination: Joi.array().items(Joi.string().required()).allow([]),
    outgoing_file_remove: Joi.array().items(Joi.string().required()).allow([]),
    attachments_remove: Joi.array().items(Joi.string().required()).allow([]),
    
}).required();

exports.validation = validation;
