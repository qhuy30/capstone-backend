const { ValidationProvider } = require('../../../shared/validation/validation.provider');
const Joi = ValidationProvider.initModuleValidation();
var validation = {};


validation.load = function (req, res, next) {
    const schema_body = {
        search: Joi.string(),
        top: Joi.number().required(),
        offset: Joi.number().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.count = function (req, res, next) {
    const schema_body = {
        search: Joi.string()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.loadDetails = function (req, res, next) {
    const schema_body = {
        key: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}




validation.insert = function (req, res, next) {
    const schema_body = {
        ordernumber: Joi.number().required(),
        title: Joi.object().required(),
        key: Joi.string().required(),
        extend : Joi.any()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.update = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        ordernumber: Joi.number().required(),
        title: Joi.object().required(),
        key: Joi.string().required(),
        extend : Joi.any()

    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}


validation.delete = function (req, res, next) {
    const schema_body = {
        key: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}




exports.validation = validation;