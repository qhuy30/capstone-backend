const { ValidationProvider } = require('../../../shared/validation/validation.provider');
const {ORGANIZATION_TYPE} = require('./const');
const Joi = ValidationProvider.initModuleValidation();
var validation = {};

validation.load = function (req, res, next) {
    const schema_body = {
        level: Joi.number().required(),
        id: Joi.string()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.load_for_workflow = function (req, res, next) {
    const schema_body = {
        level: Joi.number().required(),
        id: Joi.string()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.load_for_pick_user_directive = function (req, res, next) {
    const schema_body = {
        level: Joi.number().required(),
        id: Joi.string()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.loadDetails = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.loadDetailWithTasks = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        fromDate: Joi.number(),
        toDate: Joi.number(),
        filterPerson: Joi.array(),
        status: Joi.array().items(Joi.string()),
        priority: Joi.array().items(Joi.number())
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.loadDetails_m = function (req, res, next) {
    const schema_body = {
        id: Joi.array().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.insert = function(req, res, next) {
    const schema_body = {
        ordernumber: Joi.number().required(),
        title: Joi.any().required(),
        abbreviation: Joi.string().required(),
        icon: Joi.string().allow(''),
        parent: Joi.array().items(Joi.string()).required(),
        level: Joi.number().required(),
        isactive: Joi.boolean(),
        leader: Joi.string().allow(""),
        departmentLeader: Joi.string().allow(""),
        type: Joi.string().valid(Object.values(ORGANIZATION_TYPE)).required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};

validation.update = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        ordernumber : Joi.number(),
        title :Joi.any(),
        abbreviation: Joi.string().required(),
        icon :Joi.string().allow(""),
        parent: Joi.array().items(Joi.string()),
        level :Joi.number(),
        isactive:Joi.boolean(),
        leader: Joi.string().allow(""),
        departmentLeader: Joi.string().allow(""),
        type: Joi.string().valid(Object.values(ORGANIZATION_TYPE)).required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.update_nursing_report = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        value : Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.delete = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required()
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.load_multiple_employee = function(req, res, next) {
    const schema_body = {
        department: Joi.string().required(),
        search: Joi.string().allow(null, ''),
        top: Joi.number(),
        offset: Joi.number(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

validation.loadGroupOrganization = function(req, res, next) {
    const schema_body = {
        search: Joi.string().allow(null, ""),
        isActive: Joi.boolean(),
        top: Joi.number().positive().allow(0, null, ""),
        offset: Joi.number().positive().allow(0, null, ""),
        sort: Joi.object(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};

validation.insertGroupOrganization = function(req, res, next) {
    const schema_body = {
        title: Joi.string().required(),
        isActive: Joi.boolean().default(true),
        departments: Joi.array().items(Joi.string()).default([]),
    };
    ValidationProvider.createValidator(schema_body, req, res, next);
};

validation.updateGroupOrganization = function(req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        isActive: Joi.boolean().default(true),
        title: Joi.string().required(),
        departments: Joi.array().items(Joi.string()).default([]),
    };
    ValidationProvider.createValidator(schema_body, req, res, next);
};

validation.load_employee_by_departments = function(req, res, next) {
    const schema_body = {
        departments: Joi.array().items(Joi.string()).default([]),
        search: Joi.string().allow(null, ''),
        top: Joi.number(),
        offset: Joi.number(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
}

exports.validation = validation;
