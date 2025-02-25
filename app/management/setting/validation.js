const { ValidationProvider } = require('../../../shared/validation/validation.provider');
const Joi = ValidationProvider.initModuleValidation();
var validation = {};


validation.load_module = function (req, res, next) {
    const schema_body = {
        module: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.update = function (req, res, next) {
    const schema_body = {
        itemAr: Joi.array().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.uploadImage = Joi.object().keys({
    id: Joi.string().required(),
    image: Joi.any()
}).required();

exports.validation = validation;