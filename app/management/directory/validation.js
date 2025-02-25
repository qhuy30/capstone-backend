const { ValidationProvider } = require('../../../shared/validation/validation.provider');
const Joi = ValidationProvider.initModuleValidation();
var validation = {};

validation.getOrderNumber = function (req, res, next) {
    const schema_body = {
        master_key: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.load_for_directive = function (req, res, next) {
    const schema_body = {
        search: Joi.string(),
        master_key: Joi.string().required(),
        filter: Joi.array(),
        top: Joi.number().required(),
        offset: Joi.number().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.count_for_directive = function (req, res, next) {
    const schema_body = {
        search: Joi.string(),
        master_key: Joi.string().required(),
        filter: Joi.array()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}


validation.load = function (req, res, next) {
    const schema_body = {
        filter: Joi.array(),
        search: Joi.string(),
        master_key: Joi.string().required(),
        top: Joi.number().required(),
        offset: Joi.number().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.count = function (req, res, next) {
    const schema_body = {
        filter: Joi.array(),
        search: Joi.string(),
        master_key: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.loadDetails = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        type: Joi.string(),
        master_key: Joi.string()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.loadDetailsMany = function (req, res, next) {
    const schema_body = {
        ids: Joi.array().required(),
        type: Joi.string(),
        master_key: Joi.string()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}


validation.insert = function (req, res, next) {
    const schema_body = {
        ordernumber: Joi.number().required(),
        title: Joi.object().required(),
        value: Joi.any().required(),
        item : Joi.any(),
        master_key: Joi.string().required(),
        isactive : Joi.boolean().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.update = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        ordernumber: Joi.number().required(),
        title: Joi.object().required(),
        value: Joi.any().required(),
        item :Joi.any(),
        isactive : Joi.boolean().required()
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