const {
    ValidationProvider,
} = require("../../../shared/validation/validation.provider");
const Joi = ValidationProvider.initModuleValidation();

const { TASK_PRIORITY, REPETITIVE_CYCLE, TASK_TEMPLATE_STATUS, TASK_TEMPLATE_UPDATE_ACTION } = require("../../../utils/constant");

var validation = {};

validation.load = function (req, res, next) {
    const schema_body = {
        top: Joi.number(),
        offset: Joi.number(),
        search: Joi.string().allow(null, ""),
        load_parent_only: Joi.boolean().default(false),
        skip_load_child: Joi.boolean().default(false),
        repetitive_cycle: Joi.string().valid(Object.values(REPETITIVE_CYCLE)).allow(null, ""),
        priority: Joi.number().valid(Object.values(TASK_PRIORITY)),
        status: Joi.string().valid(Object.values(TASK_TEMPLATE_STATUS)),
        series: Joi.string().allow(null, ""),
        task_type: Joi.number(),
        from_date: Joi.date().timestamp().raw().allow(null),
        to_date: Joi.date().timestamp().min(Joi.ref('from_date')).raw().allow(null),
    };
    ValidationProvider.createValidator(schema_body, req, res, next);
};

validation.count = function (req, res, next) {
    const schema_body = {
        search: Joi.string().allow(null, ""),
        repetitive_cycle: Joi.string().valid(Object.values(REPETITIVE_CYCLE)).allow(null, ""),
        priority: Joi.number().valid(Object.values(TASK_PRIORITY)),
        status: Joi.string().valid(Object.values(TASK_TEMPLATE_STATUS)),
        series: Joi.string().allow(null, ""),
        task_type: Joi.number(),
        from_date: Joi.date().timestamp().raw().allow(null),
        to_date: Joi.date().timestamp().raw().min(Joi.ref('from_date')).allow(null),
    };
    ValidationProvider.createValidator(schema_body, req, res, next);
};

validation.loadDetail = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
    };
    ValidationProvider.createValidator(schema_body, req, res, next);
};

validation.insert = function (req, res, next) {
    const schema_body = {
        title: Joi.string().required(),
        department: Joi.array().items(Joi.string()).required(),
        priority: Joi.number().valid(Object.values(TASK_PRIORITY)).required(),
        task_type: Joi.number().required(),
        from_date: Joi.date().timestamp().required(),
        to_date: Joi.date().timestamp().required(),
        repetitive: Joi.object()
            .keys({
                per: Joi.number().required(),
                cycle: Joi.string().valid(Object.values(REPETITIVE_CYCLE)).required(),
                has_expired: Joi.boolean().required(),
                expired_date: Joi.date().allow(["", null]).timestamp(),
            })
            .required(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};

validation.update = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        title: Joi.string().required(),
        department: Joi.array().items(Joi.string()).required(),
        priority: Joi.number().valid(Object.values(TASK_PRIORITY)).required(),
        task_type: Joi.number().required(),
        from_date: Joi.date().timestamp().required(),
        to_date: Joi.date().timestamp().required(),
        repetitive: Joi.object()
            .keys({
                per: Joi.number().required(),
                cycle: Joi.string().valid(Object.values(REPETITIVE_CYCLE)).required(),
                has_expired: Joi.boolean().required(),
                expired_date: Joi.date().allow(["", null]).timestamp(),
            })
            .required(),
    };
    ValidationProvider.createMiddleware(schema_body, req, res, next);
};

validation.updateJobStatus = function (req, res, next) {
    const schema_body = {
        id: Joi.string().required(),
        department: Joi.string().allow(null, ""),
        action: Joi.string().valid(Object.values(TASK_TEMPLATE_UPDATE_ACTION)).required(),
    };
    return ValidationProvider.createValidator(schema_body, req, res, next);
}

exports.validation = validation;
