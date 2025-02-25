const { CHECKS_ON_UI, DISPATCH_SCOPE } = require("./const")
const { ValidationProvider } = require('../../../shared/validation/validation.provider');
const { DISPATCH_FORWARD_TO, DISPATCH_RESPONSE_TYPE } = require("@utils/constant");
const Joi = ValidationProvider.initModuleValidation();
var validation = {};
"da_book", "priority", "receive_method","type", "tab"

validation.load = function (req, res, next) {
    const schema_body = {
        search: Joi.string().allow(''),
        incoming_number: Joi.string(),
        urgency_level: Joi.string(),
        receive_method: Joi.string(),
        type: Joi.string(),
        scope: Joi.string().valid(Object.values(DISPATCH_SCOPE)).required(),
        checks: Joi.array().items(Joi.string().valid(Object.values(CHECKS_ON_UI))).required(),
        top: Joi.number().required(),
        offset: Joi.number().required(),
        sort: Joi.any().required(),
        date_start: Joi.date().timestamp(),
        date_end: Joi.date().timestamp(),
        year: Joi.number()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};


validation.load_quick_handle = function (req, res, next) {
    const schema_body = {
        search: Joi.string().allow(''),
        // da_book: Joi.string(),
        // priority: Joi.string(),
        // receive_method: Joi.string(),
        // type: Joi.string(),
        checks: Joi.array().items(Joi.string().valid(Object.values(CHECKS_ON_UI))),
        top: Joi.number().required(),
        offset: Joi.number().required(),
        sort: Joi.any().required(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};

validation.count_quick_handle = function (req, res, next) {
    const schema_body = {
        search: Joi.string(),
        // da_book: Joi.string(),
        // priority: Joi.string(),
        // receive_method: Joi.string(),
        // type: Joi.string(),
        checks: Joi.array().items(Joi.string().valid(Object.values(CHECKS_ON_UI))),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.loadDetails = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.get_number = function (req, res, next) {
    const schema_body = {
        da_book: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.count = function (req, res, next) {
    const schema_body = {
        search: Joi.string(),
        incoming_number: Joi.string(),
        urgency_level: Joi.string(),
        receive_method: Joi.string(),
        type: Joi.string(),
        checks: Joi.array().items(Joi.string().valid(Object.values(CHECKS_ON_UI))).required(),
        scope: Joi.string().valid(Object.values(DISPATCH_SCOPE)).required(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.load_employee = function (req, res, next) {
    const schema_body = {
        department: Joi.string().required()
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

validation.downloadfile = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        filename: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

// validation.insertFormData = function (data) {
//     const schema_body = {
//         code: Joi.string().required(),
//         da_book: Joi.string().required(),
//         number: Joi.number().positive().integer().required(),
//         release_date: Joi.date().timestamp("javascript").required(),
//         author: Joi.string().required(),
//         agency_promulgate: Joi.string().required(),
//         transfer_date: Joi.date().timestamp("javascript").required(),
//         note: Joi.string().allow(null),
//         type: Joi.string().required(),
//         priority: Joi.string().required(),
//         excerpt: Joi.string().required(),
//         excerpt_search: Joi.string().required(),
//         is_legal: Joi.boolean().default(false).required(),
//         view_only_departments: Joi.array().items(Joi.string()).default([]),
//         is_assign_task: Joi.boolean().default(false),
//         attachments: Joi.array().items(Joi.object().required()).required(),
//     };
//     return ValidationProvider.validateData(schema_body, data);
// }

validation.insertFormData = Joi.object().keys({
    scope: Joi.string().required(),
    year: Joi.number().required(),
    code: Joi.string().required(),
    incoming_number: Joi.string().required(),
    incomming_date: Joi.date().timestamp("javascript").required(),
    symbol_number: Joi.string().required(),
    sending_place: Joi.string().required(),
    type: Joi.string().required(),
    field: Joi.string().required(),
    security_level: Joi.string().required(),
    urgency_level: Joi.string().required(),
    date_sign: Joi.date().timestamp("javascript").required(),
    expried: Joi.date().timestamp("javascript").required(),
    task_label: Joi.array().items(Joi.string()).allow([]),
    content: Joi.string().required(),
    department_execute: Joi.string().optional(),
    department_receiver: Joi.array().items(Joi.string().optional()).allow([]),
}).required();

validation.updateFormData = Joi.object().keys({
    id: Joi.string().length(24).hex(),
    year: Joi.number(),
    code: Joi.string(),
    incoming_number: Joi.string(),
    incomming_date: Joi.date().timestamp("javascript"),
    symbol_number: Joi.string(),
    sending_place: Joi.string(),
    type: Joi.string(),
    field: Joi.string(),
    security_level: Joi.string(),
    urgency_level: Joi.string(),
    date_sign: Joi.date().timestamp("javascript"),
    expried: Joi.date().timestamp("javascript"),
    content: Joi.string(),
    department_execute: Joi.string().optional(),
    department_receiver: Joi.array().items(Joi.string()).allow([]),
    task_label: Joi.array().items(Joi.string()).allow([]),
    incoming_file_remove: Joi.array().items(Joi.string().required()),
    attachments_remove: Joi.array().items(Joi.string().required()),
}).required();

validation.send_lead_department = Joi.object().keys({
    id: Joi.string().length(24).hex(),
    year: Joi.number(),
    code: Joi.string(),
    incoming_number: Joi.string(),
    incomming_date: Joi.date().timestamp("javascript"),
    symbol_number: Joi.string(),
    sending_place: Joi.string(),
    type: Joi.string(),
    field: Joi.string(),
    security_level: Joi.string(),
    urgency_level: Joi.string(),
    date_sign: Joi.date().timestamp("javascript"),
    expried: Joi.date().timestamp("javascript"),
    content: Joi.string(),
    department_execute: Joi.string().optional(),
    department_receiver: Joi.array().items(Joi.string().required()).allow([]),
    task_label: Joi.array().items(Joi.string()).allow([]),
    // task: Joi.object({
    //     username: Joi.string().required(),
    //     department: Joi.string().required(),
    //     from_department: Joi.string().required()
    // }).optional(),
    incoming_file_remove: Joi.array().items(Joi.string().required()),
    attachments_remove: Joi.array().items(Joi.string().required()),
    note: Joi.string(),
}).required();

validation.send_lead_external = Joi.object().keys({
    id: Joi.string().length(24).hex(),
    year: Joi.number(),
    code: Joi.string(),
    incoming_number: Joi.string(),
    incomming_date: Joi.date().timestamp("javascript"),
    symbol_number: Joi.string(),
    sending_place: Joi.string(),
    type: Joi.string(),
    field: Joi.string(),
    security_level: Joi.string(),
    urgency_level: Joi.string(),
    date_sign: Joi.date().timestamp("javascript"),
    expried: Joi.date().timestamp("javascript"),
    content: Joi.string(),
    department_execute: Joi.string().optional(),
    department_receiver: Joi.array().items(Joi.string().required()).allow([]),
    task_label: Joi.array().items(Joi.string()).allow([]),
    // task: Joi.object({
    //     username: Joi.string().required(),
    //     department: Joi.string().required(),
    //     from_department: Joi.string().required()
    // }).optional(),
    incoming_file_remove: Joi.array().items(Joi.string().required()),
    attachments_remove: Joi.array().items(Joi.string().required()),
    note: Joi.string(),
}).required();

validation.return_lead_department_external = Joi.object().keys({
    id: Joi.string().length(24).hex(),
    year: Joi.number(),
    code: Joi.string(),
    incoming_number: Joi.string(),
    incomming_date: Joi.date().timestamp("javascript"),
    symbol_number: Joi.string(),
    sending_place: Joi.string(),
    type: Joi.string(),
    field: Joi.string(),
    security_level: Joi.string(),
    urgency_level: Joi.string(),
    date_sign: Joi.date().timestamp("javascript"),
    expried: Joi.date().timestamp("javascript"),
    content: Joi.string(),
    department_execute: Joi.string().optional(),
    department_receiver: Joi.array().items(Joi.string().required()).allow([]),
    task_label: Joi.array().items(Joi.string()).allow([]),
    // task: Joi.object({
    //     username: Joi.string().required(),
    //     department: Joi.string().required(),
    //     from_department: Joi.string().required()
    // }).optional(),
    incoming_file_remove: Joi.array().items(Joi.string().required()),
    attachments_remove: Joi.array().items(Joi.string().required()),
    note: Joi.string(),
}).required();

validation.transfer_department = Joi.object().keys({
    id: Joi.string().length(24).hex(),
    year: Joi.number(),
    code: Joi.string(),
    incoming_number: Joi.string(),
    incomming_date: Joi.date().timestamp("javascript"),
    symbol_number: Joi.string(),
    sending_place: Joi.string(),
    type: Joi.string(),
    field: Joi.string(),
    security_level: Joi.string(),
    urgency_level: Joi.string(),
    date_sign: Joi.date().timestamp("javascript"),
    expried: Joi.date().timestamp("javascript"),
    content: Joi.string(),
    department_execute: Joi.string().optional(),
    department_receiver: Joi.array().items(Joi.string().required()).allow([]),
    task_label: Joi.array().items(Joi.string()).allow([]),
    // task: Joi.object({
    //     username: Joi.string().required(),
    //     department: Joi.string().required(),
    //     from_department: Joi.string().required()
    // }).optional(),
    incoming_file_remove: Joi.array().items(Joi.string().required()),
    attachments_remove: Joi.array().items(Joi.string().required()),
    note: Joi.string(),
}).required();

validation.transfer_department_approve = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        note: Joi.string(),
    };
    ValidationProvider.createValidator(schema_body, req, res, next);
};

validation.reject_department = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        note: Joi.string().required(),
    };
    ValidationProvider.createValidator(schema_body, req, res, next);
};

validation.seen_work = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        note: Joi.string(),
    };
    ValidationProvider.createValidator(schema_body, req, res, next);
};


validation.delete = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.handling = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        comment : Joi.string().allow(""),
        forward : Joi.array().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.insert_task = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        title : Joi.string().required(),
        content : Joi.string().required(),
        main_person: Joi.array().required(),
        participant: Joi.array().required(),
        observer: Joi.array().required(),
        from_date: Joi.number().required(),
        to_date: Joi.number().required(),
        priority: Joi.number().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

// validation.update = function (req, res, next) {
//     const schema_body = {
//         id: Joi.string().required(),
//         number : Joi.number().required(),
//         title: Joi.string().required(),
//         da_book: Joi.string().required(),
//         expiration_date:Joi.number()
//     };
//     ValidationProvider.createMiddleware(schema_body, req, res, next);
// }

validation.signAcknowledge = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        note: Joi.any(),
        with_task: Joi.any().required(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.forward = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        to: Joi.string().valid(Object.values(DISPATCH_FORWARD_TO)).required(),
        note: Joi.string().required(),
    };
    ValidationProvider.createValidator(schema_body, req, res, next);
};

validation.response = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        type: Joi.string().valid(Object.values(DISPATCH_RESPONSE_TYPE)).required(),
        note: Joi.string().required(),
    };
    ValidationProvider.createValidator(schema_body, req, res, next);
};

validation.receive = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        odb_id: Joi.string().allow(""),
        note: Joi.string().allow(""),
        code: Joi.string().required(), 
        incoming_number: Joi.string().required(), 
        field: Joi.string().required(),
    };
    ValidationProvider.createValidator(schema_body, req, res, next);
};

exports.validation = validation;
