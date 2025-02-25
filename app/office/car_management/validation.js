const {CHECKS_ON_UI, STATUS_CAR, CAR_TAB} = require("./const")
const { ValidationProvider } = require('../../../shared/validation/validation.provider');
const Joi = ValidationProvider.initModuleValidation();
var validation = {};

validation.load = function (req, res, next) {
    const schema_body = {
        search: Joi.string(),
        tab : Joi.string().valid(Object.values(CAR_TAB)),
        filters: Joi.array().allow(null),
        checks: Joi.array().items(Joi.string().valid( Object.values(CHECKS_ON_UI))).required(),
        from_date: Joi.number(),
        to_date: Joi.number(),
        top: Joi.number().required(),
        offset: Joi.number().required(),
        sort: Joi.object().optional(),
        status: Joi.array().items(Joi.string().valid(Object.values(STATUS_CAR))),
        have_car: Joi.boolean().optional(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.export_excel = function (req, res, next) {
    const schema_body = {
        filters: Joi.array().allow(null),
        checks: Joi.array().items(Joi.string().valid(Object.values(CHECKS_ON_UI))).required(),
        from_date: Joi.number(),
        to_date: Joi.number(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.loadDetail = function (req, res, next) {
    const schema_body = {
        code: Joi.string().required(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.count = function (req, res, next) {
    const schema_body = {
        search: Joi.string(),
        from_date: Joi.number(),
        to_date: Joi.number(),
        checks: Joi.array().items(Joi.string().valid( Object.values(CHECKS_ON_UI))).required(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.update = Joi.object().keys({
    code: Joi.string().required(),
    removed_attachments: Joi.string(),
    starting_place: Joi.string(),
    destination: Joi.string().required(),
    passenger: Joi.string(),
    contact_passenger: Joi.string(),
    number_of_people : Joi.string().required(),
    time_to_go: Joi.string().required(),
    pick_up_time: Joi.string().optional(),
    to_department: Joi.string(),
    content: Joi.string().allow(null),
    title: Joi.string().required(),
}).required();

validation.insert = Joi.object().keys({
    starting_place: Joi.string(),
    destination: Joi.string().required(),
    passenger: Joi.string(),
    contact_passenger: Joi.string(),
    number_of_people : Joi.string().required(),
    time_to_go: Joi.string().required(),
    pick_up_time: Joi.string().optional(),
    to_department: Joi.string(),
    content: Joi.string().allow(null),
    title: Joi.string().required(),
}).required();

validation.approve_department = Joi.object().keys({
    code: Joi.string().required(),
    note: Joi.string().required(),
    removed_attachments: Joi.string(),
    contact_passenger: Joi.string(),
    starting_place: Joi.string(),
    destination: Joi.string().required(),
    passenger: Joi.string(),
    number_of_people : Joi.string().required(),
    time_to_go: Joi.string().required(),
    pick_up_time: Joi.string().optional(),
    to_department: Joi.string(),
    content: Joi.string().allow(null),
    title: Joi.string().required(),
}).required();

validation.reject_department = function (req, res, next) {
    const schema_body = {
        code: Joi.string().required(),
        note: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.approve_car_management = function (req, res, next) {
    const schema_body = {
        code: Joi.string().required(),
        note: Joi.string().allow(""),
        assign_card: Joi.boolean(),
        car: Joi.string(),
        card: Joi.string().allow(""),
        driver: Joi.string()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.reject_car_management = function (req, res, next) {
    const schema_body = {
        code: Joi.string().required(),
        note: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.approve_lead = function (req, res, next) {
    const schema_body = {
        code: Joi.string().required(),
        note: Joi.string().allow(""),
        assign_card: Joi.boolean(),
        car: Joi.string(),
        card: Joi.string().allow(""),
        driver: Joi.string()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.reject_lead = function (req, res, next) {
    const schema_body = {
        code: Joi.string().required(),
        note: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.approve_lead_external = function (req, res, next) {
    const schema_body = {
        code: Joi.string().required(),
        note: Joi.string().allow(""),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.reject_lead_external = function (req, res, next) {
    const schema_body = {
        code: Joi.string().required(),
        note: Joi.string().required(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.approve_card_management = function (req, res, next) {
    const schema_body = {
        code: Joi.string().required(),
        note: Joi.string().allow(""),
        card: Joi.alternatives().try(
            Joi.string(),
            Joi.number()
        ).required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.edit_card_management = function (req, res, next) {
    const schema_body = {
        code: Joi.string().required(),
        note: Joi.string().allow(""),
        card: Joi.alternatives().try(
            Joi.string(),
            Joi.number()
        ).required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.reject_card_management = function (req, res, next) {
    const schema_body = {
        code: Joi.string().required(),
        note: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.manager_assign_card = function (req, res, next) {
    const schema_body = {
        code: Joi.string().required(),
        note: Joi.string().allow(""),
        card: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.creator_receive_card = function (req, res, next) {
    const schema_body = {
        code: Joi.string().required(),
        note: Joi.string().allow("")
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.creator_return_card = Joi.object().keys({
    code: Joi.string().required(),
    note: Joi.string().allow(""),
    km: Joi.number().required(),
    money: Joi.number().required(),
}).required();

validation.manager_receive_card = function (req, res, next) {
    const schema_body = {
        code: Joi.string().required(),
        note: Joi.string().allow("")
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.delete = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.creator_cancel = function (req, res, next) {
    const schema_body = {
        code: Joi.string().required(),
        note: Joi.string().required(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.load_file_info = function (req, res, next) {
    const schema_body = {
        code: Joi.string().optional(),
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

validation.recall_flow = function (req, res, next) {
    const schema_body = {
        code: Joi.string().required(),
        note: Joi.string().required(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

exports.validation = validation;
