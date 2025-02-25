const { ValidationProvider } = require('../../../shared/validation/validation.provider');
const Joi = ValidationProvider.initModuleValidation();
var validation = {};

validation.load = function (req, res, next) {
    const schema_body = {
        path: Joi.any(),
        search: Joi.string(),
        from_date: Joi.number(),
        last_update_date: Joi.number(),
        top: Joi.number().required(),
        offset: Joi.number().required(),
        sort: Joi.any().required(),
        tab: Joi.string().required(),
        department: Joi.any(),
        project: Joi.any(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};

validation.count = function (req, res, next) {
    const schema_body = {
        path: Joi.any(),
        tab: Joi.string().required(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};

validation.insert = Joi.object()
    .keys({
        name: Joi.string().required(),
        size: Joi.number().required(),
        version: Joi.string().required(),
        type: Joi.string().required(),
        department: Joi.any().required(),
        general: Joi.any().required(),
        share: Joi.any().required(),
        value: Joi.any().required(),
        from_date: Joi.number().required(),
        last_update_date: Joi.number().required(),
        path: Joi.string().required(),
        file: Joi.any().required(),
    })
    .required();

validation.delete = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};

validation.load_department = function (req, res, next) {
    const schema_body = {
        department_id: Joi.string(),
        department_grade: Joi.number()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

exports.validation = validation;
