const { ValidationProvider } = require('../../../shared/validation/validation.provider');
const Joi = ValidationProvider.initModuleValidation();
var validation = {};

validation.load = function (req, res, next) {
    const schema_body = {
        top: Joi.number().required(),
        offset: Joi.number().required(),
        tab: Joi.string().allow(["all","notseen"]).required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.countAll = function (req, res, next) {
    const schema_body = {
        tab: Joi.string().allow(["all","notseen"]).required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.seen = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}


exports.validation = validation;