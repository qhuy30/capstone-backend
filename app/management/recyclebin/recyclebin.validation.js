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
        isactive: Joi.boolean()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.loadDetails = function (req, res, next) {
    const schema_body = {
        id:Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
} 
validation.delete = function (req, res, next) {
    const schema_body = {
        idar:Joi.array().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
} 

validation.restore = function (req, res, next) {
    const schema_body = {
        data:Joi.array().items(Joi.object().keys({
            dbname: Joi.string().required(),
            collection: Joi.string().required(),
            idar : Joi.array().items(Joi.string()).required()
        })).required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
} 

exports.validation = validation;