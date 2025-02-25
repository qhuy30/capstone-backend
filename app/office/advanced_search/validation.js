const { ValidationProvider } = require('../../../shared/validation/validation.provider');
const { TYPE } = require('./const');
const Joi = ValidationProvider.initModuleValidation();
var validation = {};

validation.load = function (req, res, next) {
    const schema_body = {
        search: Joi.string(),
        type : Joi.string().valid(Object.values(TYPE)),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}


exports.validation = validation;
