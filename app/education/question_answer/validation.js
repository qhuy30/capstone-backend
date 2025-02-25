const { ValidationProvider } = require('../../../shared/validation/validation.provider');
const Joi = ValidationProvider.initModuleValidation();
var validation = {};
validation.createFrequentlyQuestions = function (req, res, next) {
    const schema_body = {
        question: Joi.string().required(),
        answer: Joi.string().required(),
        type_question: Joi.any().required(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};

validation.createListQuestions = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        title_vi: Joi.string().required(),
        title_en: Joi.string().required(),
        value: Joi.string().required(),
        active: Joi.any().required(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};

validation.updateFrequentlyQuestions = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        question: Joi.string(),
        answer: Joi.string(),
        type_question: Joi.any(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};

validation.updateListTypeOfQuestions = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        title_vi: Joi.string(),
        title_en: Joi.string(),
        value: Joi.string(),
        active: Joi.boolean()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};

validation.delete = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.count = function (req, res, next) {
    const schema_body = {
        search: Joi.string(),
        from_date: Joi.number(),
        to_date: Joi.number(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

exports.validation = validation;
