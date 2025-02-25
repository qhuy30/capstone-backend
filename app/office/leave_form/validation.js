const { ValidationProvider } = require('../../../shared/validation/validation.provider');
const Joi = ValidationProvider.initModuleValidation();
var validation = {};
validation.load = function (req, res, next) {
    const schema_body = {
        search: Joi.string(),
        type: Joi.string(),
        from_date: Joi.number(),
        to_date: Joi.number(),
        status: Joi.string(),
        tab: Joi.any().valid(["created","approved","rejected","need_to_handle","all","journey_time_handle"]).required(),
        top:Joi.number().required(),
        offset:Joi.number().required(),
        sort:Joi.any().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}
validation.loadDetails = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.count = function (req, res, next) {
    const schema_body = {
        search: Joi.string(),
        type: Joi.string(),
        from_date: Joi.number(),
        to_date: Joi.number(),
        status: Joi.string(),
        tab: Joi.any().valid(["created","approved","rejected","need_to_handle","all","journey_time_handle"]).required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}
validation.loadFileInfo = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        filename: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}
validation.insert = Joi.object().keys({
    flow: Joi.string().required(),
    from_date: Joi.string().required(),
    to_date: Joi.string().required(),
    type: Joi.string().required(),
    content: Joi.string().required(),
    number_day: Joi.string().required(),
    use_jtf: Joi.string().required()
}).required();

validation.approval = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        comment: Joi.string()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.reject = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        comment: Joi.string()
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