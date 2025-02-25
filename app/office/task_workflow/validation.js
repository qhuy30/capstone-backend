const { ValidationProvider } = require('../../../shared/validation/validation.provider');
const Joi = ValidationProvider.initModuleValidation();
var validation = {};

validation.load = function (req, res, next) {
    const schema_body = {
        search: Joi.string(),
        status: Joi.string().allow(['Draft','Active']),
        project: Joi.array().items(Joi.string()),
        department: Joi.array().items(Joi.string()),
        top:Joi.number().required(),
        offset:Joi.number().required(),
        sort:Joi.any().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.count = function (req, res, next) {
    const schema_body = {
        search: Joi.string(),
        status: Joi.string().allow(['Draft','Active']),
        project: Joi.array().items(Joi.string()),
        department: Joi.array().items(Joi.string()),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.loadDetails = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.insert = function (req, res, next) {
    const schema_body = {
        title: Joi.string().required(),
        status: Joi.string().allow(['Draft','Active']).required(),
        project: Joi.array().items(Joi.string()).required(),
        department: Joi.array().items(Joi.string()).required(),
        flow:Joi.any().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.update = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        title: Joi.string().required(),
        status: Joi.string().allow(['Draft','Active']).required(),
        project: Joi.array().items(Joi.string()).required(),
        department: Joi.array().items(Joi.string()).required(),
        flow:Joi.any().required()
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