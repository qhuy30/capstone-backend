const { ValidationProvider } = require('../../../shared/validation/validation.provider');
const Joi = ValidationProvider.initModuleValidation();

var validation = {};
validation.load = function (req, res, next) {
    const schema_body = {
        search: Joi.string(),
        top:Joi.number().required(),
        offset:Joi.number().required(),
        sort : Joi.object().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}
validation.count = function (req, res, next) {
    const schema_body = {
        search: Joi.string(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.insert = function (req, res, next) {
    const schema_body = {
        name: Joi.string().required(),
        code: Joi.string().required(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.checkexist = function (req, res, next) {
    const schema_body = {
        code: Joi.string().required(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.update = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        name: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};

validation.delete = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}


exports.validation = validation;
