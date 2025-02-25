const { ValidationProvider } = require('../../../shared/validation/validation.provider');
const Joi = ValidationProvider.initModuleValidation();
var validation = {};
validation.load = function (req, res, next) {
    const schema_body = {
        search: Joi.string(),
        type: Joi.string(),
        from_date: Joi.string(),
        to_date: Joi.string(),
        tab: Joi.any().valid(["my_journey_time_form","handled"]).required(),
        top:Joi.number().required(),
        offset:Joi.number().required(),
        sort:Joi.any().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.loadDetails = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.count = function (req, res, next) {
    const schema_body = {
        search: Joi.string(),
        type: Joi.string(),
        from_date: Joi.string(),
        to_date: Joi.string(),
        tab: Joi.any().valid(["my_journey_time_form","handled"]).required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.insert = function (req, res, next) {
    const schema_body = {
        title: Joi.string().required(),
        number_day: Joi.number().required(),
        leave_form: Joi.string().required(),
        note: Joi.string()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.cancel = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        note: Joi.string()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

exports.validation = validation;