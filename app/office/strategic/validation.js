const { ValidationProvider } = require('../../../shared/validation/validation.provider');
const Joi = ValidationProvider.initModuleValidation();
var validation = {};

validation.load_base_department = function (req, res, next) {
    const schema_body = {
        search: Joi.string(),
        status :Joi.string(),
        department: Joi.string().required(),
        from_date: Joi.number().required(),
        to_date: Joi.number().required(),
        top: Joi.number().required(),
        offset: Joi.number().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.load_base_project = function (req, res, next) {
    const schema_body = {
        search: Joi.string(),
        status :Joi.string(),
        project: Joi.string().required(),
        from_date: Joi.number().required(),
        to_date: Joi.number().required(),
        top: Joi.number().required(),
        offset: Joi.number().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.count_base_department = function (req, res, next) {
    const schema_body = {
        search: Joi.string(),
        status :Joi.string(),
        department: Joi.string().required(),
        from_date: Joi.number().required(),
        to_date: Joi.number().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.count_base_project = function (req, res, next) {
    const schema_body = {
        search: Joi.string(),
        status :Joi.string(),
        project: Joi.string().required(),
        from_date: Joi.number().required(),
        to_date: Joi.number().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.insert = function (req, res, next) {
    const schema_body = {
        title: Joi.string().required(),
        from_date: Joi.number().required(),
        to_date: Joi.number().required(),
        department: Joi.string(),
        project: Joi.string()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.update = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        title: Joi.string().required(),
        from_date: Joi.number().required(),
        to_date: Joi.number().required(),
        progress: Joi.number().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.delete = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.obtained = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.insert_object = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        title: Joi.string().required(),
        from_date: Joi.number().required(),
        to_date: Joi.number().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.update_object = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        itemid: Joi.string().required(),
        title: Joi.string().required(),
        from_date: Joi.number().required(),
        to_date: Joi.number().required(),
        progress: Joi.number().required(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.delete_object = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        itemid: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.obtained_object = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        itemid: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}


exports.validation = validation;