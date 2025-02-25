const { ValidationProvider } = require('../../../shared/validation/validation.provider');
const Joi = ValidationProvider.initModuleValidation();

var validation = {};
validation.load = function (req, res, next) {
    const schema_body = {
        search: Joi.string(),
        isactive: Joi.boolean(),
        top:Joi.number().required(),
        offset:Joi.number().required(),
        sort : Joi.object().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}
validation.count = function (req, res, next) {
    const schema_body = {
        search: Joi.string(),
        isactive: Joi.boolean()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}
validation.insert = function (req, res, next) {
    const schema_body = {
        title: Joi.string().required(),
        isactive: Joi.boolean().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}


validation.update = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        title: Joi.string().required(),
        isactive: Joi.boolean().required(),
        user: Joi.array(),
        role: Joi.array(),
        competence: Joi.array().items(Joi.string()),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};

validation.delete = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}


validation.pushRule = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        rule: Joi.object({
            rule :Joi.string().required(),
            details : Joi.object()
        }).required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.removeRule = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        rule: Joi.object({
            rule :Joi.string().required(),
            details : Joi.object()
        }).required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}



exports.validation = validation;
