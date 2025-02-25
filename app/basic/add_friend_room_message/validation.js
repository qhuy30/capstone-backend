const { ValidationProvider } = require('../../../shared/validation/validation.provider');
const Joi = ValidationProvider.initModuleValidation();
var validation = {};


validation.load = function (req, res, next) {
    const schema_body = {
        offset:Joi.number().required(),
        room:Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.count_not_seen = function (req, res, next) {
    const schema_body = {
        room:Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.insert = function (req, res, next) {
    const schema_body = {
        room:Joi.string().required(),
        message:Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.delete = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

exports.validation = validation;