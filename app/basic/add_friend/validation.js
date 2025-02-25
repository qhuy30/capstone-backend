const { ValidationProvider } = require('../../../shared/validation/validation.provider');
const Joi = ValidationProvider.initModuleValidation();
var validation = {};


validation.getFriend = function (req, res, next) {
    const schema_body = {
        search: Joi.string(),
        top:Joi.number().required(),
        offset:Joi.number().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

exports.validation = validation;