const { ValidationProvider } = require('../../../shared/validation/validation.provider');
const Joi = ValidationProvider.initModuleValidation();
var validation = {};
validation.get_typing = function (req, res, next) {
    const schema_body = {
        id:Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.get_room = function (req, res, next) {
    const schema_body = {
        request_id:Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.push_show = function (req, res, next) {
    const schema_body = {
        room:Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.pull_show = function (req, res, next) {
    const schema_body = {
        room:Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

exports.validation = validation;