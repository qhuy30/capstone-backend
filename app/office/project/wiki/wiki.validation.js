const { ValidationProvider } = require('../../../../shared/validation/validation.provider');
const Joi = ValidationProvider.initModuleValidation();
var validation = {};

validation.loadDetails = function(req, res, next) {
    const schema_body = {
        id: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.loadDetailsForUpdate = function(req, res, next) {
    const schema_body = {
        id: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.like = function(req, res, next) {
    const schema_body = {
        id: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.unlike = function(req, res, next) {
    const schema_body = {
        id: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}
validation.delete = function(req, res, next) {
    const schema_body = {
        id: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.update = function(req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        title: Joi.string().required(),
        content: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.load = function(req, res, next) {
    const schema_body = {
        search: Joi.string(),
        department: Joi.string(),
        project: Joi.string(),
        top: Joi.number().required(),
        offset: Joi.number().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.count = function(req, res, next) {
    const schema_body = {
        search: Joi.string(),
        department: Joi.string(),
        project: Joi.string()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.checkexist = function(req, res, next) {
    const schema_body = {
        key: Joi.string().required(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.insert = Joi.object().keys({
    title: Joi.string().required(),
    content: Joi.string().required(),
    department: Joi.string(),
    project: Joi.string()
}).required();

validation.loadFileInfo = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        filename: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}


validation.removeAttachment = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        filename: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}


exports.validation = validation;