const { ValidationProvider } = require('../../../shared/validation/validation.provider');
const Joi = ValidationProvider.initModuleValidation();

const { FileValidationProvider } = require('../validation/fileValidation.provider');

var validation = {};

validation.loadList = function (req, res, next) {
    const schema_body = {
        search: Joi.string().allow(""),
        status: Joi.string().allow(""),
        start_date: Joi.date().timestamp('javascript').required(),
        end_date: Joi.date().timestamp('javascript').required(),
        top: Joi.number().required(),
        offset: Joi.number().required(),
        sort: Joi.any().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.countList = function (req, res, next) {
    const schema_body = {
        search: Joi.string().allow(""),
        status: Joi.string().allow(""),
        start_date: Joi.date().timestamp('javascript').required(),
        end_date: Joi.date().timestamp('javascript').required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}


validation.insert = function (req, res, next) {
    const schema_body = {
        title: Joi.string().required(),
        content: Joi.string().required(),
        quantity: Joi.number().required(),
        start_registered_date: Joi.date().timestamp().required(),
        end_registered_date: Joi.date().timestamp().greater(Joi.ref("start_registered_date")).required(),
        start_date: Joi.date().timestamp().required(),
        end_date: Joi.date().timestamp().greater(Joi.ref("start_date")).required(),
        point: Joi.number().required(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.update = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        title: Joi.string().required(),
        content: Joi.string().required(),
        quantity: Joi.number().required(),
        start_registered_date: Joi.date().timestamp().required(),
        end_registered_date: Joi.date().timestamp().greater(Joi.ref("start_registered_date")).required(),
        start_date: Joi.date().timestamp().required(),
        end_date: Joi.date().timestamp().greater(Joi.ref("start_date")).required(),
        point: Joi.number().required(),
        status: Joi.string().valid(['Store','Active']).required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.delete = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}


validation.register = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        student: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}


validation.unregister = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        student: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.loadListStudent = function (req, res, next) {
    const schema_body = {
        search: Joi.string().allow(""),
        status: Joi.string().allow(""),
        start_date: Joi.string().required(),
        end_date: Joi.string().required(),
        top: Joi.number().required(),
        offset: Joi.number().required(),
        sort: Joi.any().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.loadRegisteredEventByStudentId = function (req, res, next) {
    const schema_body = {
        search: Joi.string().allow(""),
        status: Joi.string().allow(""),
        studentId: Joi.string().required(),
        start_date: Joi.string().required(),
        end_date: Joi.string().required(),
        top: Joi.number().required(),
        offset: Joi.number().required(),
        sort: Joi.any().required()
    }
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.loadDetails = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.getQRCode = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        type: Joi.string().valid("checkin","checkout").required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.ackTrainingEvent = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        type: Joi.string().valid("checkin", "checkout").required(),
        studentId: Joi.string().required(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};


validation.exportCheckoutList = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};

exports.validation = validation;
