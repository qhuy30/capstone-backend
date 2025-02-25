const { ValidationProvider } = require("../../../shared/validation/validation.provider");
const Joi = ValidationProvider.initModuleValidation();


exports.load = function (request, response, next) {
    const bodySchema = {
        department: Joi.string().allow(null, ""),
        search: Joi.string().allow(null, ""),
        top: Joi.number().default(10),
        offset: Joi.number().default(0),
        sort: Joi.object().default({}),
        isLarge: Joi.boolean().optional(),
        isExternal: Joi.boolean().optional(),
    };
    ValidationProvider.createMiddleware(bodySchema, request, response, next);
};

exports.loadMultiple = function (request, response, next) {
    const bodySchema = {
        ids: Joi.array().items(Joi.string()),
    };
    ValidationProvider.createMiddleware(bodySchema, request, response, next);
};


exports.loadDetail = function (request, response, next) {
    const bodySchema = {
        id: Joi.string().required(),
    };
    ValidationProvider.createMiddleware(bodySchema, request, response, next);
};

exports.insert = function (request, response, next) {
    const bodySchema = {
        title: Joi.string().required(),
        parent_label: Joi.string().allow("", null),
        is_has_department: Joi.boolean().required().default(false),
        departments: Joi.when("is_has_department", {
            is: true,
            then: Joi.array().items(Joi.string().required()),
            otherwise: Joi.array().default([]),
        }),
    };
    ValidationProvider.createMiddleware(bodySchema, request, response, next);
};

exports.update = function (request, response, next) {
    const bodySchema = {
        id: Joi.string().required(),
        title: Joi.string().required(),
        parent_label: Joi.string().allow("", null),
        is_has_department: Joi.boolean().required().default(false),
        departments: Joi.when("is_has_department", {
            is: true,
            then: Joi.array().items(Joi.string().required()),
            otherwise: Joi.array().default([]),
        }),
    };
    ValidationProvider.createMiddleware(bodySchema, request, response, next);
};

