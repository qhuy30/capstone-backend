const { ValidationProvider } = require('../../../shared/validation/validation.provider');
const Joi = ValidationProvider.initModuleValidation();

const { FileValidationProvider } = require('../validation/fileValidation.provider');

var validation = {};

validation.import = Joi.object()
    .keys({
        file: Joi.any().required(),
        upload_date: Joi.any().required(),
        id: Joi.any().required(),
    })
    .required();

validation.deleteExamSchedule = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};

validation.fileValidation = function (req, res, next) {
    FileValidationProvider.validationRules(req, res, next);
}


exports.validation = validation;
