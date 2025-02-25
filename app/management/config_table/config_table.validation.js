const { ValidationProvider } = require('../../../shared/validation/validation.provider');
const Joi = ValidationProvider.initModuleValidation();
var validation = {};
validation.load = function (req, res, next) {
    const schema_body = {
        project: Joi.string(),
        department: Joi.string(),
        username: Joi.string(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.update = function (req, res, next) {
    const schema_body = {
        project: Joi.string(),
        department: Joi.string(),
        config: Joi.any()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

exports.validation = validation;