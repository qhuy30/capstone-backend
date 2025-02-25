const { ValidationProvider } = require('../../../shared/validation/validation.provider');
const Joi = ValidationProvider.initModuleValidation();
var validation = {};
validation.loadIndex = function (req, res, next) {
    const schema_body = {
        key: Joi.any().valid(["basic","management","office"]).required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.loadCollection = function (req, res, next) {
    const schema_body = {
        key: Joi.any().valid(["basic","management","office"]).required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.loadItem = function (req, res, next) {
    const schema_body = {
        key: Joi.any().valid(["basic","management","office"]).required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.loadItemByCollection = function (req, res, next) {
    const schema_body = {
        key: Joi.any().valid(["basic","management","office"]).required(),
        collection: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

exports.validation = validation;