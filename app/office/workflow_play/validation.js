const { ValidationProvider } = require('../../../shared/validation/validation.provider');
const Joi = ValidationProvider.initModuleValidation();
var validation = {};
validation.load = function (req, res, next) {
    const schema_body = {
        search: Joi.string(),
        document_type: Joi.string(),
        checks: Joi.array().items(Joi.string()),
        status: Joi.string(),
        statuses: Joi.array().items(Joi.string()),
        // tab: Joi.any().valid(["created","approved","returned","rejected","need_to_handle","all","pending"]).required(),
        top:Joi.number().required(),
        offset:Joi.number().required(),
        sort:Joi.any().required(),
        is_personal: Joi.boolean().optional(),
        is_department: Joi.boolean().optional(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.loadDetails = function (req, res, next) {
    const schema_body = {
        id: Joi.string().allow(null, "").default(null),
        code: Joi.string().allow(null, "").default(null),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.count = function (req, res, next) {
    const schema_body = {
        search: Joi.string(),
        document_type: Joi.string(),
        status: Joi.string(),
        // tab: Joi.any().valid(["created","approved","returned","rejected","need_to_handle","all"]).required()
        checks: Joi.array().items(Joi.string()),
        is_personal: Joi.boolean().optional(),
        is_department: Joi.boolean().optional(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.loadFileInfo = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        filename: Joi.string().required(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};

validation.creator_additional_document = Joi.object().keys({
    id: Joi.string().required(),
    waiting_archive_id: Joi.string().required(),
    note: Joi.string(),
}).required();

validation.insert = Joi.object().keys({
    title: Joi.string().required(),
    flow_info: Joi.string().required(),
    flow: Joi.string().required(),
    document_type: Joi.string().required(),
    tags_value: Joi.object().required(),
    archived_documents: Joi.array(),
    parents: Joi.array(),
    parent: Joi.object(),
    toDepartment: Joi.string(),
    // user_and_department_destination: Joi.object(),
    department_destination: Joi.array().items(Joi.string().optional()).allow([]),
    is_personal: Joi.boolean().optional(),
    is_department: Joi.boolean().optional(),
    transfer_ticket: Joi.object().optional(),
}).required();

validation.insert_transfer_ticket = Joi.object().keys({
    title: Joi.string().required(),
    flow_info: Joi.string().required(),
    flow: Joi.string().required(),
    document_type: Joi.string().required(),
    tags_value: Joi.object().required(),
    archived_documents: Joi.array(),
    parents: Joi.array(),
    parent: Joi.object(),
    toDepartment: Joi.string(),
    user_and_department_destination: Joi.object(),
    is_personal: Joi.boolean().optional(),
    is_department: Joi.boolean().optional(),
    transfer_ticket: Joi.object().optional(),
}).required();

validation.approval = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        comment: Joi.string(),
        note: Joi.string()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.transform_signOther = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        receiver: Joi.string()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.sign_other = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        comment: Joi.string()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.process = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        odb_book: Joi.string().required(),
        number: Joi.any(),
        odb_date: Joi.any(),
        signed_date: Joi.any(),
        priority: Joi.any(),
        signers: Joi.array().items(Joi.string()),
        excerpt: Joi.any(),
        place_of_da: Joi.any(),
        expiration_date: Joi.any(),
        is_ODB_WFP: Joi.boolean(),
        parents: Joi.array(),
        parent: Joi.object()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.processFormData = function (data) {
    const schema_body = {
        outgoing_dispatch_id: Joi.string().allow(null, "").default(null),
        outgoing_dispatch_book: Joi.string().required(),
        workflow_play_id: Joi.string().required(),
        document_date: Joi.date().timestamp("javascript").required().raw(),
        outgoing_documents: Joi.array().items(Joi.object().required()).required(),
        attach_documents: Joi.array().items(Joi.object()).default([]),
        excerpt: Joi.string().required(),
        signers: Joi.array().items(Joi.string()).required(),
        draft_department: Joi.string().required(),
        receiver_notification: Joi.array().items(Joi.string()).default([]),
        department_notification: Joi.array().items(Joi.string()).default([]),
        document_quantity: Joi.number().positive().integer().required(),
        transfer_date: Joi.date().timestamp("javascript").required().raw(),
        note: Joi.string().allow(null, "").default(null),
        expiration_date: Joi.date().timestamp("javascript").required().raw(),
        priority: Joi.string().required(),
        parents: Joi.array(),
        parent: Joi.object(),
        code: Joi.string(),
        number: Joi.string()
    };
    return ValidationProvider.validateData(schema_body, data);
};

validation.processUpdateReferencesFormData = function (data) {
    const schema_body = {
        references: Joi.array()
    };
    return ValidationProvider.validateData(schema_body, data);
};

validation.reject = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        comment: Joi.string(),
        note: Joi.string()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.return = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        comment: Joi.string(),
        note: Joi.string()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.delete = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.return_creator_additional_document = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        waiting_archive_id: Joi.string().required(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.removeAttachment = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        filename: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.removeRelatedFile = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        filename: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.pushAttachment = Joi.object().keys({
    id: Joi.string().required()
}).required();

validation.pushRelatedFile = Joi.object().keys({
    id: Joi.string().required()
}).required();

validation.resubmit = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        comment: Joi.string()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.getUserInFlow = function (req, res, next) {
    const schema_body = {
        flow: Joi.any().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.signAFile = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        filename: Joi.string().required(),
        userId: Joi.string().required(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.signWorkflowPlay = function (req, res, next) {
    const schema_body = {
        fileName: Joi.string().required(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};

exports.validation = validation;
